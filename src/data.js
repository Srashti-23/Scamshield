// Demonstration messages only. They are fictional, not threat intelligence.
export const SAMPLES = [
  { id: 'A', label: 'SBI KYC scam', text: 'SBI ALERT: Your KYC is incomplete and your account will be blocked today. Update immediately at http://sbi-kyc-update.example/verify and share the OTP you receive to confirm.' },
  { id: 'B', label: 'Delivery update', text: 'Your parcel has been shipped and is expected to arrive tomorrow. Please check the official courier app for updates.' },
  { id: 'C', label: 'OTP safety tip', text: 'Never share your OTP, password or UPI PIN with anyone, even if they claim to be from your bank.' },
  { id: 'D', label: 'Hinglish scam', text: 'Abhi KYC update karo warna aaj tumhara bank account band ho jayega. Link par jaakar OTP bhejo.' },
  { id: 'E', label: 'Ordinary link', text: 'Lecture notes for Friday are posted at https://www.wikipedia.org/wiki/Computer_security if you want to read ahead.' },
  { id: 'F', label: 'One weak signal', text: 'Please reply immediately when you are free, I need the project file.' },
];
export const RULE_GUIDE = [
  { key: 'urgency', name: 'Fake Urgency', points: 20, desc: 'Language pushing you to act right now.', examples: ['Act now', 'Update immediately', 'Abhi karo', 'Jaldi karo'], why: 'Pressure stops you from checking.', fp: 'Real deadlines exist; "today" alone is not flagged.', safe: 'Pause and verify through an official channel.' },
  { key: 'account', name: 'Account Threat', points: 15, desc: 'Threats of blocking, closure or suspension.', examples: ['Your account will be blocked', 'Account band ho jayega'], why: 'Fear makes people comply.', fp: 'Genuine notices can mention closures, but usually via the official app.', safe: 'Open your official app yourself.' },
  { key: 'link', name: 'Suspicious Link', points: 25, desc: 'Lookalike, shortened or unusual URLs, checked locally.', examples: ['sbi-kyc-update.example', 'bit.ly/xyz'], why: 'Fake sites copy real brands.', fp: 'Unfamiliar domains are not automatically bad; reference data is a small example list.', safe: 'Never tap it. Type the official address.' },
  { key: 'sensitive', name: 'Never Share Your OTP, Password or PIN', points: 40, desc: 'A request that you hand over an authentication secret.', examples: ['Share the OTP', 'OTP bhejo', 'Password batao'], why: 'No genuine service needs your OTP or PIN.', fp: 'Warnings like "Never share your OTP" are not flagged.', safe: 'Refuse, and report at cybercrime.gov.in or 1930.' },
];
