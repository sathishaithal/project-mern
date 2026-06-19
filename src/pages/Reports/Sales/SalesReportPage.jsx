import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select, { components } from 'react-select';
import Tooltip from '../../../components/ui/Tooltip';
import SrLoader from '../../../components/ui/SrLoader';
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
  getCatgroupForCatAR1,
  getSecondLevelDispatch,
  getFifthLevelDispatch,
  getSixthLevelDispatch,
} from '../../../services/salesDashboardApi';
import { fmt, fmtR, fmtDate } from '../../../utils/salesFormatters';
import {
  groupByField, getDistfinfColor,
  FULL_DRILL_AFTER, GROUP_SUM_KEYS, GROUP_FIELD_TO_DISTFINF, ALL_NUM_KEYS,
} from '../../../utils/salesGrouping';
import {
  GROUPS, tooltipRegistry,
  ArrowIcon, l0diff, subDiff, CellTooltip,
  MonthCell, QuarterCell, numColor, SummaryCells,
} from './components/SalesCells';
import { useAuth } from '../../../context/AuthContext';
import { useSalesSelectStyles } from './filters/useSalesSelectStyles';
import { appLog } from '../../../config/appConfig';
import { logActivity } from '../../../services/activityLog';

const CheckboxOption = (props) => (
  <components.Option {...props}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => null}
        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: props.selectProps?.accentColor || '#1a237e', flexShrink: 0 }}
        readOnly
      />
      <span style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{props.label}</span>
    </div>
  </components.Option>
);

const TABS = [
  { id: 'summary',      label: 'YoY Summary',   icon: 'bi-bar-chart-line-fill' },
  { id: 'distributors', label: 'Distributors',  icon: 'bi-diagram-3-fill' },
  { id: 'catgroup',     label: 'Catgroup',       icon: 'bi-grid-fill' },
  { id: 'asm',          label: 'ASM',            icon: 'bi-person-badge-fill' },
  { id: 'soff',         label: 'Sales Officer',  icon: 'bi-person-lines-fill' },
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

const NAME_COL_WIDTH = { summary: 130, distributors: 200, catgroup: 160, asm: 150, soff: 160 };

// getDistfinfColor imported from src/utils/salesGrouping.js

const fyToCalYear = (fy) => {
  const s = String(fy ?? '');
  if (/^\d{4}$/.test(s)) {
    const endYY = parseInt(s.slice(2), 10);
    return String(endYY < 50 ? 2000 + endYY : 1900 + endYY);
  }
  return s || '—';
};

// Cell components (ArrowIcon, l0diff, subDiff, tooltipRegistry, CellTooltip,
// MonthCell, QuarterCell, numColor, SummaryCells) and GROUPS are imported from
// ./components/SalesCells.jsx — see imports at the top of this file.

// tooltipRegistry is exported from ./components/SalesCells.jsx and imported above.
// Wire it to setTooltip inside the SalesReportPage component function (see useEffect below).

// ↑ all cell component definitions removed — they live in ./components/SalesCells.jsx

const isGrandTotal = (r) =>
  r.disttype === 'Grand Total' || String(r.year) === 'Grand Total' || r.id === '';

function DrillRows({ rows, level, parentPath = '', parentRows, expandedQuarters, isSummary, showTillLast,
  monthwisecompany, monthwisedisttype, employeename, tab,
  expanded, drillData, drillLoading, onExpand, onCollapse,
  expandedYear, onYearExpand, onYearCollapse, yearRowsEnabled,
  getLabel, l0Bg, isDarkMode, accent, nameColWidth = 160, allSummaryRows, isMultiYear }) {
  const dataRows = rows.filter(r => !isGrandTotal(r));
  const effectiveParent = parentRows ? parentRows.filter(r => !isGrandTotal(r)) : dataRows;
  return dataRows.map((row, i) => {
    const rowId    = row.id ?? String(i);
    const stateKey = parentPath ? `${parentPath}__${rowId}` : `${level}_${rowId}`;
    const isOpen    = !!expanded[stateKey];
    const isLoading = !!drillLoading[stateKey];
    const children  = drillData[stateKey] || [];
    const isLeafNode = row.final === 1 || row.final === '1';
    const isShopsLeaf = isSummary && monthwisedisttype === 'Shops' && !!(row.disttype && row.description && row.disttype === row.description);
    const maxLevel = (isSummary && monthwisedisttype === 'Shops') ? 5 : 3;
    // Non-summary: drillability is purely client-side (groupByField), so ignore the API's `final` flag.
    // Summary: `final` marks a true leaf node where the server has no more data.
    const canDrill = isSummary
      ? (!(isLeafNode || isShopsLeaf) && level < maxLevel)
      : !!(FULL_DRILL_AFTER[tab]?.[row._groupField]);
    const yearOpen   = !isSummary && level === 0 && !!expandedYear?.[stateKey];
    const yearChildren = drillData[`year__${stateKey}`] || [];
    const isL0NonSummary = !isSummary && level === 0;
    const showYearBtn   = isL0NonSummary && !!yearRowsEnabled && !isLoading;
    const showExpandBtn = canDrill && !isLoading;
    const clampedLevel = Math.min(level, 3);
    const indentPx     = level * 10;
    const dfColor      = level === 0 ? getDistfinfColor(row) : null;

    const rowBgMap = [
      `color-mix(in srgb, ${accent} 15%, ${isDarkMode ? '#0f172a' : '#ffffff'})`,
      `color-mix(in srgb, ${accent} 9%, ${isDarkMode ? '#0f172a' : '#f8fafc'})`,
      `color-mix(in srgb, ${accent} 5%, ${isDarkMode ? '#0f172a' : '#f8fafc'})`,
      `color-mix(in srgb, ${accent} 2%, ${isDarkMode ? '#0f172a' : '#ffffff'})`,
    ];
    const rowBg = rowBgMap[clampedLevel];
    const borderColors = [accent, `color-mix(in srgb, ${accent} 75%, transparent)`, `color-mix(in srgb, ${accent} 50%, transparent)`, `color-mix(in srgb, ${accent} 25%, transparent)`];
    const borderWidths = ['5px', '4px', '3px', '2px'];
    const borderColor  = borderColors[clampedLevel];
    const borderWidth  = borderWidths[clampedLevel];

    const lvlTextClrs  = isDarkMode ? ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8'] : ['#0f172a', '#1e293b', '#334155', '#475569'];
    const lvlTextClr   = lvlTextClrs[clampedLevel];

    return (
      <React.Fragment key={stateKey}>
        <motion.tr
          className={level > 0 ? 'sr-drill-row' : undefined}
          style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', borderLeft: `${borderWidth} solid ${borderColor}`, background: rowBg, height: 38 }}
          onMouseEnter={e => { e.currentTarget.style.background = isDarkMode ? '#1e2d45' : '#eff6ff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.035 }}
        >
          <td className="sr-td" style={{ position: 'sticky', left: 0, background: 'inherit', textAlign: 'center', verticalAlign: 'middle', width: 50, minWidth: 50, padding: '0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {showExpandBtn && (
                <Tooltip content={isOpen ? 'Collapse' : 'Expand'}>
                  <button
                    onClick={() => {
                      if (isOpen) { onCollapse(stateKey); }
                      else { if (yearOpen) onYearCollapse(stateKey); onExpand(row, stateKey, level); }
                    }}
                    className={`sr-expand-btn${isOpen ? ' expanded' : ''}`}
                    aria-label={isOpen ? 'Collapse row' : 'Expand row'}
                    style={{ color: accent }}
                  >
                    <motion.i
                      className="bi bi-chevron-down"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'inline-block' }}
                    />
                  </button>
                </Tooltip>
              )}
              {showYearBtn && (
                <Tooltip content={yearOpen ? 'Collapse years' : 'Year breakdown'}>
                  <button
                    onClick={() => {
                      if (yearOpen) { onYearCollapse(stateKey); }
                      else { if (isOpen) onCollapse(stateKey); onYearExpand(row, stateKey); }
                    }}
                    className="sr-expand-btn"
                    aria-label={yearOpen ? 'Collapse year breakdown' : 'Year breakdown'}
                    style={{ color: accent, opacity: 0.75 }}
                  >
                    <motion.i
                      className="bi bi-chevron-double-down"
                      animate={{ rotate: yearOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'inline-block' }}
                    />
                  </button>
                </Tooltip>
              )}
              {!showExpandBtn && !showYearBtn && !isLoading && <span className="sr-expand-placeholder" />}
              {isLoading && <i className="bi bi-arrow-clockwise sr-spin" style={{ color: '#94a3b8', fontSize: '0.75rem' }} />}
            </div>
          </td>

          <td
            className="sr-td"
            style={{
              position: 'sticky', left: 50,
              background: dfColor ? dfColor.bg : 'inherit',
              fontWeight: level === 0 ? 700 : level === 1 ? 600 : 400,
              fontSize: level === 0 ? '0.82rem' : '0.79rem',
              letterSpacing: level === 0 ? '0.06em' : 'normal',
              textTransform: level === 0 ? 'uppercase' : 'none',
              color: dfColor ? dfColor.text : lvlTextClr,
              textAlign: 'left', paddingLeft: `${8 + indentPx}px`,
              minWidth: nameColWidth, maxWidth: nameColWidth + 60,
              whiteSpace: 'normal', wordBreak: 'break-word',
              lineHeight: 1.4, verticalAlign: 'middle',
            }}
          >
            {level > 0 && (
              <span style={{ marginRight: 4, color: 'var(--sr-muted, #94a3b8)', fontSize: '0.78rem' }}>
                {'↳'.repeat(level)}
              </span>
            )}
            {getLabel(row, level)}
          </td>

          {GROUPS.flatMap(g => [
            ...(expandedQuarters[g.qKey] ? g.months.map(m => (
              <MonthCell key={m.key} row={row} rows={effectiveParent} rowIdx={i} level={level}
                mKey={m.key} mLyKey={m.lyKey} accent={accent} isDarkMode={isDarkMode} isSummary={isSummary} />
            )) : []),
            <QuarterCell key={g.qKey} row={row} rows={effectiveParent} rowIdx={i} level={level} qKey={g.qKey} accent={accent} isDarkMode={isDarkMode} isSummary={isSummary} />,
          ])}

          <SummaryCells row={row} rows={effectiveParent} rowIdx={i} level={level} showTillLast={showTillLast} accent={accent} isDarkMode={isDarkMode} isSummary={isSummary} allSummaryRows={allSummaryRows} isMultiYear={isMultiYear} />
        </motion.tr>

        {yearOpen && yearChildren.length > 0 && (
          <DrillRows
            rows={yearChildren} level={1} parentPath={`year__${stateKey}`} parentRows={yearChildren}
            expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast}
            monthwisecompany={monthwisecompany} monthwisedisttype={monthwisedisttype} employeename={employeename}
            tab={tab}
            expanded={expanded} drillData={drillData} drillLoading={drillLoading}
            onExpand={onExpand} onCollapse={onCollapse}
            expandedYear={expandedYear} onYearExpand={onYearExpand} onYearCollapse={onYearCollapse}
            yearRowsEnabled={false}
            getLabel={getLabel} l0Bg={l0Bg}
            isDarkMode={isDarkMode} accent={accent} nameColWidth={nameColWidth} allSummaryRows={allSummaryRows} isMultiYear={isMultiYear}
          />
        )}

        {isOpen && children.length > 0 && (
          <DrillRows
            rows={children} level={level + 1} parentPath={stateKey} parentRows={children}
            expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast}
            monthwisecompany={monthwisecompany} monthwisedisttype={monthwisedisttype} employeename={employeename}
            tab={tab}
            expanded={expanded} drillData={drillData} drillLoading={drillLoading}
            onExpand={onExpand} onCollapse={onCollapse}
            expandedYear={expandedYear} onYearExpand={onYearExpand} onYearCollapse={onYearCollapse}
            yearRowsEnabled={yearRowsEnabled}
            getLabel={getLabel} l0Bg={l0Bg}
            isDarkMode={isDarkMode} accent={accent} nameColWidth={nameColWidth} allSummaryRows={allSummaryRows} isMultiYear={isMultiYear}
          />
        )}
      </React.Fragment>
    );
  });
}

