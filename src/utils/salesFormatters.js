export const fmt = (val) => {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

export const fmtAmt = (val) => {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export const yoyPct = (curr, last) => {
  const c = parseFloat(curr), l = parseFloat(last);
  if (!l || isNaN(c) || isNaN(l)) return null;
  return ((c - l) / l) * 100;
};

export const growthColor = (pct) => {
  if (pct === null || pct === undefined) return '#94a3b8';
  return pct >= 0 ? '#16a34a' : '#dc2626';
};

export const growthIcon = (pct) => {
  if (pct === null || pct === undefined) return '';
  return pct >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short';
};

export const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
};

export const sumFields = (row, keys) =>
  keys.reduce((s, k) => s + (parseFloat(row[k]) || 0), 0);
