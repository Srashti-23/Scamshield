// Scam Card text deliberately excludes the original message (may contain personal data).
export function cardText(r) {
  const cats = r.findings.length ? r.findings.map((f) => `${f.name} (+${f.points})`).join(', ') : 'None detected';
  return `ScamShield Campus: ${r.total}/100, ${r.level} Risk\nWarning signs: ${cats}\nAdvice: ${r.steps[0]}\nRule-based guidance, not a guarantee of safety.`;
}
