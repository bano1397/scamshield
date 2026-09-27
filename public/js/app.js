import { TACTICS, LEVELS, findHits, levelFor, RiskTracker, decideAlarm, decideCaution, CAUTION_VOICE, safeAnswer, warningFor, summarize, byPriority, combineRisk } from './rules.js';
import { makeResampler } from './resample.js';

const $ = (s) => document.querySelector(s);
const RATE = 16000;
const CHUNK = 800; // 50 ms of 16 kHz audio per WebSocket message (AssemblyAI accepts 50–1000 ms)
const MAX_DOM_TURNS = 300; // keep long calls light
const RECONNECT_DELAYS = [300, 1500, 4000];
const KEYTERMS = ['ScamShield', 'OTP', 'one-time code', 'verification code', 'PIN', 'CVV', 'gift card', 'Google Play', 'AnyDesk', 'TeamViewer', 'Western Union', 'bitcoin', 'wire transfer', 'safe account', 'warrant', 'bail', 'fraud department', 'remote access'];
const WAKE = /\b(?:scam ?shield|skim ?shield|scan ?shield)\b[,.!?]?\s*(.*)$/i;
const VISIBLE = Object.keys(TACTICS).filter((k) => !TACTICS[k].hidden);

const I = {
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
  gift: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12M3 12h18M7.5 8a2.5 2.5 0 1 1 4.5-1.5A2.5 2.5 0 1 1 16.5 8"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M10 10l2 2 4-4"/>',
  bank: '<path d="M3 21h18M5 21V10M19 21V10M9 21v-6h6v6M2 10l10-7 10 7"/>',
  alert: '<path d="M12 3 2 21h20L12 3ZM12 10v5M12 18h.01"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  gavel: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
  hush: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a15 15 0 0 1-3 4M6.6 6.6C3.6 8.6 2 12 2 12s3 8 10 8a10 10 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
};
const ICONS = {
  otp: I.lock, credential: I.key, remote: I.screen, unusual_payment: I.gift, money_request: I.cash, impersonation: I.bank,
  account_threat: I.alert, urgency: I.clock, threat: I.gavel, secrecy: I.hush, family_emergency: I.heart, too_good: I.star,
};
const DEMO_ICONS = { bank: I.bank, irs: I.doc, grandson: I.heart, techsupport: I.screen, dentist: I.check, family: I.people };
const DEMO_BLURB = {
  bank: '“Fraud department” says your account is locked and asks for the code sent to your phone.',
  irs: 'A fake officer claims there is an arrest warrant and demands gift cards within the hour.',
  grandson: 'A panicked “grandson” needs bail money by Western Union — and begs you not to tell anyone.',
  techsupport: '“Microsoft” says you have a virus and asks you to install AnyDesk and open your bank.',
  dentist: 'A genuine appointment reminder. ScamShield should stay calm and green.',
  family: 'A real son talks about the bank, a transfer, a code and a password. No alarm should fire.',
};
const SHIELD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5z"/></svg>';

// ---------------- state ----------------
const health = { assemblyai: false, llm: false };
const prefs = { ai: true };
let calls = [];
let timings = {};
let busy = false; // blocks overlapping start/stop from rapid clicks
const S = freshState();

function freshState() {
  return {
    running: false, source: null, demoId: null, tracker: new RiskTracker(), turns: [],
    partial: '', partialId: null, turnEls: new Map(), rule: null,
    aiRisk: null, aiReason: '', aiTactics: [], target: 0, shown: 0, peak: 0, level: 'low',
    found: new Map(), warned: new Set(), lastWarnAt: 0, lastWarning: null,
    startedAt: 0, endedAt: 0, aiBusy: false, aiQueued: false, speaking: false,
    ws: null, closing: false, reconnecting: false, audioCtx: null, cleanup: [], gain: null, analyser: null,
    pendingEot: new Map(), firstSeen: new Map(), stats: { firstPartialMs: null, alarmAtMs: null, turnsFinal: 0, audioStart: 0 },
  };
}

// ---------------- helpers ----------------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const elapsed = () => (S.startedAt ? ((S.endedAt || performance.now()) - S.startedAt) / 1000 : 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('err', err);
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 5000);
}

function highlight(text) {
  const hits = findHits(text).filter((h) => !TACTICS[h.tactic].hidden);
  let out = '', i = 0;
  for (const h of hits) {
    if (h.index < i) continue;
    out += esc(text.slice(i, h.index)) + `<mark title="${esc(TACTICS[h.tactic].label)}">${esc(h.match)}</mark>`;
    i = h.index + h.match.length;
  }
  return { html: out + esc(text.slice(i)), tactics: [...new Set(hits.map((h) => h.tactic))] };
}

// ---------------- UI ----------------
function renderTactics() {
  $('#tactics').innerHTML = VISIBLE.map((k) => {
    const t = TACTICS[k];
    return `<div class="tactic${t.critical ? ' crit' : ''}" data-k="${k}"><div class="ic"><svg viewBox="0 0 24 24">${ICONS[k]}</svg></div><div><h3>${t.label}</h3><p>${t.explain}</p></div><span class="when"></span></div>`;
  }).join('');
  $('#tactic-count').textContent = `0 of ${VISIBLE.length} detected`;
}

