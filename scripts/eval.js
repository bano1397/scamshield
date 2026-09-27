// Detection quality report on the labelled corpora.
//   node scripts/eval.js            rule layer only (offline)
//   node scripts/eval.js --ai       rule layer + AI second opinion via a running local server
// The AI is combined exactly as in the app: it can only raise risk, and alone it is capped at HIGH.
import { CORPUS } from '../tests/corpus.js';
import { HOLDOUT } from '../tests/holdout.js';
import { HOLDOUT2 } from '../tests/holdout2.js';
import { scoreCall, levelFor, combineRisk } from '../public/js/rules.js';

const useAI = process.argv.includes('--ai');
const only = process.argv.find((a) => a.startsWith('--set='))?.slice(6);
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const bucket = (l) => (l === 'high' || l === 'critical' ? 'alarm' : l);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ai(turns) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${BASE}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ turns }) });
    const j = r.ok ? await r.json() : {};
    if (r.ok && !j.fallback) return j.risk;
    await sleep(8000);
  }
  return null;
}

const sets = { own: CORPUS, holdout1: HOLDOUT, holdout2: HOLDOUT2 };
for (const [name, set] of Object.entries(sets)) {
  if (only && only !== name) continue;
  const m = { ok: 0, fp: 0, fn: 0, alarmTotal: 0, alarmCaught: 0, lowTotal: 0, aiFail: 0 };
  for (const c of set) {
    const rule = scoreCall(c.turns);
    let risk = rule.risk;
    if (useAI) {
      const a = await ai(c.turns);
      if (a == null) m.aiFail++;
      else risk = combineRisk(rule, a);
      await sleep(1500);
    }
    const got = bucket(levelFor(risk));
    if (c.expect === 'alarm') { m.alarmTotal++; if (got === 'alarm') m.alarmCaught++; else m.fn++; }
    if (c.expect === 'low') { m.lowTotal++; if (got === 'alarm') m.fp++; }
    if (got === c.expect) m.ok++;
    else if (process.argv.includes('-v')) console.log(`  miss ${name}: ${c.expect} -> ${got} (${risk}) ${c.name}`);
  }
  console.log(`${name.padEnd(9)} ${useAI ? 'rules+AI' : 'rules   '}  exact ${m.ok}/${set.length}  scams caught ${m.alarmCaught}/${m.alarmTotal}  false alarms ${m.fp}/${m.lowTotal}${m.aiFail ? `  (AI unavailable on ${m.aiFail})` : ''}`);
}
