import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import './Sales.css';
import { useColorMode } from '../../../theme/ThemeContext';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import {
  getMultiYearSales,
  getMonthwiseFiltersDist,
  getMonthwiseFiltersNew,
  getCatgroupForCategory,
  getThirdLevelDispatch,
  getFourthLevelDispatch,
  getLastUpdatedDates,
} from '../../../services/salesDashboardApi';
import { fmt, fmtDate } from '../../../utils/salesFormatters';
import { useAuth } from '../../../context/AuthContext';
import { CheckOption } from './filters/salesSelectUtils';

const GROUPS = [
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

const ALL_NUM_KEYS = [
  'jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
  'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage',
  'jantonnage_last','febtonnage_last','martonnage_last','aprtonnage_last','maytonnage_last','juntonnage_last',
  'jultonnage_last','augtonnage_last','septonnage_last','octtonnage_last','novtonnage_last','dectonnage_last',
  'Q1','Q2','Q3','Q4','Q1_last','Q2_last','Q3_last','Q4_last',
  'ttltonnage_crnt','ttltonnage_crntwy','ttltonnagewy','currentmonthtonnage','currentmonthtonnage_last',
];

const TABS = [
  { id: 'summary',      label: 'YoY Summary' },
  { id: 'distributors', label: 'Distributors' },
  { id: 'catgroup',     label: 'Catgroup' },
  { id: 'asm',          label: 'ASM' },
  { id: 'soff',         label: 'Sales Officer' },
];

const FIRST_COL_LABEL = {
  summary: 'Dispatch Type', distributors: 'Distributor Name',
  catgroup: 'Category Group', asm: 'ASM Name', soff: 'Sales Officer',
};

const L0_BG = {
  summary: '#fffde7', distributors: '#ffebee', catgroup: '#f3e5f5',
  asm: '#e8f5e9', soff: '#fff3e0',
};

const TILL_LAST_MONTH_TABS = { summary: true, distributors: false, catgroup: false, asm: false, soff: false };

const fyToCalYear = (fy) => {
  const s = String(fy ?? '');
  if (/^\d{4}$/.test(s)) {
    const endYY = parseInt(s.slice(2), 10);
    return String(endYY < 50 ? 2000 + endYY : 1900 + endYY);
  }
  return s || '—';
};

const ArrowIcon = ({ diff }) => {
  if (diff === null || diff === undefined || diff === 0) return null;
  return (
    <span style={{ fontWeight: 700, fontSize: '0.75rem', marginLeft: 1, color: diff > 0 ? '#2e7d32' : '#c62828' }}>
      {diff > 0 ? '▲' : '▼'}
    </span>
  );
};

const l0diff  = (rows, i, key) => {
  if (i === 0) return null;
  const curr = parseFloat(rows[i][key]), prev = parseFloat(rows[i - 1][key]);
  if (isNaN(curr) || isNaN(prev)) return null;
  return curr - prev;
};
const subDiff = (row, key, lyKey) => {
  const curr = parseFloat(row[key]), prev = parseFloat(row[lyKey]);
  if (isNaN(curr) || isNaN(prev)) return null;
  return curr - prev;
};

const MonthCell = ({ row, rows, rowIdx, level, mKey, mLyKey }) => {
  const diff = level === 0 ? l0diff(rows, rowIdx, mKey) : subDiff(row, mKey, mLyKey);
  return (
    <td style={{ ...tdStyle }}>
      <div style={{ fontWeight: 500, color: 'var(--sales-text, #1e293b)' }}>{fmt(row[mKey])}</div>
      <ArrowIcon diff={diff} />
    </td>
  );
};

const QuarterCell = ({ row, rows, rowIdx, level, qKey }) => {
  const diff = level === 0 ? l0diff(rows, rowIdx, qKey) : subDiff(row, qKey, qKey + '_last');
  return (
    <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'center' }}>
      <div>{fmt(row[qKey])}</div>
      <ArrowIcon diff={diff} />
    </td>
  );
};

const numColor = (v) => (v === null || v === undefined) ? '#94a3b8' : v >= 0 ? '#2e7d32' : '#c62828';

