// Local dev server: serves /public and the same /api handlers Vercel runs in production.
import http from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname;

// Minimal .env loader (no dependency)
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
// Same security headers as vercel.json, so local testing matches production.
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const SECURITY_HEADERS = vercel.headers.find((h) => h.source === '/(.*)').headers;

const routes = {};
for (const name of ['token', 'analyze', 'health']) routes[`/api/${name}`] = (await import(`./api/${name}.js`)).default;

const port = Number(process.env.PORT) || 3000;
http
  .createServer(async (req, res) => {
    for (const h of SECURITY_HEADERS) res.setHeader(h.key, h.value);
    const url = new URL(req.url, 'http://x');
    if (routes[url.pathname]) {
      try { return await routes[url.pathname](req, res); } catch { res.statusCode = 500; return res.end('{"error":"Server error"}'); }
    }
    let decoded;
    try { decoded = decodeURIComponent(url.pathname); } catch { res.statusCode = 400; return res.end('Bad request'); }
    let path = normalize(join(root, 'public', decoded));
    if (!path.startsWith(join(root, 'public'))) { res.statusCode = 403; return res.end(); }
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[extname(path)] || 'application/octet-stream');
    createReadStream(path).pipe(res);
  })
  .listen(port, () => console.log(`ScamShield running at http://localhost:${port}`));
