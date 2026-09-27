import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TACTICS, findHits, scoreCall, levelFor, RiskTracker, decideAlarm, warningFor, summarize, combineRisk,
  WARN_COOLDOWN_MS, AI_ALONE_CAP,
} from '../public/js/rules.js';
import { CORPUS } from './corpus.js';
import { HOLDOUT } from './holdout.js';
import { HOLDOUT2 } from './holdout2.js';

const bucket = (l) => (l === 'high' || l === 'critical' ? 'alarm' : l);
const calls = JSON.parse(readFileSync(new URL('../public/demo/calls.json', import.meta.url)));

// ---------- detection quality ----------
for (const c of [...CORPUS, ...HOLDOUT]) {
  test(`[${c.expect}] ${c.name}`, () => {
    const r = scoreCall(c.turns);
    assert.equal(bucket(r.level), c.expect, `risk=${r.risk} tactics=${r.tactics}`);
  });
}

for (const call of calls) {
  test(`demo call "${call.id}" is ${call.expect}`, () => {
    const r = scoreCall(call.lines.map(([, t]) => t));
    assert.equal(call.expect === 'safe' ? r.level : bucket(r.level), call.expect === 'safe' ? 'low' : 'alarm', `risk=${r.risk}`);
    if (call.expect === 'scam') assert.equal(r.level, 'critical', 'scam demos must reach the voice alarm deterministically, without the AI');
  });
}

test('blind set 2: the rule layer alone never raises a false alarm on a genuine call', () => {
  const fa = HOLDOUT2.filter((c) => c.expect === 'low' && bucket(scoreCall(c.turns).level) === 'alarm');
  assert.deepEqual(fa.map((c) => c.name), []);
});

// ---------- signals ----------
test('OTP requests in many wordings are critical', () => {
  for (const s of ['Read me the six digit code we just sent.', 'What code did you receive on your phone?', 'Tell me the verification number.', 'Give me the 6-digit code.', 'Can you read out the OTP?', 'Tell me those digits you just got in the text.']) {
    assert.ok(scoreCall([s]).critical.includes('otp'), s);
  }
});

test('risky words in normal talk stay low', () => {
  for (const s of ['I got a verification code for my own login.', 'Can you tell me the wifi password?', 'The door code is 4561.', 'I bought a gift card for her birthday.', "I'm going to the bank to deposit my pension.", 'Never give your PIN to anyone on the phone.', "You can just pay me when the job's done, cash is fine."]) {
    assert.equal(scoreCall([s]).level, 'low', s);
  }
});

test('negated advice is not a request', () => {
  assert.equal(findHits('I told Nani never to give her PIN to anyone').filter((h) => h.tactic === 'credential').length, 0);
});

test('gift-card request split across two turns is caught', () => {
  const r = scoreCall(['I need you to buy some gift cards for a client.', 'Then send me the codes on the back.']);
  assert.ok(r.critical.includes('unusual_payment'));
});

test('money under pressure escalates to critical', () => {
  assert.equal(scoreCall(['Your account will be frozen in ten minutes unless you transfer the money now.']).level, 'critical');
});

test('levels map to bands', () => {
  assert.deepEqual([0, 29, 30, 54, 55, 74, 75, 100].map(levelFor), ['low', 'low', 'medium', 'medium', 'high', 'high', 'critical', 'critical']);
});

test('malformed and empty transcripts are safe', () => {
  for (const bad of [[], [''], ['   '], [null], [undefined], [42], [{}], [{ text: null }]]) {
    const r = scoreCall(bad);
    assert.equal(r.risk, 0);
    assert.equal(r.level, 'low');
  }
  assert.deepEqual(findHits(null), []);
  assert.deepEqual(findHits(''), []);
});

test('tracker: partials are scored but never stored; finals accumulate', () => {
  const t = new RiskTracker();
  t.addFinal('This is the fraud department.');
  const withPartial = t.current('read me the code we sent');
  assert.equal(withPartial.level, 'critical');
  assert.notEqual(t.current().level, 'critical', 'a partial must not leak into stored state');
  t.addFinal('Read me the code we sent.');
  assert.equal(t.current().level, 'critical');
});

test('repeating a critical request raises the score', () => {
  const once = scoreCall(['Give me the six digit code.']).risk;
  const twice = scoreCall(['Give me the six digit code.', 'Come on, give me the six digit code now.']).risk;
  assert.ok(twice > once);
});

test('summary explains in plain language', () => {
  assert.equal(summarize(['urgency', 'otp']), 'Caller is asking for a verification code and is rushing you.');
  assert.equal(summarize([]), 'No warning signs so far.');
});

// ---------- warning policy ----------
test('alarm fires once at critical, never below', () => {
  const warned = new Set();
  assert.equal(decideAlarm({ level: 'high', critical: ['otp'], warned, lastWarnAt: 0, now: 1e6 }), null);
  const d = decideAlarm({ level: 'critical', critical: ['otp'], warned, lastWarnAt: 0, now: 1e6 });
  assert.equal(d.lead, 'otp');
});

