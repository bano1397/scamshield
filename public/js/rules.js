// Instant rule layer: runs in the browser on every partial transcript (and in tests/serverless).
// Signals look for *requests aimed at the listener* ("read me the code", "you must transfer"),
// not bare keywords, so normal talk about banks, codes or money stays calm.

const REQ = String.raw`(?:read|tell|give|send|share|say|repeat|confirm|verify|provide|enter|type|text|forward|need|want)`;
const ORG = String.raw`(?:(?:internet|broadband|mobile|phone|electric(?:ity)?|gas|water|energy) (?:provider|company|supplier|service)|bank|fraud|security|irs|internal revenue|tax|revenue|hmrc|police|fbi|customs|immigration|court|social security|government|microsoft|windows|apple|icloud|amazon|google|paypal|netflix|dhl|fedex|ups|courier|post office|delivery|manager|boss|ceo|director|telecom|phone company|electric(?:ity)? company)`;
const MONEY = String.raw`(?:money|funds|savings|payment|fee|fine|cash|bail|[$£€₹]\s?\d|\d[\d,]*\s?(?:dollars|pounds|rupees|euros)|(?:hundred|thousand|lakh)s?\s(?:dollars|pounds|rupees|euros))`;
const PAYMETHOD = String.raw`(?:gift ?cards?|google play|itunes|apple (?:gift )?cards?|steam cards?|amazon cards?|vouchers?|bitcoin|crypto(?:currency)?|usdt|western union|moneygram)`;
const W = (n) => `[^.?!]{0,${n}}`; // words within the same sentence
// "tell me", "read it back to us", "what's the ..." — the caller wants the item given to *them*
const TO_ME = String.raw`(?:(?:read|tell|give|send|share|say|repeat|text|forward|confirm|pass)\s(?:it\s|them\s|those\s|that\s)?(?:back\s)?(?:to\s)?(?:me|us)|read (?:it |them |that |those )?(?:out|back)|what(?:'s| is| was| are))`;
const CODE_Q = String.raw`(?:one[- ]time|verification|security|confirmation|authori[sz]ation|access|login|sms|otp|\d[- ]digit|six[- ]digit|four[- ]digit|eight[- ]digit)`;
const CODE_SRC = String.raw`(?:came|come|comes|sent|got|get|received|arrived|texted|popped|on your (?:phone|mobile|screen|cell)|in the (?:text|message|sms))`;