const SummaryCells = ({ row, rows, rowIdx, level, showTillLast }) => {
  const tillLast = (parseFloat(row.ttltonnage_crnt) || 0) - (parseFloat(row.currentmonthtonnage) || 0);
  let ytdGr = null;
  if (level === 0) {
    if (rowIdx > 0) ytdGr = (parseFloat(row.ttltonnage_crnt) || 0) - (parseFloat(rows[rowIdx - 1].ttltonnage_crnt) || 0);
  } else {
    const lyYtd = GROUPS.flatMap(g => g.months.map(m => parseFloat(row[m.lyKey]) || 0)).reduce((s, v) => s + v, 0)
      + (parseFloat(row.currentmonthtonnage_last) || 0);
    ytdGr = (parseFloat(row.ttltonnage_crnt) || 0) - lyYtd;
  }
  const ytdBase = parseFloat(row.ttltonnagewy) || 0;
  const ytdPct  = (ytdGr !== null && ytdBase !== 0) ? (ytdGr / Math.abs(ytdBase) * 100) : null;
  const yoyVal  = parseFloat(row.ttltonnage_crntwy) || 0;
  let yoyGr = null;
  if (level === 0 && rowIdx > 0) yoyGr = yoyVal - (parseFloat(rows[rowIdx - 1].ttltonnagewy) || 0);
  else if (level > 0) yoyGr = yoyVal - (parseFloat(row.ttltonnagewy) || 0);
  const yoyPct  = (yoyGr !== null && ytdBase !== 0) ? (yoyGr / Math.abs(ytdBase) * 100) : null;

  return (
    <>
      {showTillLast && (
        <td style={{ ...tdStyle, fontWeight: 600 }}>
          <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(tillLast)}</div>
        </td>
      )}
      <td style={{ ...tdStyle, fontWeight: 600 }}>
        <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(row.currentmonthtonnage)}</div>
        {<ArrowIcon diff={level === 0 ? l0diff(rows, rowIdx, 'currentmonthtonnage') : subDiff(row, 'currentmonthtonnage', 'currentmonthtonnage_last')} />}
      </td>
      <td style={{ ...tdStyle, fontWeight: 700 }}>
        <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(row.ttltonnage_crnt)}</div>
        {ytdGr !== null && <ArrowIcon diff={ytdGr} />}
      </td>
      <td style={{ ...tdStyle }}>
        <div style={{ color: numColor(ytdGr) }}>{ytdGr !== null ? `${ytdGr >= 0 ? '+' : ''}${fmt(ytdGr)}` : '—'}</div>
      </td>
      <td style={{ ...tdStyle }}>
        <div style={{ color: numColor(ytdPct) }}>
          {ytdPct !== null ? `${ytdPct.toFixed(1)}%` : '—'}
          {ytdPct !== null && <ArrowIcon diff={ytdPct} />}
        </div>
      </td>
      <td style={{ ...tdStyle, fontWeight: 700 }}>
        <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(yoyVal)}</div>
      </td>
      <td style={{ ...tdStyle }}>
        <div style={{ color: numColor(yoyGr) }}>
          {yoyGr !== null ? `${yoyGr >= 0 ? '+' : ''}${fmt(yoyGr)}` : '—'}
          {yoyGr !== null && <ArrowIcon diff={yoyGr} />}
        </div>
      </td>
      <td style={{ ...tdStyle }}>
        <div style={{ color: numColor(yoyPct) }}>
          {yoyPct !== null ? `${yoyPct.toFixed(1)}%` : '—'}
          {yoyPct !== null && <ArrowIcon diff={yoyPct} />}
        </div>
      </td>
    </>
  );
};

const isGrandTotal = (r) =>
  r.disttype === 'Grand Total' || String(r.year) === 'Grand Total' || r.id === '';