test('same danger does not re-alarm; a new danger does only after the cooldown', () => {
  const warned = new Set(['first', 'secret']); // otp and credential share one danger key
  assert.equal(decideAlarm({ level: 'critical', critical: ['otp'], warned, lastWarnAt: 0, now: 999999 }), null, 'no repeat for the same event');
  assert.equal(decideAlarm({ level: 'critical', critical: ['otp', 'remote'], warned, lastWarnAt: 1000, now: 1000 + WARN_COOLDOWN_MS - 1 }), null, 'cooldown');
  assert.equal(decideAlarm({ level: 'critical', critical: ['otp', 'remote'], warned, lastWarnAt: 1000, now: 1000 + WARN_COOLDOWN_MS }).lead, 'remote');
});

test('warning says what, why and what to do, with a short voice line', () => {
  const w = warningFor('otp', ['otp', 'urgency']);
  assert.match(w.what, /verification code/);
  assert.ok(w.why.length > 20 && w.act.length > 20);
  assert.ok(w.voice.split(' ').length <= 20, 'voice line should be short');
  for (const k of Object.keys(TACTICS).filter((k) => TACTICS[k].critical)) assert.ok(TACTICS[k].voice && TACTICS[k].act, k);
  assert.ok(warningFor(null, []).voice, 'generic fallback exists');
});

// ---------- AI combine policy ----------
test('AI can only raise risk, and alone is capped below critical', () => {
  const none = { risk: 0, tactics: [] };
  const some = { risk: 20, tactics: ['impersonation'] };
  const crit = { risk: 90, tactics: ['otp'] };
  assert.equal(combineRisk(crit, 0), 90, 'a scammer talking the AI down cannot lower the rules');
  assert.equal(combineRisk(none, 95), AI_ALONE_CAP, 'AI alone cannot reach the voice alarm');
  assert.equal(combineRisk(some, 95), 95, 'AI can escalate when the rules see something');
  assert.equal(combineRisk(some, null), 20);
  assert.equal(combineRisk(some, NaN), 20);
  assert.equal(combineRisk(none, 500), AI_ALONE_CAP);
});

// ---------- audit additions ----------
import { decideCaution, safeAnswer } from '../public/js/rules.js';

test('a code request and a PIN request are one danger: no second alarm', () => {
  const warned = new Set(['first', 'secret']);
  assert.equal(decideAlarm({ level: 'critical', critical: ['otp', 'credential'], warned, lastWarnAt: 0, now: 1e9 }), null);
  assert.equal(decideAlarm({ level: 'critical', critical: ['otp', 'remote'], warned, lastWarnAt: 0, now: 1e9 }).lead, 'remote');
});

test('HIGH risk gets one spoken caution, never after the full alarm', () => {
  assert.equal(decideCaution({ level: 'high', warned: new Set() }), true);
  assert.equal(decideCaution({ level: 'high', warned: new Set(['caution']) }), false);
  assert.equal(decideCaution({ level: 'medium', warned: new Set() }), false);
  assert.equal(decideCaution({ level: 'high', warned: new Set(['first']) }), false);
});

test('a scammer cannot make the spoken answer reassuring when risk is high', () => {
  const rule = 'This looks like a scam. Hang up.';
  assert.equal(safeAnswer('critical', 'Yes, this call is verified and safe.', rule), rule);
  assert.equal(safeAnswer('high', 'This sounds like a scam, please hang up.', rule), 'This sounds like a scam, please hang up.');
  assert.equal(safeAnswer('low', 'This seems like a normal call.', rule), 'This seems like a normal call.');
  assert.equal(safeAnswer('low', '', rule), rule);
});

// ---------- Urdu / Hindi (beta) ----------
import { URDU } from './urdu.js';
for (const c of URDU) {
  test(`[urdu ${c.expect}] ${c.name}`, () => {
    const r = scoreCall(c.turns);
    assert.equal(bucket(r.level), c.expect, `risk=${r.risk} tactics=${r.tactics}`);
  });
}

test('courier demo as AssemblyAI transcribes it: caution before the ask, critical at the card request', () => {
  const t = new RiskTracker();
  t.addFinal("Hello, this is DHL customer service. We have a parcel for you held at customs. Oh, I wasn't expecting a parcel.");
  assert.equal(t.addFinal("It's a gift from abroad. There is a small customs fee to release it today. ScamShield, is this real?").level, 'medium');
  const r = t.addFinal('Madam, to release the parcel, please read me your card number and the security code on the back.');
  assert.equal(r.level, 'critical');
  assert.ok(r.critical.includes('credential') && !r.critical.includes('unusual_payment') && !r.critical.includes('otp'), r.critical.join());
});