const NEGATED = /\b(?:never|not|don'?t|won'?t|no one|nobody|shouldn'?t)\b[^.?!]*$/i;
// Matches containing these are everyday requests, never scam signals.
const HARMLESS = /\b(wi-?fi|door|gate|garage|zip|area|promo|discount|coupon|voucher code for|netflix password)\b/i;

export const TACTICS = {
  otp: {
    label: 'Asks for a verification code', critical: true, weight: 80,
    does: 'is asking for a verification code',
    explain: 'Banks and companies never ask you to read out a one-time code. Whoever has it can get into your account.',
    voice: 'Stop. This may be a scam. Never give a caller your verification code. Hang up.',
    act: 'Do not read out any code. Hang up and call your bank on the number printed on your card.',
    patterns: [
      // "the security code on the back" of a card is a card-details request (credential), not an OTP
      new RegExp(String.raw`\b${TO_ME}\b${W(40)}\b${CODE_Q}\s?(?:code|number|pin|password|passcode|digits)\b(?!\s+on the back)`, 'i'),
      new RegExp(String.raw`\b${TO_ME}\b${W(40)}\b(?:code|number|digits|otp|pin)\b${W(50)}\b${CODE_SRC}`, 'i'),
      new RegExp(String.raw`\b${TO_ME}\b${W(12)}\b(?:the|that|this|your)\s(?:\w+\s)?(?:code|otp)\b`, 'i'),
      /\bwhat(?:'s| is| was)?\s(?:the\s)?(?:code|number|otp|pin|digits)\b[^.?!]{0,40}\b(?:receiv|got|get|sent|text|sms|phone|screen|came)/i,
    ],
  },
  credential: {
    label: 'Asks for a password, PIN or card', critical: true, weight: 80,
    does: 'is asking for your password, PIN or card details',
    explain: 'No real bank, shop or officer needs your PIN, password or the digits on your card over the phone.',
    voice: 'Stop. Never share your PIN, password or card details on a call. Hang up.',
    act: 'Share nothing. If you already did, call your bank now using the number on your card.',
    patterns: [
      new RegExp(String.raw`\b(?:${REQ}|what(?:'s| is))\b${W(40)}\b(?:password|passcode|pin(?: number)?|cvv|cvc|security (?:answer|question|code on the back)|maiden name|card number|long number on|digits on the back|expiry date|login details|online banking (?:details|password|login)|account number and|social security number|ssn)\b`, 'i'),
      new RegExp(String.raw`\bpay\b${W(40)}\bwith your (?:card|card number|debit card|credit card)\b`, 'i'),
      /\blog ?in to your (?:online )?bank(?:ing)?\b/i,
    ],
  },
  remote: {
    label: 'Wants remote access to your device', critical: true, weight: 80,
    does: 'wants remote access to your device',
    explain: 'Remote-control apps let a stranger see your screen and use your bank apps as if they were you.',
    voice: 'Stop. Do not install anything or give remote access. This is how scammers take control. Hang up.',
    act: 'Do not install anything. If you already did, turn off the internet and ask someone you trust for help.',
    patterns: [
      /\b(?:any ?desk|team ?viewer|quick ?support|ultra ?viewer|rust ?desk|logmein|supremo|remote (?:access|support app|desktop|control))\b/i,
      /\bshare (?:your|the) screen\b[^.?!]{0,40}\b(?:so (?:that )?i can|let me|for me to)\b[^.?!]{0,20}\b(?:check|fix|see|help|secure|access|look)/i,
      /\b(?:let me|i will|i'll|i need to) (?:connect|get|log) ?(?:in)?to your (?:computer|pc|laptop|phone|device|system)\b|\b(?:press|hold) (?:down )?the windows key\b/i,
      new RegExp(String.raw`\b(?:install|download|open)\b${W(30)}\b(?:app|application|software|program|tool)\b${W(50)}\b(?:so (?:that )?i can|let me|i can (?:help|fix|check|see|access|secure)|access your|secure your|to fix|to help you)`, 'i'),
      /\bgive me (?:control|access) (?:of|to) your (?:computer|phone|device|laptop)\b/i,
    ],
  },
  unusual_payment: {
    label: 'Gift cards, crypto or a "safe account"', critical: true, weight: 80,
    does: 'wants payment by gift card, crypto or a "safe account"',
    explain: 'Gift cards, crypto and "safe accounts" are used by scammers because the money can never be traced or returned.',
    voice: 'Stop. No real bank or government takes gift cards or crypto. This is a scam. Hang up.',
    act: 'Do not buy cards or move money. Real organisations never ask for this.',
    patterns: [
      new RegExp(String.raw`\b(?:pay|settle|clear|cover|send|use|wire|put)\b${W(40)}\b${PAYMETHOD}`, 'i'),
      new RegExp(String.raw`\b(?:buy|get|purchase|pick up|grab)\b[^?!]{0,40}\bgift ?cards?\b[^?!]{0,90}\b(?:send|read|give|tell|text)\b[^?!]{0,15}\b(?:codes?|numbers?|pins?|photos?|pictures?)\b`, 'i'),
      /\bnumbers (?:on|from) the backs?\b(?! of (?:your|the) (?:debit |credit |bank )?card)|\bcodes (?:on|from) the backs?\b|\bscratch (?:off )?(?:the )?(?:backs?|silver|panel)\b/i,
      /\b(?:move|transfer|send|put|wire)\b[^.?!]{0,40}\b(?:safe|secure|protected|holding) account\b/i,
      /\b(?:bitcoin|crypto) (?:atm|machine|kiosk)\b|\bto this (?:wallet|crypto address)\b/i,
    ],
  },
  money_request: {
    label: 'Asks you to send money', critical: false, weight: 30,
    does: 'is asking you to send money',
    explain: 'A caller pushing you to send or move money is the end goal of almost every phone scam.',
    voice: 'Stop. Do not send any money. Hang up and call your bank on its official number.',
    act: 'Do not send money. Hang up and check with your bank or family using a number you already know.',
    patterns: [
      // a demand or a direct ask — not "you can pay me later" from a plumber you called
      new RegExp(String.raw`\b(?:you (?:must|need to|have to|should|are required to|will (?:need|have) to|'ll (?:need|have) to)|please|i need you to|can you|could you|go and)\s(?:\w+\s){0,3}(?:transfer|wire|send|move|withdraw|pay)\b${W(35)}\b${MONEY}`, 'i'),
      /\b(?:if|unless) you (?:do not |don'?t )?(?:pay|transfer|send)\b|\byou (?:must|need to|have to) (?:\w+ ){0,2}(?:pay|transfer)\b/i,
      /\b(?:need|needs) (?:\w+ ){0,2}bail money\b|\bbail money\b/i,
    ],
  },
  impersonation: {
    label: 'Claims to be a bank or authority', critical: false, weight: 20,
    does: 'claims to be from a bank or an authority',
    explain: 'Anyone can say they are your bank, the police or a company. Call back on the official number to check.',
    voice: 'Be careful. Anyone can pretend to be your bank. Hang up and call the official number.',
    act: 'Hang up and call the organisation yourself on a number you find independently.',
    patterns: [
      new RegExp(String.raw`\b(?:calling|this is|i'?m|i am|we'?re|we are|it'?s)\b${W(30)}\b(?:from|with|of|on behalf of)\s(?:the\s|your\s)?${ORG}`, 'i'),
      new RegExp(String.raw`\b(?:this is|it'?s)\s(?:the\s|your\s)?${ORG}\b`, 'i'),
      /\b(?:fraud|security|technical) (?:department|team|prevention)\b/i,
      /\b(?:this is|it is|it'?s) \w+,? your (?:manager|boss|ceo|director|supervisor)\b/i,
      /\b(?:officer|agent|detective|inspector|sergeant) [a-z]+ (?:[a-z]+ )?(?:from|with|calling)\b/i,
    ],
  },
  account_threat: {
    label: 'Says your account is in danger', critical: false, weight: 15,
    does: 'says your account is in danger',
    explain: 'A "locked", "hacked" or "at risk" account is the most common way scams start — to scare you into acting fast.',
    voice: 'Be careful. Scammers say your account is in danger to rush you.',
    act: 'Check your account yourself in your bank app or by calling the number on your card.',
    patterns: [
      /\b(?:account|card|savings|money|computer|line|service|connection|internet|number|licen[cs]e|pension)\b[^.?!]{0,20}\b(?:has been|is|was|will be|are)\s(?:\w+\s)?(?:locked|suspended|frozen|closed|blocked|compromised|hacked|at risk|infected|cancelled|disconnected|cut off|terminated|deactivated)\b/i,
      /\b(?:suspicious|unusual) (?:activity|transaction|payment|login)\b|\bunauthori[sz]ed (?:transaction|charge|access|payment)\b/i,
      /\b(?:infected|a virus|hackers are)\b/i,
    ],
  },
  urgency: {
    label: 'Pressure to act right now', critical: false, weight: 15,
    does: 'is rushing you',
    explain: 'Scammers rush you so you don\'t have time to think or check with anyone.',
    voice: 'Be careful. Real organisations give you time to check.',
    act: 'Slow down. Nothing real needs to happen in the next few minutes.',
    patterns: [
      /\b(?:right now|immediately|urgent(?:ly)?|act now|hurry|as soon as possible|before it'?s too late|last chance|no time to)\b/i,
      /\b(?:within|in) (?:the next )?(?:\d+|one|two|five|ten|fifteen|twenty|thirty) (?:minutes|hours?)\b|\byou only have\b/i,
    ],
  },
  threat: {
    label: 'Threatens arrest or legal trouble', critical: false, weight: 25,
    does: 'is threatening arrest or legal trouble',
    explain: 'Police and tax offices do not threaten arrest over the phone or demand instant payment.',
    voice: 'Stop. Officials do not threaten arrest over the phone. This is a scam. Hang up.',
    act: 'Hang up. If worried, call the agency on its official number.',
    patterns: [
      /\b(?:warrant (?:for|against) (?:you|your)|your arrest|arrest you|you (?:will|'ll) be (?:arrested|jailed|deported|sued)|police will (?:come|arrive)|go to (?:jail|prison)|legal action against you|(?:sue|deport) you)\b/i,
    ],
  },
  secrecy: {
    label: 'Tells you to keep it secret', critical: false, weight: 25,
    does: 'wants you to keep this secret',
    explain: 'Scammers cut you off from people who would spot the scam. Real organisations never ask you to hide a call.',
    voice: 'Stop. Being told to keep a call secret is a scam warning sign. Talk to your family first.',
    act: 'Tell a family member or friend about this call before doing anything.',
    patterns: [
      /\b(?:don'?t|do not) (?:tell|talk to|mention (?:this|it) to|call) (?:anyone|anybody|your|mom|mum|dad|the bank|the police)\b/i,
      /\bkeep (?:this|it) (?:between us|secret|quiet|confidential|to yourself)\b/i,
      /\b(?:stay on the line|don'?t hang up|do not hang up)\b/i,
    ],
  },
  family_emergency: {
    label: 'Family emergency story', critical: false, weight: 25,
    does: 'tells a family-emergency story',
    explain: 'Voices can be faked. The "relative in trouble" scam uses panic to make you send money fast.',
    voice: 'Stop. This may not be your relative. Hang up and call them on their usual number.',
    act: 'Hang up and call your relative, or another family member, on the number you already have.',
    patterns: [
      /\bit'?s me,? (?:your )?(?:grandson|granddaughter|son|daughter|nephew|niece|grandchild)\b|\b(?:grandma|grandpa|nana|mum|mom|dad),? it'?s me\b/i,
      /\b(?:i'?m|i am) (?:in (?:jail|prison|trouble|the hospital)|arrested)\b|\b(?:arrested me|i(?:'ve| have) been arrested)\b/i,
      /\b(?:i )?lost my phone\b|\bthis is my new number\b/i,
    ],
  },
  too_good: {
    label: 'Prize or guaranteed profit', critical: false, weight: 30,
    does: 'is offering a prize or guaranteed profit',
    explain: 'Real prizes and investments never need you to pay, share details or decide on a phone call.',
    voice: 'Be careful. Prizes and guaranteed profits on a phone call are a classic scam.',
    act: 'Do not pay or share anything to "claim" a prize or join an investment.',
    patterns: [/\byou(?:'ve| have) (?:just )?(?:won|been selected)\b|\blucky (?:draw|winner)\b|\bclaim your (?:prize|reward)\b|\bguaranteed (?:returns?|profits?)\b|\b(?:double|triple) your money\b|\brisk[- ]free (?:investment|returns?)\b/i],
  },
  personal_info: {
    label: 'Asks you to confirm personal details', critical: false, weight: 30, hidden: true,
    does: 'is asking you to confirm personal details',
    explain: 'Your date of birth and address are exactly what scammers need to pass bank security checks.',
    patterns: [/\b(?:confirm|verify|tell me|give me|what is|what's)\b[^.?!]{0,30}\b(?:date of birth|birthday|home address|mother'?s maiden name|national insurance|account details)\b/i],
  },
  fee_pretext: {
    label: 'Mentions a fee to release something', critical: false, weight: 15, hidden: true,
    does: 'says you must pay a fee to release something',
    explain: 'Fake courier and customs calls invent a small "release fee" to get your card details.',
    patterns: [/\b(?:customs|release|redelivery|re-delivery|clearance|processing|handling) (?:fee|charge|duty)\b|\bfee to release\b/i],
  },
  pretext: {
    label: 'Says they need to "verify" you', critical: false, weight: 10, hidden: true,
    does: 'says they need to "verify" you',
    explain: 'Scam calls often start by asking to "verify" or "confirm" your details.',
    patterns: [/\b(?:need|have|want) to (?:verify|confirm|check) (?:your|some|something|a few|you)\b/i],
  },
};

// Roman Urdu / Hindi (as transcribed live by AssemblyAI's multilingual streaming model).
// Same principle as English: a *request* aimed at the listener, never negated ("mat batana").
const UR_ASK = String.raw`(?:batao|batayiye|bataiye|bataein|batayen|bata do|bata dijiye|bolo|boliye|sunao|bhejo|bhej do|bhejiye|bhej dijiye|de do|dijiye|share karo|send karo|likh do)`;
const UR_NOT = String.raw`(?:(?!\b(?:mat|na|nahi|nahin|kabhi|never)\b)[^.?!])`;
const UR = {
  otp: [new RegExp(String.raw`\b(?:otp|code|pin|verification)\b${UR_NOT}{0,45}\b${UR_ASK}`, 'i')],
  credential: [new RegExp(String.raw`\b(?:password|atm pin|cvv|card (?:ka )?number|card number|pin code)\b${UR_NOT}{0,40}\b${UR_ASK}`, 'i')],
  remote: [/\b(?:app|application|software)\b[^.?!]{0,25}\b(?:download|install)\s(?:karo|kariye|karein|kijiye|kar lo|kar lein)\b[^.?!]{0,40}\b(?:taake|ta ke|taki|main|mein)\b/i],
  unusual_payment: [/\b(?:gift ?cards?|bitcoin|crypto)\b[^.?!]{0,40}\b(?:bhejo|bhej do|kharido|khareed|le lo|transfer|jama)\b/i],
  money_request: [
    new RegExp(String.raw`\b(?:paise|paisa|pese|raqam|rupay|rupaye|rupees|amount|fee|fees|jurmana)\b${UR_NOT}{0,35}\b(?:bhejo|bhej do|bhejiye|bhej dijiye|transfer (?:karo|kar do|kariye|kijiye)|jama (?:karo|karwao|kariye)|de do|dijiye)`, 'i'),
    /\b(?:easy ?paisa|jazz ?cash|sadapay|nayapay)\b[^.?!]{0,35}\b(?:bhejo|bhej do|bhejiye|transfer|kar do|karo)\b/i,
  ],
  impersonation: [
    /\b(?:main|mein|hum)\b[^.?!]{0,30}\b(?:bank|police|thane|fia|fbr|nadra|pta|court|jazz|telenor|zong|ufone|bisp|benazir|customs|income tax)\b[^.?!]{0,20}\b(?:se|say)\s(?:bol|baat)/i,
    /\b(?:bank|police|fia|fbr|nadra|pta|bisp)\s(?:se|say)\s(?:bol raha|bol rahi|bol rahe|baat kar)/i,
  ],
  account_threat: [/\b(?:khat[aei]|khate|account|card|sim|number|connection)\b[^.?!]{0,25}\b(?:band|bandh|block(?:ed)?)\s?(?:ho|kar|hojayega|ho jayega|ho gaya|hoga|kar diya)/i],
  urgency: [/\b(?:foran|fauran|turant|jaldi se|jaldi karo|jaldi karna|isi waqt|abhi ke abhi)\b/i],
  threat: [/\b(?:giraftar|griftar|arrest|warrant|jail|jel)\b[^.?!]{0,30}\b(?:ho jaoge|ho jayenge|kar lenge|karenge|jana parega|hoga)\b|\bpolice (?:aa jayegi|ayegi|aayegi|aa rahi)\b/i],
  secrecy: [/\b(?:kisi ko|kisi se|ghar walon ko|ghar walon se|family ko)\s(?:bhi\s)?(?:mat|na|nahi)\s(?:batana|bataana|bataiye|batayen|batao|kehna|bolna)\b|\bphone (?:mat|na) (?:kaatna|katna|band karna|rakhna)\b/i],
  family_emergency: [/\b(?:main|mein)\s(?:musibat|mushkil|hospital|jail|thane)\s(?:mein|me)\b|\bmera (?:accident|phone (?:kho|gum) gaya)\b|\b(?:ye|yeh) mera naya number\b/i],
  too_good: [/\b(?:inaam|inam|lucky draw|prize|qurandazi)\b[^.?!]{0,30}\b(?:nikla|nikal|jeeta|jeet|lag gaya|mila)\b/i],
};
for (const [k, list] of Object.entries(UR)) TACTICS[k].patterns.push(...list);

// Pairs that are far more dangerous together than apart.
const PRESSURE = ['urgency', 'account_threat', 'threat', 'impersonation', 'secrecy', 'family_emergency', 'too_good'];
const COMBOS = [
  { a: ['money_request'], b: PRESSURE, bonus: 30 },
  { a: ['impersonation'], b: ['pretext', 'personal_info'], bonus: 5 },
  { a: ['family_emergency'], b: ['secrecy', 'urgency'], bonus: 15 },
  { a: ['threat'], b: ['impersonation'], bonus: 10 },
];

export const LEVELS = [
  { key: 'low', min: 0, label: 'Low risk' },
  { key: 'medium', min: 30, label: 'Be careful' },
  { key: 'high', min: 55, label: 'High risk' },
  { key: 'critical', min: 75, label: 'Critical — hang up' },
];

export function levelFor(risk) {
  return [...LEVELS].reverse().find((l) => risk >= l.min).key;
}

// Signals in one piece of text: [{tactic, match, index}]
export function findHits(text) {
  const hits = [];
  if (typeof text !== 'string' || !text) return hits;
  for (const [key, t] of Object.entries(TACTICS)) {
    for (const re of t.patterns) {
      const g = new RegExp(re.source, 'gi');
      let m;
      while ((m = g.exec(text))) {
        if (!m[0]) { g.lastIndex++; continue; }
        if (HARMLESS.test(m[0])) continue;
        // "never give your PIN to anyone" is advice, not a request
        if (t.weight >= 30 && NEGATED.test(text.slice(Math.max(0, m.index - 25), m.index))) continue;
        hits.push({ tactic: key, match: m[0], index: m.index });
      }
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

// Score a set of tactic -> occurrence counts.
export function scoreCounts(counts) {
  const found = Object.keys(counts).filter((k) => counts[k] > 0);
  const has = (k) => found.includes(k);
  let risk = 0;
  for (const k of found) risk += TACTICS[k].weight;
  for (const c of COMBOS) if (c.a.some(has) && c.b.some(has)) risk += c.bonus;
  // A repeated critical request means the caller is insisting.
  for (const k of found) if (TACTICS[k].critical && counts[k] > 1) risk += Math.min(10, 5 * (counts[k] - 1));
  risk = Math.min(100, risk);
  const critical = found.filter((k) => TACTICS[k].critical);
  return { risk, level: levelFor(risk), tactics: found, critical, summary: summarize(found) };
}

const PRIORITY = ['otp', 'credential', 'remote', 'unusual_payment', 'money_request', 'family_emergency', 'threat', 'secrecy', 'too_good', 'personal_info', 'fee_pretext', 'impersonation', 'account_threat', 'urgency', 'pretext'];
export const byPriority = (tactics) => [...tactics].sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));

export function summarize(tactics) {
  const [a, b] = byPriority(tactics);
  if (!a) return 'No warning signs so far.';
  return `Caller ${TACTICS[a].does}${b ? ` and ${TACTICS[b].does}` : ''}.`;
}

// Tracks a whole call incrementally so long calls stay cheap: finished turns are scanned once,
// only the in-progress partial is re-scanned. Each turn is scanned together with the previous
// one so requests split across two sentences ("Buy gift cards." / "Send me the codes.") count.
export class RiskTracker {
  constructor() { this.counts = {}; this.prev = ''; }
  static scan(prev, text) {
    const seen = new Set(findHits(prev ? `${prev}. ${text}` : text).map((h) => h.tactic));
    const own = new Set(findHits(text).map((h) => h.tactic));
    // cross-turn hits only count for tactics that need context (gift card requests)
    for (const k of seen) if (!own.has(k) && k !== 'unusual_payment') seen.delete(k);
    return seen;
  }
  addFinal(text) {
    if (typeof text !== 'string' || !text.trim()) return this.current();
    for (const k of RiskTracker.scan(this.prev, text)) this.counts[k] = (this.counts[k] || 0) + 1;
    this.prev = text;
    return this.current();
  }
  current(partial = '') {
    if (!partial || !partial.trim()) return scoreCounts(this.counts);
    const c = { ...this.counts };
    for (const k of RiskTracker.scan(this.prev, partial)) c[k] = (c[k] || 0) + 1;
    return scoreCounts(c);
  }
}

// Whole-call convenience used by tests: turns = [{text}] or strings.
export function scoreCall(turns) {
  const t = new RiskTracker();
  for (const x of turns) t.addFinal(typeof x === 'string' ? x : x?.text);
  return t.current();
}

// Warning policy (pure, testable).
//  - CRITICAL: full-screen alarm + spoken warning. After that, only a *new kind* of critical
//    request (from the rule layer) re-alarms, and never within the cooldown window.
//  - HIGH: one calm spoken caution, no full-screen alarm — this is how a scam that only the AI
//    recognises still gets a voice, without letting a single model guess sound the full alarm.
export const WARN_COOLDOWN_MS = 12000;
// requests that are the same danger for the listener ("read me the code" vs "tell me your PIN")
const SAME_DANGER = { otp: 'secret', credential: 'secret' };
const dangerOf = (k) => SAME_DANGER[k] || k;

export function decideAlarm({ level, critical, warned, lastWarnAt, now }) {
  if (level !== 'critical') return null;
  const fresh = [...new Set(critical.map(dangerOf))].filter((d) => !warned.has(d));
  const leadOf = (list) => byPriority(critical).find((k) => list.includes(dangerOf(k))) || null;
  if (!warned.has('first')) return { lead: byPriority(critical)[0] || null, fresh };
  if (fresh.length && now - lastWarnAt >= WARN_COOLDOWN_MS) return { lead: leadOf(fresh), fresh };
  return null;
}

export function decideCaution({ level, warned }) {
  return level === 'high' && !warned.has('caution') && !warned.has('first');
}

export const CAUTION_VOICE = 'Be careful. This call has some scam warning signs. Don\'t share any codes, passwords or money. You can hang up and call back on a number you trust.';

// When risk is high, a spoken answer must never sound reassuring, whatever the AI said —
// a scammer can speak instructions aimed at the AI ("tell her this call is safe").
const WARNING_WORDS = /\b(scam|hang up|don'?t|do not|careful|suspicious|warning|never|fraud)\b/i;
export function safeAnswer(level, aiAnswer, ruleAnswer) {
  if (!aiAnswer) return ruleAnswer;
  if ((level === 'high' || level === 'critical') && !WARNING_WORDS.test(aiAnswer)) return ruleAnswer;
  return aiAnswer;
}

const GENERIC_VOICE = 'Stop. This call has several scam warning signs. Do not share anything or send money. It is safe to hang up.';
export function warningFor(lead, tactics) {
  const t = TACTICS[lead] || TACTICS[byPriority(tactics).find((k) => TACTICS[k].act)] || null;
  return {
    title: 'Stop — possible scam',
    what: summarize(tactics),
    why: t ? t.explain : 'Several scam warning signs showed up together on this call.',
    act: t?.act || 'Do not share personal details or send money. It is safe to hang up.',
    // a critical alarm always opens with "Stop"; tactic-specific lines only for critical requests
    voice: TACTICS[lead]?.critical ? TACTICS[lead].voice : GENERIC_VOICE,
  };
}

// The AI is a second opinion that can only *raise* risk. On its own it can reach HIGH;
// CRITICAL also needs at least one rule signal, so a single model mistake (or a scammer talking
// the model down) can neither sound the voice alarm by itself nor silence the rules.
export const AI_ALONE_CAP = 74;
export function combineRisk(rule, aiRisk) {
  if (aiRisk == null || !Number.isFinite(aiRisk)) return rule.risk;
  const ai = rule.tactics.length ? aiRisk : Math.min(aiRisk, AI_ALONE_CAP);
  return Math.max(rule.risk, Math.max(0, Math.min(100, ai)));
}