function renderDemos() {
  $('#demo-grid').innerHTML = calls
    .map((c) => `<button class="demo ${c.expect === 'safe' ? 'legit' : ''}" data-id="${c.id}">
      <div class="d-ic"><svg viewBox="0 0 24 24">${DEMO_ICONS[c.id] || I.doc}</svg></div>
      <h3>${esc(c.title)}</h3><p>${DEMO_BLURB[c.id] || ''}</p>
      <div class="d-foot"><span class="d-play"><svg viewBox="0 0 24 24"><path d="m7 4 13 8-13 8z"/></svg>Play call · ${Math.round(timings[c.id]?.duration || 40)}s</span>
      <span class="expect ${c.expect}">${c.expect === 'safe' ? 'Genuine' : 'Scam'}</span></div>
      <div class="d-prog"></div></button>`)
    .join('');
  document.querySelectorAll('.demo').forEach((b) => b.addEventListener('click', () => startDemo(b.dataset.id)));
}

function setPills() {
  const stt = $('#pill-stt'), ai = $('#pill-ai');
  const live = S.running && S.ws;
  stt.className = 'pill ' + (S.reconnecting ? 'off' : live ? 'live' : health.assemblyai ? 'on' : 'off');
  stt.innerHTML = `<i></i>${S.reconnecting ? 'Reconnecting…' : live ? 'Listening' : health.assemblyai ? 'AssemblyAI ready' : 'Speech offline'}`;
  const aiOn = health.llm && prefs.ai;
  ai.className = 'pill ' + (aiOn ? 'on' : 'off');
  ai.innerHTML = `<i></i>${aiOn ? 'AI check on' : 'Rules only'}`;
}

function setRunningUI(on, label) {
  document.body.classList.toggle('listening', on);
  const b = $('#btn-live');
  b.classList.toggle('recording', on);
  b.querySelector('span').textContent = on ? 'End call & see report' : 'Start protecting';
  $('#btn-ask').disabled = !on;
  const tag = $('#source-tag');
  tag.textContent = label || (on ? 'Live' : 'Idle');
  tag.classList.toggle('live', on);
  document.querySelectorAll('.demo').forEach((d) => {
    d.disabled = on && d.dataset.id !== S.demoId;
    d.classList.toggle('playing', on && d.dataset.id === S.demoId);
    if (!on) d.querySelector('.d-prog').style.width = '0';
  });
  setPills();
}

function resetUI() {
  $('#transcript').innerHTML = '';
  document.querySelectorAll('.tactic').forEach((t) => { t.classList.remove('on'); t.querySelector('.when').textContent = ''; });
  $('#tactic-count').textContent = `0 of ${VISIBLE.length} detected`;
  setReason('Listening… ScamShield will explain what it hears.');
  setLevel('low');
}

function showEmpty() {
  $('#transcript').innerHTML = `<div class="empty"><div class="empty-rings"><span></span><span></span><span></span></div><p>Waiting for the call…</p><small>Words appear here live as AssemblyAI hears them. Red flags light up instantly.</small></div>`;
}

function addSys(text, cls = '') {
  const d = document.createElement('div');
  d.className = `sys ${cls}`;
  d.textContent = text;
  $('#transcript').appendChild(d);
  scrollTranscript();
}

function trimTranscript() {
  const t = $('#transcript');
  while (t.children.length > MAX_DOM_TURNS) t.firstElementChild.remove();
}

function scrollTranscript() {
  const t = $('#transcript');
  t.scrollTop = t.scrollHeight;
}

function setReason(text) {
  const r = $('#reason');
  if (r.textContent === text) return;
  r.textContent = text;
  r.classList.remove('flash');
  void r.offsetWidth;
  r.classList.add('flash');
}

function setLevel(level) {
  S.level = level;
  document.body.dataset.level = level;
}

// ---------------- transcript turns ----------------
function upsertTurn(id, text, final) {
  let el = S.turnEls.get(id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'turn partial';
    el.innerHTML = `<span class="ts">${fmt(elapsed())}</span><div class="bubble"><div class="tx"></div></div>`;
    $('#transcript').appendChild(el);
    S.turnEls.set(id, el);
    trimTranscript();
  }
  const { html, tactics } = highlight(text);
  el.querySelector('.tx').innerHTML = html;
  el.classList.toggle('flagged', tactics.length > 0);
  if (final) {
    el.classList.remove('partial');
    if (tactics.length && !el.querySelector('.tagrow')) {
      el.querySelector('.bubble').insertAdjacentHTML('beforeend', `<div class="tagrow">${tactics.map((k) => `<span class="tag">${esc(TACTICS[k].label)}</span>`).join('')}</div>`);
    }
  }
  scrollTranscript();
}

function onPartial(id, text) {
  if (typeof text !== 'string' || !text.trim()) return;
  if (S.stats.firstPartialMs == null) S.stats.firstPartialMs = Math.round(performance.now() - S.startedAt);
  if (!S.firstSeen.has(id)) S.firstSeen.set(id, performance.now());
  S.partial = text;
  S.partialId = id;
  upsertTurn(id, text, false);
  updateRisk();
}

