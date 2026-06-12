/**
 * SalesCells.jsx
 * Presentational cell components extracted from SalesReportPage.
 * All components are wrapped in React.memo to prevent unnecessary
 * re-renders when unrelated parts of SalesReportPage state change.
 *
 * Exports:
 *   tooltipRegistry  — singleton wired to SalesReportPage's tooltip useState
 *   ArrowIcon        — ▲ / ▼ indicator next to cell values
 *   l0diff / subDiff — YoY diff helpers
 *   CellTooltip      — <td> that shows a hover tooltip via the registry
 *   MonthCell        — renders a single month column cell (Jan, Feb, …)
 *   QuarterCell      — renders a quarterly total cell (Q1, Q2, …)
 *   numColor         — returns green/red/grey based on sign
 *   SummaryCells     — renders the trailing summary columns (YTD, YOY, %)
 *   GROUPS           — month/quarter structure used in cell rendering
 */
import React, { useRef, useEffect } from 'react';
import { fmt, fmtR } from '../../../../utils/salesFormatters';

// Month / quarter column structure (shared between SalesReportPage and SalesCells)
export const GROUPS = [
  { months: [
      { key: 'jantonnage', lyKey: 'jantonnage_last', label: 'Jan' },
      { key: 'febtonnage', lyKey: 'febtonnage_last', label: 'Feb' },
      { key: 'martonnage', lyKey: 'martonnage_last', label: 'Mar' },
    ], qKey: 'Q1', qLabel: 'Q1' },
  { months: [
      { key: 'aprtonnage', lyKey: 'aprtonnage_last', label: 'Apr' },
      { key: 'maytonnage', lyKey: 'maytonnage_last', label: 'May' },
      { key: 'juntonnage', lyKey: 'juntonnage_last', label: 'Jun' },
    ], qKey: 'Q2', qLabel: 'Q2' },
  { months: [
      { key: 'jultonnage', lyKey: 'jultonnage_last', label: 'July' },
      { key: 'augtonnage', lyKey: 'augtonnage_last', label: 'Aug' },
      { key: 'septonnage', lyKey: 'septonnage_last', label: 'Sep' },
    ], qKey: 'Q3', qLabel: 'Q3' },
  { months: [
      { key: 'octtonnage', lyKey: 'octtonnage_last', label: 'Oct' },
      { key: 'novtonnage', lyKey: 'novtonnage_last', label: 'Nov' },
      { key: 'dectonnage', lyKey: 'dectonnage_last', label: 'Dec' },
    ], qKey: 'Q4', qLabel: 'Q4' },
];

// Singleton tooltip registry — SalesReportPage wires its setTooltip into this,
// and CellTooltip fires it on hover. Avoids ~1560 per-cell useState instances.
export const tooltipRegistry = { setter: null };

// ── Diff helpers ──────────────────────────────────────────────────────────────

export const l0diff = (rows, i, key) => {
  if (i === 0) return null;
  const curr = parseFloat(rows[i][key]), prev = parseFloat(rows[i - 1][key]);
  if (isNaN(curr) || isNaN(prev)) return null;
  return curr - prev;
};

export const subDiff = (row, key, lyKey) => {
  const curr = parseFloat(row[key]), prev = parseFloat(row[lyKey]);
  if (isNaN(curr) || isNaN(prev)) return null;
  return curr - prev;
};

// ── ArrowIcon ─────────────────────────────────────────────────────────────────

export const ArrowIcon = React.memo(function ArrowIcon({ diff }) {
  if (diff === null || diff === undefined || diff === 0) return null;
  return (
    <span style={{
      fontWeight: 700, fontSize: '0.72rem', marginLeft: 2,
      color: diff > 0 ? '#2e7d32' : '#c62828',
      display: 'inline-flex', alignItems: 'center',
      verticalAlign: 'middle', lineHeight: 1, flexShrink: 0,
    }}>
      {diff > 0 ? '▲' : '▼'}
    </span>
  );
});

// ── CellTooltip ───────────────────────────────────────────────────────────────

export const CellTooltip = React.memo(function CellTooltip({
  className, style, title, thisYear, lastYear, formula, unit = '', accent, isDarkMode, children,
}) {
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const handleEnter = (e) => {
    clearTimeout(timerRef.current);
    const x = e.clientX, y = e.clientY;
    timerRef.current = setTimeout(() => {
      tooltipRegistry.setter?.({ x, y, title, thisYear, lastYear, formula, unit });
    }, 120);
  };
  const handleLeave = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => tooltipRegistry.setter?.(null), 80);
  };
  return (
    <td className={className} style={style} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
    </td>
  );
});

