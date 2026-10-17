import { useState, useEffect, useRef } from 'react';
import { analyzeMessage, MAX_LEN } from './engine/engine.js';
import { SAMPLES, RULE_GUIDE } from './data.js';
import { loadHistory, saveScan, clearHistory } from './storage.js';
import { cardText } from './card.js';
import { canExportImage, exportCardImage } from './cardImage.js';

const TABS = [['scan', 'Scanner'], ['history', 'History'], ['card', 'Scam Card & Help']];

function Highlighted({ result, onPick, active }) {
  const parts = []; let i = 0;
  result.highlights.forEach((h, n) => {
    if (h.start > i) parts.push(result.original.slice(i, h.start));
    parts.push(<mark key={n} className={`hl hl-${h.key}`} tabIndex={0} aria-label={`${h.key} warning: ${h.text}`}
      aria-pressed={active === n} onClick={() => onPick(n)} onFocus={() => onPick(n)}>{h.text}</mark>);
    i = h.end;
  });
  parts.push(result.original.slice(i));
  return <p className="msg">{parts}</p>; // React escapes text; no raw HTML
}

function Results({ r, onReset, onCard, onOpen }) {
  const [active, setActive] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const top = useRef(null);
  useEffect(() => {
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    top.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  }, [r]);
  const recent = loadHistory().slice(0, 5);
  const h = active !== null ? r.highlights[active] : null;
  return (
    <section ref={top} aria-live="polite" className="card result">
      <div className="score">
        <div className={`badge lvl-${r.level}`}>{r.level} Risk</div>
        <strong className="num">{r.total}<small>/100</small></strong>
        <div className="bar" role="img" aria-label={`Risk score ${r.total} out of 100`}><i style={{ width: `${r.total}%` }} className={`lvl-${r.level}`} /></div>
      </div>
      {!r.findings.length && <p className="note">No warning signs were detected by the current rules. This does not guarantee that the message is safe.</p>}
      <h3>Your message</h3>
      <Highlighted result={r} onPick={setActive} active={active} />
      <p className="legend">{RULE_GUIDE.map((g) => <span key={g.key} className={`hl hl-${g.key}`}>{g.name.startsWith('Never') ? 'Sensitive request' : g.name}</span>)}</p>
      {h && <div className="detail"><b>"{h.text}"</b> ({h.variant}): {h.reason}</div>}
      <h3>Score breakdown</h3>
      <ul className="list">{r.findings.map((f) => (
        <li key={f.key}><b>{f.name}</b> <span className="pts">+{f.points}</span> <small>Rule {f.id}</small>
          <p>{f.why}</p><ul>{f.evidence.map((e, n) => <li key={n}>"{e.text}": {e.reason}</li>)}</ul></li>))}</ul>
      <h3>What to do next</h3>
      <ul>{r.steps.map((s, n) => <li key={n}>{s}</li>)}</ul>
      <p className="small">ScamShield does not report, block or verify anything for you. Report in India: <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a> or call 1930.</p>
      <h3>Recent scans</h3>
      <p className="small">History is stored locally in this browser only (localStorage, not encrypted) and is never uploaded. Anyone using this device could see it.</p>
      <ul className="list">{recent.map((x, n) => <li key={n}><button className="ghost" onClick={() => { setActive(null); onOpen(x); }}>{x.level} · {x.total}/100 · {new Date(x.at).toLocaleString()}</button></li>)}</ul>
      <div className="row"><button onClick={onCard}>Create Scam Card</button><button className="ghost" onClick={() => setShowRules(true)}>How this is scored</button><button className="ghost" onClick={onReset}>Scan another</button></div>
      <RulesDialog open={showRules} onClose={() => setShowRules(false)} />
    </section>
  );
}