function onFinal(id, text, speaker) {
  const existing = S.turnEls.get(id);
  if (existing && !existing.classList.contains('partial')) return; // duplicate final
  if (S.partialId === id) { S.partial = ''; S.partialId = null; }
  text = typeof text === 'string' ? text.trim() : '';
  if (!text) { existing?.remove(); S.turnEls.delete(id); return; }
  upsertTurn(id, text, true);
  const who = typeof speaker === 'string' && /^[A-Z]$/.test(speaker) ? speaker : null;
  if (who && existing) existing.querySelector('.bubble').insertAdjacentHTML('afterbegin', `<span class="spk spk-${who}">Speaker ${who}</span>`);
  S.turnEls.delete(id); // finished turns never change again
  S.turns.push({ text, t: elapsed(), at: performance.now(), who });
  S.stats.turnsFinal++;
  S.tracker.addFinal(text);
  updateRisk(text);

  const wake = S.source === 'mic' && text.match(WAKE);
  if (wake) {
    existing?.classList.add('you');
    ask(wake[1] || 'Is this call real?', false);
    return;
  }
  queueAnalysis();
}

// ---------------- risk engine ----------------
function updateRisk(finalText) {
  const rule = S.tracker.current(S.partial);
  S.rule = rule;
  for (const k of rule.tactics) markTactic(k, finalText);
  S.target = combineRisk(rule, S.aiRisk);
  S.peak = Math.max(S.peak, S.target);
  setLevel(levelFor(S.target));
  const aiLeads = S.aiRisk != null && S.aiReason && S.aiRisk > rule.risk;
  setReason(aiLeads ? S.aiReason : rule.tactics.length ? rule.summary : S.aiReason || 'No warning signs so far.');
  maybeAlarm();
}

function markTactic(k, quote, byAI = false) {
  if (!TACTICS[k] || TACTICS[k].hidden) return;
  if (!S.found.has(k)) {
    S.found.set(k, byAI
      ? { t: elapsed(), quote: '', who: null, byAI: true }
      : { t: elapsed(), quote: quote || S.partial || S.turns.at(-1)?.text || '', who: quote ? S.turns.at(-1)?.who : null });
    const el = document.querySelector(`.tactic[data-k="${k}"]`);
    if (el) {
      el.classList.add('on');
      el.querySelector('.when').textContent = fmt(elapsed());
    }
    $('#tactic-count').textContent = `${S.found.size} of ${VISIBLE.length} detected`;
  } else if (quote && !S.found.get(k).quote) {
    Object.assign(S.found.get(k), { quote, byAI: false, who: S.turns.at(-1)?.who || null });
  }
}

function maybeAlarm() {
  if (!S.running) return;
  // Repeat alarms follow the rule layer only: AI tags are useful context but too noisy to re-alarm on.
  const critical = S.rule?.critical || [];
  const d = decideAlarm({ level: S.level, critical, warned: S.warned, lastWarnAt: S.lastWarnAt, now: performance.now() });
  if (d) {
    S.warned.add('first');
    d.fresh.forEach((k) => S.warned.add(k));
    S.lastWarnAt = performance.now();
    const all = [...new Set([...(S.rule?.tactics || []), ...S.aiTactics])];
    const w = warningFor(d.lead, all);
    if (!d.lead && S.aiReason) w.what = S.aiReason;
    if (S.stats.alarmAtMs == null) S.stats.alarmAtMs = Math.round(performance.now() - S.startedAt);
    S.lastWarning = w;
    showAlarm(w);
    return;
  }
  if (decideCaution({ level: S.level, warned: S.warned })) {
    S.warned.add('caution');
    chime(true);
    speak(CAUTION_VOICE, { caution: true });
  }
}

// Free AI tiers allow only a few requests per minute: at most one request every few seconds,
// always with the newest transcript. The instant rule layer covers the gaps.
const AI_GAP = 4000;
let analysisTimer, lastAnalysis = 0;
function aiEnabled() { return health.llm && prefs.ai; }
function queueAnalysis() {
  if (!aiEnabled()) return;
  clearTimeout(analysisTimer);
  analysisTimer = setTimeout(runAnalysis, Math.max(150, lastAnalysis + AI_GAP - Date.now()));
}

async function runAnalysis() {
  if (!aiEnabled() || !S.turns.length) return;
  if (S.aiBusy) { S.aiQueued = true; return; }
  S.aiBusy = true;
  lastAnalysis = Date.now();
  const session = S.startedAt;
  try {
    const r = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turns: S.turns.slice(-40).map((t) => t.text) }),
      signal: AbortSignal.timeout(12000),
    });
    const j = await r.json().catch(() => ({}));
    if (session !== S.startedAt || !r.ok || j.fallback) {
      if (r.status === 503) { health.llm = false; setPills(); }
      return;
    }
    S.aiRisk = Number.isFinite(j.risk) ? j.risk : null;
    S.aiTactics = Array.isArray(j.tactics) ? j.tactics.filter((k) => TACTICS[k]) : [];
    S.aiReason = typeof j.reason === 'string' ? j.reason : '';
    for (const k of S.aiTactics) markTactic(k, null, true);
    updateRisk();
  } catch {
    /* timeout or network hiccup: the rule layer keeps working */
  } finally {
    S.aiBusy = false;
    if (S.aiQueued) { S.aiQueued = false; queueAnalysis(); }
  }
}

