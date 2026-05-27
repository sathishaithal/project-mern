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
  getCatgroupForCategory,
  getThirdLevelDispatch,
  getFourthLevelDispatch,
  getLastUpdatedDates,
} from '../../../services/salesDashboardApi';
import { fmt, fmtDate } from '../../../utils/salesFormatters';
import { useAuth } from '../../../context/AuthContext';
import { CheckOption } from './filters/salesSelectUtils';
import { useSalesSelectStyles } from './filters/useSalesSelectStyles';
import { appLog } from '../../../config/appConfig';

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

// Keys summed during grouping (superset of ALL_NUM_KEYS — adds ttltonnage and lastmonthtonnage)
const GROUP_SUM_KEYS = [...ALL_NUM_KEYS, 'ttltonnage', 'lastmonthtonnage'];

const MONTH_KEYS_FOR_MINMAX = [
  'jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
  'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage','currentmonthtonnage',
];

// Groups a flat API response by groupField and sums all numeric tonnage fields — mirrors Angular datafilter_new()
function groupByField(rows, groupField) {
  const map = {};
  for (const row of rows) {
    const key = String(row[groupField] ?? '').trim();
    if (!key) continue;
    if (!map[key]) {
      map[key] = { ...row, id: key };
      GROUP_SUM_KEYS.forEach(k => { map[key][k] = 0; });
    }
    GROUP_SUM_KEYS.forEach(k => { map[key][k] += parseFloat(row[k]) || 0; });
  }
  return Object.values(map)
    .sort((a, b) => String(a[groupField]).localeCompare(String(b[groupField])))
    .map(row => {
      const vals = MONTH_KEYS_FOR_MINMAX.map(k => row[k]).filter(v => v > 0);
      row.maxvalue = vals.length ? Math.max(...vals) : '';
      row.minvalue = vals.length ? Math.min(...vals) : '';
      return row;
    });
}

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
    <td className="sr-td" title={`This year: ${fmt(row[mKey])}, Last year: ${fmt(row[mLyKey])}`}>
      <div style={{ fontWeight: 500, color: 'var(--sales-text, #1e293b)' }}>{fmt(row[mKey])}</div>
      <ArrowIcon diff={diff} />
    </td>
  );
};

