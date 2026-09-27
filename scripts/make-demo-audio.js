// Generates the demo phone calls as 16 kHz mono 16-bit WAV files using free macOS voices.
// Usage: npm run demo-audio   (needs macOS `say` and ffmpeg)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const calls = JSON.parse(readFileSync(join(root, 'public/demo/calls.json')));
const RATE = 16000;
const GAP = Math.round(RATE * 0.6); // silence between speakers

const VOICES = {
  bank: { caller: 'Daniel', user: 'Karen' },
  irs: { caller: 'Ralph', user: 'Reed (English (US))' },
  grandson: { caller: 'Reed (English (UK))', user: 'Grandma (English (US))' },
  techsupport: { caller: 'Rishi', user: 'Shelley (English (US))' },
  dentist: { caller: 'Samantha', user: 'Eddy (English (US))' },
  family: { caller: 'Rishi', user: 'Flo (English (UK))' },
};

function wav(pcm) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const tmp = mkdtempSync(join(tmpdir(), 'ss-'));
const timings = {};
try {
  for (const call of calls) {
    const parts = [Buffer.alloc(GAP * 2)];
    let samples = GAP;
    const lines = [];
    call.lines.forEach(([who, text], i) => {
      const aiff = join(tmp, `${call.id}-${i}.aiff`);
      execFileSync('say', ['-v', VOICES[call.id][who], '-r', '175', '-o', aiff, text]);
      const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', aiff, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1 << 26 });
      lines.push({ who, text, start: +(samples / RATE).toFixed(2), end: +((samples + raw.length / 2) / RATE).toFixed(2) });
      parts.push(raw, Buffer.alloc(GAP * 2));
      samples += raw.length / 2 + GAP;
    });
    parts.push(Buffer.alloc(GAP * 2));
    writeFileSync(join(root, `public/audio/${call.id}.wav`), wav(Buffer.concat(parts)));
    timings[call.id] = { duration: +((samples + GAP) / RATE).toFixed(2), lines };
    console.log(`${call.id}: ${timings[call.id].duration}s`);
  }
  writeFileSync(join(root, 'public/demo/timings.json'), JSON.stringify(timings, null, 1));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