function DrillRows({ rows, level, parentRows, expandedQuarters, isSummary, showTillLast,
  monthwisecompany, monthwisedisttype, employeename,
  expanded, drillData, drillLoading, onExpand, onCollapse, getLabel, l0Bg, isDarkMode }) {
  const dataRows = rows.filter(r => !isGrandTotal(r));
  const effectiveParent = parentRows ? parentRows.filter(r => !isGrandTotal(r)) : dataRows;
  return dataRows.map((row, i) => {
    const rowId   = row.id ?? `${level}-${i}`;
    const stateKey = `${level}_${rowId}`;
    const isOpen    = !!expanded[stateKey];
    const isLoading = !!drillLoading[stateKey];
    const children  = drillData[stateKey] || [];
    const canDrill  = level < 4;
    const indentPx  = level * 16;
    const isMax     = (v) => parseFloat(v) > 0 && parseFloat(v) === parseFloat(row.maxvalue);
    const isMin     = (v) => parseFloat(v) > 0 && parseFloat(v) === parseFloat(row.minvalue);
    const cellBg    = (v) => isMax(v) ? 'rgba(16,185,129,0.10)' : isMin(v) ? 'rgba(239,68,68,0.08)' : undefined;

    const rowBg = isDarkMode
      ? (level === 0 ? '#192030'
        : level === 1 ? '#1a1228'
        : level === 2 ? '#0e1816'
        : level === 3 ? '#1a1e1e'
        : '#182030')
      : (level === 0 ? (l0Bg || '#fffde7')
        : level === 1 ? '#e8d5f5'
        : level === 2 ? '#e0f2f1'
        : level === 3 ? '#f5f5f5'
        : '#f0fff4');

    return (
      <React.Fragment key={stateKey}>
        <tr
          style={{ borderBottom: '1px solid #f1f5f9', background: rowBg }}
          onMouseEnter={e => { e.currentTarget.style.background = isDarkMode ? '#1e2d45' : '#eff6ff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
        >
          <td style={{ ...tdStyle, position: 'sticky', left: 0, background: 'inherit', textAlign: 'center', width: 28 }}>
            {canDrill && !isLoading && !isOpen && (
              <button onClick={() => onExpand(row, rowId, level)} style={expandBtnStyle} title="expand">
                <i className="bi bi-chevron-down" />
              </button>
            )}
            {canDrill && !isLoading && isOpen && (
              <button onClick={() => onCollapse(stateKey)} style={expandBtnStyle} title="collapse">
                <i className="bi bi-chevron-up" />
              </button>
            )}
            {isLoading && <i className="bi bi-arrow-clockwise" style={{ color: '#94a3b8', fontSize: '0.75rem' }} />}
          </td>

          <td style={{
            ...tdStyle,
            position: 'sticky', left: 28, background: 'inherit',
            fontWeight: level === 0 ? 700 : 600,
            color: isDarkMode
              ? (level === 0 ? '#e2e8f0' : level === 1 ? '#93c5fd' : level === 2 ? '#c4b5fd' : '#cbd5e1')
              : (level === 0 ? '#1e293b' : level === 1 ? '#1d4ed8' : level === 2 ? '#7c3aed' : '#374151'),
            textAlign: 'left', paddingLeft: `${8 + indentPx}px`, minWidth: 160,
          }}>
            {level > 0 && <span style={{ color: '#94a3b8', marginRight: 4 }}>{'↳'.repeat(level)}</span>}
            {getLabel(row, level)}
          </td>

          {GROUPS.flatMap(g => [
            ...(isSummary && expandedQuarters[g.qKey] ? g.months.map(m => (
              <MonthCell key={m.key} row={row} rows={effectiveParent} rowIdx={i} level={level}
                mKey={m.key} mLyKey={m.lyKey} />
            )) : []),
            <QuarterCell key={g.qKey} row={row} rows={effectiveParent} rowIdx={i} level={level} qKey={g.qKey} />,
          ])}

          <SummaryCells row={row} rows={effectiveParent} rowIdx={i} level={level} showTillLast={showTillLast} />
        </tr>

        {isOpen && children.length > 0 && (
          <DrillRows
            rows={children} level={level + 1} parentRows={children}
            expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast}
            monthwisecompany={monthwisecompany} monthwisedisttype={monthwisedisttype} employeename={employeename}
            expanded={expanded} drillData={drillData} drillLoading={drillLoading}
            onExpand={onExpand} onCollapse={onCollapse} getLabel={getLabel} l0Bg={l0Bg}
            isDarkMode={isDarkMode}
          />
        )}
      </React.Fragment>
    );
  });
}

function GrandTotalRow({ rows, expandedQuarters, isSummary, showTillLast, accent }) {
  const gt = useMemo(() => {
    const r = {};
    ALL_NUM_KEYS.forEach(k => { r[k] = rows.reduce((s, row) => s + (parseFloat(row[k]) || 0), 0); });
    return r;
  }, [rows]);

  const tillLast = (gt.ttltonnage_crnt || 0) - (gt.currentmonthtonnage || 0);
  const gtBg = accent ? `color-mix(in srgb, ${accent} 55%, #1a3a0e)` : '#2e7d32';
  const gtBorder = accent ? `color-mix(in srgb, ${accent} 35%, #0d2006)` : '#1b5e20';

  return (
    <tr style={{ background: gtBg, borderTop: `2px solid ${gtBorder}`, borderBottom: `2px solid ${gtBorder}` }}>
      <td style={{ ...tdStyle, position: 'sticky', left: 0, background: gtBg }} />
      <td style={{ ...tdStyle, position: 'sticky', left: 28, background: gtBg, textAlign: 'left', fontWeight: 800, color: 'white', fontSize: '0.8rem', minWidth: 160 }}>
        Grand Total
      </td>
      {GROUPS.flatMap(g => [
        ...(isSummary && expandedQuarters[g.qKey] ? g.months.map(m => (
          <td key={m.key} style={{ ...tdStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{fmt(gt[m.key])}</td>
        )) : []),
        <td key={g.qKey} style={{ ...tdStyle, background: 'rgba(0,0,0,0.18)', fontWeight: 800, color: 'white', textAlign: 'center' }}>{fmt(gt[g.qKey])}</td>,
      ])}
      {showTillLast && <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}>{fmt(tillLast)}</td>}
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}>{fmt(gt.currentmonthtonnage)}</td>
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800 }}>{fmt(gt.ttltonnage_crnt)}</td>
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>—</td>
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>—</td>
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 800 }}>{fmt(gt.ttltonnage_crntwy)}</td>
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>—</td>
      <td style={{ ...tdStyle, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>—</td>
    </tr>
  );
}