const QuarterCell = ({ row, rows, rowIdx, level, qKey }) => {
  const diff = level === 0 ? l0diff(rows, rowIdx, qKey) : subDiff(row, qKey, qKey + '_last');
  return (
    <td className="sr-td" style={{ fontWeight: 700, textAlign: 'center' }}
      title={`This year: ${fmt(row[qKey])}, Last year: ${fmt(row[qKey + '_last'])}`}>
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

  const TOOLTIP_FORMULA = 'current year tonnage till this month - previous year tonnage till this month';
  const TOOLTIP_PCT     = 'Formula: ((Current Value till this month - Previous Value till this month) / Previous Value till this month) × 100';

  return (
    <>
      {showTillLast && (
        <td className="sr-td" style={{ fontWeight: 600 }}>
          <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(tillLast)}</div>
        </td>
      )}
      <td className="sr-td" style={{ fontWeight: 600 }}
        title={`This year: ${fmt(row.currentmonthtonnage)} | Last year: ${fmt(row.currentmonthtonnage_last)}`}>
        <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(row.currentmonthtonnage)}</div>
        {<ArrowIcon diff={level === 0 ? l0diff(rows, rowIdx, 'currentmonthtonnage') : subDiff(row, 'currentmonthtonnage', 'currentmonthtonnage_last')} />}
      </td>
      <td className="sr-td" style={{ fontWeight: 700 }}>
        <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(row.ttltonnage_crnt)}</div>
        {ytdGr !== null && <ArrowIcon diff={ytdGr} />}
      </td>
      <td className="sr-td" title={TOOLTIP_FORMULA}>
        <div style={{ color: numColor(ytdGr) }}>{ytdGr !== null ? `${ytdGr >= 0 ? '+' : ''}${fmt(ytdGr)}` : '—'}</div>
      </td>
      <td className="sr-td" title={TOOLTIP_PCT}>
        <div style={{ color: numColor(ytdPct) }}>
          {ytdPct !== null ? `${ytdPct.toFixed(1)}%` : '—'}
          {ytdPct !== null && <ArrowIcon diff={ytdPct} />}
        </div>
      </td>
      <td className="sr-td" style={{ fontWeight: 700 }}>
        <div style={{ color: 'var(--sales-text, #1e293b)' }}>{fmt(yoyVal)}</div>
      </td>
      <td className="sr-td" title={TOOLTIP_FORMULA}>
        <div style={{ color: numColor(yoyGr) }}>
          {yoyGr !== null ? `${yoyGr >= 0 ? '+' : ''}${fmt(yoyGr)}` : '—'}
          {yoyGr !== null && <ArrowIcon diff={yoyGr} />}
        </div>
      </td>
      <td className="sr-td" title={TOOLTIP_PCT}>
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
          <td className="sr-td" style={{ position: 'sticky', left: 0, background: 'inherit', textAlign: 'center', width: 28 }}>
            {canDrill && !isLoading && !isOpen && (
              <button onClick={() => onExpand(row, rowId, level)} className="sr-expand-btn" title="expand">
                <i className="bi bi-chevron-down" />
              </button>
            )}
            {canDrill && !isLoading && isOpen && (
              <button onClick={() => onCollapse(stateKey)} className="sr-expand-btn" title="collapse">
                <i className="bi bi-chevron-up" />
              </button>
            )}
            {isLoading && <i className="bi bi-arrow-clockwise" style={{ color: '#94a3b8', fontSize: '0.75rem' }} />}
          </td>

          <td
            className="sr-td"
            style={{
              position: 'sticky', left: 28, background: 'inherit',
              fontWeight: level === 0 ? 700 : 600,
              color: isDarkMode
                ? (level === 0 ? '#e2e8f0' : level === 1 ? '#93c5fd' : level === 2 ? '#c4b5fd' : '#cbd5e1')
                : (level === 0 ? '#1e293b' : level === 1 ? '#1d4ed8' : level === 2 ? '#7c3aed' : '#374151'),
              textAlign: 'left', paddingLeft: `${8 + indentPx}px`, minWidth: 160,
            }}
          >
            {level > 0 && <span style={{ color: '#94a3b8', marginRight: 4 }}>{'↳'.repeat(level)}</span>}
            {getLabel(row, level)}
          </td>

          {GROUPS.flatMap(g => [
            ...(expandedQuarters[g.qKey] ? g.months.map(m => (
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
  const gtBg     = accent ? `color-mix(in srgb, ${accent} 60%, #050505)` : '#1e293b';
  const gtBorder = accent ? `color-mix(in srgb, ${accent} 40%, #000000)` : '#334155';

  return (
    <tr style={{ background: gtBg, borderTop: `2px solid ${gtBorder}`, borderBottom: `2px solid ${gtBorder}` }}>
      <td className="sr-td" style={{ position: 'sticky', left: 0, background: gtBg }} />
      <td className="sr-td" style={{ position: 'sticky', left: 28, background: gtBg, textAlign: 'left', fontWeight: 800, color: 'white', fontSize: '0.8rem', minWidth: 160 }}>
        Grand Total
      </td>
      {GROUPS.flatMap(g => [
        ...(expandedQuarters[g.qKey] ? g.months.map(m => (
          <td key={m.key} className="sr-td" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{fmt(gt[m.key])}</td>
        )) : []),
        <td key={g.qKey} className="sr-td" style={{ background: 'rgba(0,0,0,0.18)', fontWeight: 800, color: 'white', textAlign: 'center' }}>{fmt(gt[g.qKey])}</td>,
      ])}
      {showTillLast && <td className="sr-td" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}>{fmt(tillLast)}</td>}
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}>{fmt(gt.currentmonthtonnage)}</td>
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800 }}>{fmt(gt.ttltonnage_crnt)}</td>
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>—</td>
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>—</td>
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 800 }}>{fmt(gt.ttltonnage_crntwy)}</td>
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>—</td>
      <td className="sr-td" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>—</td>
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

  const [rawRows,    setRawRows]    = useState([]);
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

  // Tab-specific filter state — cleared on tab switch
  const [fCatgroup,  setFCatgroup]  = useState('');
  const [fCategory,  setFCategory]  = useState('');
  const [fItemType,  setFItemType]  = useState('');
  const [fItem,      setFItem]      = useState('');
  const [fDistName,  setFDistName]  = useState('');
  const [fAsm,       setFAsm]       = useState('');
  const [fAreaName,  setFAreaName]  = useState('');
  const [fSoff,      setFSoff]      = useState('');

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
  const visibleMonthCount = GROUPS.reduce((n, g) => n + (expandedQuarters[g.qKey] ? 3 : 0), 0);
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
      const baseParams = { multiyear, employeename, monthwisecompany, monthwisedisttype };
      // All non-summary tabs use getMonthwiseFiltersDist (same data, grouped client-side by different field)
      const data = await (activeTab === 'summary'
        ? getMultiYearSales(baseParams)
        : getMonthwiseFiltersDist({ selectedyear: multiyear[0], employeename, monthwisecompany, disttype: monthwisedisttype })
      );
      setRawRows(Array.isArray(data) ? data.filter(r => !isGrandTotal(r)) : []);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
      setError(msg);
      showToast('Error loading data', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, multiyear, monthwisecompany, monthwisedisttype, employeename]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch last-updated dates once on mount — never on tab or filter change
  useEffect(() => {
    if (!employeename) return;
    appLog('[INIT] Fetching last updated dates — runs once on mount');
    getLastUpdatedDates(employeename)
      .then(d => setLastUpdate(Array.isArray(d) ? d[0] : d))
      .catch(() => null);
  }, [employeename]);

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

  // Filter option arrays — derived from raw API response (unique sorted values)
  const optCatgroups  = useMemo(() => [...new Set(rawRows.map(r => r.catgroup).filter(Boolean))].sort(), [rawRows]);
  const optCategories = useMemo(() => [...new Set(rawRows.map(r => r.category).filter(Boolean))].sort(), [rawRows]);
  const optItemTypes  = useMemo(() => [...new Set(rawRows.map(r => r.method).filter(Boolean))].sort(), [rawRows]);
  const optItems      = useMemo(() => [...new Set(rawRows.map(r => r.description).filter(Boolean))].sort(), [rawRows]);
  const optDistNames  = useMemo(() => [...new Set(rawRows.map(r => r.distname).filter(Boolean))].sort(), [rawRows]);
  const optAsms       = useMemo(() => [...new Set(rawRows.map(r => r.asm).filter(Boolean))].sort(), [rawRows]);
  const optAreaNames  = useMemo(() => [...new Set(rawRows.map(r => r.areaname).filter(Boolean))].sort(), [rawRows]);
  const optSoffs      = useMemo(() => [...new Set(rawRows.map(r => r.soff).filter(Boolean))].sort(), [rawRows]);

  // Filter rawRows FIRST, then group — mirrors Angular's datafilter_new() on the raw response
  const displayRows = useMemo(() => {
    if (activeTab === 'summary') {
      const selectedYearSet = new Set(
        (Array.isArray(multiyear) ? multiyear : [multiyear]).map(y => String(y))
      );
      return rawRows.filter(r => selectedYearSet.has(String(r.year)));
    }
    let f = rawRows;
    if (activeTab === 'distributors') {
      if (fDistName) f = f.filter(r => r.distname === fDistName);
      if (fCatgroup) f = f.filter(r => r.catgroup === fCatgroup);
      if (fCategory) f = f.filter(r => r.category === fCategory);
      if (fItemType) f = f.filter(r => r.method === fItemType);
      if (fItem)     f = f.filter(r => r.description === fItem);
      return groupByField(f, 'distname');
    }
    if (activeTab === 'catgroup') {
      if (fCatgroup) f = f.filter(r => r.catgroup === fCatgroup);
      if (fCategory) f = f.filter(r => r.category === fCategory);
      if (fItemType) f = f.filter(r => r.method === fItemType);
      if (fItem)     f = f.filter(r => r.description === fItem);
      if (fDistName) f = f.filter(r => r.distname === fDistName);
      return groupByField(f, 'catgroup');
    }
    if (activeTab === 'asm') {
      if (fAsm)      f = f.filter(r => r.asm === fAsm);
      if (fAreaName) f = f.filter(r => r.areaname === fAreaName);
      if (fCatgroup) f = f.filter(r => r.catgroup === fCatgroup);
      if (fCategory) f = f.filter(r => r.category === fCategory);
      if (fItem)     f = f.filter(r => r.description === fItem);
      return groupByField(f, 'asm');
    }
    if (activeTab === 'soff') {
      if (fAsm)      f = f.filter(r => r.asm === fAsm);
      if (fSoff)     f = f.filter(r => r.soff === fSoff);
      if (fDistName) f = f.filter(r => r.distname === fDistName);
      if (fCatgroup) f = f.filter(r => r.catgroup === fCatgroup);
      if (fCategory) f = f.filter(r => r.category === fCategory);
      if (fItem)     f = f.filter(r => r.description === fItem);
      return groupByField(f, 'soff');
    }
    return rawRows;
  }, [rawRows, activeTab, fCatgroup, fCategory, fItemType, fItem, fDistName, fAsm, fAreaName, fSoff]);

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary  || '#283593';
  const headerMain = accent;
  const headerQ    = `color-mix(in srgb, ${accent} 55%, #000000)`;
  const headerDark = `color-mix(in srgb, ${accent} 35%, #000000)`;
  const cardBg     = isDarkMode ? '#1e293b' : 'white';

  const tabSelStyles = useSalesSelectStyles({ minHeight: 32, height: 32, fontSize: '0.8rem', borderRadius: 7, minWidth: 130 });
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
      {/* ── Contained section: title, filters, tabs — overflow:hidden keeps these from spilling ── */}
      <div style={{ overflow: 'hidden', width: '100%' }}>
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
              onClick={() => { setActiveTab(t.id); setExpanded({}); setDrillData({}); setFCatgroup(''); setFCategory(''); setFItemType(''); setFItem(''); setFDistName(''); setFAsm(''); setFAreaName(''); setFSoff(''); }}
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

        {/* Tab-specific filter rows — options derived from rawRows unique values */}
        {activeTab === 'distributors' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="Distributor"    value={fDistName}  onChange={setFDistName}  options={optDistNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category Group" value={fCatgroup}  onChange={setFCatgroup}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory}  onChange={setFCategory}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item Type"      value={fItemType}  onChange={setFItemType}  options={optItemTypes}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}      onChange={setFItem}      options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <button onClick={fetchData} disabled={loading} className="sr-apply-btn" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
              <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
            </button>
          </div>
        )}

        {activeTab === 'catgroup' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="Category Group" value={fCatgroup}  onChange={setFCatgroup}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory}  onChange={setFCategory}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item Type"      value={fItemType}  onChange={setFItemType}  options={optItemTypes}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}      onChange={setFItem}      options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Distributor"    value={fDistName}  onChange={setFDistName}  options={optDistNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <button onClick={fetchData} disabled={loading} className="sr-apply-btn" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
              <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
            </button>
          </div>
        )}

        {activeTab === 'asm' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="ASM Name"       value={fAsm}       onChange={setFAsm}       options={optAsms}       styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Area Name"      value={fAreaName}  onChange={setFAreaName}  options={optAreaNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category Group" value={fCatgroup}  onChange={setFCatgroup}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory}  onChange={setFCategory}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}      onChange={setFItem}      options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <button onClick={fetchData} disabled={loading} className="sr-apply-btn" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
              <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
            </button>
          </div>
        )}

        {activeTab === 'soff' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="ASM Name"      value={fAsm}      onChange={setFAsm}      options={optAsms}       styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Sales Officer" value={fSoff}     onChange={setFSoff}     options={optSoffs}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Distributor"   value={fDistName} onChange={setFDistName} options={optDistNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category Group" value={fCatgroup} onChange={setFCatgroup} options={optCatgroups} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"      value={fCategory} onChange={setFCategory} options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"          value={fItem}     onChange={setFItem}     options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <button onClick={fetchData} disabled={loading} className="sr-apply-btn" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
              <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />{loading ? 'Loading…' : 'Apply'}
            </button>
          </div>
        )}
      </div>
      {/* ── End contained section — table card below has no overflow:hidden ancestor ── */}

      {loading && (
        <div className="sr-loader-overlay">
          <div className={`sr-loader-card${isDarkMode ? ' sr-loader-card-dark' : ''}`}>
            <div className="sr-loader-spinner" style={{ borderTopColor: accent }} />
            <div className="sr-loader-text">Generating Report</div>
            <div className="sr-loader-dots">
              <span style={{ background: accent }} />
              <span style={{ background: accent }} />
              <span style={{ background: accent }} />
            </div>
          </div>
        </div>
      )}

      {/* Table card — animates in, re-animates on tab change */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{ background: cardBg, borderRadius: 14, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: `1px solid ${borderClr}`, width: '100%', marginTop: '0.75rem', position: 'relative' }}
      >
        {isDrillLoading && (
          <div className="sr-drill-overlay" style={{ background: isDarkMode ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.72)' }}>
            <div className={`sr-loader-card${isDarkMode ? ' sr-loader-card-dark' : ''}`}>
              <div className="sr-loader-spinner" style={{ borderTopColor: accent }} />
              <div className="sr-loader-text">Generating Report</div>
              <div className="sr-loader-dots">
                <span style={{ background: accent }} />
                <span style={{ background: accent }} />
                <span style={{ background: accent }} />
              </div>
            </div>
          </div>
        )}
        <div className="sr-table-wrap" style={{ maxHeight: '65vh', borderRadius: 14 }}>
          <table className="sr-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: headerMain, color: 'white' }}>
                <th className="sr-th" style={{ position: 'sticky', left: 0, background: headerMain, width: 28, minWidth: 28, zIndex: 11, padding: '0.55rem 0.2rem' }} />
                <th className="sr-th" style={{ position: 'sticky', left: 28, background: headerMain, minWidth: 160, textAlign: 'left', zIndex: 11 }}>
                  {FIRST_COL_LABEL[activeTab] || 'Name'}
                </th>
                {GROUPS.flatMap(g => [
                  ...(expandedQuarters[g.qKey] ? g.months.map(m => (
                    <th key={m.key} className="sr-th" style={{ background: headerMain }}>{m.label}</th>
                  )) : []),
                  <th key={g.qKey}
                    className="sr-th" style={{ background: headerQ, minWidth: 70, cursor: 'pointer', userSelect: 'none', textAlign: 'center', verticalAlign: 'middle' }}
                    onClick={() => toggleQuarter(g.qKey)}
                    title={expandedQuarters[g.qKey] ? 'Collapse months' : 'Expand months'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span>{expandedQuarters[g.qKey] ? '▼' : '▶'}</span>
                      <span>{g.qLabel}</span>
                    </div>
                  </th>,
                ])}
                {showTillLast && <th className="sr-th" style={{ background: headerDark, minWidth: 70 }}>Till Last<br />Month</th>}
                <th className="sr-th" style={{ background: headerDark, minWidth: 70 }}>Current<br />tonnage</th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}>Total<br />(YTD)</th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}>YTD Gr/<br />Degr</th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 60 }}>YTD<br />%</th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}>Total<br />(YOY)</th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}>YOY Gr/<br />Degr</th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 60 }}>YOY<br />%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: cardBg }}>
                    <i className="bi bi-arrow-clockwise" style={{ fontSize: '1.2rem', marginRight: 8 }} />Loading…
                  </td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: cardBg }}>No data</td>
                </tr>
              ) : (
                <>
                  <DrillRows
                    rows={displayRows} level={0} parentRows={displayRows}
                    expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast}
                    monthwisecompany={monthwisecompany} monthwisedisttype={monthwisedisttype} employeename={employeename}
                    expanded={expanded} drillData={drillData} drillLoading={drillLoading}
                    onExpand={handleExpand} onCollapse={handleCollapse}
                    getLabel={getLabel} l0Bg={L0_BG[activeTab] ?? '#fffde7'}
                    isDarkMode={isDarkMode}
                  />
                  {displayRows.length > 1 && (
                    <GrandTotalRow rows={displayRows} expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast} accent={accent} />
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {!loading && displayRows.length > 0 && (
          <div style={{ padding: '0.5rem 1rem', borderTop: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, fontSize: '0.72rem', color: '#94a3b8' }}>
            {displayRows.length} row{displayRows.length > 1 ? 's' : ''} · Click ▶/▼ on Q headers to expand months · Click ▼ on rows to drill down
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

function TabFilter({ label, value, onChange, options, styles, isDarkMode, accent }) {
  return (
    <div className="sr-filter-group">
      <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : (accent || '#1e3a5f') }}>{label}</label>
      <Select
        options={[{ value: '', label: 'All' }, ...options.map(o => ({ value: o, label: o }))]}
        value={{ value, label: value || 'All' }}
        onChange={s => onChange(s.value)}
        styles={styles}
        isSearchable
        menuPortalTarget={document.body}
        menuPosition="fixed"
        components={{ Option: CheckOption }}
      />
    </div>
  );
}

