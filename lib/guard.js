// Abuse protection for the public API routes. This is not authentication — anyone can use the
// app — but it stops other websites from calling our endpoints from a browser and caps how fast
// one client can spend the free AssemblyAI / Gemini quotas.
import { send } from './http.js';

const hits = new Map(); // key -> [timestamps]

// On Vercel, x-vercel-forwarded-for / x-real-ip are set by the platform and can't be spoofed by
// the client. Locally we use the socket address and ignore client-supplied forwarding headers.
export function clientIp(req) {
  if (process.env.VERCEL) {
    const v = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'];
    if (typeof v === 'string' && v) return v.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function rateLimited(key, limit, windowMs = 60_000, now = Date.now()) {
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  const blocked = list.length >= limit;
  if (!blocked) list.push(now);
  hits.delete(key);
  hits.set(key, list); // re-insert so Map order = least recently used first
  // bounded memory: evict the least recently used clients, never reset everyone
  while (hits.size > 5000) hits.delete(hits.keys().next().value);
  return blocked;
}

export function crossSite(req) {
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return true;
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return true;
    } catch {
      return true;
    }
  }
  return false;
}

// Returns true (and sends the error) if the request must be rejected.
export function guard(req, res, { name, limit, globalLimit }) {
  if (crossSite(req)) {
    send(res, 403, { error: 'Cross-site requests are not allowed.' });
    return true;
  }
  // per-client limit, plus a per-instance ceiling so many clients together can't drain the free quota
  if (rateLimited(`${name}:${clientIp(req)}`, limit) || (globalLimit && rateLimited(`${name}:*`, globalLimit, 3600_000))) {
    res.setHeader('Retry-After', '60');
    send(res, 429, { error: 'Too many requests. Please wait a minute.', fallback: true });
    return true;
  }
  return false;
}

export function _resetRateLimits() {
  hits.clear();
}