export default function SalesReportPage() {
  const { user } = useAuth();
  const employeename = user?.username;
  const { multiyear, monthwisecompany, monthwisedisttype } = useSalesFilterStore();
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const [toast, setToast]       = useState({ show: false, message: '', type: 'info', title: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [lastUpdate, setLastUpdate] = useState(null);

  const [expandedQuarters, setExpandedQuarters] = useState({ Q1: false, Q2: false, Q3: false, Q4: false });
  const [expanded, setExpanded]     = useState({});
  const [drillData, setDrillData]   = useState({});
  const [drillLoading, setDrillLoading] = useState({});
  const drillDataRef = useRef({});
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const [filterDists,     setFilterDists]     = useState([]);
  const [filterCatgroups, setFilterCatgroups] = useState([]);
  const [filterAsms,      setFilterAsms]      = useState([]);
  const [filterSoffs,     setFilterSoffs]     = useState([]);

  const [fdist,      setFdist]      = useState('');
  const [fCatgroup,  setFCatgroup]  = useState('');
  const [fAsm,       setFAsm]       = useState('');
  const [fSoff,      setFSoff]      = useState('');
  const [fSoffAsm,   setFSoffAsm]   = useState('');

  useEffect(() => {
    if (!employeename) return;
    Promise.all([
      getMonthwiseFiltersDist({ employeename, selectedyear: multiyear[0] }).catch(() => []),
      getMonthwiseFiltersNew({ jsonData: JSON.stringify({ type: 'catgroup', employeename, multiyear }) }).catch(() => []),
      getMonthwiseFiltersNew({ jsonData: JSON.stringify({ type: 'asm',      employeename, multiyear }) }).catch(() => []),
      getMonthwiseFiltersNew({ jsonData: JSON.stringify({ type: 'soff',     employeename, multiyear }) }).catch(() => []),
    ]).then(([dists, cats, asms, soffs]) => {
      setFilterDists(Array.isArray(dists) ? dists : []);
      setFilterCatgroups(Array.isArray(cats) ? cats : []);
      setFilterAsms(Array.isArray(asms) ? asms : []);
      setFilterSoffs(Array.isArray(soffs) ? soffs : []);
    });
  }, [employeename, multiyear]);

  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  const showToast = useCallback((title, message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type, title });
    setToastVisible(true);
    const duration = type === 'success' ? 3000 : 5000;
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast({ show: false, message: '', type: 'info', title: '' }), 300);
    }, duration);
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastVisible(false);
    setTimeout(() => setToast({ show: false, message: '', type: 'info', title: '' }), 300);
  }, []);

  const getLabel = useCallback((row, level) => {
    switch (activeTab) {
      case 'distributors':
        if (level === 0) return row.distname || '—';
        if (level === 1) return row.catgroup || '—';
        if (level === 2) return row.category || '—';
        if (level === 3) return row.description || row.code || '—';
        return '—';
      case 'catgroup':
        if (level === 0) return row.catgroup || '—';
        if (level === 1) return row.distname || '—';
        if (level === 2) return row.category || '—';
        if (level === 3) return row.description || '—';
        return '—';
      case 'asm':
        if (level === 0) return row.asm || '—';
        if (level === 1) return row.areaname || row.distname || '—';
        if (level === 2) return row.catgroup || '—';
        if (level === 3) return row.category || '—';
        return '—';
      case 'soff':
        if (level === 0) return row.soff || '—';
        if (level === 1) return row.areaname || row.distname || row.asm || '—';
        if (level === 2) return row.catgroup || '—';
        if (level === 3) return row.category || '—';
        return '—';
      default:
        if (level === 0) return fyToCalYear(row.year) || '—';
        if (level === 1) return row.catgroup || row.disttype || '—';
        if (level === 2) return row.distname || '—';
        if (level === 3) return row.catgroup || '—';
        return '—';
    }
  }, [activeTab]);

  const isSummary     = activeTab === 'summary';
  const showTillLast  = TILL_LAST_MONTH_TABS[activeTab] ?? true;
  const visibleMonthCount = isSummary ? GROUPS.reduce((n, g) => n + (expandedQuarters[g.qKey] ? 3 : 0), 0) : 0;
  const TOTAL_COLS    = 2 + visibleMonthCount + 4 + (showTillLast ? 1 : 0) + 7;

  const toggleQuarter = (qKey) => setExpandedQuarters(p => ({ ...p, [qKey]: !p[qKey] }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpanded({});
    drillDataRef.current = {};
    setDrillData({});
    setDrillLoading({});

    try {
      let fetchMain;
      const baseParams = { multiyear, employeename, monthwisecompany, monthwisedisttype };

      if (activeTab === 'summary') {
        fetchMain = getMultiYearSales(baseParams);
      } else if (activeTab === 'distributors') {
        fetchMain = getMonthwiseFiltersDist({ ...baseParams, selectedyear: multiyear[0], disttype: monthwisedisttype });
      } else {
        fetchMain = getMonthwiseFiltersNew({
          jsonData: JSON.stringify({ ...baseParams, view: activeTab }),
        });
      }

      const [data, dates] = await Promise.all([
        fetchMain,
        getLastUpdatedDates(employeename),
      ]);
      setRows(Array.isArray(data) ? data.filter(r => !isGrandTotal(r)) : []);
      setLastUpdate(Array.isArray(dates) ? dates[0] : dates);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
      setError(msg);
      showToast('Error loading data', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, multiyear, monthwisecompany, monthwisedisttype, employeename]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExpand = useCallback(async (row, id, level) => {
    const key = `${level}_${id}`;
    if (drillDataRef.current[key]) { setExpanded(p => ({ ...p, [key]: true })); return; }
    setDrillLoading(p => ({ ...p, [key]: true }));
    showToast('Loading', 'Fetching sales data...', 'info');
    try {
      const tab = activeTabRef.current;
      const rowId = row.id ?? id;
      const selectedyear = row.year ?? String(multiyear?.[0] ?? '');
      let data;

      if (tab === 'summary' && level === 0) {
        // YoY Summary Level 0 → catgroup-for-category
        // Backend splits id on "_" to extract disttype and company.
        // multi-year-sales rows have id=year (number) — that is wrong to pass here.
        // Build id from filter values: disttype_company (e.g. "Distribution_SBL").
        data = await getCatgroupForCategory({
          selectedyear,
          employeename,
          monthwisecompany,
          id: `${monthwisedisttype}_${monthwisecompany}`,
        });
      } else if (level <= 1) {
        // Level 0 for non-summary tabs, or Level 1 for summary (catgroup row → distributor list)
        // Angular: getsecondlevel → thirdleveldispatch_vn_AR4_SVS.php
        // params: id, distpatchtype, disttype, selectedyear, monthwisecompany, employeename
        data = await getThirdLevelDispatch({
          id: rowId,
          distpatchtype: row.disttype || monthwisedisttype,
          disttype: row.disttype || monthwisedisttype,
          selectedyear,
          monthwisecompany,
          employeename,
        });
      } else {
        // Level 2+ (distributor row → item list)
        // Angular: catgroup_for_cat → fourthleveldispatch_all_AR4_SVS.php
        // params: id, dispatchtype, disttype, selectedyear, monthwisecompany, employeename
        data = await getFourthLevelDispatch({
          id: rowId,
          dispatchtype: row.disttype || monthwisedisttype,
          disttype: row.disttype || monthwisedisttype,
          selectedyear,
          monthwisecompany,
          employeename,
        });
      }

      const list = (Array.isArray(data) ? data : []).filter(r => !isGrandTotal(r));
      drillDataRef.current = { ...drillDataRef.current, [key]: list };
      setDrillData(p => ({ ...p, [key]: list }));
      setExpanded(p => ({ ...p, [key]: true }));
      showToast('Success', 'Data loaded successfully!', 'success');
    } catch {
      setExpanded(p => ({ ...p, [key]: true }));
      showToast('Error', 'Failed to load data.', 'error');
    } finally {
      setDrillLoading(p => ({ ...p, [key]: false }));
    }
  }, [monthwisecompany, monthwisedisttype, employeename, multiyear]);

  const handleCollapse = useCallback((id) => setExpanded(p => ({ ...p, [id]: false })), []);

  const lastUpdateDate = lastUpdate ? fmtDate(lastUpdate.dispatchlastupdate) : null;
  const isDrillLoading = Object.values(drillLoading).some(Boolean);

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary  || '#283593';
  const accentDark = `color-mix(in srgb, ${accent} 52%, #0a1628)`;
  const cardBg     = isDarkMode ? '#1e293b' : 'white';

  const tabSelStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base, minHeight: 32, height: 32, fontSize: '0.8rem', fontFamily: 'inherit',
      borderColor: state.isFocused ? accent : (isDarkMode ? '#334155' : '#cbd5e1'),
      boxShadow: state.isFocused ? `0 0 0 2px ${accent}30` : 'none',
      '&:hover': { borderColor: accent }, borderRadius: 7, cursor: 'pointer',
      background: isDarkMode ? '#0f172a' : 'white', minWidth: 110,
    }),
    valueContainer: (base) => ({ ...base, padding: '0 0.6rem' }),
    indicatorsContainer: (base) => ({ ...base, height: 32 }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({ ...base, fontSize: '0.8rem', fontFamily: 'inherit', background: isDarkMode ? '#1e293b' : 'white' }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? accent : state.isFocused ? (isDarkMode ? '#334155' : '#eff6ff') : (isDarkMode ? '#1e293b' : 'white'),
      color: state.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'), cursor: 'pointer',
    }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b' }),
    dropdownIndicator: (base) => ({ ...base, color: accent, padding: '0 6px' }),
    indicatorSeparator: () => ({ display: 'none' }),
  }), [accent, isDarkMode]);
  const borderClr  = isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)';
  const textClr    = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr   = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div
      className="sr-page"
      style={{
        fontFamily: selectedFont?.body || "'Manrope',sans-serif",
        background: isDarkMode ? '#0f172a' : 'transparent',
        minHeight: '100%',
        transition: 'background 0.3s',
        '--sales-text-muted': mutedClr,
        '--sales-text': textClr,
      }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{ marginBottom: '1rem' }}
      >
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: textClr, margin: 0 }}>
          Month-wise Sales Report
        </h2>
      </motion.div>

      <FilterBar mode="monthwise" onApply={fetchData} isLoading={loading} lastUpdateDate={lastUpdateDate} />

      {error && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: isDarkMode ? '#2d1515' : '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {/* Sub-tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="sr-tabs"
        style={{ marginBottom: 0, borderBottom: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setExpanded({}); setDrillData({}); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? accent : mutedClr,
              borderBottom: activeTab === t.id ? `2px solid ${accent}` : '2px solid transparent',
              marginBottom: -2, fontFamily: 'inherit', transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab-specific filter rows */}
      {activeTab === 'distributors' && (
        <div style={tabFilterRowStyle}>
          <div style={tabFiltGroupStyle}>
            <label style={tabFiltLblStyle(isDarkMode, accent)}>Distributor</label>
            <Select options={[{value:'',label:'All'},...filterDists.map(d=>({value:d.distname,label:d.distname}))]}
              value={{value:fdist,label:fdist||'All'}} onChange={s=>setFdist(s.value)}
              styles={tabSelStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" components={{ Option: CheckOption }} />
          </div>
          <div style={tabFiltGroupStyle}>
            <label style={tabFiltLblStyle(isDarkMode, accent)}>Cat Group</label>
            <Select options={[{value:'',label:'All'},...filterCatgroups.map(c=>({value:c.catgroup,label:c.catgroup}))]}
              value={{value:fCatgroup,label:fCatgroup||'All'}} onChange={s=>setFCatgroup(s.value)}
              styles={tabSelStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" components={{ Option: CheckOption }} />
          </div>
          <button onClick={fetchData} disabled={loading} style={tabFiltApplyStyle(accent, accent2)}>
            <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      )}

      {activeTab === 'catgroup' && (
        <div style={tabFilterRowStyle}>
          <div style={tabFiltGroupStyle}>
            <label style={tabFiltLblStyle(isDarkMode, accent)}>Category Group</label>
            <Select options={[{value:'',label:'All'},...filterCatgroups.map(c=>({value:c.catgroup,label:c.catgroup}))]}
              value={{value:fCatgroup,label:fCatgroup||'All'}} onChange={s=>setFCatgroup(s.value)}
              styles={tabSelStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" components={{ Option: CheckOption }} />
          </div>
          <button onClick={fetchData} disabled={loading} style={tabFiltApplyStyle(accent, accent2)}>
            <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      )}

      {activeTab === 'asm' && (
        <div style={tabFilterRowStyle}>
          <div style={tabFiltGroupStyle}>
            <label style={tabFiltLblStyle(isDarkMode, accent)}>ASM Name</label>
            <Select options={[{value:'',label:'All'},...filterAsms.map(a=>({value:a.asm,label:a.asm}))]}
              value={{value:fAsm,label:fAsm||'All'}} onChange={s=>setFAsm(s.value)}
              styles={tabSelStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" components={{ Option: CheckOption }} />
          </div>
          <button onClick={fetchData} disabled={loading} style={tabFiltApplyStyle(accent, accent2)}>
            <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      )}

      {activeTab === 'soff' && (
        <div style={tabFilterRowStyle}>
          <div style={tabFiltGroupStyle}>
            <label style={tabFiltLblStyle(isDarkMode, accent)}>ASM Name</label>
            <Select options={[{value:'',label:'All'},...filterAsms.map(a=>({value:a.asm,label:a.asm}))]}
              value={{value:fSoffAsm,label:fSoffAsm||'All'}} onChange={s=>setFSoffAsm(s.value)}
              styles={tabSelStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" components={{ Option: CheckOption }} />
          </div>
          <div style={tabFiltGroupStyle}>
            <label style={tabFiltLblStyle(isDarkMode, accent)}>Sales Officer</label>
            <Select options={[{value:'',label:'All'},...filterSoffs.map(s=>({value:s.soff,label:s.soff}))]}
              value={{value:fSoff,label:fSoff||'All'}} onChange={s=>setFSoff(s.value)}
              styles={tabSelStyles} isSearchable={false} menuPortalTarget={document.body} menuPosition="fixed" components={{ Option: CheckOption }} />
          </div>
          <button onClick={fetchData} disabled={loading} style={tabFiltApplyStyle(accent, accent2)}>
            <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      )}

      {/* Table card — animates in, re-animates on tab change */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{ background: cardBg, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: `1px solid ${borderClr}`, width: '100%', marginTop: '0.75rem', position: 'relative' }}
      >
        {/* FIX 7: Drill-down loading overlay */}
        {isDrillLoading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20, borderRadius: 14,
            background: isDarkMode ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: isDarkMode ? '#1e293b' : 'white',
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              borderRadius: 12, padding: '1.5rem 2rem', textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
              <i className={`bi bi-arrow-clockwise sr-spin`} style={{ fontSize: '1.8rem', color: accent, display: 'block', marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: textClr }}>Generating Report</div>
              <div style={{ color: mutedClr, fontSize: '0.78rem', marginTop: 4 }}>Fetching sales data…</div>
            </div>
          </div>
        )}
        <div className="sr-table-wrap" style={{ maxHeight: '65vh' }}>
          <table className="sr-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: accent, color: 'white' }}>
                <th style={{ ...thStyle, position: 'sticky', left: 0, background: accent, width: 28, minWidth: 28, zIndex: 11, padding: '0.55rem 0.2rem' }} />
                <th style={{ ...thStyle, position: 'sticky', left: 28, background: accent, minWidth: 160, textAlign: 'left', zIndex: 11 }}>
                  {FIRST_COL_LABEL[activeTab] || 'Name'}
                </th>
                {GROUPS.flatMap(g => [
                  ...(isSummary && expandedQuarters[g.qKey] ? g.months.map(m => (
                    <th key={m.key} style={{ ...thStyle, background: accent }}>{m.label}</th>
                  )) : []),
                  isSummary ? (
                    <th key={g.qKey}
                      style={{ ...thStyle, background: accent2, minWidth: 70, cursor: 'pointer', userSelect: 'none', textAlign: 'center', verticalAlign: 'middle' }}
                      onClick={() => toggleQuarter(g.qKey)}
                      title={expandedQuarters[g.qKey] ? 'Collapse months' : 'Expand months'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span>{expandedQuarters[g.qKey] ? '▼' : '▶'}</span>
                        <span>{g.qLabel}</span>
                      </div>
                    </th>
                  ) : (
                    <th key={g.qKey} style={{ ...thStyle, background: accent2, minWidth: 70, textAlign: 'center', verticalAlign: 'middle' }}>
                      {g.qLabel}
                    </th>
                  ),
                ])}
                {showTillLast && <th style={{ ...thStyle, background: accentDark, minWidth: 70 }}>Till Last<br />Month</th>}
                <th style={{ ...thStyle, background: accentDark, minWidth: 70 }}>Current<br />tonnage</th>
                <th style={{ ...thStyle, background: accentDark, minWidth: 75 }}>Total<br />(YTD)</th>
                <th style={{ ...thStyle, background: accentDark, minWidth: 75 }}>YTD Gr/<br />Degr</th>
                <th style={{ ...thStyle, background: accentDark, minWidth: 60 }}>YTD<br />%</th>
                <th style={{ ...thStyle, background: accentDark, minWidth: 75 }}>Total<br />(YOY)</th>
                <th style={{ ...thStyle, background: accentDark, minWidth: 75 }}>YOY Gr/<br />Degr</th>
                <th style={{ ...thStyle, background: accentDark, minWidth: 60 }}>YOY<br />%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: cardBg }}>
                    <i className="bi bi-arrow-clockwise" style={{ fontSize: '1.2rem', marginRight: 8 }} />Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: cardBg }}>No data</td>
                </tr>
              ) : (
                <>
                  <DrillRows
                    rows={rows} level={0} parentRows={rows}
                    expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast}
                    monthwisecompany={monthwisecompany} monthwisedisttype={monthwisedisttype} employeename={employeename}
                    expanded={expanded} drillData={drillData} drillLoading={drillLoading}
                    onExpand={handleExpand} onCollapse={handleCollapse}
                    getLabel={getLabel} l0Bg={L0_BG[activeTab] ?? '#fffde7'}
                    isDarkMode={isDarkMode}
                  />
                  {rows.length > 1 && (
                    <GrandTotalRow rows={rows} expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast} accent={accent} />
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div style={{ padding: '0.5rem 1rem', borderTop: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, fontSize: '0.72rem', color: '#94a3b8' }}>
            {rows.length} row{rows.length > 1 ? 's' : ''} · Click ▶/▼ on Q headers to expand months · Click ▼ on rows to drill down
          </div>
        )}
      </motion.div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast.show && toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, minWidth: 300, maxWidth: 420 }}
          >
            <div style={{ background: cardBg, border: `1px solid ${toast.type === 'error' ? '#fca5a5' : toast.type === 'success' ? '#86efac' : '#93c5fd'}`, borderRadius: 12, padding: '0.9rem 1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <i
                className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : toast.type === 'error' ? 'exclamation-triangle-fill' : 'info-circle-fill'}`}
                style={{ color: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : accent, fontSize: '1.15rem', marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: textClr }}>{toast.title}</div>
                <div style={{ fontSize: '0.78rem', color: mutedClr, marginTop: 2 }}>{toast.message}</div>
              </div>
              <button onClick={closeToast} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedClr, fontSize: '1.2rem', lineHeight: 1, padding: 0, marginLeft: 4 }}>×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const thStyle = { padding: '0.55rem 0.6rem', fontWeight: 700, fontSize: '0.71rem', color: 'white', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 60 };
const tdStyle = { padding: '0.35rem 0.6rem', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.77rem', color: 'var(--sales-text-muted, #475569)' };
const expandBtnStyle = { background: 'none', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: '#64748b', padding: 0 };
const tabFilterRowStyle = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', padding: '0.6rem 0', marginBottom: 0 };
const tabFiltGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem' };
const tabFiltLblStyle   = (dark, accent) => ({ fontWeight: 600, fontSize: '0.72rem', color: dark ? '#94a3b8' : (accent || '#1e3a5f'), whiteSpace: 'nowrap', letterSpacing: '0.02em' });
const tabFiltApplyStyle  = (a1, a2) => ({ height: 32, background: `linear-gradient(135deg, ${a1 || '#2563eb'}, ${a2 || '#1e40af'})`, color: 'white', border: 'none', borderRadius: 7, padding: '0 0.9rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit', alignSelf: 'flex-end' });
