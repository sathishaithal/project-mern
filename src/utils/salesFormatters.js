export const fmt = (val) => {
  if (val === null || val === undefined || val === '') return '0.00';
  const n = parseFloat(val);
  if (isNaN(n)) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Rounded integer format — no decimal places; used for level-0 rows
export const fmtR = (val) => {
  if (val === null || val === undefined || val === '') return '0';
  const n = parseFloat(val);
  if (isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-IN');
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

export const fmtDate = (val) => {
  if (!val || val === 'Invalid Date' || val === 'null' || val === 'undefined') return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return null;
  }
};

export const sumFields = (row, keys) =>
  keys.reduce((s, k) => s + (parseFloat(row[k]) || 0), 0);