function Scanner({ result, setResult }) {
  const [text, setText] = useState(''); const [err, setErr] = useState('');
  const scan = () => {
    const r = analyzeMessage(text);
    if (r.error) { setErr(r.error); return; }
    setErr(''); setResult(r); saveScan(r);
  };
  return (<>
    <div className="hero"><h1>ScamShield Campus</h1><p>Paste a message. See the warning signs, the risk level and what to do next.</p>
      <p className="small">Transparent, rule-based checks run in your browser. Results are guidance, not a guarantee of safety.</p></div>
    <div className="card">
      <label htmlFor="msg">Suspicious message</label>
      <textarea id="msg" value={text} maxLength={MAX_LEN + 1000} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Paste or type a message…" />
      <div className="small">{text.length}/{MAX_LEN} characters. Processed locally; nothing is uploaded.</div>
      {err && <p role="alert" className="err">{err}</p>}
      <div className="row"><button onClick={scan}>Scan Message</button></div>
      <p className="small">Try a demonstration message (fictional, not real threat data):</p>
      <div className="row wrap">{SAMPLES.map((s) => <button key={s.id} className="ghost" onClick={() => { setText(s.text); setErr(''); }}>{s.label}</button>)}</div>
    </div>
    {result && <Results r={result} onReset={() => { setResult(null); setText(''); }} onOpen={setResult} onCard={() => document.dispatchEvent(new CustomEvent('goto', { detail: 'card' }))} />}
  </>);
}