// ---------------- gauge animation ----------------
const ARC = 424.1;
let lastW = 0;
function tick() {
  S.shown += (S.target - S.shown) * 0.15; // fast enough that number and label agree within ~0.3 s
  if (Math.abs(S.target - S.shown) < 0.2) S.shown = S.target;
  $('#g-arc').style.strokeDashoffset = ARC * (1 - S.shown / 100);
  $('#g-num').textContent = Math.round(S.shown);
  const lvl = document.body.dataset.level;
  $('#g-verdict').textContent = lvl === 'idle' ? 'Ready' : LEVELS.find((l) => l.key === lvl)?.label || '';
  $('#timer').textContent = fmt(elapsed());
  if (!document.hidden) drawWave();
  requestAnimationFrame(tick);
}

const wave = $('#wave');
const wctx = wave.getContext('2d');
let waveData;
function drawWave() {
  const cw = Math.round(wave.clientWidth * devicePixelRatio);
  if (cw !== lastW) { wave.width = cw; wave.height = 56 * devicePixelRatio; lastW = cw; }
  const w = wave.width, h = wave.height;
  wctx.clearRect(0, 0, w, h);
  const color = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#5eead4';
  const bars = 48, gap = w / bars;
  const live = S.analyser && S.running;
  if (live) {
    if (!waveData || waveData.length !== S.analyser.frequencyBinCount) waveData = new Uint8Array(S.analyser.frequencyBinCount);
    S.analyser.getByteFrequencyData(waveData);
  }
  wctx.fillStyle = color;
  for (let i = 0; i < bars; i++) {
    const v = live ? Math.max(0.06, waveData[Math.floor((i / bars) * waveData.length * 0.6)] / 255) : 0.08 + 0.05 * Math.sin(performance.now() / 600 + i / 3);
    const bh = v * h * 0.9, bw = gap * 0.6;
    wctx.globalAlpha = 0.35 + v * 0.65;
    wctx.beginPath();
    wctx.roundRect(i * gap + gap * 0.2, (h - bh) / 2, bw, bh, bw / 2);
    wctx.fill();
  }
  wctx.globalAlpha = 1;
}

// ---------------- voice (agent speaks) ----------------
let voice;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
  const prefer = ['Google UK English Female', 'Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Google US English', 'Karen', 'Moira'];
  voice = prefer.map((n) => vs.find((v) => v.name.includes(n))).find(Boolean) || vs[0];
}
const canSpeak = 'speechSynthesis' in window;
if (canSpeak) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function agentBubble(text, alert, caution) {
  const d = document.createElement('div');
  d.className = `turn agent${alert ? ' alert' : caution ? ' caution' : ''}`;
  d.innerHTML = `<span class="ts">${fmt(elapsed())}</span><div class="bubble"><div class="agent-name">${SHIELD_SVG}ScamShield</div>${esc(text)}</div>`;
  $('#transcript').appendChild(d);
  trimTranscript();
  scrollTranscript();
}

// Sentences are queued so a warning and a spoken answer never cut each other off.
let speechChain = Promise.resolve();
let speechGen = 0;
function hush() {
  speechGen++;
  if (canSpeak) speechSynthesis.cancel();
}
function speak(text, { alert = false, caution = false } = {}) {
  agentBubble(text, alert, caution);
  if (!canSpeak) return Promise.resolve();
  const gen = speechGen;
  speechChain = speechChain.then(() => (gen === speechGen ? say(text) : null));
  return speechChain;
}

function duck(on) {
  if (S.gain && S.audioCtx?.state === 'running') S.gain.gain.setTargetAtTime(on ? 0.12 : 1, S.audioCtx.currentTime, on ? 0.1 : 0.25);
}

function say(text) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.volume = 1;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      S.speaking = false;
      duck(false);
      $('#speaking').classList.add('quiet');
      resolve();
    };
    u.onstart = () => { S.speaking = true; duck(true); $('#speaking').classList.remove('quiet'); };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
    setTimeout(done, 15000); // some browsers never fire onend
  });
}

// Two-tone chime: gets attention even if speech synthesis is unavailable or muted.
function chime(soft = false) {
  try {
    const ctx = S.audioCtx && S.audioCtx.state !== 'closed' ? S.audioCtx : new AudioContext();
    const t = ctx.currentTime;
    (soft ? [660] : [880, 660]).forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.22);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.22 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.22);
      o.stop(t + i * 0.22 + 0.22);
    });
  } catch {}
}

function showAlarm(w) {
  $('#alarm-what').textContent = w.what;
  $('#alarm-text').textContent = w.why;
  $('#alarm-act').textContent = w.act;
  $('#alarm-risk').textContent = Math.round(S.target);
  $('#speaking').hidden = !canSpeak;
  const wasOpen = !$('#alarm').hidden;
  $('#alarm').hidden = false;
  if (!wasOpen) $('#alarm-hangup').focus({ preventScroll: true });
  if (navigator.vibrate) navigator.vibrate([300, 120, 300]);
  chime();
  speak(w.voice, { alert: true });
}

