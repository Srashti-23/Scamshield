const KEY = 'scamshield.history.v1', MAX = 20;
export function loadHistory() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(a) ? a.filter((x) => x && typeof x.original === 'string' && typeof x.total === 'number' && Array.isArray(x.findings)).slice(0, MAX) : [];
  } catch { return []; }
}
export function saveScan(r) {
  const rec = { ...r, at: new Date().toISOString() };
  const list = [rec, ...loadHistory()].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  return list;
}
export function clearHistory() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
