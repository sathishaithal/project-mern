import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { getShortSupplyByCategory } from '../../../services/salesDashboardApi';
import { AppDatePicker } from '../../../components/FormControls';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import SrLoader from '../../../components/ui/SrLoader';
import { appLog } from '../../../config/appConfig';
import { logActivity } from '../../../services/activityLog';
import Tooltip from '../../../components/ui/Tooltip';
import './Sales.css';

const SS_ENTRIES_OPTIONS = [5, 10, 15, 20, 25, 50];

function SSEntriesSelect({ value, onChange, accent, isDarkMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 10px', borderRadius: 6,
        border: `1.5px solid ${accent}`, background: isDarkMode ? '#1e293b' : '#fff',
        color: accent, fontSize: '0.75rem', fontWeight: 700,
        cursor: 'pointer', minWidth: 52, lineHeight: 1.6,
      }}>
        {value}
        <span style={{ fontSize: '0.55rem', lineHeight: 1 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0,
          background: isDarkMode ? '#1e293b' : '#fff',
          border: `1.5px solid ${accent}`, borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          zIndex: 999, minWidth: 60, overflow: 'hidden',
        }}>
          {SS_ENTRIES_OPTIONS.map(n => (
            <div key={n} onClick={() => { onChange(n); setOpen(false); }}
              style={{
                padding: '5px 14px', fontSize: '0.75rem',
                fontWeight: n === value ? 700 : 400,
                color: n === value ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                background: n === value ? accent : 'transparent',
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (n !== value) e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'; }}
              onMouseLeave={e => { if (n !== value) e.currentTarget.style.background = 'transparent'; }}
            >{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// YYYY-MM-DD string → Date object without timezone shift
const strToDate = (s) => {
  const [y, mo, d] = s.split('-').map(Number);
  return new Date(y, mo - 1, d);
};

const initDateStr = () => toYMD(new Date());

const PERIOD_OPTIONS = [
  { value: 'today',         label: 'Today'          },
  { value: 'yesterday',     label: 'Yesterday'      },
  { value: 'thisweek',      label: 'This Week'      },
  { value: 'thismonth',     label: 'This Month'     },
  { value: 'lastmonth',     label: 'Last Month'     },
  { value: 'quarter',       label: 'Quarter'        },
  { value: 'financialyear', label: 'Financial Year' },
  { value: 'year',          label: 'Year'           },
  { value: 'month',         label: 'Month'          },
  { value: 'custom',        label: 'Custom Range'   },
];

const MONTH_OPTS = [
  { v:'01',l:'Jan' },{ v:'02',l:'Feb' },{ v:'03',l:'Mar' },
  { v:'04',l:'Apr' },{ v:'05',l:'May' },{ v:'06',l:'Jun' },
  { v:'07',l:'Jul' },{ v:'08',l:'Aug' },{ v:'09',l:'Sep' },
  { v:'10',l:'Oct' },{ v:'11',l:'Nov' },{ v:'12',l:'Dec' },
];

const computePeriodDates = (type, opts = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = (y, m, day) => new Date(y, m, day);
  switch (type) {
    case 'today':     return { from: new Date(today), to: new Date(today) };
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: y, to: new Date(y) }; }
    case 'thisweek': {
      const day = today.getDay(), mon = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      return { from: mon, to: new Date(today) };
    }
    case 'thismonth': return { from: d(today.getFullYear(), today.getMonth(), 1), to: new Date(today) };
    case 'lastmonth': {
      return { from: d(today.getFullYear(), today.getMonth() - 1, 1), to: d(today.getFullYear(), today.getMonth(), 0) };
    }
    case 'quarter': {
      const yr = parseInt(opts.qYear || today.getFullYear(), 10);
      if (opts.quarterType === 'calendar') {
        const cm = { Q1:{from:d(yr,0,1),to:d(yr,2,31)}, Q2:{from:d(yr,3,1),to:d(yr,5,30)}, Q3:{from:d(yr,6,1),to:d(yr,8,30)}, Q4:{from:d(yr,9,1),to:d(yr,11,31)} };
        return cm[opts.quarter] || cm['Q1'];
      } else {
        const fm = { Q1:{from:d(yr,3,1),to:d(yr,5,30)}, Q2:{from:d(yr,6,1),to:d(yr,8,30)}, Q3:{from:d(yr,9,1),to:d(yr,11,31)}, Q4:{from:d(yr+1,0,1),to:d(yr+1,2,31)} };
        return fm[opts.quarter] || fm['Q1'];
      }
    }
    case 'financialyear': {
      const fy = parseInt(opts.fy || today.getFullYear(), 10);
      return { from: d(fy, 3, 1), to: d(fy + 1, 2, 31) };
    }
    case 'year': {
      const yr = parseInt(opts.year || today.getFullYear(), 10);
      return { from: d(yr, 0, 1), to: d(yr, 11, 31) };
    }
    case 'month': {
      const yr = parseInt(opts.monthYear || today.getFullYear(), 10);
      const mo = parseInt(opts.monthVal || 1, 10);
      return { from: d(yr, mo - 1, 1), to: d(yr, mo, 0) };
    }
    default: return { from: opts.customFrom instanceof Date ? opts.customFrom : today, to: opts.customTo instanceof Date ? opts.customTo : today };
  }
};

const DM = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDisplayDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return `${String(d).padStart(2,'0')} ${DM[m-1]} ${y}`;
};

function ShortSupplyTable({
  title, data, loading, error,
  fromDate, toDate, setFromDate, setToDate, onApply,
  accent, accent2, cardBg, borderClr, textClr, mutedClr, isDarkMode, fontFamily,
  flipPicker,
}) {
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [periodType,       setPeriodType]       = useState('today');
  const [customFrom,       setCustomFrom]       = useState(() => new Date());
  const [customTo,         setCustomTo]         = useState(() => new Date());
  const [quarterType,      setQuarterType]      = useState('financial');
  const [selectedQuarter,  setSelectedQuarter]  = useState('Q1');
  const [selectedQYear,    setSelectedQYear]    = useState(() => {
    const n = new Date(); return String(n.getMonth() >= 3 ? n.getFullYear() : n.getFullYear() - 1);
  });
  const [selectedFY,       setSelectedFY]       = useState(() => {
    const n = new Date(); return String(n.getMonth() >= 3 ? n.getFullYear() : n.getFullYear() - 1);
  });
  const [selectedYear,     setSelectedYear]     = useState(() => String(new Date().getFullYear()));
  const [selectedMonthYear,setSelectedMonthYear]= useState(() => String(new Date().getFullYear()));
  const [selectedMonthVal, setSelectedMonthVal] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));

  useEffect(() => { setPage(1); }, [data, rowsPerPage]);

  // Sync computed dates up to parent whenever any period option changes
  useEffect(() => {
    const { from, to } = computePeriodDates(periodType, {
      quarterType, quarter: selectedQuarter, qYear: selectedQYear,
      fy: selectedFY, year: selectedYear,
      monthYear: selectedMonthYear, monthVal: selectedMonthVal,
      customFrom, customTo,
    });
    setFromDate(toYMD(from));
    setToDate(toYMD(to));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, quarterType, selectedQuarter, selectedQYear, selectedFY, selectedYear, selectedMonthYear, selectedMonthVal, customFrom, customTo]);

  const curYear = new Date().getFullYear();
  const yearOpts = Array.from({ length: 10 }, (_, i) => ({ v: String(curYear - i), l: String(curYear - i) }));

  const totals = useMemo(() => ({
    order:    data.reduce((s, r) => s + (parseFloat(r.ordertonnage)          || 0), 0),
    supply:   data.reduce((s, r) => s + (parseFloat(r.supplytonnage)         || 0), 0),
    short:    data.reduce((s, r) => s + (parseFloat(r.shortsupplytonnage)    || 0), 0),
    lastYear: data.reduce((s, r) => s + (parseFloat(r.ly_shortsupplytonnage) || 0), 0),
  }), [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const pagedRows  = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startNum0  = data.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endNum0    = Math.min(page * rowsPerPage, data.length);
  const totalRowBg = `color-mix(in srgb, ${accent} 18%, ${isDarkMode ? '#1e293b' : '#e8eaf6'})`;

  const pgBtn = (disabled, onClick, label) => (
    <motion.button onClick={onClick} disabled={disabled} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{
      background: disabled ? 'transparent' : accent,
      color: disabled ? mutedClr : 'white',
      border: `1px solid ${disabled ? borderClr : accent}`,
      borderRadius: 5, padding: '2px 8px', fontSize: '0.72rem',
      cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600,
    }}>{label}</motion.button>
  );
  const pageNums = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pageNums.push(p);
    else if (Math.abs(p - page) === 2) pageNums.push('…');
  }
  const deduped = pageNums.filter((v, i, a) => v !== '…' || a[i - 1] !== '…');

  const labelStyle = {
    fontWeight: 600, fontSize: '0.72rem', color: mutedClr,
    whiteSpace: 'nowrap', display: 'block', marginBottom: 2,
  };
  const ssz = (v, digits = 3) => {
    const n = parseFloat(v) || 0;
    return n === 0
      ? <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>{n.toFixed(digits)}</span>
      : n.toFixed(digits);
  };

  return (
    <div style={{ width: '100%', '--ss-muted': mutedClr }}>

      {/* ── Filter row — OUTSIDE the card so calendar popup is never clipped ── */}
      <div
        className={`ss-filter-row${flipPicker ? ' ss-flip-picker' : ''}`}
        style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${borderClr}` }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: textClr, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-table" style={{ color: accent }} />
          {title}
        </span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Period — themed React Select */}
          {(() => {
            const selStyles = {
              control: (b, s) => ({ ...b, minHeight: 36, height: 36, border: `1.5px solid ${s.isFocused ? accent : (isDarkMode ? '#334155' : '#e2e8f0')}`, borderRadius: 7, background: isDarkMode ? '#1e293b' : 'white', boxShadow: 'none', cursor: 'pointer', minWidth: 148 }),
              singleValue: b => ({ ...b, color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '0.8rem', fontFamily }),
              menu: b => ({ ...b, background: isDarkMode ? '#1e293b' : 'white', zIndex: 99999, borderRadius: 8, border: `1.5px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }),
              menuPortal: b => ({ ...b, zIndex: 99999 }),
              option: (b, s) => ({ ...b, background: s.isSelected ? accent : s.isFocused ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent', color: s.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'), fontWeight: s.isSelected ? 600 : 400, fontSize: '0.8rem', cursor: 'pointer', fontFamily }),
              indicatorSeparator: () => ({ display: 'none' }),
              dropdownIndicator: (b, s) => ({ ...b, color: s.isFocused ? accent : mutedClr, padding: '0 6px' }),
              valueContainer: b => ({ ...b, padding: '0 8px' }),
              indicatorsContainer: b => ({ ...b, height: 36 }),
            };
            const SubSel = (lbl, val, onChg, opts, minW = 120) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>{lbl}</label>
                <Select
                  options={opts} value={opts.find(o => o.value === val) || null}
                  onChange={o => onChg(o.value)}
                  styles={{ ...selStyles, control: (b, s) => ({ ...selStyles.control(b, s), minWidth: minW }) }}
                  isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="auto"
                />
              </div>
            );
            const qTypeOpts = [
              { value: 'financial', label: 'Financial Year Quarter (Apr-Mar)' },
              { value: 'calendar',  label: 'Calendar Year Quarter (Jan-Dec)'  },
            ];
            const qOpts = quarterType === 'financial'
              ? [{value:'Q1',label:'Q1 (Apr-Jun)'},{value:'Q2',label:'Q2 (Jul-Sep)'},{value:'Q3',label:'Q3 (Oct-Dec)'},{value:'Q4',label:'Q4 (Jan-Mar)'}]
              : [{value:'Q1',label:'Q1 (Jan-Mar)'},{value:'Q2',label:'Q2 (Apr-Jun)'},{value:'Q3',label:'Q3 (Jul-Sep)'},{value:'Q4',label:'Q4 (Oct-Dec)'}];
            const fyFmt = v => `FY ${v}-${String(parseInt(v)+1).slice(-2)}`;
            const fyOpts    = yearOpts.map(o => ({ value: o.v, label: fyFmt(o.v) }));
            const qYrOpts   = quarterType === 'financial' ? fyOpts : yearOpts.map(o => ({ value: o.v, label: o.v }));
            const qYrLabel  = quarterType === 'financial' ? 'FY Start Year' : 'Year';
            const yrOpts    = yearOpts.map(o => ({ value: o.v, label: o.v }));
            const moOpts    = MONTH_OPTS.map(o => ({ value: o.v, label: o.l }));
            return (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={labelStyle}>Period</label>
                  <Select options={PERIOD_OPTIONS} value={PERIOD_OPTIONS.find(o => o.value === periodType)} onChange={o => setPeriodType(o.value)} styles={selStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="auto" />
                </div>
                {periodType === 'quarter' && <>
                  {SubSel('Quarter Type', quarterType, setQuarterType, qTypeOpts, 230)}
                  {SubSel(qYrLabel, selectedQYear, setSelectedQYear, qYrOpts, 145)}
                  {SubSel('Quarter', selectedQuarter, setSelectedQuarter, qOpts, 145)}
                </>}
                {periodType === 'financialyear' && SubSel('Financial Year', selectedFY, setSelectedFY, fyOpts, 148)}
                {periodType === 'year'          && SubSel('Year', selectedYear, setSelectedYear, yrOpts, 100)}
                {periodType === 'month' && <>
                  {SubSel('Month', selectedMonthVal, setSelectedMonthVal, moOpts, 110)}
                  {SubSel('Year', selectedMonthYear, setSelectedMonthYear, yrOpts, 100)}
                </>}
                {periodType === 'custom' && <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>From Date</label>
                    <AppDatePicker value={customFrom} onChange={setCustomFrom} max={customTo} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>To Date</label>
                    <AppDatePicker value={customTo} onChange={setCustomTo} min={customFrom} />
                  </div>
                </>}
                {periodType !== 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: mutedClr, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {fmtDisplayDate(fromDate)} → {fmtDisplayDate(toDate)}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
          <button
            onClick={onApply}
            disabled={loading}
            className="sr-apply-btn btn-generate-anim"
            style={{ background: `linear-gradient(135deg,${accent},${accent2})`, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', fontFamily, alignSelf: 'flex-end', height: 36 }}
          >
            <i className="bi bi-play-fill" style={{ marginRight: 4 }} />
            {loading ? 'Loading…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* ── Table card — overflow: hidden is safe here (no dropdowns inside) ── */}
      <div
        className="ss-table-card"
        style={{ background: cardBg, border: `1px solid ${borderClr}` }}
      >
        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#c62828', fontSize: '0.82rem' }}>
              <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: accent }}>
                  <th className="ss-th" style={{ textAlign: 'center', width: 36 }}>#</th>
                  <th className="ss-th" style={{ textAlign: 'left', minWidth: 180 }}>Description</th>
                  <th className="ss-th" style={{ minWidth: 70 }}>Order</th>
                  <th className="ss-th" style={{ minWidth: 70 }}>Supply</th>
                  <th className="ss-th" style={{ minWidth: 80 }}>Shortsupply</th>
                  <th className="ss-th" style={{ minWidth: 110 }}>Last Year<br />Shortsupply</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="ss-td" style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>
                      <i className="bi bi-inbox" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.4rem', opacity: 0.45 }} />
                      No data for the selected period
                    </td>
                  </tr>
                ) : pagedRows.map((row, idx) => {
                  const globalNum  = (page - 1) * rowsPerPage + idx + 1;
                  const evenBg     = isDarkMode ? '#1e293b' : '#ffffff';
                  const oddBg      = isDarkMode ? '#192233' : '#f8fafc';
                  const rowBg      = idx % 2 === 0 ? evenBg : oddBg;
                  const curVal     = parseFloat(row.shortsupplytonnage    || 0);
                  const lyVal      = parseFloat(row.ly_shortsupplytonnage || 0);
                  const diffVal    = curVal - lyVal;
                  const isUp       = diffVal > 0.0005;
                  const isDown     = diffVal < -0.0005;
                  const lyTooltip = `Current : ${curVal.toFixed(3)}\nLast Year : ${lyVal.toFixed(3)}\nDifference : ${isUp ? '+' : ''}${diffVal.toFixed(3)} ${isUp ? '↑' : isDown ? '↓' : ''}`.trim();
                  return (
                    <motion.tr
                      key={row.id ?? globalNum}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(idx, 12) * 0.03 }}
                      style={{ background: rowBg, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}
                      onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? '#1e2d45' : '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      <td className="ss-td" style={{ textAlign: 'center' }}>{globalNum}</td>
                      <td className="ss-td" style={{ textAlign: 'left', color: textClr, fontWeight: 500, whiteSpace: 'normal' }}>
                        {row.description}
                      </td>
                      <td className="ss-td">{ssz(row.ordertonnage)}</td>
                      <td className="ss-td">{ssz(row.supplytonnage)}</td>
                      <td className="ss-td">{ssz(curVal)}</td>
                      <td className="ss-td">
                        <Tooltip content={lyTooltip} header="Last Year Comparison">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'default' }}>
                            {isUp   && <span style={{ color: '#c62828', fontWeight: 700, fontSize: '0.72rem', lineHeight: 1, marginRight: 2 }}>▲</span>}
                            {isDown && <span style={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.72rem', lineHeight: 1, marginRight: 2 }}>▼</span>}
                            {ssz(lyVal)}
                          </span>
                        </Tooltip>
                      </td>
                    </motion.tr>
                  );
                })}

                {/* Total row — always visible, outside pagination slice */}
                {data.length > 0 && (
                  <tr style={{ background: totalRowBg, borderTop: `2px solid ${borderClr}`, fontWeight: 700 }}>
                    <td className="ss-td" style={{ textAlign: 'center', color: accent }}>{data.length + 1}</td>
                    <td className="ss-td" style={{ textAlign: 'left', color: accent, fontWeight: 800 }}>Total</td>
                    <td className="ss-td" style={{ color: accent }}>{totals.order.toFixed(3)}</td>
                    <td className="ss-td" style={{ color: accent }}>{totals.supply.toFixed(3)}</td>
                    <td className="ss-td" style={{ color: accent }}>{totals.short.toFixed(3)}</td>
                    <td className="ss-td" style={{ color: accent }}>{totals.lastYear.toFixed(3)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination — always visible for Show entries control */}
        <div
          className="ss-pagination"
          style={{ borderTop: `1px solid ${borderClr}`, background: isDarkMode ? '#0f172a' : '#f8fafc', flexWrap: 'wrap', gap: 6 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: '0.72rem', color: mutedClr, fontWeight: 600 }}>Show</span>
            <SSEntriesSelect
              value={rowsPerPage}
              onChange={(n) => { setRowsPerPage(n); setPage(1); }}
              accent={accent}
              isDarkMode={isDarkMode}
            />
            <span style={{ fontSize: '0.72rem', color: mutedClr, fontWeight: 600 }}>entries</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: mutedClr, fontWeight: 600 }}>
            {data.length === 0 ? 'No data' : `Showing ${startNum0} to ${endNum0} of ${data.length}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {pgBtn(page <= 1, () => setPage(1), '«')}
            {pgBtn(page <= 1, () => setPage(p => p - 1), '‹')}
            {deduped.map((p, i) =>
              p === '…'
                ? <span key={`e${i}`} style={{ color: mutedClr, fontSize: '0.72rem', padding: '0 2px' }}>…</span>
                : <motion.button key={p} onClick={() => setPage(p)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{
                    background: p === page ? accent : 'transparent',
                    color: p === page ? 'white' : textClr,
                    border: `1px solid ${p === page ? accent : borderClr}`,
                    borderRadius: 5, padding: '2px 7px', fontSize: '0.72rem',
                    cursor: 'pointer', fontWeight: p === page ? 700 : 400,
                  }}>{p}</motion.button>
            )}
            {pgBtn(page >= totalPages, () => setPage(p => p + 1), '›')}
            {pgBtn(page >= totalPages, () => setPage(totalPages), '»')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortSupplyPage() {
  const { user } = useAuth();
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary || '#283593';
  const cardBg     = isDarkMode ? '#1e293b' : 'white';
  const borderClr  = isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)';
  const textClr    = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr   = isDarkMode ? '#94a3b8' : '#64748b';
  const fontFamily = selectedFont?.body || "'Manrope', sans-serif";

  // Responsive: stack vertically on mobile
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Left table — High to Low (DESC sort)
  const [leftFrom,    setLeftFrom]    = useState(initDateStr);
  const [leftTo,      setLeftTo]      = useState(initDateStr);
  const [leftData,    setLeftData]    = useState([]);
  const [leftLoading, setLeftLoading] = useState(true);
  const [leftError,   setLeftError]   = useState(null);

  // Right table — Low to High (ASC sort), independent date range + separate API call
  const [rightFrom,    setRightFrom]    = useState(initDateStr);
  const [rightTo,      setRightTo]      = useState(initDateStr);
  const [rightData,    setRightData]    = useState([]);
  const [rightLoading, setRightLoading] = useState(true);
  const [rightError,   setRightError]   = useState(null);

  // Shows full-page overlay only on the first load; Apply clicks use per-table overlay instead
  const [initialLoad,  setInitialLoad]  = useState(true);

  // Toast
  const [toast,        setToast]        = useState({ show: false, title: '', message: '', type: 'info' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((title, message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, title, message, type });
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast({ show: false, title: '', message: '', type: 'info' }), 300);
    }, 5000);
  }, []);

  const closeToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(false);
    setTimeout(() => setToast({ show: false, title: '', message: '', type: 'info' }), 300);
  };

  const fetchLeft = useCallback(() => {
    appLog('[ShortSupply] fetchLeft', leftFrom, '→', leftTo);
    setLeftLoading(true);
    setLeftError(null);
    showToast('Loading', 'Fetching short supply data...', 'info');
    getShortSupplyByCategory({ fromdate: leftFrom, todate: leftTo, employeename: user?.username })
      .then(data => {
        const arr = (Array.isArray(data) ? data : []).filter(r => r.description !== 'Total');
        setLeftData([...arr].sort((a, b) => (parseFloat(b.shortsupplytonnage) || 0) - (parseFloat(a.shortsupplytonnage) || 0)));
        setLeftLoading(false);
        logActivity('Sales-Report', 'Short Supply');
        showToast('Success', 'Data loaded successfully!', 'success');
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
        setLeftError(msg);
        setLeftLoading(false);
        showToast('Error', msg, 'error');
      });
  }, [leftFrom, leftTo, user?.username, showToast]);

  const fetchRight = useCallback(() => {
    appLog('[ShortSupply] fetchRight', rightFrom, '→', rightTo);
    setRightLoading(true);
    setRightError(null);
    showToast('Loading', 'Fetching short supply data...', 'info');
    getShortSupplyByCategory({ fromdate: rightFrom, todate: rightTo, employeename: user?.username })
      .then(data => {
        const arr = (Array.isArray(data) ? data : []).filter(r => r.description !== 'Total');
        setRightData([...arr].sort((a, b) => (parseFloat(a.shortsupplytonnage) || 0) - (parseFloat(b.shortsupplytonnage) || 0)));
        setRightLoading(false);
        showToast('Success', 'Data loaded successfully!', 'success');
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
        setRightError(msg);
        setRightLoading(false);
        showToast('Error', msg, 'error');
      });
  }, [rightFrom, rightTo, user?.username, showToast]);

  // Initial load — fires once when user becomes available
  useEffect(() => {
    if (!user?.username) return;
    fetchLeft();
    fetchRight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  // Clear initialLoad once both fetches complete for the first time
  useEffect(() => {
    if (initialLoad && !leftLoading && !rightLoading) setInitialLoad(false);
  }, [leftLoading, rightLoading, initialLoad]);

  const toastAccentMap = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: accent };
  const toastIconMap   = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const toastAccent    = toastAccentMap[toast.type] || accent;

  const commonProps = { accent, accent2, cardBg, borderClr, textClr, mutedClr, isDarkMode, fontFamily };

  return (
    <div style={{ width: '100%', fontFamily, '--ss-accent': accent, '--ss-accent2': accent2 }}>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && toastVisible && (
          <motion.div
            key="ss-toast"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.26 }}
            style={{ position: 'fixed', top: 88, right: 24, zIndex: 9999 }}
          >
            <div
              onClick={closeToast}
              style={{
                minWidth: 260, maxWidth: 340, cursor: 'pointer', overflow: 'hidden',
                background: isDarkMode ? '#1e293b' : 'white',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                borderLeft: `4px solid ${toastAccent}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <i className={`bi ${toastIconMap[toast.type]}`} style={{ fontSize: '1.15rem', flexShrink: 0, color: toastAccent }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: textClr }}>{toast.title}</div>
                  <div style={{ fontSize: '0.73rem', color: mutedClr, marginTop: 1 }}>{toast.message}</div>
                </div>
                <Tooltip content="Close">
                  <button
                    onClick={e => { e.stopPropagation(); closeToast(); }}
                    style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: mutedClr, padding: '0 2px' }}
                  >×</button>
                </Tooltip>
              </div>
              <div style={{ height: 3, background: toastAccent, animation: 'ssprogress 5s linear forwards' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{ marginBottom: '1rem' }}
      >
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: textClr, margin: 0 }}>
          Short Supply
        </h2>
      </motion.div>

      {/*
        Desktop: side by side (flex row)
        Mobile (<768px): stacked vertically (flex column)
      */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
          <ShortSupplyTable
            {...commonProps}
            title="Short supply tonnage (High to Low)"
            data={leftData}
            loading={leftLoading}
            error={leftError}
            fromDate={leftFrom}
            toDate={leftTo}
            setFromDate={setLeftFrom}
            setToDate={setLeftTo}
            onApply={fetchLeft}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
          <ShortSupplyTable
            {...commonProps}
            flipPicker={!isMobile}
            title="Short supply tonnage (Low to High)"
            data={rightData}
            loading={rightLoading}
            error={rightError}
            fromDate={rightFrom}
            toDate={rightTo}
            setFromDate={setRightFrom}
            setToDate={setRightTo}
            onApply={fetchRight}
          />
        </div>
      </motion.div>

      {(leftLoading || rightLoading) && (
        <SrLoader accent={accent} isDarkMode={isDarkMode} text="Generating Report" />
      )}
    </div>
  );
}