// ── numColor ──────────────────────────────────────────────────────────────────

export const numColor = (v) =>
  (v === null || v === undefined) ? '#94a3b8' : v >= 0 ? '#2e7d32' : '#c62828';

// ── MonthCell ─────────────────────────────────────────────────────────────────

export const MonthCell = React.memo(function MonthCell({
  row, rows, rowIdx, level, mKey, mLyKey, accent, isDarkMode, isSummary,
}) {
  const isL0Summary = isSummary && level === 0;
  const f = level === 0 ? fmtR : fmt;
  const dz = (v) => { const n = parseFloat(v); return (n === 0 || isNaN(n)) ? <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>{f(v)}</span> : f(v); };
  const diff = isL0Summary ? l0diff(rows, rowIdx, mKey) : subDiff(row, mKey, mLyKey);

  if (!isSummary) {
    return (
      <td className="sr-td">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, fontWeight: 500, color: 'var(--sales-text, #1e293b)' }}>
          {dz(row[mKey])}<ArrowIcon diff={diff} />
        </div>
      </td>
    );
  }
  const label = mKey.replace('tonnage', '').replace(/^./, c => c.toUpperCase());
  const lyVal = isL0Summary
    ? (rowIdx > 0 ? rows[rowIdx - 1][mKey] : undefined)
    : row[mLyKey];
  return (
    <CellTooltip
      className="sr-td"
      title={`${label} Tonnage`}
      thisYear={f(row[mKey])}
      lastYear={lyVal !== undefined && lyVal !== null && lyVal !== '' ? f(lyVal) : undefined}
      accent={accent} isDarkMode={isDarkMode}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, fontWeight: 500, color: 'var(--sales-text, #1e293b)' }}>
        {dz(row[mKey])}<ArrowIcon diff={diff} />
      </div>
    </CellTooltip>
  );
});

// ── QuarterCell ───────────────────────────────────────────────────────────────

