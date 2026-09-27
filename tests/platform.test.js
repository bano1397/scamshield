import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { makeResampler } from '../public/js/resample.js';

const root = new URL('..', import.meta.url).pathname;

test('resampler: 48 kHz → 16 kHz keeps duration and amplitude across chunk boundaries', () => {
  const rs = makeResampler(48000);
  let out = 0, peak = 0;
  for (let c = 0; c < 100; c++) {
    const frame = new Float32Array(128).map((_, i) => 0.5 * Math.sin((2 * Math.PI * 440 * (c * 128 + i)) / 48000));
    const o = rs(frame);
    out += o.length;
    for (const v of o) peak = Math.max(peak, Math.abs(v));
  }
  assert.ok(Math.abs(out - (100 * 128) / 3) <= 2, `samples=${out}`);
  assert.ok(peak > 0.45 * 0x7fff && peak <= 0.5 * 0x7fff + 1, `peak=${peak}`);
});

test('resampler: 44.1 kHz and clipping', () => {
  const rs = makeResampler(44100);
  const o = rs(new Float32Array(4410).fill(2));
  assert.ok(Math.abs(o.length - 1600) <= 2);
  assert.ok(o.every((v) => v === 0x7fff));
});

test('no secrets in the files that get published', () => {
  const skip = new Set(['.git', 'node_modules', '.vercel', 'audio']);
  const files = [];
  const walk = (d) => readdirSync(d).forEach((f) => {
    if (skip.has(f) || f === '.env') return;
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  });
  walk(root);
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/AIza[0-9A-Za-z_-]{30,}/.test(s), `Google key pattern in ${f}`);
    assert.ok(!/^\s*(ASSEMBLYAI_API_KEY|GEMINI_API_KEY)\s*=\s*\S{8,}/m.test(s), `.env-style key in ${f}`);
  }
});

test('.env is ignored by git', () => {
  const out = execSync('git check-ignore .env .env.local .env.production', { cwd: root }).toString();
  assert.match(out, /\.env\n/);
  assert.match(out, /\.env\.local/);
});

test('browser code never references server secrets', () => {
  for (const f of readdirSync(join(root, 'public/js'))) {
    const s = readFileSync(join(root, 'public/js', f), 'utf8');
    assert.ok(!/process\.env|API_KEY/.test(s), f);
  }
});

test('security headers: strict CSP allows only what the app needs', () => {
  const v = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const h = Object.fromEntries(v.headers.find((x) => x.source === '/(.*)').headers.map((x) => [x.key, x.value]));
  assert.match(h['Content-Security-Policy'], /script-src 'self';/);
  assert.match(h['Content-Security-Policy'], /connect-src 'self' wss:\/\/streaming\.assemblyai\.com;/);
  assert.match(h['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(h['Permissions-Policy'], /microphone=\(self\)/);
});

test('page has no inline scripts (CSP-safe)', () => {
  const html = readFileSync(join(root, 'public/index.html'), 'utf8');
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  assert.ok(scripts.every((s) => /src=/.test(s)));
  assert.ok(!/\son[a-z]+="/i.test(html), 'no inline event handlers');
});

test('every demo call has audio and timings', () => {
  const calls = JSON.parse(readFileSync(join(root, 'public/demo/calls.json'), 'utf8'));
  const timings = JSON.parse(readFileSync(join(root, 'public/demo/timings.json'), 'utf8'));
  for (const c of calls) {
    assert.ok(statSync(join(root, `public/audio/${c.id}.wav`)).size > 100_000, c.id);
    assert.equal(timings[c.id].lines.length, c.lines.length, c.id);
  }
});

test('AI tactic keys match the visible rule tactics', async () => {
  const { TACTIC_KEYS } = await import('../api/analyze.js');
  const { TACTICS } = await import('../public/js/rules.js');
  assert.deepEqual([...TACTIC_KEYS].sort(), Object.keys(TACTICS).filter((k) => !TACTICS[k].hidden).sort());
});