function hideAlarm() {
  $('#alarm').hidden = true;
}

async function ask(question, showYou = true) {
  if (showYou) {
    const d = document.createElement('div');
    d.className = 'turn you';
    d.innerHTML = `<span class="ts">${fmt(elapsed())}</span><div class="bubble"><div class="agent-name you-name">You asked</div>${esc(question)}</div>`;
    $('#transcript').appendChild(d);
    scrollTranscript();
  }
  let answer = '';
  if (aiEnabled() && S.turns.length) {
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ask', question, turns: S.turns.slice(-40).map((t) => t.text) }),
        signal: AbortSignal.timeout(8000),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && typeof j.answer === 'string') answer = j.answer;
    } catch {}
  }
  await speak(safeAnswer(S.level, answer, ruleAnswer()));
}

function ruleAnswer() {
  const tactics = S.rule?.tactics || [];
  const top = byPriority(tactics)[0];
  if (S.level === 'critical' || S.level === 'high') return `This looks like a scam. ${summarize(tactics)} ${top ? TACTICS[top].act || '' : ''}`.trim();
  if (S.level === 'medium') return `Be careful. ${summarize(tactics)} Don't share any codes, passwords or money.`;
  return "I haven't heard any warning signs so far. Still, never share codes or passwords on a call.";
}