export const QuarterCell = React.memo(function QuarterCell({
  row, rows, rowIdx, level, qKey, accent, isDarkMode, isSummary,
}) {
  const isL0Summary = isSummary && level === 0;
  const f = level === 0 ? fmtR : fmt;
  const dz = (v) => { const n = parseFloat(v); return (n === 0 || isNaN(n)) ? <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>{f(v)}</span> : f(v); };
  const diff = isL0Summary ? l0diff(rows, rowIdx, qKey) : subDiff(row, qKey, qKey + '_last');

  if (!isSummary) {
    return (
      <td className="sr-td" style={{ fontWeight: 700, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {dz(row[qKey])}<ArrowIcon diff={diff} />
        </div>
      </td>
    );
  }
  const lyVal = isL0Summary
    ? (rowIdx > 0 ? rows[rowIdx - 1][qKey] : undefined)
    : row[qKey + '_last'];
  return (
    <CellTooltip
      className="sr-td"
      style={{ fontWeight: 700, textAlign: 'center' }}
      title={`${qKey} Total`}
      thisYear={f(row[qKey])}
      lastYear={lyVal !== undefined && lyVal !== null && lyVal !== '' ? f(lyVal) : undefined}
      accent={accent} isDarkMode={isDarkMode}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {dz(row[qKey])}<ArrowIcon diff={diff} />
      </div>
    </CellTooltip>
  );
});

// ── SummaryCells ──────────────────────────────────────────────────────────────

export const SummaryCells = React.memo(function SummaryCells({
  row, rows, rowIdx, level, showTillLast, accent, isDarkMode,
  isSummary, allSummaryRows, isMultiYear,
}) {
  const f = level === 0 ? fmtR : fmt;
  const dz = (v) => { const n = parseFloat(v); return (n === 0 || isNaN(n)) ? <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>{f(v)}</span> : f(v); };
  const dp = (pct, isL0) => { const s = isL0 ? `${Math.round(pct ?? 0)}%` : `${(pct ?? 0).toFixed(2)}%`; return !pct ? <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>{s}</span> : s; };

  const isNonSummaryL0 = !isSummary && level === 0 && isMultiYear;
  const tillLast = (parseFloat(row.ttltonnage_crnt) || 0) - (parseFloat(row.currentmonthtonnage) || 0);

  const lyYtd = GROUPS.flatMap(g => g.months.map(m => parseFloat(row[m.lyKey]) || 0)).reduce((s, v) => s + v, 0);
  let ytdGr, ytdGrBase;
  if (isSummary && level === 0) {
    if (rowIdx > 0) {
      ytdGrBase = parseFloat(rows[rowIdx - 1].ttltonnage_crnt) || 0;
    } else {
      const prevYrRow = allSummaryRows?.find(r => String(r.year) === String(parseInt(row.year, 10) - 1));
      ytdGrBase = prevYrRow
        ? (parseFloat(prevYrRow.ttltonnage) || 0) + (parseFloat(prevYrRow.currentmonthtonnage) || 0)
        : lyYtd;
    }
    ytdGr = (parseFloat(row.ttltonnage_crnt) || 0) - ytdGrBase;
  } else {
    ytdGrBase = parseFloat(row.ttltonnage) || 0;
    ytdGr = (parseFloat(row.ttltonnage_crnt) || 0) - ytdGrBase;
  }

  const curMon   = parseFloat(row.currentmonthtonnage) || 0;
  const curMonLy = parseFloat(row.currentmonthtonnage_last) || 0;
  let ytdPct, ytdPctFormula;
  if (isSummary && level === 0) {
    const prevYearRow = (allSummaryRows || rows).find(r => String(r.year) === String(parseInt(row.year, 10) - 1));
    const prevMonForPct = prevYearRow
      ? (parseFloat(prevYearRow.currentmonthtonnage_last) || parseFloat(prevYearRow.currentmonthtonnage) || 0)
      : 0;
    ytdPct = prevMonForPct !== 0 ? ((curMon - prevMonForPct) / Math.abs(prevMonForPct) * 100) : null;
    ytdPctFormula = `(Current Month − Prev Year Month) ÷ Prev Year Month × 100\n= (${f(curMon)} − ${f(prevMonForPct)}) ÷ ${f(prevMonForPct)} × 100\n= ${(ytdPct ?? 0).toFixed(1)}%`;
  } else {
    ytdPct = ytdGrBase !== 0 ? (ytdGr / Math.abs(ytdGrBase) * 100) : null;
    const formulaPrefix = isNonSummaryL0 ? 'Multi-year aggregate (sum of all selected years)\n' : '';
    ytdPctFormula = `${formulaPrefix}YTD Gr/Degr ÷ Prev Year YTD × 100\n= ${f(ytdGr ?? 0)} ÷ ${f(ytdGrBase)} × 100\n= ${(ytdPct ?? 0).toFixed(1)}%`;
  }

  const yoyVal   = parseFloat(row.ttltonnage_crntwy) || 0;
  const ttlYtd   = parseFloat(row.ttltonnage_crnt) || 0;
  const ttlYoy   = parseFloat(row.ttltonnage_crntwy) || 0;
  const ttlYoyLy = parseFloat(row.ttltonnagewy) || 0;

  let yoyGr = null, yoyBase = 0;
  if (isSummary && level === 0) {
    if (rowIdx > 0) {
      yoyBase = parseFloat(rows[rowIdx - 1].ttltonnagewy) || 0;
    } else {
      const prevYrRow = allSummaryRows?.find(r => String(r.year) === String(parseInt(row.year, 10) - 1));
      yoyBase = prevYrRow ? (parseFloat(prevYrRow.ttltonnagewy) || 0) : 0;
    }
    yoyGr = yoyBase !== 0 ? yoyVal - yoyBase : null;
  } else {
    yoyBase = ttlYoyLy;
    yoyGr = yoyVal - yoyBase;
  }
  const yoyPct = (yoyGr !== null && yoyBase !== 0) ? (yoyGr / Math.abs(yoyBase) * 100) : null;

  return (
    <>
      {showTillLast && (isSummary ? (
        <CellTooltip className="sr-td" style={{ fontWeight: 600 }} title="Till Last Month"
          thisYear={f(tillLast)} formula={`Total YTD − Current Month\n= ${f(ttlYtd)} − ${f(curMon)}`}
          accent={accent} isDarkMode={isDarkMode}>
          <div style={{ color: 'var(--sales-text, #1e293b)' }}>{dz(tillLast)}</div>
        </CellTooltip>
      ) : (
        <td className="sr-td" style={{ fontWeight: 600 }}>
          <div style={{ color: 'var(--sales-text, #1e293b)' }}>{dz(tillLast)}</div>
        </td>
      ))}

      {isSummary ? (
        <CellTooltip className="sr-td" style={{ fontWeight: 600 }} title="Current Month"
          thisYear={f(row.currentmonthtonnage)} lastYear={(curMonLy > 0 ? f(curMonLy) : undefined)}
          accent={accent} isDarkMode={isDarkMode}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
            {dz(row.currentmonthtonnage)}<ArrowIcon diff={l0diff(rows, rowIdx, 'currentmonthtonnage')} />
          </div>
        </CellTooltip>
      ) : (
        <td className="sr-td" style={{ fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
            {dz(row.currentmonthtonnage)}<ArrowIcon diff={subDiff(row, 'currentmonthtonnage', 'currentmonthtonnage_last')} />
          </div>
        </td>
      )}

      {isSummary ? (
        <CellTooltip className="sr-td" style={{ fontWeight: 700 }} title="Total (YTD)"
          thisYear={f(row.ttltonnage_crnt)} lastYear={ytdGrBase > 0 ? f(ytdGrBase) : undefined}
          formula="Year-to-date total tonnage" accent={accent} isDarkMode={isDarkMode}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
            {dz(row.ttltonnage_crnt)}{ytdGr !== null && <ArrowIcon diff={ytdGr} />}
          </div>
        </CellTooltip>
      ) : (
        <td className="sr-td" style={{ fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
            {dz(row.ttltonnage_crnt)}{ytdGr !== null && <ArrowIcon diff={ytdGr} />}
          </div>
        </td>
      )}

      <CellTooltip className="sr-td" title="YTD Growth / Degrowth"
        formula={isNonSummaryL0 ? `Multi-year aggregate (sum of all selected years)\nCurrent YTD − Prev Year YTD\n= ${f(ttlYtd)} − ${f(ytdGrBase)}\n= ${f(ytdGr ?? 0)}` : `Current YTD − Prev Year YTD\n= ${f(ttlYtd)} − ${f(ytdGrBase)}\n= ${f(ytdGr ?? 0)}`}
        accent={accent} isDarkMode={isDarkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
          {dz(ytdGr ?? 0)}<ArrowIcon diff={ytdGr ?? 0} />
        </div>
      </CellTooltip>

      <CellTooltip className="sr-td" title="YTD %" formula={ytdPctFormula} accent={accent} isDarkMode={isDarkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
          {dp(ytdPct, level === 0)}<ArrowIcon diff={ytdPct ?? 0} />
        </div>
      </CellTooltip>

      <CellTooltip className="sr-td" style={{ fontWeight: 700 }} title="Total (YOY)"
        thisYear={f(ttlYoy)} lastYear={(!isNonSummaryL0 && yoyBase > 0) ? f(yoyBase) : undefined}
        formula="Full year comparison (same period)" accent={accent} isDarkMode={isDarkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
          {dz(yoyVal)}<ArrowIcon diff={yoyGr ?? 0} />
        </div>
      </CellTooltip>

      <CellTooltip className="sr-td" title="YOY Growth / Degrowth"
        formula={isNonSummaryL0 ? `Multi-year aggregate (sum of all selected years)\nCurrent YOY − Last Year YOY\n= ${f(ttlYoy)} − ${f(yoyBase)}\n= ${f(yoyGr ?? 0)}` : `Current YOY − Last Year YOY\n= ${f(ttlYoy)} − ${f(yoyBase)}\n= ${f(yoyGr ?? 0)}`}
        accent={accent} isDarkMode={isDarkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
          {dz(yoyGr ?? 0)}<ArrowIcon diff={yoyGr ?? 0} />
        </div>
      </CellTooltip>

      <CellTooltip className="sr-td" title="YOY %"
        formula={isNonSummaryL0 ? `Multi-year aggregate (sum of all selected years)\n(YOY Gr/Degr ÷ Last Year YOY) × 100\n= (${f(yoyGr ?? 0)} ÷ ${f(yoyBase)}) × 100\n= ${(yoyPct ?? 0).toFixed(1)}%` : `(YOY Gr/Degr ÷ Last Year YOY) × 100\n= (${f(yoyGr ?? 0)} ÷ ${f(yoyBase)}) × 100\n= ${(yoyPct ?? 0).toFixed(1)}%`}
        accent={accent} isDarkMode={isDarkMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'var(--sales-text, #1e293b)' }}>
          {dp(yoyPct, level === 0)}<ArrowIcon diff={yoyPct ?? 0} />
        </div>
      </CellTooltip>
    </>
  );
});