function GrandTotalRow({ rows, expandedQuarters, isSummary, showTillLast, accent, nameColWidth = 160, allSummaryRows }) {
  const gt = useMemo(() => {
    const r = {};
    ALL_NUM_KEYS.forEach(k => { r[k] = rows.reduce((s, row) => s + (parseFloat(row[k]) || 0), 0); });
    return r;
  }, [rows]);

  const tillLast = (gt.ttltonnage_crnt || 0) - (gt.currentmonthtonnage || 0);
  const gtBg     = accent ? `color-mix(in srgb, ${accent} 60%, #050505)` : '#1e293b';
  const gtBorder = accent ? `color-mix(in srgb, ${accent} 40%, #000000)` : '#334155';

  // Compute aggregate growth values for Grand Total row
  const gtGrowth = useMemo(() => {
    if (rows.length === 0) return null;

    // Non-summary tabs (Distributors/Catgroup/ASM/Soff): each L0 row has ttltonnage (prev YTD)
    // summed from GROUP_SUM_KEYS via groupByField — use directly
    if (!isSummary) {
      let prevYtd = 0, currYtd = 0, prevYoy = 0, currYoy = 0;
      rows.forEach(row => {
        prevYtd += parseFloat(row.ttltonnage)       || 0;
        currYtd += parseFloat(row.ttltonnage_crnt)  || 0;
        prevYoy += parseFloat(row.ttltonnagewy)     || 0;
        currYoy += parseFloat(row.ttltonnage_crntwy) || 0;
      });
      const totalYtdGr = currYtd - prevYtd;
      const ytdPct     = prevYtd !== 0 ? (totalYtdGr / Math.abs(prevYtd) * 100) : null;
      const totalYoyGr = currYoy - prevYoy;
      const yoyPct     = prevYoy !== 0 ? (totalYoyGr / Math.abs(prevYoy) * 100) : null;
      return { totalYtdGr, ytdPct, totalYoyGr, yoyPct };
    }

    // Summary tab: mirrors SummaryCells per-row logic then aggregates
    // YTD% and YOY% are sums of per-row rounded values (e.g. 2024:12% + 2025:12% = 24%)
    let totalYtdGr = 0, totalYoyGr = 0, totalYoyBase = 0;
    let ytdPctSum = 0, ytdPctRows = 0, yoyPctSum = 0;
    rows.forEach((row, rowIdx) => {
      // YTD Gr/Degr base — mirrors SummaryCells exactly
      let ytdGrBase;
      if (rowIdx > 0) {
        ytdGrBase = parseFloat(rows[rowIdx - 1].ttltonnage_crnt) || 0;
      } else {
        const prevYrRow = allSummaryRows?.find(r => String(r.year) === String(parseInt(row.year, 10) - 1));
        ytdGrBase = prevYrRow
          ? (parseFloat(prevYrRow.ttltonnage) || 0) + (parseFloat(prevYrRow.currentmonthtonnage) || 0)
          : GROUPS.flatMap(g => g.months.map(m => parseFloat(row[m.lyKey]) || 0)).reduce((s, v) => s + v, 0);
      }
      totalYtdGr += (parseFloat(row.ttltonnage_crnt) || 0) - ytdGrBase;

      // YTD % — sum of per-row rounded values (matches Angular: each year's % adds up)
      const curMon = parseFloat(row.currentmonthtonnage) || 0;
      const prevYrRowForPct = (allSummaryRows || rows).find(r => String(r.year) === String(parseInt(row.year, 10) - 1));
      const prevMon = prevYrRowForPct
        ? (parseFloat(prevYrRowForPct.currentmonthtonnage_last) || parseFloat(prevYrRowForPct.currentmonthtonnage) || 0)
        : 0;
      if (prevMon !== 0) { ytdPctSum += Math.round((curMon - prevMon) / Math.abs(prevMon) * 100); ytdPctRows++; }

      // YOY Gr/Degr base
      let yoyBase;
      if (rowIdx > 0) {
        yoyBase = parseFloat(rows[rowIdx - 1].ttltonnagewy) || 0;
      } else {
        const prevYrRow = allSummaryRows?.find(r => String(r.year) === String(parseInt(row.year, 10) - 1));
        yoyBase = prevYrRow ? (parseFloat(prevYrRow.ttltonnagewy) || 0) : 0;
      }
      const yoyVal = parseFloat(row.ttltonnage_crntwy) || 0;
      if (yoyBase !== 0) {
        totalYoyGr += yoyVal - yoyBase;
        yoyPctSum += Math.round((yoyVal - yoyBase) / Math.abs(yoyBase) * 100);
      }
      totalYoyBase += yoyBase;
    });

    const ytdPct = ytdPctRows > 0 ? ytdPctSum : null;
    const yoyPct = totalYoyBase !== 0 ? yoyPctSum : null;
    return { totalYtdGr, ytdPct, totalYoyGr, yoyPct };
  }, [rows, allSummaryRows, isSummary]);

  return (
    <tr style={{ background: gtBg, borderTop: `2px solid ${gtBorder}`, borderBottom: `2px solid ${gtBorder}` }}>
      <td className="sr-td" style={{ position: 'sticky', left: 0, background: gtBg, width: 50, minWidth: 50 }} />
      <td className="sr-td" style={{ position: 'sticky', left: 50, background: gtBg, textAlign: 'left', fontWeight: 800, color: 'white', fontSize: '0.8rem', minWidth: nameColWidth, maxWidth: nameColWidth + 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Grand Total
      </td>
      {GROUPS.flatMap(g => [
        ...(expandedQuarters[g.qKey] ? g.months.map(m => (
          <td key={m.key} className="sr-td" style={{ background: gtBg, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{fmtR(gt[m.key])}</td>
        )) : []),
        <td key={g.qKey} className="sr-td" style={{ background: gtBg, fontWeight: 800, color: 'white', textAlign: 'center' }}>{fmtR(gt[g.qKey])}</td>,
      ])}
      {showTillLast && <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 600 }}>{fmtR(tillLast)}</td>}
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 600 }}>{fmtR(gt.currentmonthtonnage)}</td>
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 800 }}>{fmtR(gt.ttltonnage_crnt)}</td>
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 700 }}>
        {gtGrowth != null ? fmtR(gtGrowth.totalYtdGr) : '—'}
      </td>
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 700 }}>
        {gtGrowth?.ytdPct != null ? `${Math.round(gtGrowth.ytdPct)}%` : '—'}
      </td>
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 800 }}>{fmtR(gt.ttltonnage_crntwy)}</td>
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 700 }}>
        {gtGrowth != null ? fmtR(gtGrowth.totalYoyGr) : '—'}
      </td>
      <td className="sr-td" style={{ background: gtBg, color: 'white', fontWeight: 700 }}>
        {gtGrowth?.yoyPct != null ? `${Math.round(gtGrowth.yoyPct)}%` : '—'}
      </td>
    </tr>
  );
}

