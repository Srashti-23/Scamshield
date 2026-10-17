// Deterministic rule engine. No network, no AI. Same input => same output.
export const MAX_LEN = 5000;
export const WEIGHTS = { urgency: 20, account: 15, link: 25, sensitive: 40 };
// Small example list only; does NOT cover every organization.
export const OFFICIAL_DOMAINS = {
  sbi: ['sbi.co.in', 'onlinesbi.sbi'], hdfc: ['hdfcbank.com'], icici: ['icicibank.com'],
  axis: ['axisbank.com'], paytm: ['paytm.com'], bluedart: ['bluedart.com'],
  delhivery: ['delhivery.com'], indiapost: ['indiapost.gov.in'],
};
const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at'];
const DEMO_TLDS = ['example', 'invalid', 'test'];
const NEG = /\b(never|not|don'?t|dont|no one|nobody|mat|kabhi\s+na)\b/i;
const SECRET = '(?:otp|one[- ]time password|password|passcode|upi pin|pin|verification code|cvv)';

const RULES = [
  { key: 'urgency', id: 'R1', name: 'Fake Urgency', points: 20,
    why: 'Scammers rush you so you act before thinking. Ordinary deadlines alone are not treated as proof.',
    patterns: [
      [/\b(?:act now|urgent action required|immediately|right now|do it today|within (?:the )?next (?:few )?minutes|within (?:a )?few minutes)\b/gi, 'English'],
      [/\b(?:abhi\s+(?:\w+\s+){0,2}karo|turant\s+(?:\w+\s+){0,2}karo|jaldi\s+karo)\b/gi, 'Hinglish']] },
  { key: 'account', id: 'R2', name: 'Account Threat', points: 15,
    why: 'Threatening loss of access creates fear. Real banks rarely threaten blocking by message.',
    patterns: [
      [/\b(?:bank\s+)?account(?:\s+access)?\s+(?:will|is going to|may)\s+(?:be\s+)?(?:blocked|suspended|closed|disabled|deactivated|frozen)\b/gi, 'English'],
      [/\baccount\s+(?:band|block|suspend)\s+ho\s+ja+y?e?ga\b/gi, 'Hinglish'],
      [/\bkyc\s+nahi\s+\w+\s+toh\s+account\s+band\b/gi, 'Hinglish']] },
  { key: 'sensitive', id: 'R4', name: 'Never Share Your OTP, Password or PIN', points: 40, negatable: true,
    why: 'No genuine bank or service asks you to disclose an OTP, password or PIN. Mentioning one is fine; being asked to hand it over is the warning sign.',
    patterns: [
      [new RegExp(`\\b(?:share|send|tell|give|provide|enter|forward|read out|confirm)\\b(?:\\s+\\w+){0,4}?\\s+${SECRET}\\b`, 'gi'), 'English'],
      [new RegExp(`\\b${SECRET}\\b(?:\\s+\\w+){0,2}?\\s+(?:bhejo|bhej\\s+do|bhejiye|batao|bataiye|share\\s+karo)\\b`, 'gi'), 'Hinglish']] },
];

function sentenceBefore(text, start) {
  const s = text.slice(Math.max(0, start - 40), start);
  return s.slice(Math.max(s.lastIndexOf('.'), s.lastIndexOf('!'), s.lastIndexOf('?'), s.lastIndexOf('\n')) + 1);
}

export function analyzeUrl(raw) {
  let u;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'http://' + raw); } catch { return null; }
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  const on = (d) => host === d || host.endsWith('.' + d);
  if (SHORTENERS.some(on)) return `"${host}" is a link shortener that hides the real destination.`;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return 'The link uses a raw IP address instead of a normal domain name.';
  if (host.includes('xn--')) return `"${host}" uses encoded (punycode) characters that can imitate other letters.`;
  const labels = host.split(/[.-]/);
  for (const [brand, domains] of Object.entries(OFFICIAL_DOMAINS)) {
    if (labels.includes(brand) && !domains.some(on))
      return `"${host}" contains "${brand}" but is not one of the example official domains (${domains.join(', ')}) in this prototype's reference list.`;
  }
  if (DEMO_TLDS.includes(host.split('.').pop())) return `"${host}" uses a reserved demonstration/test ending, not a real public domain.`;
  return null;
}

const STEPS = {
  urgency: 'Pause. Real organizations do not need you to act within minutes.',
  account: 'Check your account only via the official app or a website address you type yourself.',
  link: 'Do not click the link. Open the official app or type the official website address manually.',
  sensitive: 'Never share your OTP, password or PIN. If you already did, call your bank promptly and report at https://cybercrime.gov.in/ or helpline 1930.',
};

export function riskLevel(score) { return score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low'; }

export function analyzeMessage(message) {
  const text = typeof message === 'string' ? message : '';
  if (!text.trim()) return { error: 'Please paste a message to scan.' };
  if (text.length > MAX_LEN) return { error: `Message is too long. The limit is ${MAX_LEN} characters.` };
  const found = [];
  for (const r of RULES) {
    const evidence = [];
    for (const [re, variant] of r.patterns)
      for (const m of text.matchAll(re)) {
        const s = m.index, e = s + m[0].length;
        if (r.negatable && NEG.test(sentenceBefore(text, s) + m[0])) continue;
        evidence.push({ start: s, end: e, text: m[0], variant, reason: r.why });
      }
    if (evidence.length) found.push({ key: r.key, id: r.id, name: r.name, points: r.points, why: r.why, evidence });
  }
  const linkEv = [];
  for (const m of text.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy)\/[^\s<>"']*/gi)) {
    const raw = m[0].replace(/[.,;:!?)\]]+$/, '');
    const reason = analyzeUrl(raw);
    if (reason) linkEv.push({ start: m.index, end: m.index + raw.length, text: raw, variant: 'URL', reason });
  }
  if (linkEv.length) found.push({ key: 'link', id: 'R3', name: 'Suspicious Link', points: 25,
    why: 'Flagged by local rules only. This is a caution signal, not proof the site is malicious.', evidence: linkEv });
  const order = ['urgency', 'account', 'link', 'sensitive'];
  found.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const total = Math.min(100, found.reduce((s, f) => s + f.points, 0));
  // Highlights: sorted, overlaps dropped so text is never corrupted.
  const all = found.flatMap((f) => f.evidence.map((e) => ({ ...e, key: f.key }))).sort((a, b) => a.start - b.start || b.end - a.end);
  const highlights = []; let last = 0;
  for (const h of all) if (h.start >= last) { highlights.push(h); last = h.end; }
  const steps = found.map((f) => STEPS[f.key]);
  if (!found.length) steps.push('No warning signs were detected by the current rules. This does not guarantee that the message is safe. When unsure, verify through official channels.');
  return { original: text, findings: found, total, level: riskLevel(total), highlights, steps };
}