function RulesDialog({ open, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (<dialog ref={ref} className="dlg" aria-labelledby="rules-title" onClose={onClose} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="row"><h2 id="rules-title">How this is scored</h2><button className="ghost" onClick={onClose}>Close</button></div>
    <Rules />
  </dialog>);
}

function Rules() {
  return <div><p className="small">Total = points of each triggered category, once per scan. Low 0–29, Medium 30–59, High 60–100.</p>
    {RULE_GUIDE.map((g) => <article key={g.key} className="rule"><h3>{g.name} <span className="pts">{g.points} pts</span></h3><p>{g.desc}</p>
      <p><b>Examples:</b> {g.examples.join(' · ')}</p><p><b>Why suspicious:</b> {g.why}</p><p><b>Possible false positives:</b> {g.fp}</p><p><b>Safe behavior:</b> {g.safe}</p></article>)}
    <p className="small">Coverage of English and Hinglish phrases is representative, not comprehensive. Domain checks use a small example list.</p></div>;
}

function History({ onOpen }) {
  const [list, setList] = useState(loadHistory);
  return <div className="card"><h2>Scan history</h2><p className="small">Stored only in this browser (localStorage, not encrypted). Anyone using this device could see it.</p>
    {!list.length && <p>No saved scans yet.</p>}
    <ul className="list">{list.map((x, n) => <li key={n}><button className="ghost" onClick={() => onOpen(x)}>{x.level} · {x.total}/100 · {new Date(x.at).toLocaleString()}</button><p className="small">{x.original.slice(0, 80)}…</p></li>)}</ul>
    {!!list.length && <button className="ghost" onClick={() => { clearHistory(); setList([]); }}>Clear history</button>}</div>;
}

function CardHelp({ result }) {
  const [msg, setMsg] = useState('');
  if (!result) return <div className="card"><h2>Scam Card & Help</h2><p>Scan a message first to create a card.</p>{help}</div>;
  const t = cardText(result);
  const copy = async () => { try { await navigator.clipboard.writeText(t); setMsg('Copied.'); } catch { setMsg('Copy unavailable. Select the text above and copy it manually.'); } };
  const share = async () => { try { await navigator.share({ title: 'ScamShield Campus', text: t }); } catch { setMsg('Sharing unavailable or cancelled. Use Copy instead.'); } };
  const img = async () => { try { await exportCardImage(result); setMsg('Image downloaded.'); } catch { setMsg('Image export failed. Use Print / Save PDF instead.'); } };
  return <div className="card"><h2>Scam Card</h2><pre className="print-area">{t}</pre>
    <div className="row wrap">{typeof navigator.share === 'function' && <button onClick={share}>Share</button>}<button onClick={copy}>Copy summary</button>{canExportImage() ? <button className="ghost" onClick={img}>Download image (PNG)</button> : <span className="small">Image export isn't supported in this browser; use Print / Save PDF.</span>}<button className="ghost" onClick={() => window.print()}>Print / Save PDF</button></div>
    <p role="status" className="small">{msg}</p>{help}</div>;
}
const help = <p className="small">Safety help: never share OTPs, passwords or PINs. Report cybercrime at <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a> or call 1930.</p>;

const PLANS = [
  { k: 'individual', name: 'Free Tier', tag: 'Free', who: 'Individuals', billing: 'Free', gets: ['Unlimited checks', 'Highlights', 'Risk level', 'Safe steps'], goal: 'Builds trust and users.' },
  { k: 'family', name: 'Family Plus', tag: 'Proposed', who: 'Families', billing: 'Small monthly fee', gets: ['Shareable Scam Cards', 'Family alert digest', 'Extra Hinglish / regional rule packs'] },
  { k: 'campus', name: 'Campus License', tag: 'Proposed', who: 'Colleges', billing: 'Annual, per college', gets: ['College domains whitelisted', 'Anonymous awareness dashboard', 'Learn-why module for orientation'] },
  { k: 'partner', name: 'Partnerships', tag: 'Proposed', who: 'Banks, payment apps, couriers', billing: 'Partnership agreement', gets: ['Co-branded awareness campaigns', 'Verified-domain listing'] },
];

function PlanGate({ onFree }) {
  const [sel, setSel] = useState(null);
  const plan = PLANS.find((p) => p.k === sel);
  return (<div className="hero"><h1>ScamShield Campus</h1><p>Who is using ScamShield today?</p>
    <div className="plans" role="group" aria-label="Choose how you will use ScamShield">
      {PLANS.map((p) => <button key={p.k} className={`plan ${sel === p.k ? 'on' : ''}`} aria-pressed={sel === p.k} onClick={() => (p.k === 'individual' ? onFree() : setSel(p.k))}>
        <b>{p.name}</b><span className="pts">{p.tag}</span></button>)}
    </div>
    {plan && <div className="card"><h2>{plan.name} <span className="pts">{plan.tag}</span></h2>
      <p><b>For:</b> {plan.who} · <b>Billing:</b> {plan.billing}</p>
      <p><b>What they get:</b></p><ul>{plan.gets.map((g) => <li key={g}>{g}</li>)}</ul>
      {plan.goal && <p>{plan.goal}</p>}
      <p className="note">This is a proposed future offering, not available yet. A future version would ask you to sign in for this plan; this prototype has no sign-in, payments or subscriptions.</p>
      <button onClick={onFree}>Continue with the free version</button></div>}
    <p className="small">Rules run in your browser, which keeps running costs low. Individuals always get the core tool for free.</p></div>);
}

function Credit() {
  return <p className="credit">Presented by: Team Smiling (solo) &nbsp;|&nbsp; Srashti Srivastava &nbsp;|&nbsp; Rajiv Academy for Technology and Management</p>;
}

export default function App() {
  const [tab, setTab] = useState('scan'); const [result, setResult] = useState(null); const [plan, setPlan] = useState(null);
  useState(() => { document.addEventListener('goto', (e) => setTab(e.detail)); });
  if (!plan) return <div className="app"><main><PlanGate onFree={() => setPlan('individual')} /></main><Credit /></div>;
  return (<div className="app">
    <nav aria-label="Main">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{l}</button>)}</nav>
    <main>
      {tab === 'scan' && <Scanner result={result} setResult={setResult} />}
      {tab === 'history' && <History onOpen={(x) => { setResult(x); setTab('scan'); }} />}
      {tab === 'card' && <CardHelp result={result} />}
    </main>
    <footer className="small">Privacy: messages are processed locally in your browser. Rule-based guidance only. Plan: Free Tier <button className="ghost" onClick={() => setPlan(null)}>Change plan</button></footer>
    <Credit />
  </div>);
}
