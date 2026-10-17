import { describe, it, expect } from 'vitest';
import { analyzeMessage as a, riskLevel } from '../src/engine/engine.js';
export const SBI = 'SBI ALERT: Your KYC is incomplete and your account will be blocked today. Update immediately at http://sbi-kyc-update.example/verify and share the OTP you receive to confirm.';
const keys = (r) => r.findings.map((f) => f.key);
describe('engine', () => {
  it('SBI sample = 100 High, all four categories', () => { const r = a(SBI); expect(r.total).toBe(100); expect(r.level).toBe('High'); expect(r.findings.map(f => f.points)).toEqual([20, 15, 25, 40]); });
  it('repeats do not add points', () => expect(a('Act now! Act now! Immediately!').total).toBe(20));
  it('OTP + PIN = 40 once', () => expect(a('Share your OTP and send your PIN').total).toBe(40));
  it('negated warning is not a request', () => { expect(a('Never share your OTP, password or UPI PIN with anyone.').total).toBe(0); expect(a("Please don't share your OTP").total).toBe(0); });
  it('delivery message is Low', () => expect(a('Your parcel has been shipped and is expected to arrive tomorrow. Please check the official courier app for updates.').level).toBe('Low'));
  it('ordinary URL not flagged', () => expect(a('Notes are at https://www.wikipedia.org/wiki/Test').total).toBe(0));
  it('Hinglish', () => { const r = a('Abhi KYC update karo warna aaj tumhara bank account band ho jayega. Link par jaakar OTP bhejo.'); expect(keys(r)).toEqual(['urgency', 'account', 'sensitive']); expect(r.total).toBe(75); });
  it('single weak signal is not High', () => expect(a('Please reply immediately when free').level).toBe('Low'));
  it('thresholds', () => { expect([riskLevel(29), riskLevel(30), riskLevel(59), riskLevel(60)]).toEqual(['Low', 'Medium', 'High', 'High']); });
  it('empty / too long', () => { expect(a('   ').error).toBeTruthy(); expect(a('x'.repeat(5001)).error).toBeTruthy(); expect(a(null).error).toBeTruthy(); });
  it('steps + explanations present', () => { const r = a(SBI); expect(r.steps.length).toBe(4); r.findings.forEach(f => { expect(f.why).toBeTruthy(); f.evidence.forEach(e => expect(e.reason).toBeTruthy()); }); });
  it('highlight positions match original', () => { const r = a(SBI); r.highlights.forEach(h => expect(r.original.slice(h.start, h.end)).toBe(h.text)); });
});
