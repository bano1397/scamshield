// Returns a short-lived, single-use AssemblyAI Universal-Streaming token so the API key never
// reaches the browser. Sessions opened with it are capped in length to protect the free credits.
import { send } from '../lib/http.js';
import { guard } from '../lib/guard.js';

// Short sessions limit how much of the free credit one token can spend; the app reconnects
// automatically when a session ends, so long calls stay protected.
export const MAX_SESSION_SECONDS = 900;

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  if (guard(req, res, { name: 'token', limit: 8, globalLimit: 300 })) return;
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) return send(res, 503, { error: 'Live speech is not configured on the server.' });
  try {
    const url = `https://streaming.assemblyai.com/v3/token?expires_in_seconds=60&max_session_duration_seconds=${MAX_SESSION_SECONDS}`;
    const r = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || !body.token) {
      return send(res, 502, { error: `Speech service refused the connection (${r.status}). Please try again.` });
    }
    send(res, 200, { token: body.token });
  } catch {
    send(res, 502, { error: 'Could not reach the speech service. Check your connection and try again.' });
  }
}