const COLOR_LEGEND = [
  { bg: 'green',      label: 'All 4 quarters growing vs last year' },
  { bg: 'lightgreen', label: '3 quarters growing (1 declining)' },
  { bg: 'yellow',     label: '2 quarters growing, 2 declining' },
  { bg: 'red',        label: '3 or more quarters declining' },
];

function ColorLegend({ accent, isDarkMode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px',
      marginBottom: 6, borderRadius: 8, flexWrap: 'wrap',
      background: isDarkMode ? 'rgba(30,41,59,0.55)' : '#f8fafc',
      border: `1px solid ${accent}22`,
    }}>
      <span style={{
        fontSize: '0.72rem', fontWeight: 700, color: accent,
        display: 'flex', alignItems: 'center', gap: 4,
        animation: 'colorLegendPulse 2s ease-in-out infinite',
        flexShrink: 0,
      }}>
        <i className="bi bi-info-circle-fill" />
        Row colors indicate quarterly performance:
      </span>
      {COLOR_LEGEND.map(({ bg, label }) => (
        <div key={bg} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            display: 'inline-block', width: 14, height: 14, borderRadius: 3,
            background: bg, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.7rem', color: isDarkMode ? '#94a3b8' : '#475569' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SalesReportPage({ loggedInRole = null, loggedInRolex = null, syncKey = 0, onLastUpdateChange }) {
  const { user } = useAuth();
  const employeename = user?.username;
  const { multiyear, monthwisecompany, monthwisedisttype, setMonthwiseDisttype } = useSalesFilterStore();
  // Refs keep current filter values so fetchData can read them without being in its dep array
  const multiyearRef         = useRef(multiyear);
  const monthwisecompanyRef  = useRef(monthwisecompany);
  const monthwisedisttypeRef = useRef(monthwisedisttype);
  useEffect(() => { multiyearRef.current = multiyear; }, [multiyear]);
  useEffect(() => { monthwisecompanyRef.current = monthwisecompany; }, [monthwisecompany]);
  useEffect(() => { monthwisedisttypeRef.current = monthwisedisttype; }, [monthwisedisttype]);
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const [toast, setToast]       = useState({ show: false, message: '', type: 'info', title: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const [rawRows,        setRawRows]        = useState([]);
  const [appliedMultiyear, setAppliedMultiyear] = useState(multiyear);
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
  const [expandedYear, setExpandedYear] = useState({});
  const rawRowsRef = useRef([]);
  useEffect(() => { rawRowsRef.current = rawRows; }, [rawRows]);

  // Cache for non-summary joined data — same API response for all non-summary tabs
  const nonSummaryRawRef    = useRef([]);
  const nonSummaryParamsRef = useRef(null);
  const prevTabCatRef       = useRef(null);

  // Pre-grouped results for each non-summary tab — populated via setTimeout chain after fetch
  const groupedCacheRef = useRef({});
  const groupingRef     = useRef(false); // guard: prevents concurrent preGroupAll chains
  const [grouping, setGrouping] = useState(false);

  // Single page-level tooltip (replaces per-cell useState — eliminates ~1560 state instances)
  const [tooltip, setTooltip] = useState(null);
  useEffect(() => {
    tooltipRegistry.setter = setTooltip;
    return () => { tooltipRegistry.setter = null; };
  }, []);

  // Tab-specific filter state — multi-select arrays, cleared on tab switch
  const [fCatgroup,  setFCatgroup]  = useState([]);
  const [fCategory,  setFCategory]  = useState([]);
  const [fItemType,  setFItemType]  = useState([]);
  const [fItem,      setFItem]      = useState([]);
  const [fDistName,  setFDistName]  = useState([]);
  const [fAsm,       setFAsm]       = useState([]);
  const [fAreaName,  setFAreaName]  = useState([]);
  const [fSoff,      setFSoff]      = useState([]);

  // Ref that always holds the latest tab filter values — used in drill-down callbacks
  const activeFiltersRef = useRef({});
  useEffect(() => {
    activeFiltersRef.current = { fDistName, fCatgroup, fCategory, fItemType, fItem, fAsm, fAreaName, fSoff };
  }, [fDistName, fCatgroup, fCategory, fItemType, fItem, fAsm, fAreaName, fSoff]);

  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  // Clear large refs on unmount so GC can reclaim memory (state clears automatically)
  useEffect(() => {
    return () => {
      drillDataRef.current    = {};
      groupedCacheRef.current = {};
      nonSummaryRawRef.current = [];
    };
  }, []);

  // Expose busy flag so sidebar can show confirm dialog before navigating away mid-load
  useEffect(() => {
    window.salesReportBusy = loading || grouping;
    return () => { window.salesReportBusy = false; };
  }, [loading, grouping]);

  // Browser-level guard for page refresh/close while data is loading
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (loading || grouping) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, grouping]);

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
    if (activeTab !== 'summary' && row._groupField) {
      const val = row[row._groupField];
      if (row._groupField === 'year') return fyToCalYear(val) || '—';
      return String(val ?? '—');
    }
    if (level === 0) return fyToCalYear(row.year) || '—';
    const isShops = monthwisedisttype === 'Shops';
    if (isShops) {
      // L1: shop type — disttype = 'NTPet Shop', 'Yeshwantpur Shop', etc.
      if (level === 1) return String(row.disttype ?? row.distname ?? '—');
      // L2: distributor — distname = 'SBL NT PET SHOP', 'GATE PASS', etc.
      if (level === 2) return String(row.distname ?? row.disttype ?? '—');
      // L3: catgroup — catgroup = 'GRAM FLOUR', 'AVALAKKI', etc. (from getFifthLevelDispatch)
      if (level === 3) return String(row.catgroup ?? row.category ?? row.disttype ?? '—');
      // L4: item — disttype = item name (getSixthLevelDispatch sets disttype = description)
      if (level === 4) return String(row.disttype ?? row.description ?? '—');
      return String(row.disttype ?? row.description ?? '—');
    }
    // Distribution mode
    // L1: catgroup name (from getCatgroupForCategory)
    if (level === 1) return String(row.catgroup ?? row.disttype ?? '—');
    // L2: from getThirdLevelDispatch — groups by a.category, so row.category = category name
    //     row.disttype = 'Distribution' (constant, not useful here)
    if (level === 2) return String(row.category ?? row.distname ?? row.disttype ?? '—');
    // L3: from getFourthLevelDispatch — description = item name (disttype = 'Distribution', not useful)
    if (level === 3) return String(row.description ?? row.disttype ?? row.distname ?? '—');
    return '—';
  }, [activeTab, monthwisedisttype]);

  const isSummary     = activeTab === 'summary';
  const showTillLast  = TILL_LAST_MONTH_TABS[activeTab] ?? true;
  const visibleMonthCount = GROUPS.reduce((n, g) => n + (expandedQuarters[g.qKey] ? 3 : 0), 0);
  const TOTAL_COLS    = 2 + visibleMonthCount + 4 + (showTillLast ? 1 : 0) + 7;

  // Mirrors Angular *ngIf on tab li elements — role + method based visibility
  // ASM:  monthwisedisttype !== 'Shops' && loggedInRole !== 'Distributor' && loggedInRolex !== 'Sales Man' && loggedInRolex !== 'Sales Executive'
  // Soff: monthwisedisttype !== 'Shops' && loggedInRole !== 'Distributor'
  const visibleTabs = useMemo(() => {
    const isShops   = monthwisedisttype === 'Shops';
    const isDist    = loggedInRole === 'Distributor';
    const isSalesMn = loggedInRolex === 'Sales Man' || loggedInRolex === 'Sales Executive';
    return TABS.filter(t => {
      if (t.id === 'asm')  return !isShops && !isDist && !isSalesMn;
      if (t.id === 'soff') return !isShops && !isDist;
      return true;
    });
  }, [monthwisedisttype, loggedInRole, loggedInRolex]);

  const toggleQuarter = (qKey) => setExpandedQuarters(p => ({ ...p, [qKey]: !p[qKey] }));

  const preGroupAll = useCallback((baseRows) => {
    if (groupingRef.current) return;
    groupingRef.current = true;
    groupedCacheRef.current = {};
    setGrouping(true);
    setTimeout(() => {
      groupedCacheRef.current.distributors = groupByField(baseRows, 'distname');
      setTimeout(() => {
        groupedCacheRef.current.catgroup = groupByField(baseRows, 'catgroup');
        setTimeout(() => {
          groupedCacheRef.current.asm = groupByField(baseRows, 'asm');
          setTimeout(() => {
            groupedCacheRef.current.soff = groupByField(baseRows, 'soff');
            groupingRef.current = false;
            setGrouping(false);
          }, 0);
        }, 0);
      }, 0);
    }, 0);
  }, []);

  const fetchData = useCallback(async () => {
    // Read current filter values from refs — avoids auto-refetch when filters change
    const multiyear         = multiyearRef.current;
    const monthwisecompany  = monthwisecompanyRef.current;
    const monthwisedisttype = monthwisedisttypeRef.current;
    const tab = activeTabRef.current;

    // Clear pre-grouped cache — will be rebuilt below
    groupedCacheRef.current = {};

    // Cache hit: non-summary tab with same params → reuse joined data, skip API + spinner
    if (tab !== 'summary') {
      const paramsKey = JSON.stringify({ multiyear, monthwisecompany, monthwisedisttype, employeename });
      if (nonSummaryParamsRef.current === paramsKey && nonSummaryRawRef.current.length > 0) {
        appLog('[CACHE] Non-summary cache hit — reusing joined data');
        setRawRows(nonSummaryRawRef.current);
        preGroupAll(nonSummaryRawRef.current);
        setAppliedMultiyear(multiyear);
        logActivity('Sales', 'Month Wise', TABS.find(t => t.id === tab)?.label || tab, 'generate', { year: String(multiyear), company: monthwisecompany, method: monthwisedisttype });
        return;
      }
    }

    setLoading(true);
    setError(null);
    setExpanded({});
    setExpandedYear({});
    drillDataRef.current = {};
    setDrillData({});
    setDrillLoading({});

    try {
      const baseParams = { multiyear, employeename, monthwisecompany, monthwisedisttype };

      if (tab === 'summary') {
        const data = await getMultiYearSales(baseParams);
        setRawRows(Array.isArray(data) ? data.filter(r => !isGrandTotal(r)) : []);
        setAppliedMultiyear(multiyear);
        logActivity('Sales', 'Month Wise', 'YoY Summary', 'generate', { year: String(multiyear), company: monthwisecompany, method: monthwisedisttype });
      } else {
        // Non-summary tabs: call both APIs in parallel
        // API 12 → lookup table (distname → asm, soff, catgroup, description, method)
        // API 13 → tonnage rows for all selected years
        const selectedYearStr = Array.isArray(multiyear) ? multiyear.join(',') : String(multiyear);
        const multiyearArr    = Array.isArray(multiyear) ? multiyear : String(multiyear).split(',');
        const paramsKey       = JSON.stringify({ multiyear, monthwisecompany, monthwisedisttype, employeename });

        const [distRaw, newRaw] = await Promise.all([
          getMonthwiseFiltersDist({
            selectedyear: selectedYearStr,
            employeename,
            monthwisecompany: monthwisecompany || 'ALL',
            disttype: monthwisedisttype || 'Distribution',
          }),
          getMonthwiseFiltersNew({
            multiyear: multiyearArr,
            employeename,
            monthwisecompany: monthwisecompany || 'ALL',
            monthwisedisttype: monthwisedisttype || 'ALL',
          }),
        ]);

        const lookupList  = Array.isArray(distRaw) ? distRaw : (distRaw?.list  || []);
        const tonnageList = Array.isArray(newRaw)  ? newRaw  : (newRaw?.list   || []);

        appLog('[DEBUG] distRaw:', distRaw);
        appLog('[DEBUG] newRaw:', newRaw);
        appLog('[DEBUG] lookupList length:', lookupList.length);
        appLog('[DEBUG] tonnageList length:', tonnageList.length);

        // Build O(1) lookup map: distname → API 12 metadata row (asm, soff, catgroup etc.)
        const distLookup = {};
        for (const row of lookupList) {
          const key = String(row.distname ?? '').trim();
          if (key && !distLookup[key]) distLookup[key] = row;
        }

        // Join: for each API 13 tonnage row, merge API 12 metadata by distname
        // spread order: match first so tonnage values always win on overlap
        const joined = tonnageList.map(tRow => {
          const match = distLookup[String(tRow.distname ?? '').trim()];
          return match ? { ...match, ...tRow } : tRow;
        });

        appLog('[DEBUG rawRows] fields:', joined.length > 0 ? Object.keys(joined[0]).join(', ') : 'empty');
        appLog('[DEBUG rawRows] row[0]:', joined[0]);
        appLog('[DEBUG] joined sample:', joined.slice(0, 2));

        const filtered = joined.filter(r => !isGrandTotal(r));
        nonSummaryRawRef.current    = filtered;
        nonSummaryParamsRef.current = paramsKey;
        setRawRows(filtered);
        preGroupAll(filtered);
        setAppliedMultiyear(multiyear);
        logActivity('Sales', 'Month Wise', TABS.find(t => t.id === tab)?.label || tab, 'generate', { year: String(multiyear), company: monthwisecompany, method: monthwisedisttype });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
      setError(msg);
      showToast('Error loading data', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [employeename, preGroupAll]); // filter values read from refs; activeTab intentionally excluded

  // Effect 1: fetch when params change (tab is irrelevant to this effect)
  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch when global Sync completes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (syncKey > 0) fetchData(); }, [syncKey]);

  // Effect 2: fetch only when crossing the summary ↔ non-summary boundary
  useEffect(() => {
    const cat = activeTab === 'summary' ? 'summary' : 'non-summary';
    if (prevTabCatRef.current !== null && prevTabCatRef.current !== cat) {
      fetchData();
    }
    prevTabCatRef.current = cat;
  }, [activeTab, fetchData]);

  // Fetch last-updated dates once on mount — never on tab or filter change
  useEffect(() => {
    if (!employeename) return;
    appLog('[INIT] Fetching last updated dates — runs once on mount');
    getLastUpdatedDates(employeename)
      .then(d => setLastUpdate(Array.isArray(d) ? d[0] : d))
      .catch(() => null);
  }, [employeename]);

  const handleExpand = useCallback(async (row, stateKey, level) => {
    const key = stateKey;
    if (drillDataRef.current[key]) { setExpanded(p => ({ ...p, [key]: true })); return; }

    const tab = activeTabRef.current;

    // Non-summary tabs: synchronous client-side drill using rawRowsRef + _filters context
    if (tab !== 'summary') {
      const nextGroupField = FULL_DRILL_AFTER[tab]?.[row._groupField];
      if (!nextGroupField) return;
      const parentFilters  = row._filters || {};
      const af             = activeFiltersRef.current;
      const filtered = rawRowsRef.current.filter(r => {
        if (!Object.entries(parentFilters).every(([f, v]) =>
          String(r[f] ?? '').trim() === String(v ?? '').trim()
        )) return false;
        if (tab === 'distributors' || tab === 'catgroup') {
          if (af.fCatgroup?.length > 0 && !af.fCatgroup.includes(r.catgroup))   return false;
          if (af.fCategory?.length > 0 && !af.fCategory.includes(r.category))   return false;
          if (af.fItemType?.length > 0 && !af.fItemType.includes(r.method))     return false;
          if (af.fItem?.length     > 0 && !af.fItem.includes(r.description))    return false;
          if (af.fDistName?.length > 0 && !af.fDistName.includes(r.distname))   return false;
        }
        if (tab === 'asm') {
          if (af.fAsm?.length      > 0 && !af.fAsm.includes(r.asm))             return false;
          if (af.fAreaName?.length > 0 && !af.fAreaName.includes(r.areaname))   return false;
          if (af.fCatgroup?.length > 0 && !af.fCatgroup.includes(r.catgroup))   return false;
          if (af.fCategory?.length > 0 && !af.fCategory.includes(r.category))   return false;
          if (af.fItem?.length     > 0 && !af.fItem.includes(r.description))    return false;
        }
        if (tab === 'soff') {
          if (af.fAsm?.length      > 0 && !af.fAsm.includes(r.asm))             return false;
          if (af.fSoff?.length     > 0 && !af.fSoff.includes(r.soff))           return false;
          if (af.fDistName?.length > 0 && !af.fDistName.includes(r.distname))   return false;
          if (af.fCatgroup?.length > 0 && !af.fCatgroup.includes(r.catgroup))   return false;
          if (af.fCategory?.length > 0 && !af.fCategory.includes(r.category))   return false;
          if (af.fItem?.length     > 0 && !af.fItem.includes(r.description))    return false;
        }
        return true;
      });
      // Show loading briefly so the spinner appears while groupByField computes
      setDrillLoading(p => ({ ...p, [key]: true }));
      setTimeout(() => {
        const children = groupByField(filtered, nextGroupField, parentFilters);

        // When drilling from a year row (parentFilters has 'year'), the raw rows for
        // year=Y don't carry the prior year's comparison in ttltonnagewy at individual-row
        // level. Fix YOY by cross-referencing year=Y-1 rows from rawRows.
        if (parentFilters.year) {
          const priorYear = String(parseInt(parentFilters.year, 10) - 1);
          const priorFilters = { ...parentFilters, year: priorYear };
          const priorFiltered = rawRowsRef.current.filter(r =>
            Object.entries(priorFilters).every(([f, v]) =>
              String(r[f] ?? '').trim() === String(v ?? '').trim()
            )
          );
          if (priorFiltered.length > 0) {
            const priorGroups = groupByField(priorFiltered, nextGroupField, priorFilters);
            const priorMap = {};
            priorGroups.forEach(r => { priorMap[String(r[nextGroupField] ?? '').trim()] = r; });
            children.forEach(child => {
              const priorRow = priorMap[String(child[nextGroupField] ?? '').trim()];
              if (priorRow) child.ttltonnagewy = parseFloat(priorRow.ttltonnage_crntwy) || 0;
            });
          }
        }

        drillDataRef.current = { ...drillDataRef.current, [key]: children };
        setDrillData(p => ({ ...p, [key]: children }));
        setExpanded(p => ({ ...p, [key]: true }));
        setDrillLoading(p => ({ ...p, [key]: false }));
      }, 0);
      return;
    }

    setDrillLoading(p => ({ ...p, [key]: true }));
    showToast('Loading', 'Fetching sales data...', 'info');
    try {
      const rowId = row.id ?? '';
      const selectedyear = row.year ?? String(multiyear?.[0] ?? '');
      let data;

      if (level === 0) {
        // YoY Summary Level 0 → disttype breakdown
        // Angular getallmaindisttype() routing:
        //   Distribution + SBL/BALAJI → catgroup_for_cat_AR4_SVS.php  (getCatgroupForCategory)
        //   (Distribution + ALL) || (Shops + SBL/BALAJI) → secondleveldispatch_AR1_SVS1.php (getSecondLevelDispatch)
        const isDistAll   = monthwisedisttype === 'Distribution' && monthwisecompany === 'ALL';
        const isShopsSbl  = monthwisedisttype === 'Shops' && (monthwisecompany === 'SBL' || monthwisecompany === 'BALAJI');

        if (isDistAll || isShopsSbl) {
          // API 24: getSecondLevelDispatch
          data = await getSecondLevelDispatch({
            id: `${monthwisedisttype}_${monthwisecompany}`,
            selectedyear,
            monthwisecompany,
            monthwisedisttype,
            employeename,
          });
        } else {
          // Existing: getCatgroupForCategory (Distribution+SBL/BALAJI and other combinations)
          data = await getCatgroupForCategory({
            selectedyear,
            employeename,
            monthwisecompany,
            id: `${monthwisedisttype}_${monthwisecompany}`,
          });
        }
      } else if (level === 1) {
        // Summary Level 1: catgroup/disttype row → next level
        // Angular getsecondlevel() routing:
        //   Distribution + SBL/BALAJI → thirdleveldispatch_vn_AR4_SVS.php (getThirdLevelDispatch)
        //   (Distribution + ALL) || (Shops + SBL/BALAJI) → catgroup_for_cat_AR1_SVS1.php (getCatgroupForCatAR1)
        //   ALL + SBL/BALAJI + disttype='Distribution' → catgroup_for_cat_AR1_SVS1.php (getCatgroupForCatAR1)
        //   ALL + SBL/BALAJI + disttype≠'Distribution' → secondleveldispatch_AR1_SVS1.php (getSecondLevelDispatch)
        //   Shops + ALL or else → secondleveldispatch_AR1_SVS1.php (getSecondLevelDispatch)
        const catgroup    = row.catgroup || '';
        const rowDisttype = row.disttype || catgroup;
        const isDistSbl   = monthwisedisttype === 'Distribution' && (monthwisecompany === 'SBL' || monthwisecompany === 'BALAJI');
        const isDistAll   = monthwisedisttype === 'Distribution' && monthwisecompany === 'ALL';
        const isShopsSbl  = monthwisedisttype === 'Shops' && (monthwisecompany === 'SBL' || monthwisecompany === 'BALAJI');
        const isAllSbl    = monthwisedisttype === 'ALL' && (monthwisecompany === 'SBL' || monthwisecompany === 'BALAJI');
        const isAllSblDist = isAllSbl && rowDisttype === 'Distribution';

        if (isDistSbl) {
          // Existing path — Distribution + SBL/BALAJI
          data = await getThirdLevelDispatch({
            id: `${monthwisedisttype}_${monthwisecompany}_${catgroup}_0_${selectedyear}`,
            distpatchtype: monthwisedisttype,
            disttype: catgroup,
            selectedyear,
            monthwisecompany,
            employeename,
          });
        } else if (isDistAll || isShopsSbl || isAllSblDist) {
          // API 20: getCatgroupForCatAR1 — Angular uses actual row ID, not a constructed string
          data = await getCatgroupForCatAR1({
            id: row.id,
            distpatchtype: monthwisedisttype,
            disttype: rowDisttype,
            selectedyear,
            monthwisecompany,
            employeename,
          });
          // Shops+SBL: getCatgroupForCatAR1 returns distributor rows → stamp distfinf=5 (traffic-light color)
          if (isShopsSbl || isAllSblDist) {
            data = (Array.isArray(data) ? data : []).map(r => ({ ...r, distfinf: 5 }));
          }
        } else {
          // API 24: getSecondLevelDispatch (ALL+SBL/BALAJI+non-Distribution, Shops+ALL, etc.)
          data = await getSecondLevelDispatch({
            id: `${rowDisttype}_${monthwisecompany}`,
            selectedyear,
            monthwisecompany,
            monthwisedisttype,
            employeename,
          });
        }
      } else {
        // Summary Level 2+
        const isShopsSblDeep = monthwisedisttype === 'Shops' && (monthwisecompany === 'SBL' || monthwisecompany === 'BALAJI');
        if (isShopsSblDeep && level === 2) {
          // Shops+SBL L2→L3: distributor row → catgroup rows
          appLog('[SHOPS L2→L3] row.id:', row.id, '| row.distid:', row.distid, '| row.disttype:', row.disttype, '| row.distname:', row.distname);
          const rowYear = row.year || selectedyear;
          const raw = await getFifthLevelDispatch({
            id: row.id,
            dispatchtype: monthwisedisttype,
            selectedyear: rowYear,
            monthwisecompany,
          });
          data = (Array.isArray(raw) ? raw : []).map(r => ({ ...r, distfinf: 3 }));
          // Cross-year patch: getFifthLevelDispatch may return ttltonnagewy=0 — fetch prior year to fill it
          if (data.length > 0 && !data.some(r => (parseFloat(r.ttltonnagewy) || 0) > 0)) {
            const priorYear = String(parseInt(rowYear, 10) - 1);
            const priorId = String(row.id || '').replace(new RegExp(`_${rowYear}$`), `_${priorYear}`);
            try {
              const priorRaw = await getFifthLevelDispatch({ id: priorId, dispatchtype: monthwisedisttype, selectedyear: priorYear, monthwisecompany });
              const priorMap = {};
              (Array.isArray(priorRaw) ? priorRaw : []).forEach(r => {
                const k = String(r.catgroup ?? r.description ?? '').trim();
                if (k) priorMap[k] = r;
              });
              data = data.map(r => {
                const k = String(r.catgroup ?? r.description ?? '').trim();
                const pr = priorMap[k];
                return pr ? { ...r, ttltonnagewy: parseFloat(pr.ttltonnage_crntwy) || 0 } : r;
              });
            } catch { /* keep current data */ }
          }
        } else if (isShopsSblDeep && level === 3) {
          // Shops+SBL L3→L4: catgroup row → item-code rows
          const rowYear = row.year || selectedyear;
          const builtId = `${row.distid || ''}_${row.company || monthwisecompany}_${row.disttype || ''}_${row.catgroup || row.category || ''}_0_${rowYear}`;
          appLog('[SHOPS L3→L4] row.id:', row.id, '| builtId:', builtId, '| row.distid:', row.distid, '| row.catgroup:', row.catgroup, '| row.disttype:', row.disttype);
          const raw = await getSixthLevelDispatch({
            id: builtId,
            dispatchtype: monthwisedisttype,
            selectedyear: rowYear,
            monthwisecompany,
          });
          data = (Array.isArray(raw) ? raw : []).map(r => ({ ...r, distfinf: 1 }));
          // Cross-year patch: getSixthLevelDispatch may return ttltonnagewy=0 — fetch prior year to fill it
          if (data.length > 0 && !data.some(r => (parseFloat(r.ttltonnagewy) || 0) > 0)) {
            const priorYear = String(parseInt(rowYear, 10) - 1);
            const priorBuiltId = `${row.distid || ''}_${row.company || monthwisecompany}_${row.disttype || ''}_${row.catgroup || row.category || ''}_0_${priorYear}`;
            try {
              const priorRaw = await getSixthLevelDispatch({ id: priorBuiltId, dispatchtype: monthwisedisttype, selectedyear: priorYear, monthwisecompany });
              const priorMap = {};
              (Array.isArray(priorRaw) ? priorRaw : []).forEach(r => {
                const k = String(r.description ?? r.catgroup ?? '').trim();
                if (k) priorMap[k] = r;
              });
              data = data.map(r => {
                const k = String(r.description ?? r.catgroup ?? '').trim();
                const pr = priorMap[k];
                return pr ? { ...r, ttltonnagewy: parseFloat(pr.ttltonnage_crntwy) || 0 } : r;
              });
            } catch { /* keep current data */ }
          }
        } else if (isShopsSblDeep && level === 4) {
          // Angular getfourthlevel for Shops — item description rows (leaf, distfinf=1)
          const rowYear = row.year || selectedyear;
          const raw = await getSixthLevelDispatch({
            id: row.id,
            dispatchtype: monthwisedisttype,
            disttype: row.distid || row.disttype,
            selectedyear: rowYear,
            monthwisecompany,
          });
          data = (Array.isArray(raw) ? raw : []).map(r => ({ ...r, distfinf: 1 }));
          // Cross-year patch for leaf item rows
          if (data.length > 0 && !data.some(r => (parseFloat(r.ttltonnagewy) || 0) > 0)) {
            const priorYear = String(parseInt(rowYear, 10) - 1);
            const priorId = String(row.id || '').replace(new RegExp(`_${rowYear}$`), `_${priorYear}`);
            try {
              const priorRaw = await getSixthLevelDispatch({ id: priorId, dispatchtype: monthwisedisttype, disttype: row.distid || row.disttype, selectedyear: priorYear, monthwisecompany });
              const priorMap = {};
              (Array.isArray(priorRaw) ? priorRaw : []).forEach(r => {
                const k = String(r.description ?? r.catgroup ?? '').trim();
                if (k) priorMap[k] = r;
              });
              data = data.map(r => {
                const k = String(r.description ?? r.catgroup ?? '').trim();
                const pr = priorMap[k];
                return pr ? { ...r, ttltonnagewy: parseFloat(pr.ttltonnage_crntwy) || 0 } : r;
              });
            } catch { /* keep current data */ }
          }
        } else {
          const categoryVal = row.category || '';
          const distnameVal = row.distname  || '';
          const deepLabel   = level === 2 ? categoryVal : (distnameVal || categoryVal);
          data = await getFourthLevelDispatch({
            id: `${monthwisedisttype}_${monthwisecompany}_${deepLabel}_0_${selectedyear}`,
            dispatchtype: monthwisedisttype,
            disttype: deepLabel,
            selectedyear,
            monthwisecompany,
            employeename,
          });
        }
      }

      const list = (Array.isArray(data) ? data : []).filter(r => !isGrandTotal(r));
      if (list.length === 0) {
        setExpanded(p => ({ ...p, [key]: false }));
        showToast('No Data', `No data available for "${getLabel(row, level)}"`, 'info');
        return;
      }
      drillDataRef.current = { ...drillDataRef.current, [key]: list };
      setDrillData(p => ({ ...p, [key]: list }));
      setExpanded(p => ({ ...p, [key]: true }));
      showToast('Success', 'Data loaded successfully!', 'success');
    } catch {
      setExpanded(p => ({ ...p, [key]: false }));
      showToast('Error', 'Failed to load data.', 'error');
    } finally {
      setDrillLoading(p => ({ ...p, [key]: false }));
    }
  }, [monthwisecompany, monthwisedisttype, employeename, multiyear, getLabel]);

  const handleCollapse = useCallback((stateKey) => {
    // Cascade-collapse: close this row AND all descendants.
    // Child keys always begin with `${stateKey}__` (double-underscore separator).
    const prefix = stateKey + '__';
    setExpanded(prev => {
      const next = { ...prev };
      next[stateKey] = false;
      Object.keys(next).forEach(k => { if (k.startsWith(prefix)) next[k] = false; });
      return next;
    });
  }, []);

  const handleYearExpand = useCallback((row, stateKey) => {
    const yearKey = `year__${stateKey}`;
    if (drillDataRef.current[yearKey]) { setExpandedYear(p => ({ ...p, [stateKey]: true })); return; }
    const parentFilters = row._filters || {};
    const tab = activeTabRef.current;
    const af  = activeFiltersRef.current;
    const filtered = rawRowsRef.current.filter(r => {
      if (!Object.entries(parentFilters).every(([f, v]) =>
        String(r[f] ?? '').trim() === String(v ?? '').trim()
      )) return false;
      if (tab === 'distributors' || tab === 'catgroup') {
        if (af.fCatgroup?.length > 0 && !af.fCatgroup.includes(r.catgroup))   return false;
        if (af.fCategory?.length > 0 && !af.fCategory.includes(r.category))   return false;
        if (af.fItemType?.length > 0 && !af.fItemType.includes(r.method))     return false;
        if (af.fItem?.length     > 0 && !af.fItem.includes(r.description))    return false;
        if (af.fDistName?.length > 0 && !af.fDistName.includes(r.distname))   return false;
      }
      if (tab === 'asm') {
        if (af.fAsm?.length      > 0 && !af.fAsm.includes(r.asm))             return false;
        if (af.fAreaName?.length > 0 && !af.fAreaName.includes(r.areaname))   return false;
        if (af.fCatgroup?.length > 0 && !af.fCatgroup.includes(r.catgroup))   return false;
        if (af.fCategory?.length > 0 && !af.fCategory.includes(r.category))   return false;
        if (af.fItem?.length     > 0 && !af.fItem.includes(r.description))    return false;
      }
      if (tab === 'soff') {
        if (af.fAsm?.length      > 0 && !af.fAsm.includes(r.asm))             return false;
        if (af.fSoff?.length     > 0 && !af.fSoff.includes(r.soff))           return false;
        if (af.fDistName?.length > 0 && !af.fDistName.includes(r.distname))   return false;
        if (af.fCatgroup?.length > 0 && !af.fCatgroup.includes(r.catgroup))   return false;
        if (af.fCategory?.length > 0 && !af.fCategory.includes(r.category))   return false;
        if (af.fItem?.length     > 0 && !af.fItem.includes(r.description))    return false;
      }
      return true;
    });
    const selectedYears = new Set(
      (Array.isArray(multiyearRef.current) ? multiyearRef.current : String(multiyearRef.current).split(','))
        .map(y => String(y).trim())
    );
    const yearRows = groupByField(filtered, 'year', parentFilters)
      .filter(r => selectedYears.has(String(r.year).trim()));
    drillDataRef.current = { ...drillDataRef.current, [yearKey]: yearRows };
    setDrillData(p => ({ ...p, [yearKey]: yearRows }));
    setExpandedYear(p => ({ ...p, [stateKey]: true }));
  }, []);

  const handleYearCollapse = useCallback((stateKey) => {
    setExpandedYear(p => ({ ...p, [stateKey]: false }));
  }, []);

  // Auto-switch to first visible tab if active tab becomes hidden by role/method change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ids = visibleTabs.map(t => t.id);
    if (!ids.includes(activeTab)) {
      setActiveTab(ids[0] || 'summary');
      setExpanded({});
      setDrillData({});
      setExpandedYear({});
    }
  }, [visibleTabs]); // activeTab read from closure; omitting it prevents double-fire loop

  // Auto-reset method to Distribution when switching to ASM or Soff tab
  // (Shops has no data for these tabs)
  useEffect(() => {
    if (activeTab === 'asm' || activeTab === 'soff') {
      if (monthwisedisttype === 'Shops') {
        setMonthwiseDisttype('Distribution');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const lastUpdateDate = lastUpdate ? fmtDate(lastUpdate.dispatchlastupdate) : null;

  // Propagate last update date to parent (SalesDashboard tab bar)
  useEffect(() => { onLastUpdateChange?.(lastUpdateDate); }, [lastUpdateDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDrillLoading = Object.values(drillLoading).some(Boolean);

  // Filter option arrays — cascading: each dropdown only shows values valid given upstream selections
  const optCatgroups  = useMemo(() => [...new Set(rawRows.map(r => r.catgroup).filter(Boolean))].sort(), [rawRows]);
  const optCategories = useMemo(() => {
    const base = fCatgroup.length > 0 ? rawRows.filter(r => fCatgroup.includes(r.catgroup)) : rawRows;
    return [...new Set(base.map(r => r.category).filter(Boolean))].sort();
  }, [rawRows, fCatgroup]);
  const optItemTypes  = useMemo(() => {
    let base = rawRows;
    if (fCatgroup.length > 0) base = base.filter(r => fCatgroup.includes(r.catgroup));
    if (fCategory.length > 0) base = base.filter(r => fCategory.includes(r.category));
    return [...new Set(base.map(r => r.method).filter(Boolean))].sort();
  }, [rawRows, fCatgroup, fCategory]);
  const optItems      = useMemo(() => {
    let base = rawRows;
    if (fCatgroup.length > 0) base = base.filter(r => fCatgroup.includes(r.catgroup));
    if (fCategory.length > 0) base = base.filter(r => fCategory.includes(r.category));
    if (fItemType.length > 0) base = base.filter(r => fItemType.includes(r.method));
    return [...new Set(base.map(r => r.description).filter(Boolean))].sort();
  }, [rawRows, fCatgroup, fCategory, fItemType]);
  const optDistNames  = useMemo(() => [...new Set(rawRows.map(r => r.distname).filter(Boolean))].sort(), [rawRows]);
  const optAsms       = useMemo(() => [...new Set(rawRows.map(r => r.asm).filter(Boolean))].sort(), [rawRows]);
  const optAreaNames  = useMemo(() => {
    const base = fAsm.length > 0 ? rawRows.filter(r => fAsm.includes(r.asm)) : rawRows;
    return [...new Set(base.map(r => r.areaname).filter(Boolean))].sort();
  }, [rawRows, fAsm]);
  const optSoffs      = useMemo(() => [...new Set(rawRows.map(r => r.soff).filter(Boolean))].sort(), [rawRows]);

  // Cascade handlers — clear downstream selections when an upstream filter changes
  const handleCatgroupChange = useCallback((val) => { setFCatgroup(val); setFCategory([]); setFItemType([]); setFItem([]); }, []);
  const handleCategoryChange = useCallback((val) => { setFCategory(val); setFItemType([]); setFItem([]); }, []);
  const handleItemTypeChange = useCallback((val) => { setFItemType(val); setFItem([]); }, []);
  const handleAsmChange      = useCallback((val) => { setFAsm(val); setFAreaName([]); }, []);

  // Filter rawRows FIRST, then group — mirrors Angular's datafilter_new() on the raw response
  // Fast path: if no filters are active and the pre-grouped cache is ready, return it directly (O(1) lookup).
  // Slow path: filter rawRows then re-group (only when user has active filter selections).
  const displayRows = useMemo(() => {
    if (activeTab === 'summary') {
      const selectedYearSet = new Set(
        (Array.isArray(appliedMultiyear) ? appliedMultiyear : [appliedMultiyear]).map(y => String(y))
      );
      return rawRows.filter(r => selectedYearSet.has(String(r.year)));
    }

    const hasFilters =
      fDistName.length > 0 || fCatgroup.length > 0 || fCategory.length > 0 ||
      fItemType.length > 0 || fItem.length > 0 ||
      fAsm.length > 0 || fAreaName.length > 0 || fSoff.length > 0;

    if (!hasFilters && groupedCacheRef.current[activeTab]) {
      return groupedCacheRef.current[activeTab];
    }

    let f = rawRows;
    if (activeTab === 'distributors') {
      if (fDistName.length > 0) f = f.filter(r => fDistName.includes(r.distname));
      if (fCatgroup.length > 0) f = f.filter(r => fCatgroup.includes(r.catgroup));
      if (fCategory.length > 0) f = f.filter(r => fCategory.includes(r.category));
      if (fItemType.length > 0) f = f.filter(r => fItemType.includes(r.method));
      if (fItem.length > 0)     f = f.filter(r => fItem.includes(r.description));
      return groupByField(f, 'distname');
    }
    if (activeTab === 'catgroup') {
      if (fCatgroup.length > 0) f = f.filter(r => fCatgroup.includes(r.catgroup));
      if (fCategory.length > 0) f = f.filter(r => fCategory.includes(r.category));
      if (fItemType.length > 0) f = f.filter(r => fItemType.includes(r.method));
      if (fItem.length > 0)     f = f.filter(r => fItem.includes(r.description));
      if (fDistName.length > 0) f = f.filter(r => fDistName.includes(r.distname));
      return groupByField(f, 'catgroup');
    }
    if (activeTab === 'asm') {
      if (fAsm.length > 0)      f = f.filter(r => fAsm.includes(r.asm));
      if (fAreaName.length > 0) f = f.filter(r => fAreaName.includes(r.areaname));
      if (fCatgroup.length > 0) f = f.filter(r => fCatgroup.includes(r.catgroup));
      if (fCategory.length > 0) f = f.filter(r => fCategory.includes(r.category));
      if (fItem.length > 0)     f = f.filter(r => fItem.includes(r.description));
      return groupByField(f, 'asm');
    }
    if (activeTab === 'soff') {
      if (fAsm.length > 0)      f = f.filter(r => fAsm.includes(r.asm));
      if (fSoff.length > 0)     f = f.filter(r => fSoff.includes(r.soff));
      if (fDistName.length > 0) f = f.filter(r => fDistName.includes(r.distname));
      if (fCatgroup.length > 0) f = f.filter(r => fCatgroup.includes(r.catgroup));
      if (fCategory.length > 0) f = f.filter(r => fCategory.includes(r.category));
      if (fItem.length > 0)     f = f.filter(r => fItem.includes(r.description));
      return groupByField(f, 'soff');
    }
    return rawRows;
  // groupedCacheRef is a ref — intentionally excluded from deps. Cache populated via setTimeout after fetch;
  // re-render on tab switch reads it naturally since activeTab is in deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRows, activeTab, appliedMultiyear, fCatgroup, fCategory, fItemType, fItem, fDistName, fAsm, fAreaName, fSoff]);

  // ── Table virtualization ───────────────────────────────────────────────────────
  const ROW_HEIGHT = 52; // px — accounts for potential 2-line wrapped names
  const tableWrapRef  = useRef(null);
  const scrollTopRef  = useRef(0);
  const rafRef        = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 60 });

  // RAF-debounced scroll handler: batches to one update per animation frame;
  // equality check prevents re-renders when start/end haven't changed.
  const handleScroll = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const scrollTop = e.currentTarget.scrollTop;
    const clientH   = e.currentTarget.clientHeight;
    scrollTopRef.current = scrollTop;
    rafRef.current = requestAnimationFrame(() => {
      const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 10);
      const end   = Math.min(displayRows.length, Math.ceil((scrollTop + clientH) / ROW_HEIGHT) + 10);
      setVisibleRange(prev =>
        prev.start === start && prev.end === end ? prev : { start, end }
      );
    });
  }, [displayRows.length]);

  // Reset scroll and visible range when tab changes or data refreshes
  useEffect(() => {
    setVisibleRange({ start: 0, end: 60 });
    scrollTopRef.current = 0;
    if (tableWrapRef.current) tableWrapRef.current.scrollTop = 0;
  }, [activeTab, displayRows.length]);
  // ──────────────────────────────────────────────────────────────────────────────

  const nameColWidth = NAME_COL_WIDTH[activeTab] ?? 160;

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

        <FilterBar mode="monthwise" onApply={fetchData} isLoading={loading} lastUpdateDate={lastUpdateDate} activeReportTab={activeTab} />

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
          {visibleTabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setExpanded({}); setDrillData({}); setExpandedYear({}); setFCatgroup([]); setFCategory([]); setFItemType([]); setFItem([]); setFDistName([]); setFAsm([]); setFAreaName([]); setFSoff([]); if (t.id !== 'summary') logActivity('Sales', 'Month Wise', t.label, 'view', { year: String(multiyear), company: monthwisecompany, method: monthwisedisttype }); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? accent : mutedClr,
                borderBottom: activeTab === t.id ? `2px solid ${accent}` : '2px solid transparent',
                marginBottom: -2, fontFamily: 'inherit', transition: 'color 0.15s',
              }}
            >
              <i className={`bi ${t.icon}`} style={{ marginRight: 5, fontSize: '0.78rem' }} />
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Tab-specific filter rows — options derived from rawRows unique values */}
        {activeTab === 'distributors' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="Distributor"    value={fDistName}  onChange={setFDistName}          options={optDistNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category Group" value={fCatgroup}  onChange={handleCatgroupChange}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory}  onChange={handleCategoryChange}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item Type"      value={fItemType}  onChange={handleItemTypeChange}  options={optItemTypes}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}      onChange={setFItem}              options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
          </div>
        )}

        {activeTab === 'catgroup' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="Category Group" value={fCatgroup}  onChange={handleCatgroupChange}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory}  onChange={handleCategoryChange}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item Type"      value={fItemType}  onChange={handleItemTypeChange}  options={optItemTypes}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}      onChange={setFItem}              options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Distributor"    value={fDistName}  onChange={setFDistName}          options={optDistNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
          </div>
        )}

        {activeTab === 'asm' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="ASM Name"       value={fAsm}       onChange={handleAsmChange}       options={optAsms}       styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Area Name"      value={fAreaName}  onChange={setFAreaName}          options={optAreaNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category Group" value={fCatgroup}  onChange={handleCatgroupChange}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory}  onChange={handleCategoryChange}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}      onChange={setFItem}              options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
          </div>
        )}

        {activeTab === 'soff' && (
          <div className="sr-tab-filter-row">
            <TabFilter label="ASM Name"       value={fAsm}      onChange={handleAsmChange}       options={optAsms}       styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Sales Officer"  value={fSoff}     onChange={setFSoff}              options={optSoffs}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Distributor"    value={fDistName} onChange={setFDistName}          options={optDistNames}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category Group" value={fCatgroup} onChange={handleCatgroupChange}  options={optCatgroups}  styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Category"       value={fCategory} onChange={handleCategoryChange}  options={optCategories} styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
            <TabFilter label="Item"           value={fItem}     onChange={setFItem}              options={optItems}      styles={tabSelStyles} isDarkMode={isDarkMode} accent={accent} />
          </div>
        )}
      </div>
      {/* ── End contained section — table card below has no overflow:hidden ancestor ── */}

      {loading && (
        <SrLoader accent={accent} isDarkMode={isDarkMode} text="Generating Report" />
      )}

      {/* Color legend — only for tabs with traffic-light row colors */}
      {activeTab !== 'summary' && (
        <ColorLegend accent={accent} isDarkMode={isDarkMode} />
      )}

      {/* Table card — animates in, re-animates on tab change */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{ background: cardBg, borderRadius: 14, boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: `1px solid ${borderClr}`, width: '100%', marginTop: '0.75rem', position: 'relative' }}
      >
        {grouping && !loading && (
          <div style={{ position: 'absolute', top: 8, right: 16, zIndex: 20, fontSize: '0.72rem', color: accent, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
            <i className="bi bi-arrow-clockwise sr-spin" />
            Pre-loading tab data...
          </div>
        )}

        {isDrillLoading && <SrLoader accent={accent} isDarkMode={isDarkMode} text="Loading..." />}
        <div ref={tableWrapRef} className="sr-table-wrap" style={{ maxHeight: '65vh', borderRadius: 14 }} onScroll={handleScroll}
          onMouseMove={(e) => { if (tooltip && !e.target.closest('[data-ctt]')) setTooltip(null); }}
          onMouseLeave={() => setTooltip(null)}
        >
          <table className="sr-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: headerMain, color: 'white' }}>
                <th className="sr-th" style={{ position: 'sticky', left: 0, background: headerMain, width: 50, minWidth: 50, zIndex: 11, padding: '0.55rem 0.2rem' }} />
                <th className="sr-th" style={{ position: 'sticky', left: 50, background: headerMain, minWidth: nameColWidth, textAlign: 'left', zIndex: 11, whiteSpace: 'normal', verticalAlign: 'middle' }}>
                  {FIRST_COL_LABEL[activeTab] || 'Name'}
                </th>
                {GROUPS.flatMap(g => [
                  ...(expandedQuarters[g.qKey] ? g.months.map(m => (
                    <th key={m.key} className="sr-th" style={{ background: headerMain }}>{m.label}</th>
                  )) : []),
                  <th key={g.qKey}
                    className="sr-th" style={{ background: headerQ, minWidth: 70, cursor: 'pointer', userSelect: 'none', textAlign: 'center', verticalAlign: 'middle' }}
                    onClick={() => toggleQuarter(g.qKey)}
                  >
                    <Tooltip content={expandedQuarters[g.qKey] ? 'Collapse months' : 'Expand months'}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span>{expandedQuarters[g.qKey] ? '▼' : '▶'}</span>
                        <span>{g.qLabel}</span>
                      </div>
                    </Tooltip>
                  </th>,
                ])}
                {showTillLast && <th className="sr-th" style={{ background: headerDark, minWidth: 70 }}><Tooltip content="Cumulative tonnage up to (but not including) the current month"><span>Till Last<br />Month</span></Tooltip></th>}
                <th className="sr-th" style={{ background: headerDark, minWidth: 70 }}><Tooltip content="Current month's dispatched tonnage"><span>Current<br />tonnage</span></Tooltip></th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}><Tooltip content="Year-to-Date: total tonnage from start of year to current month"><span>Total<br />(YTD)</span></Tooltip></th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}><Tooltip content="Year-to-Date Growth / Degrowth vs previous year's YTD"><span>YTD Gr/<br />Degr</span></Tooltip></th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 60 }}><Tooltip content="Current month % change vs same month last year"><span>YTD<br />%</span></Tooltip></th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}><Tooltip content="Year-on-Year: full financial year comparable tonnage"><span>Total<br />(YOY)</span></Tooltip></th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 75 }}><Tooltip content="Year-on-Year Growth / Degrowth vs previous year's full year"><span>YOY Gr/<br />Degr</span></Tooltip></th>
                <th className="sr-th" style={{ background: headerDark, minWidth: 60 }}><Tooltip content="Year-on-Year percentage change"><span>YOY<br />%</span></Tooltip></th>
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
                  <td colSpan={TOTAL_COLS} style={{ textAlign: 'center', padding: '3rem', color: mutedClr, background: cardBg }}>
                    <i className="bi bi-inbox" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.4rem', opacity: 0.45 }} />
                    No data for the selected filters
                  </td>
                </tr>
              ) : (() => {
                // Disable virtualization when rows are drilled open (expanded rows add height the spacer doesn't account for)
                const hasOpenDrills = Object.keys(expanded).length > 0 || Object.keys(expandedYear).length > 0;
                const sliceStart = hasOpenDrills ? 0 : visibleRange.start;
                const sliceEnd   = hasOpenDrills ? displayRows.length : visibleRange.end;
                const slicedRows = displayRows.slice(sliceStart, sliceEnd);
                return (
                  <>
                    {/* Top spacer — maintains scroll height for rows above viewport */}
                    {sliceStart > 0 && (
                      <tr style={{ height: sliceStart * ROW_HEIGHT }}><td colSpan={TOTAL_COLS} /></tr>
                    )}
                    <DrillRows
                      rows={slicedRows} level={0} parentRows={displayRows}
                      expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast}
                      monthwisecompany={monthwisecompany} monthwisedisttype={monthwisedisttype} employeename={employeename}
                      tab={activeTab}
                      expanded={expanded} drillData={drillData} drillLoading={drillLoading}
                      onExpand={handleExpand} onCollapse={handleCollapse}
                      expandedYear={expandedYear} onYearExpand={handleYearExpand} onYearCollapse={handleYearCollapse}
                      yearRowsEnabled={!isSummary && (Array.isArray(multiyear) ? multiyear.length : 1) > 1}
                      getLabel={getLabel} l0Bg={L0_BG[activeTab] ?? '#fffde7'}
                      isDarkMode={isDarkMode} accent={accent} nameColWidth={nameColWidth}
                      allSummaryRows={isSummary ? rawRows : undefined}
                      isMultiYear={(Array.isArray(multiyear) ? multiyear.length : 1) > 1}
                    />
                    {/* Bottom spacer — maintains scroll height for rows below viewport */}
                    {sliceEnd < displayRows.length && (
                      <tr style={{ height: (displayRows.length - sliceEnd) * ROW_HEIGHT }}><td colSpan={TOTAL_COLS} /></tr>
                    )}
                    {/* Grand Total always rendered — outside the virtual slice */}
                    {displayRows.length > 1 && (
                      <GrandTotalRow rows={displayRows} expandedQuarters={expandedQuarters} isSummary={isSummary} showTillLast={showTillLast} accent={accent} nameColWidth={nameColWidth} allSummaryRows={isSummary ? rawRows : undefined} />
                    )}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>

        {!loading && displayRows.length > 0 && (
          <div style={{ padding: '0.5rem 1rem', borderTop: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, fontSize: '0.72rem', color: '#94a3b8' }}>
            {displayRows.length} row{displayRows.length > 1 ? 's' : ''} · Click ▶/▼ on Q headers to expand months · Click ▼ on rows to drill down
          </div>
        )}
      </motion.div>

      {/* Single page-level tooltip — shared by all CellTooltip instances */}
      {tooltip && (() => {
        const left = tooltip.x + 14 > window.innerWidth - 260 ? tooltip.x - 270 : tooltip.x + 14;
        const top  = Math.min(tooltip.y - 12, window.innerHeight - 160);
        return (
          <div className="sr-tooltip-card" style={{ position: 'fixed', left, top, zIndex: 99999, pointerEvents: 'none', background: isDarkMode ? '#1e293b' : '#ffffff', '--tt-accent': accent }}>
            {tooltip.title && <div className="sr-tooltip-header" style={{ background: accent }}>{tooltip.title}</div>}
            <div className="sr-tooltip-body">
              {(tooltip.thisYear !== undefined || tooltip.lastYear !== undefined) && (
                <div className="sr-tooltip-compare">
                  {tooltip.thisYear !== undefined && (
                    <div className="sr-tooltip-year">
                      <span className="sr-tooltip-label" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>This Year</span>
                      <span className="sr-tooltip-val" style={{ color: '#22c55e' }}>{tooltip.thisYear}{tooltip.unit || ''}</span>
                    </div>
                  )}
                  {tooltip.lastYear !== undefined && (
                    <div className="sr-tooltip-year">
                      <span className="sr-tooltip-label" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>Last Year</span>
                      <span className="sr-tooltip-val" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>{tooltip.lastYear}{tooltip.unit || ''}</span>
                    </div>
                  )}
                </div>
              )}
              {tooltip.formula && <div className="sr-tooltip-formula" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>{tooltip.formula}</div>}
            </div>
          </div>
        );
      })()}

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
        isMulti
        options={options.map(o => ({ value: o, label: o }))}
        value={value.map(v => ({ value: v, label: v }))}
        onChange={selected => onChange(selected ? selected.map(s => s.value) : [])}
        placeholder="All"
        styles={styles}
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        accentColor={accent}
        components={{ Option: CheckboxOption }}
      />
    </div>
  );
}