// ---------------- AssemblyAI streaming ----------------
async function openStream(withKeyterms = true) {
  const r = await fetch('/api/token', { signal: AbortSignal.timeout(10000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.token) throw new Error(j.error || 'Could not start live transcription.');
  // speaker_labels: live diarization, so the transcript and report show who said what
  const params = new URLSearchParams({ sample_rate: RATE, encoding: 'pcm_s16le', format_turns: 'true', speaker_labels: 'true', token: j.token });
  if (withKeyterms) params.set('keyterms_prompt', JSON.stringify(KEYTERMS));
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?${params}`);
    ws.binaryType = 'arraybuffer';
    let begun = false, serverError = '';
    // Begin normally arrives in ~1.2 s; don't leave a caller unprotected waiting on a slow handshake
    const timer = setTimeout(() => { if (!begun) { try { ws.close(); } catch {} reject(new Error('The speech service is slow to respond.')); } }, 6000);
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.type === 'Begin') { begun = true; clearTimeout(timer); resolve(ws); }
      else if (m.type === 'Turn' && S.ws === ws) handleTurn(m);
      else if (m.error) serverError = String(m.error);
    };
    ws.onerror = () => {};
    ws.onclose = (e) => {
      clearTimeout(timer);
      const busy = /concurren|too many|limit|rate/i.test(serverError + ' ' + (e.reason || ''));
      if (!begun) reject(new Error(busy ? 'The speech service is busy right now (free-tier limit). Please try again in a minute.' : 'Could not connect to the speech service.'));
      else if (S.ws === ws && S.running && !S.closing) reconnect(e);
    };
  });
}

async function connectStream() {
  try {
    return await openStream(true);
  } catch {
    return await openStream(false); // keyterms are an enhancement, never a blocker
  }
}

async function reconnect(e) {
  if (S.reconnecting) return;
  S.reconnecting = true;
  S.ws = null;
  // keep what was being said when the connection dropped: it may be the scammer's key request
  if (S.partial && S.partialId) onFinal(S.partialId, S.partial);
  setPills();
  // sessions are capped at 15 min to protect free credits; renewing one is routine, not an error
  const routine = /durat|expir|time ?limit|max/i.test(e?.reason || '');
  if (routine) addSys('Refreshing the live connection…');
  else addSys(navigator.onLine ? 'Connection to speech service lost · reconnecting…' : "You're offline · will reconnect when the internet is back", 'warn');
  const session = S.startedAt;
  for (let i = 0; i < RECONNECT_DELAYS.length && S.running && session === S.startedAt; i++) {
    while (!navigator.onLine && S.running && session === S.startedAt) await sleep(500);
    await sleep(RECONNECT_DELAYS[i]);
    if (!S.running || session !== S.startedAt) return;
    try {
      S.ws = await connectStream();
      S.reconnecting = false;
      if (!routine) addSys('Reconnected · still protecting this call');
      setPills();
      return;
    } catch {}
  }
  S.reconnecting = false;
  if (S.running && session === S.startedAt) {
    toast(`Live transcription stopped (${e?.code || 'network'}). Your report so far is below.`, true);
    stopSession(true);
  }
}

function handleTurn(m) {
  const id = 'a' + m.turn_order;
  const live = Array.isArray(m.words) && m.words.length ? m.words.map((w) => w.text).join(' ') : m.transcript;
  if (m.end_of_turn && m.turn_is_formatted) {
    clearTimeout(S.pendingEot.get(id));
    S.pendingEot.delete(id);
    onFinal(id, m.transcript, m.speaker_label);
  } else if (m.end_of_turn) {
    onPartial(id, m.transcript || live);
    clearTimeout(S.pendingEot.get(id));
    // formatted text normally follows within ~0.5 s; finalize anyway if it never arrives
    S.pendingEot.set(id, setTimeout(() => { S.pendingEot.delete(id); onFinal(id, m.transcript || live); }, 1500));
  } else {
    onPartial(id, live || '');
  }
}

// Sends through whichever socket is current, so audio keeps flowing after a reconnect.
function makeSender() {
  let buf = new Int16Array(CHUNK), n = 0;
  return {
    push(int16) {
      for (let i = 0; i < int16.length; i++) {
        buf[n++] = int16[i];
        if (n === CHUNK) {
          if (S.ws && S.ws.readyState === 1) S.ws.send(buf.buffer);
          // a socket stuck in CLOSING may not fire onclose for a long time — don't wait for it
          else if (S.ws && S.ws.readyState > 1 && S.running && !S.reconnecting && !S.closing) reconnect({ code: 'closed' });
          buf = new Int16Array(CHUNK);
          n = 0;
        }
      }
    },
  };
}

// ---------------- sessions ----------------
async function beginSession(source, demoId, label) {
  if (S.running) await stopSession(false);
  hush();
  hideAlarm();
  $('#report').hidden = true;
  Object.assign(S, freshState());
  S.source = source;
  S.demoId = demoId;
  resetUI();
  $('#console').scrollIntoView({ behavior: 'smooth', block: 'start' });
  S.audioCtx = new AudioContext();
  await S.audioCtx.resume();
  S.analyser = S.audioCtx.createAnalyser();
  S.analyser.fftSize = 256;
  S.running = true;
  S.startedAt = performance.now();
  setRunningUI(true, label);
}

async function startLive() {
  if (busy) return;
  if (S.running) return stopSession(true);
  if (!health.assemblyai) return toast('Live listening needs the speech service, which is not available right now. Try a demo call.', true);
  if (!navigator.mediaDevices?.getUserMedia) return toast('This browser cannot use the microphone. Try Chrome, Edge or Safari.', true);
  busy = true;
  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      const msg = e?.name === 'NotFoundError'
        ? 'No microphone found. Plug one in or use a phone, then try again.'
        : 'Microphone access was blocked. Click the lock icon next to the address bar, allow the microphone, and try again.';
      return toast(msg, true);
    }
    await beginSession('mic', null, 'Live call');
    S.cleanup.push(() => stream.getTracks().forEach((t) => t.stop()));
    addSys('Connecting to AssemblyAI…');
    try {
      S.ws = await connectStream();
    } catch (e) {
      toast(e.message, true);
      return stopSession(false);
    }
    addSys('Protecting this call · put it on speaker');
    setPills();
    const sender = makeSender();
    const src = S.audioCtx.createMediaStreamSource(stream);
    await S.audioCtx.audioWorklet.addModule('/js/pcm-worklet.js');
    const node = new AudioWorkletNode(S.audioCtx, 'pcm-forwarder');
    const resample = makeResampler(S.audioCtx.sampleRate);
    node.port.onmessage = (e) => {
      let pcm = resample(e.data);
      if (S.speaking) pcm = new Int16Array(pcm.length); // don't transcribe our own warning
      sender.push(pcm);
    };
    src.connect(node);
    src.connect(S.analyser);
    const track = stream.getAudioTracks()[0];
    track.onended = () => {
      if (!S.running) return;
      toast('The microphone was disconnected. Protection stopped.', true);
      stopSession(true);
    };
    S.cleanup.push(() => { track.onended = null; node.port.onmessage = null; src.disconnect(); node.disconnect(); });
  } finally {
    busy = false;
  }
}

async function loadWav(id) {
  const r = await fetch(`/audio/${id}.wav`);
  if (!r.ok) throw new Error('missing audio');
  const buf = await r.arrayBuffer();
  const dv = new DataView(buf);
  let off = 12;
  while (off < dv.byteLength - 8) {
    const tag = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));
    const size = dv.getUint32(off + 4, true);
    if (tag === 'data') return new Int16Array(buf, off + 8, Math.floor(Math.min(size, dv.byteLength - off - 8) / 2));
    off += 8 + size + (size % 2);
  }
  throw new Error('Bad WAV');
}

async function startDemo(id) {
  if (busy) return;
  if (S.running && S.demoId === id) return stopSession(true);
  const call = calls.find((c) => c.id === id);
  if (!call) return;
  busy = true;
  try {
    let pcm;
    try { pcm = await loadWav(id); } catch { return toast('Could not load the demo audio. Check your connection.', true); }
    const realStt = health.assemblyai;
    await beginSession('demo', id, realStt ? 'Demo · live AssemblyAI' : 'Demo · simulated transcript');
    addSys(`Incoming call · ${call.title}`);
    if (realStt) {
      try {
        S.ws = await connectStream();
      } catch (e) {
        toast(`${e.message} Showing a simulated transcript instead.`, true);
      }
    }
    if (!S.ws) {
      addSys('Simulated transcript: the live speech service is unavailable, so the script is shown in time with the audio', 'warn');
      $('#source-tag').textContent = 'Demo · simulated transcript';
    }
    setPills();

    const ctx = S.audioCtx;
    const ab = ctx.createBuffer(1, pcm.length, RATE);
    const ch = ab.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;
    const srcNode = ctx.createBufferSource();
    srcNode.buffer = ab;
    S.gain = ctx.createGain();
    srcNode.connect(S.gain).connect(S.analyser).connect(ctx.destination);
    const t0 = ctx.currentTime + 0.15;
    srcNode.start(t0);
    S.stats.audioStart = performance.now() + 150; // for latency measurement in tests
    const dur = pcm.length / RATE;
    const prog = document.querySelector(`.demo[data-id="${id}"] .d-prog`);
    const streaming = !!S.ws;
    const sender = streaming ? makeSender() : null;
    const shown = new Set();
    let sent = 0;
    const iv = setInterval(() => {
      const t = ctx.currentTime - t0;
      if (prog) prog.style.width = `${Math.min(100, (t / dur) * 100)}%`;
      if (streaming) {
        const upto = Math.min(pcm.length, Math.floor(t * RATE));
        if (upto > sent) { sender.push(pcm.subarray(sent, upto)); sent = upto; }
      } else {
        simulate(id, t, shown);
      }
    }, 50);
    srcNode.onended = () => {
      clearInterval(iv);
      if (sender) sender.push(new Int16Array(RATE)); // 1 s of silence lets the last turn end
      setTimeout(() => S.demoId === id && S.running && stopSession(true), 2200);
    };
    S.cleanup.push(() => { clearInterval(iv); srcNode.onended = null; try { srcNode.stop(); } catch {} });
  } finally {
    busy = false;
  }
}

// Used only when the live speech service is unavailable, and clearly labelled as simulated.
function simulate(id, t, shown) {
  (timings[id]?.lines || []).forEach((l, i) => {
    const key = 's' + i;
    if (t < l.start || shown.has(key)) return;
    const words = l.text.split(' ');
    const frac = Math.min(1, (t - l.start) / Math.max(0.1, l.end - l.start));
    if (frac >= 1) { shown.add(key); onFinal(key, l.text); }
    else onPartial(key, words.slice(0, Math.max(1, Math.ceil(words.length * frac))).join(' '));
  });
}

async function stopSession(showReport) {
  if (!S.running) return;
  S.running = false;
  S.closing = true;
  S.endedAt = performance.now();
  for (const f of S.cleanup) try { f(); } catch {}
  S.cleanup = [];
  if (S.ws) {
    const ws = S.ws;
    try { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'Terminate' })); } catch {}
    setTimeout(() => { try { ws.close(); } catch {} }, 1500);
  }
  for (const to of S.pendingEot.values()) clearTimeout(to);
  S.pendingEot.clear();
  if (S.partial && S.partialId) onFinal(S.partialId, S.partial);
  setRunningUI(false, 'Call ended');
  const ctx = S.audioCtx;
  setTimeout(() => ctx && ctx.state !== 'closed' && ctx.close().catch(() => {}), 400);
  if (showReport) {
    if (aiEnabled() && S.turns.length && !S.aiBusy) { clearTimeout(analysisTimer); await runAnalysis(); }
    const until = Date.now() + 3500;
    while ((S.aiBusy || S.aiQueued) && Date.now() < until) await sleep(150);
    await waitSpeech();
    hideAlarm();
    showReportModal();
  }
}

function waitSpeech() {
  return new Promise((res) => {
    const until = Date.now() + 12000;
    const check = () => (!S.speaking || Date.now() > until ? res() : setTimeout(check, 200));
    check();
  });
}

function clearSession() {
  if (S.running) return toast('End the call first, then clear it.');
  hush();
  Object.assign(S, freshState());
  showEmpty();
  renderTactics();
  setLevel('idle');
  setReason('Start a live call or play a demo. ScamShield will explain what it hears.');
  $('#source-tag').textContent = 'Idle';
  toast('Transcript and report cleared from this device.');
}

// ---------------- report ----------------
function reportData() {
  const level = levelFor(S.peak);
  const tactics = [...S.found.entries()].sort((a, b) => a[1].t - b[1].t);
  const reason = S.aiReason && S.aiRisk >= (S.rule?.risk || 0) ? S.aiReason : summarize([...S.found.keys()]);
  return { level, peak: Math.round(S.peak), duration: fmt(elapsed()), tactics, reason };
}

function nextSteps() {
  const top = byPriority([...S.found.keys()]).find((k) => TACTICS[k].act);
  return [
    ...(top ? [TACTICS[top].act] : []),
    'Do not call the number back or answer if they ring again.',
    'If you shared a code, password or card number, call your bank now using the number on your card.',
    'Tell a family member and report the number.',
  ];
}

const REPORT_TITLES = { critical: 'Scam call caught', high: 'High-risk call', medium: 'Suspicious call', low: 'Call looked safe' };

function reportText() {
  const r = reportData();
  const lines = [
    `ScamShield call report — ${REPORT_TITLES[r.level].toUpperCase()}`,
    `Peak risk: ${r.peak}% (${LEVELS.find((l) => l.key === r.level).label}) · Call length: ${r.duration} · ${new Date().toLocaleString()}`,
  ];
  if (r.reason) lines.push(`Why: ${r.reason}`);
  if (r.tactics.length) {
    lines.push('', 'Warning signs:');
    for (const [k, v] of r.tactics) lines.push(`• [${fmt(v.t)}] ${TACTICS[k].label}${v.who ? ` (Speaker ${v.who})` : ''}${v.byAI ? ' (noticed by AI)' : ''}${v.quote ? ` — "${v.quote.slice(0, 120)}"` : ''}`);
  }
  if (r.level !== 'low') lines.push('', 'Next steps:', ...nextSteps().map((x, i) => `${i + 1}. ${x}`));
  lines.push('', 'ScamShield can miss scams. If in doubt, hang up and call back on a number you trust.');
  return lines.join('\n');
}

function showReportModal() {
  const r = reportData();
  const badge = $('#report-badge');
  badge.className = `report-badge ${r.level}`;
  badge.textContent = r.peak;
  $('#report-title').textContent = REPORT_TITLES[r.level];
  $('#report-stats').innerHTML = `
    <div><b>${r.peak}%</b><span>Peak risk</span></div>
    <div><b>${r.tactics.length}</b><span>Warning signs</span></div>
    <div><b>${r.duration}</b><span>Call length</span></div>`;
  let body = r.reason ? `<p class="report-reason">${esc(r.reason)}</p>` : '';
  if (r.tactics.length) {
    body += `<h3>Timeline</h3><ul class="tl">${r.tactics
      .map(([k, v]) => `<li><time>${fmt(v.t)}</time>${esc(TACTICS[k].label)}${v.who ? ` <span class="spk spk-${v.who}">Speaker ${v.who}</span>` : ''}${v.byAI ? ' <span class="ai-tag">noticed by AI</span>' : ''}${v.quote ? `<q>${esc(v.quote.slice(0, 160))}</q>` : ''}</li>`)
      .join('')}</ul>`;
  }
  body += r.level === 'low'
    ? `<h3>All clear</h3><p class="report-reason">No scam warning signs were detected on this call.</p>`
    : `<h3>What to do next</h3><ol class="next">${nextSteps().map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
  body += `<p class="report-note">Reports stay on this device. Nothing is saved on a server.</p>`;
  $('#report-body').innerHTML = body;
  const txt = reportText();
  $('#share-wa').href = `https://wa.me/?text=${encodeURIComponent(txt)}`;
  $('#share-mail').href = `mailto:?subject=${encodeURIComponent('ScamShield call report')}&body=${encodeURIComponent(txt)}`;
  $('#report').hidden = false;
  $('#report-close').focus({ preventScroll: true });
}

// ---------------- wiring ----------------
function wire() {
  $('#btn-live').addEventListener('click', startLive);
  $('#hero-live').addEventListener('click', startLive);
  $('#btn-ask').addEventListener('click', () => ask('Is this call real?'));
  $('#btn-clear').addEventListener('click', clearSession);
  $('#alarm-dismiss').addEventListener('click', hideAlarm);
  $('#alarm-hangup').addEventListener('click', () => { hush(); hideAlarm(); stopSession(true); });
  $('#report-close').addEventListener('click', () => ($('#report').hidden = true));
  $('#report').addEventListener('click', (e) => e.target.id === 'report' && ($('#report').hidden = true));
  $('#share-dl').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([reportText()], { type: 'text/plain' }));
    a.download = 'scamshield-report.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#share-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(reportText()); toast('Report copied'); } catch { toast('Copy failed — use Download instead.', true); }
  });
  const toggle = $('#ai-toggle');
  prefs.ai = store.get('ss-ai') !== 'off';
  toggle.checked = prefs.ai;
  toggle.addEventListener('change', () => {
    prefs.ai = toggle.checked;
    store.set('ss-ai', prefs.ai ? 'on' : 'off');
    if (!prefs.ai) { S.aiRisk = null; S.aiTactics = []; S.aiReason = ''; if (S.running) updateRisk(); }
    setPills();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideAlarm(); $('#report').hidden = true; }
  });
  window.addEventListener('offline', () => { if (S.running) addSys("You're offline · transcription paused", 'warn'); });
  window.addEventListener('pagehide', () => { hush(); if (S.running) stopSession(false); });
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

async function init() {
  setLevel('idle');
  renderTactics();
  showEmpty();
  wire();
  requestAnimationFrame(tick);
  const get = (u) => fetch(u, { signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  const [h, c, t] = await Promise.allSettled([get('/api/health'), get('/demo/calls.json'), get('/demo/timings.json')]);
  health.assemblyai = !!h.value?.assemblyai;
  health.llm = !!h.value?.llm;
  calls = c.value || [];
  timings = t.value || {};
  if (!calls.length) $('#demo-grid').innerHTML = '<p class="muted">Demo calls could not load. Check your connection and refresh.</p>';
  else renderDemos();
  setPills();
}

init();

// Read-only hook for automated browser tests.
window.__scamshield = { S, health, prefs, stopSession, startDemo, combineRisk };
