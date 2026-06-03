import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ThemedTooltip from '../../../components/ui/Tooltip';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  PieChart, Pie, Legend, ResponsiveContainer,
} from 'recharts';
import Select from 'react-select';
import './Sales.css';
import { useSalesSelectStyles } from './filters/useSalesSelectStyles';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import {
  getGraphMonthwise,
  getGraphCatgroup,
  getGraphCategoryWithCode,
  getGraphSellingDataByCategory,
  getGraphSellingData,
  getGraphSellingDataByItem,
} from '../../../services/salesDashboardApi';

function getChartColors(accent, accent2) {
  return [
    accent, accent2,
    '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#6366f1', '#14b8a6',
    '#f97316', '#a855f7',
  ];
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_KEYS   = ['jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
                      'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage'];
const Q_KEYS = [
  ['jantonnage','febtonnage','martonnage'],
  ['aprtonnage','maytonnage','juntonnage'],
  ['jultonnage','augtonnage','septonnage'],
  ['octtonnage','novtonnage','dectonnage'],
];

const scrollTo = (id) => {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
};

function ZoomModal({ chart, onClose }) {
  const { isDarkMode } = useColorMode();
  const bg      = isDarkMode ? '#1e293b' : 'white';
  const titleClr = isDarkMode ? '#e2e8f0' : '#1e293b';
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: bg, borderRadius: 12, padding: 24, width: '88vw', maxWidth: 1100, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: titleClr }}>{chart.title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>✕</button>
        </div>
        {chart.content}
      </div>
    </div>
  );
}

function ChartCard({ title, onZoom, children, style = {} }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent    = selectedAccent?.primary || '#1a237e';
  const cardBg    = isDarkMode ? '#1e293b' : 'white';
  const borderClr = isDarkMode ? '#334155' : '#e2e8f0';
  const titleClr  = isDarkMode ? '#e2e8f0' : '#1e293b';
  const headerBg  = isDarkMode ? 'rgba(0,0,0,0.22)' : '#f8fafc';
  return (
    <div style={{ flex: 1, background: cardBg, borderRadius: 12, border: `1px solid ${borderClr}`, overflow: 'visible', boxShadow: '0 2px 10px rgba(37,99,235,0.07)', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 1rem', borderBottom: `1px solid ${borderClr}`, background: headerBg, borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: titleClr, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{title}</span>
        <ThemedTooltip content="Expand">
          <button onClick={onZoom} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>⛶</button>
        </ThemedTooltip>
      </div>
      <div style={{ padding: '0.8rem 1rem' }}>{children}</div>
    </div>
  );
}

const InsidePieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const VIEW_OPTIONS = [
  { value: 'Year',      label: 'Year (monthly)' },
  { value: 'Quarterly', label: 'Quarterly' },
];
const YR_FILTER_OPTIONS = [
  { value: '-Select-',  label: '-Select-' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
];

// BarChartCard — onBarClick fires with the bar's label string
function BarChartCard({ title, data, viewMode, onViewModeChange, onZoom,
  isMultiYear, yrFilterMode, yrFilterSub, yrSubOptions, onYrModeChange, onYrSubChange, onBarClick }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const axisClr  = isDarkMode ? '#94a3b8' : '#64748b';
  const gridClr  = isDarkMode ? '#334155' : '#f1f5f9';
  const labelFill = isDarkMode ? '#94a3b8' : '#475569';
  const selStyles = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6, minWidth: 130 });
  const yrSubSelOpts = (yrSubOptions || []).map(v => ({ value: v, label: v }));

  const topLabel = ({ x, y, width, value }) => {
    if (!value) return null;
    return <text x={x + width / 2} y={y - 4} fill={labelFill} textAnchor="middle" fontSize={10} fontWeight={600}>{value}</text>;
  };

  const tooltipStyle = {
    contentStyle: { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#e2e8f0' : '#1e293b' },
    itemStyle:    { color: isDarkMode ? '#e2e8f0' : '#1e293b' },
    labelStyle:   { color: isDarkMode ? '#e2e8f0' : '#1e293b' },
  };

  const chart = (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 22, right: 10, left: 0, bottom: 0 }}
        onClick={onBarClick ? (d) => { const lbl = d?.activeLabel || d?.activePayload?.[0]?.payload?.name; if (lbl) onBarClick(lbl); } : undefined}
        style={{ cursor: onBarClick ? 'pointer' : 'default' }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisClr }} />
        <YAxis tick={{ fontSize: 10, fill: axisClr }} />
        <Tooltip formatter={(v) => [`${v} T`, 'Tonnage']} {...tooltipStyle} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive animationDuration={600}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          <LabelList dataKey="value" content={topLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {isMultiYear ? (
          <>
            <Select
              options={YR_FILTER_OPTIONS}
              value={YR_FILTER_OPTIONS.find(o => o.value === yrFilterMode) || YR_FILTER_OPTIONS[0]}
              onChange={sel => { onYrModeChange(sel.value); onYrSubChange('-Select-'); }}
              styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
            <Select
              options={yrSubSelOpts}
              value={yrSubSelOpts.find(o => o.value === yrFilterSub) || yrSubSelOpts[0]}
              onChange={sel => onYrSubChange(sel.value)}
              isDisabled={yrSubSelOpts.length <= 1}
              styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
          </>
        ) : (
          <Select
            options={VIEW_OPTIONS}
            value={VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0]}
            onChange={sel => onViewModeChange(sel.value)}
            styles={selStyles} isSearchable={false}
            menuPortalTarget={document.body} menuPosition="fixed"
          />
        )}
      </div>
      {chart}
    </ChartCard>
  );
}

// PieChartCard — hides viewMode dropdown in multi-year mode
function PieChartCard({ title, data, viewMode, onViewModeChange, onZoom, onPieClick, isMultiYear }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const selStyles  = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6, minWidth: 130 });
  const legendClr  = isDarkMode ? '#94a3b8' : '#475569';
  const nonZero    = data.filter(d => d.value > 0);
  const total      = nonZero.reduce((s, d) => s + d.value, 0);
  const tooltipStyle = {
    contentStyle: { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#e2e8f0' : '#1e293b' },
    itemStyle:    { color: isDarkMode ? '#e2e8f0' : '#1e293b' },
  };
  const chart = (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <Pie data={nonZero} cx="50%" cy="45%" outerRadius={95}
          labelLine={false} label={InsidePieLabel} dataKey="value"
          onClick={onPieClick ? (entry) => onPieClick(entry.name) : undefined}
          style={{ cursor: onPieClick ? 'pointer' : 'default' }}
          isAnimationActive animationDuration={700}>
          {nonZero.map((d) => {
            const origIdx = data.indexOf(d);
            return <Cell key={d.name} fill={colors[origIdx % colors.length]} />;
          })}
        </Pie>
        <Tooltip formatter={(v) => [`${v} T`, 'Tonnage']} {...tooltipStyle} />
        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={9}
          wrapperStyle={{ fontSize: '0.67rem', paddingTop: 8, maxWidth: '100%', lineHeight: '18px', color: legendClr }}
          formatter={(value, entry) => {
            const item = nonZero.find(d => d.name === entry.payload?.name);
            const pct  = item && total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return `${value} (${pct}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        {!isMultiYear && (
          <Select options={VIEW_OPTIONS}
            value={VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0]}
            onChange={sel => onViewModeChange(sel.value)}
            styles={selStyles} isSearchable={false}
            menuPortalTarget={document.body} menuPosition="fixed"
          />
        )}
      </div>
      {chart}
    </ChartCard>
  );
}

function DrillPieCard({ title, data, onSliceClick, onZoom }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const legendClr = isDarkMode ? '#94a3b8' : '#475569';
  const total = data.reduce((s, r) => s + r.value, 0);
  const tooltipStyle = {
    contentStyle: { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#e2e8f0' : '#1e293b' },
    itemStyle:    { color: isDarkMode ? '#e2e8f0' : '#1e293b' },
  };
  const chart = (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart margin={{ top: 10, right: 30, bottom: 60, left: 30 }}>
        <Pie data={data} cx="50%" cy="46%" outerRadius={80}
          labelLine={false} label={InsidePieLabel} dataKey="value"
          onClick={(entry) => onSliceClick && onSliceClick(entry.name)}
          style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
          isAnimationActive animationDuration={700}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie>
        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={9}
          wrapperStyle={{ fontSize: '0.66rem', paddingTop: 8, maxWidth: '100%', lineHeight: '18px', color: legendClr }}
          formatter={(value, entry) => `${value}: ${Math.round(entry.payload.value)} (${total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0}%)`}
        />
        <Tooltip formatter={(v) => [`${v} T (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, 'Tonnage']} {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)} style={{ flex: 1 }}>
      {data.length === 0
        ? <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No data</div>
        : chart}
    </ChartCard>
  );
}

function HBarCard({ title, data, onBarClick, onZoom }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const axisClr  = isDarkMode ? '#94a3b8' : '#64748b';
  const textClr  = isDarkMode ? '#e2e8f0' : '#1e293b';
  const gridClr  = isDarkMode ? '#334155' : '#f1f5f9';
  const labelClr = isDarkMode ? '#94a3b8' : '#475569';
  const total    = data.reduce((s, r) => s + r.value, 0);
  const tooltipStyle = {
    contentStyle: { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#e2e8f0' : '#1e293b' },
    itemStyle:    { color: isDarkMode ? '#e2e8f0' : '#1e293b' },
  };
  const hbarLabel = ({ x, y, width, height, value }) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
    return (
      <text x={x + width + 6} y={y + height / 2} fill={labelClr} dominantBaseline="central" fontSize={9}>
        {value} ({pct}%)
      </text>
    );
  };
  const barH = Math.max(200, data.length * 40 + 40);
  const chart = (
    <ResponsiveContainer width="100%" height={barH}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 130, left: 10, bottom: 0 }}
        onClick={onBarClick ? (d) => { const p = d?.activePayload?.[0]?.payload; if (p) onBarClick(p); } : undefined}
        style={{ cursor: onBarClick ? 'pointer' : 'default' }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridClr} />
        <XAxis type="number" tick={{ fontSize: 10, fill: axisClr }} />
        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: textClr, fontWeight: 500 }} />
        <Tooltip formatter={(v) => [`${v} T (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, 'Tonnage']} {...tooltipStyle} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive animationDuration={600}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          <LabelList dataKey="value" content={hbarLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)} style={{ flex: 1 }}>
      {chart}
    </ChartCard>
  );
}

function MirroredHBarCard({ title, data, onZoom }) {
  const { isDarkMode } = useColorMode();
  const axisClr = isDarkMode ? '#94a3b8' : '#64748b';
  const textClr = isDarkMode ? '#e2e8f0' : '#1e293b';
  const gridClr = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipStyle = {
    contentStyle: { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#e2e8f0' : '#1e293b' },
  };
  const chartData = data.map(r => ({
    name:     r.name,
    tonnage:  -(r.tonnage ?? r.value ?? 0),
    amount:   (r.amount ?? 0) / 100000,
    _tonnage: r.tonnage ?? r.value ?? 0,
    _amount:  r.amount ?? 0,
  }));
  const barH = Math.max(180, data.length * 44 + 40);
  const chart = (
    <ResponsiveContainer width="100%" height={barH}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridClr} />
        <XAxis type="number" tick={{ fontSize: 9, fill: axisClr }} tickFormatter={v => v < 0 ? Math.abs(v) : `${v.toFixed(1)}L`} />
        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: textClr, fontWeight: 500 }} />
        <Tooltip
          formatter={(v, name, props) => {
            const row = props.payload;
            if (name === 'tonnage') return [`${row._tonnage} T`, 'Tonnage'];
            if (name === 'amount')  return [`${(row._amount / 100000).toFixed(2)} Lacs`, 'Amount'];
            return [Math.abs(v), name];
          }}
          {...tooltipStyle}
        />
        <Bar dataKey="tonnage" fill="#FF00CC" stackId="m" maxBarSize={22} isAnimationActive />
        <Bar dataKey="amount"  fill="#FF6600" stackId="m" maxBarSize={22} isAnimationActive />
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)} style={{ flex: 1 }}>
      {chart}
    </ChartCard>
  );
}

// DwTableCard — full Angular columns: Category | Tonnage | Amount | LY Tonnage | LY Amount
function DwTableCard({ title, data, basedon }) {
  const { isDarkMode } = useColorMode();
  const cardBg    = isDarkMode ? '#1e293b' : 'white';
  const borderClr = isDarkMode ? '#334155' : '#e2e8f0';
  const titleClr  = isDarkMode ? '#e2e8f0' : '#1e293b';
  const headerBg  = isDarkMode ? 'rgba(0,0,0,0.22)' : '#f8fafc';
  const rowEven   = isDarkMode ? '#0f172a' : 'white';
  const rowOdd    = isDarkMode ? '#1e293b' : '#f8fafc';
  const muted     = isDarkMode ? '#94a3b8' : '#64748b';
  return (
    <div style={{ flex: 1, background: cardBg, borderRadius: 12, border: `1px solid ${borderClr}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(37,99,235,0.07)' }}>
      <div style={{ padding: '0.55rem 1rem', borderBottom: `1px solid ${borderClr}`, background: headerBg, borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: titleClr }}>{title}</span>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 380 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr style={{ background: headerBg, position: 'sticky', top: 0 }}>
              <th style={{ padding: '5px 8px', textAlign: 'left',  borderBottom: `1px solid ${borderClr}`, color: muted, fontWeight: 600 }}>Category</th>
              <th style={{ padding: '5px 8px', textAlign: 'right', borderBottom: `1px solid ${borderClr}`, color: muted, fontWeight: 600 }}>Tonnage</th>
              <th style={{ padding: '5px 8px', textAlign: 'right', borderBottom: `1px solid ${borderClr}`, color: muted, fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '5px 8px', textAlign: 'right', borderBottom: `1px solid ${borderClr}`, color: muted, fontWeight: 600 }}>LY Tonnage</th>
              <th style={{ padding: '5px 8px', textAlign: 'right', borderBottom: `1px solid ${borderClr}`, color: muted, fontWeight: 600 }}>LY Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                <td style={{ padding: '4px 8px', color: titleClr, fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: titleClr }}>{r.tonnage ?? r.value ?? 0}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: titleClr }}>{r.amount ?? 0}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: muted }}>{r.ly_tonnage ?? 0}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: muted }}>{r.ly_amount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SHOP_RESTRICTED_ROLES = ['Distributor', 'Sales Man', 'Sales Executive', 'Asst. Manager Sales'];

const DW_DAYSEL_OPTIONS  = ['yesterday','today','7days','30days','month','lmonth'].map(v => ({ value: v, label: v }));
const DW_METHOD_OPTIONS  = [{ value: 'Distribution', label: 'Distribution' }, { value: 'Shops', label: 'Shops' }];
const DW_COMPANY_OPTIONS = ['ALL','SBL','BALAJI'].map(v => ({ value: v, label: v }));
const DW_FILTER_OPTIONS  = ['Category group','Category','Code'].map(v => ({ value: v, label: v }));
const DW_BASEDON_OPTIONS = ['Tonnage','Amount'].map(v => ({ value: v, label: v }));

export default function ChartsPage({ loggedInRolex }) {
  const { user }     = useAuth();
  const employeename = user?.username;
  const { multiyear, monthwisecompany, monthwisedisttype } = useSalesFilterStore();

  const rolex           = typeof loggedInRolex === 'string' ? loggedInRolex : (loggedInRolex?.designation || '');
  const showShopsOption = !SHOP_RESTRICTED_ROLES.includes(rolex);
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  const selStyles = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6 });

  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);
  const [chartTab,  setChartTab]  = useState('monthwise');
  const [viewMode,  setViewMode]  = useState('Year');
  const [zoomChart, setZoomChart] = useState(null);
  const [error,     setError]     = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [dwBasedon,         setDwBasedon]        = useState('Tonnage');
  const [dwDaysel,          setDwDaysel]          = useState('yesterday');
  const [dwMethod,          setDwMethod]          = useState('Distribution');
  const [dwCompany,         setDwCompany]         = useState('ALL');
  const [dwFilter,          setDwFilter]          = useState('Category group');
  const [dwSellingTab,      setDwSellingTab]      = useState('topview');
  const [dwLevel1,          setDwLevel1]          = useState([]);
  const [dwLevel2,          setDwLevel2]          = useState([]);
  const [dwLevel3,          setDwLevel3]          = useState([]);
  const [dwL1Loading,       setDwL1Loading]       = useState(false);
  const [dwL2Loading,       setDwL2Loading]       = useState(false);
  const [dwL3Loading,       setDwL3Loading]       = useState(false);
  const [dwClickedCatgroup, setDwClickedCatgroup] = useState(null);
  const [dwClickedCategory, setDwClickedCategory] = useState(null);
  const [graphDataAll,      setGraphDataAll]      = useState([]);
  const [yrFilterMode,      setYrFilterMode]      = useState('-Select-');
  const [yrFilterSub,       setYrFilterSub]       = useState('-Select-');

  // Month-wise drill-down state
  const [pieData1,        setPieData1]        = useState([]);
  const [pieData2,        setPieData2]        = useState([]);
  const [pieData3,        setPieData3]        = useState([]);
  const [pieTitle1,       setPieTitle1]       = useState('');
  const [pieTitle2,       setPieTitle2]       = useState('');
  const [pieTitle3,       setPieTitle3]       = useState('');
  const [catgroupLoading, setCatgroupLoading] = useState(false);
  const [categoryData,    setCategoryData]    = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [codeData,        setCodeData]        = useState([]);
  const [codeLoading,     setCodeLoading]     = useState(false);
  const [clickedMonth,    setClickedMonth]    = useState(null);
  const [clickedCatgroup, setClickedCatgroup] = useState(null);
  const [clickedCategory, setClickedCategory] = useState(null);
  const [clickedPieNum,   setClickedPieNum]   = useState(null);
  const [hbarTitle,       setHbarTitle]       = useState('');
  const [hbar2Title,      setHbar2Title]      = useState('');

  // Refs — written synchronously before any await to avoid stale closures
  const mwMonthRef    = useRef(null);
  const mwYearRef     = useRef(null);
  const mwCatgroupRef = useRef(null);
  const mwPieNumRef   = useRef(null);
  const mwPieTitles   = useRef({ t1: '', t2: '', t3: '' });
  const mwHbarTitle   = useRef('');

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPieData1([]); setPieData2([]); setPieData3([]);
    setCategoryData([]); setCodeData([]);
    setClickedMonth(null); setClickedCatgroup(null); setClickedCategory(null); setClickedPieNum(null);
    try {
      const data = await getGraphMonthwise({ multiyear, employeename, monthwisecompany, monthwisedisttype });
      const list = Array.isArray(data) ? data : [];
      setGraphDataAll(list);
      setYrFilterMode('-Select-');
      setYrFilterSub('-Select-');
      const firstRow = list[0] && typeof list[0] === 'object' && !list[0].dist ? list[0] : (list[0]?.dist ?? list[0] ?? null);
      setGraphData(firstRow);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [multiyear, monthwisecompany, monthwisedisttype, employeename]);

  useEffect(() => { fetchGraphData(); }, [fetchGraphData]);

  const monthlyBarData = useMemo(() => {
    if (!graphData) return [];
    if (viewMode === 'Quarterly') {
      return ['Q1','Q2','Q3','Q4'].map((q, qi) => ({
        name: q,
        value: Math.round(Q_KEYS[qi].reduce((s, k) => s + (parseFloat(graphData[k]) || 0), 0)),
      }));
    }
    return MONTH_LABELS.map((label, i) => ({
      name: label,
      value: parseFloat(graphData[MONTH_KEYS[i]]) || 0,
    }));
  }, [graphData, viewMode]);

  const companyLabel   = monthwisecompany || 'SBL';
  const graphTitle     = `${companyLabel} Month Wise Overview (tonnage)`;
  const graphTitleYear = `${companyLabel} Year Wise Overview (tonnage)`;
  const isMultiYear    = Array.isArray(multiyear) && multiyear.length > 1;

  const yrSubOptions = useMemo(() => {
    if (yrFilterMode === 'monthly')   return ['-Select-','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (yrFilterMode === 'Quarterly') return ['-Select-','Qt1','Qt2','Qt3','Qt4'];
    return ['-Select-'];
  }, [yrFilterMode]);

  const yearlyBarData = useMemo(() => {
    if (!isMultiYear) return [];
    const rows = graphDataAll
      .map(item => (item && typeof item === 'object' && !item.dist) ? item : (item?.dist ?? item ?? {}))
      .filter(r => r && r.year != null && !isNaN(Number(r.year)));
    if (yrFilterMode === 'monthly' && yrFilterSub !== '-Select-') {
      const monthIdx = MONTH_LABELS.findIndex(m => m === yrFilterSub);
      if (monthIdx < 0) return [];
      return rows.map(row => ({ name: `${row.year}(${yrFilterSub})`, value: parseFloat(row[MONTH_KEYS[monthIdx]]) || 0 }));
    }
    if (yrFilterMode === 'Quarterly' && yrFilterSub !== '-Select-') {
      const qtIdx = { Qt1: 0, Qt2: 1, Qt3: 2, Qt4: 3 }[yrFilterSub];
      if (qtIdx === undefined) return [];
      return rows.map(row => ({
        name: `${row.year}(${yrFilterSub})`,
        value: Math.round(Q_KEYS[qtIdx].reduce((s, k) => s + (parseFloat(row[k]) || 0), 0)),
      }));
    }
    return rows.map(row => ({
      name: String(row.year),
      value: Math.round(MONTH_KEYS.reduce((s, k) => s + (parseFloat(row[k]) || 0), 0)),
    }));
  }, [isMultiYear, graphDataAll, yrFilterMode, yrFilterSub]);

  const sortedDwLevel1 = useMemo(() => {
    const copy = [...dwLevel1];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel1, dwSellingTab]);

  const sortedDwLevel2 = useMemo(() => {
    const copy = [...dwLevel2];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel2, dwSellingTab]);

  const sortedDwLevel3 = useMemo(() => {
    const copy = [...dwLevel3];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel3, dwSellingTab]);

  // ── Day Wise fetch + drill-down (keeps raw fields for full table) ────────────
  const fetchDwData = useCallback(async () => {
    setDwL1Loading(true);
    setDwLevel1([]); setDwLevel2([]); setDwLevel3([]);
    setDwClickedCatgroup(null); setDwClickedCategory(null);
    try {
      const result = await getGraphSellingData({ daysel: dwDaysel, method: dwMethod, company: dwCompany, basedon: dwBasedon, grdaiyfilter: dwFilter, employeename });
      const list = Array.isArray(result) ? result : (result?.list ?? []);
      setDwLevel1(list.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })));
    } catch { setDwLevel1([]); }
    setDwL1Loading(false);
  }, [dwDaysel, dwMethod, dwCompany, dwBasedon, dwFilter, employeename]);

  const handleDwBarClick = useCallback(async (payload) => {
    if (!payload?.name) return;
    setDwClickedCatgroup(payload.name);
    setDwLevel2([]); setDwLevel3([]);
    setDwClickedCategory(null);
    setDwL2Loading(true);
    try {
      const rows = await getGraphSellingDataByCategory({ label: payload.name, daysel: dwDaysel, method: dwMethod, company: dwCompany, basedon: dwBasedon });
      setDwLevel2(Array.isArray(rows) ? rows.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })) : []);
    } catch { setDwLevel2([]); }
    setDwL2Loading(false);
    scrollTo('dw-section2');
  }, [dwDaysel, dwMethod, dwCompany, dwBasedon]);

  const handleDwCategoryClick = useCallback(async (payload) => {
    if (!payload?.name) return;
    setDwClickedCategory(payload.name);
    setDwLevel3([]);
    setDwL3Loading(true);
    try {
      const rows = await getGraphSellingDataByItem({ catgory: dwClickedCatgroup, label: payload.name, daysel: dwDaysel, method: dwMethod, company: dwCompany, basedon: dwBasedon });
      setDwLevel3(Array.isArray(rows) ? rows.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })) : []);
    } catch { setDwLevel3([]); }
    setDwL3Loading(false);
    scrollTo('dw-section3');
  }, [dwClickedCatgroup, dwDaysel, dwMethod, dwCompany, dwBasedon]);

  const handleZoom = (title, content) => setZoomChart({ title, content });

  // ── Month Wise drill-down — base function (used by single-year + multi-year) ─
  // Normalises Q1→Qt1 before calling API (chart labels Q1/Q2, API expects Qt1/Qt2)
  const handlePieClickForYear = useCallback(async (monthName, year) => {
    if (!monthName || !year) return;
    const apiMonth = (monthName.startsWith('Q') && !monthName.startsWith('Qt'))
      ? 'Qt' + monthName.slice(1)
      : monthName;
    mwMonthRef.current = apiMonth;
    mwYearRef.current  = String(year);
    setClickedMonth(apiMonth);
    setPieData1([]); setPieData2([]); setPieData3([]);
    setCategoryData([]); setCodeData([]);
    setClickedCatgroup(null); setClickedCategory(null); setClickedPieNum(null);

    const isQt  = apiMonth.startsWith('Qt');
    const qtNum = isQt ? apiMonth.replace('Qt', '') : '';
    const co    = companyLabel;
    let t1, t2, t3;
    if (monthwisedisttype === 'Distribution') {
      t1 = isQt ? `${co} Quarterly ${qtNum} Wise Distribution Overview (tonnage)` : `${co} ${apiMonth} Month Wise Distribution Overview (tonnage)`;
      t2 = isQt ? `${co} Quarterly ${qtNum} Wise institution Overview (tonnage)`   : `${co} ${apiMonth} Month Wise institution Overview (tonnage)`;
      t3 = isQt ? `${co} Quarterly ${qtNum} Wise Govt Orders Overview (tonnage)`   : `${co} ${apiMonth} Month Wise Govt Orders Overview (tonnage)`;
    } else if (monthwisedisttype === 'Shops') {
      t1 = isQt ? `${co} Quarterly ${qtNum} Wise NTPet Shop Overview (tonnage)`       : `${co} ${apiMonth} Month Wise NTPet Shop Overview (tonnage)`;
      t2 = isQt ? `${co} Quarterly ${qtNum} Wise SBL OTHERS Overview (tonnage)`       : `${co} ${apiMonth} Month Wise SBL OTHERS Overview (tonnage)`;
      t3 = isQt ? `${co} Quarterly ${qtNum} Wise Yeshwantpur Shop Overview (tonnage)` : `${co} ${apiMonth} Month Wise Yeshwantpur Shop Overview (tonnage)`;
    } else {
      t1 = isQt ? `${co} Quarterly ${qtNum} Wise Overall Overview (tonnage)`      : `${co} ${apiMonth} Month Wise Overall Overview (tonnage)`;
      t2 = isQt ? `${co} Quarterly ${qtNum} Wise Distribution Overview (tonnage)` : `${co} ${apiMonth} Month Wise Distribution Overview (tonnage)`;
      t3 = isQt ? `${co} Quarterly ${qtNum} Wise Shops Overview (tonnage)`        : `${co} ${apiMonth} Month Wise Shops Overview (tonnage)`;
    }
    mwPieTitles.current = { t1, t2, t3 };
    setPieTitle1(t1); setPieTitle2(t2); setPieTitle3(t3);

    setCatgroupLoading(true);
    try {
      const rows = await getGraphCatgroup({ selectedyear: String(year), month: apiMonth, monthwisecompany, monthwisedisttype, employeename });
      const arr1 = [], arr2 = [], arr3 = [];
      (Array.isArray(rows) ? rows : []).forEach(r => {
        const val     = parseFloat(r.monthval) || 0;
        const distVal = parseFloat(r.distval)  || 0;
        const shopVal = parseFloat(r.shopval)  || 0;
        if (val <= 0 && distVal <= 0 && shopVal <= 0) return;
        if (String(r.checkda1) === '1') {
          if (val     > 0) arr1.push({ name: r.catgroup, value: val });
          if (distVal > 0) arr2.push({ name: r.catgroup, value: distVal });
          if (shopVal > 0) arr3.push({ name: r.catgroup, value: shopVal });
        } else {
          if (r.dispatchtype === 'Distribution' || r.areaname === 'Govt Orders') {
            if (r.areaname === 'Govt Orders')                                            arr3.push({ name: r.catgroup, value: val });
            else if (String(r.institute) === 'Yes' && r.dispatchtype === 'Distribution') arr2.push({ name: r.catgroup, value: val });
            else                                                                         arr1.push({ name: r.catgroup, value: val });
          } else if (r.dispatchtype === 'NTPet Shop')       arr1.push({ name: r.catgroup, value: val });
          else if   (r.dispatchtype === 'SBL OTHERS')       arr2.push({ name: r.catgroup, value: val });
          else if   (r.dispatchtype === 'Yeshwantpur Shop') arr3.push({ name: r.catgroup, value: val });
        }
      });
      setPieData1(arr1); setPieData2(arr2); setPieData3(arr3);
    } catch { setPieData1([]); setPieData2([]); setPieData3([]); }
    setCatgroupLoading(false);
    scrollTo('mw-section2');
  }, [companyLabel, monthwisecompany, monthwisedisttype, employeename]);

  // Single-year pie/bar click — reads year from graphData
  const handlePieClick = useCallback((monthName) => {
    if (!monthName) return;
    const year = graphData?.year || (Array.isArray(multiyear) ? multiyear[0] : multiyear);
    handlePieClickForYear(monthName, year);
  }, [graphData, multiyear, handlePieClickForYear]);

  // Multi-year pie/bar click — extracts year from the clicked bar/slice label
  const handleYearPieClick = useCallback((yearLabel) => {
    if (!yearLabel) return;
    const yearStr = String(yearLabel).slice(0, 4);
    if (yrFilterMode === 'monthly' && yrFilterSub !== '-Select-') {
      handlePieClickForYear(yrFilterSub, yearStr);
    } else if (yrFilterMode === 'Quarterly' && yrFilterSub !== '-Select-') {
      handlePieClickForYear(yrFilterSub, yearStr);
    } else {
      // No sub-filter: switch to single-year monthly view for the clicked year
      const rows = graphDataAll
        .map(item => (item && typeof item === 'object' && !item.dist) ? item : (item?.dist ?? item ?? {}))
        .filter(r => r && r.year != null);
      const row = rows.find(r => String(r.year) === yearStr);
      if (row) {
        setGraphData(row);
        setViewMode('Year');
        setPieData1([]); setPieData2([]); setPieData3([]);
        setCategoryData([]); setCodeData([]);
      }
    }
  }, [yrFilterMode, yrFilterSub, graphDataAll, handlePieClickForYear]);

  // DrillPie slice click → Level 2 HBar (reads month + year from refs)
  const handleCatgroupClick = useCallback(async (catgroupName, pieNum) => {
    if (!catgroupName) return;
    const month = mwMonthRef.current;
    const year  = mwYearRef.current;
    const { t1, t2, t3 } = mwPieTitles.current;
    const hTitle = ([t1, t2, t3][pieNum - 1] || '').replace('Overview', `and ${catgroupName} Overview`);

    mwCatgroupRef.current = catgroupName;
    mwPieNumRef.current   = pieNum;
    mwHbarTitle.current   = hTitle;

    setClickedCatgroup(catgroupName);
    setClickedPieNum(pieNum);
    setCategoryData([]); setCodeData([]);
    setClickedCategory(null);
    setHbarTitle(hTitle);
    setHbar2Title('');
    setCategoryLoading(true);
    try {
      const rows = await getGraphCategoryWithCode({ selectedyear: year, month, catgroup: catgroupName, dataget: pieNum, monthwisedisttype, monthwisecompany, employeename });
      setCategoryData(Array.isArray(rows) ? rows.map(r => ({ name: r.category ?? r.catgroup ?? r.name, value: parseFloat(r.monthval) || 0 })) : []);
    } catch { setCategoryData([]); }
    setCategoryLoading(false);
    scrollTo('mw-section3');
  }, [monthwisedisttype, monthwisecompany, employeename]);

  // HBar category click → Level 3 HBar of codes (reads all from refs)
  const handleCategoryClick = useCallback(async (payload) => {
    const categoryName = payload?.name;
    if (!categoryName) return;
    const month    = mwMonthRef.current;
    const year     = mwYearRef.current;
    const catgroup = mwCatgroupRef.current;
    const pieNum   = mwPieNumRef.current;
    const hTitle   = mwHbarTitle.current;

    setClickedCategory(categoryName);
    setCodeData([]);
    setHbar2Title(hTitle.replace('Overview', `with ${categoryName} Category Overview`));
    setCodeLoading(true);
    try {
      const rows = await getGraphCategoryWithCode({ selectedyear: year, month, catgroup, category: categoryName, dataget: pieNum, monthwisedisttype, monthwisecompany, employeename });
      setCodeData(Array.isArray(rows) ? rows.map(r => ({ name: r.code ?? r.category ?? r.name, value: parseFloat(r.monthval) || 0 })) : []);
    } catch { setCodeData([]); }
    setCodeLoading(false);
    scrollTo('mw-section3');
  }, [monthwisedisttype, monthwisecompany, employeename]);

  const handlePie1Click = useCallback((name) => handleCatgroupClick(name, 1), [handleCatgroupClick]);
  const handlePie2Click = useCallback((name) => handleCatgroupClick(name, 2), [handleCatgroupClick]);
  const handlePie3Click = useCallback((name) => handleCatgroupClick(name, 3), [handleCatgroupClick]);

  // Year filter mode change — clears drill-down when reset to -Select-
  const handleYrModeChange = useCallback((mode) => {
    setYrFilterMode(mode);
    setYrFilterSub('-Select-');
    if (mode === '-Select-') {
      setPieData1([]); setPieData2([]); setPieData3([]);
      setCategoryData([]); setCodeData([]);
    }
  }, []);

  const LoaderOverlay = ({ text = 'Loading Chart Data' }) => (
    <div className="sr-loader-overlay">
      <div className={`sr-loader-card${isDarkMode ? ' sr-loader-card-dark' : ''}`}>
        <div className="sr-loader-spinner" style={{ borderTopColor: accent }} />
        <div className="sr-loader-text">{text}</div>
        <div className="sr-loader-dots">
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
        </div>
      </div>
    </div>
  );

  const tabBg        = isDarkMode ? '#1e293b' : '#f1f5f9';
  const inactiveClr  = isDarkMode ? '#94a3b8' : '#475569';
  const filterBarBg  = isDarkMode ? '#0f172a'  : '#f8fafc';
  const filterBarBdr = isDarkMode ? '#334155'  : '#e2e8f0';

  return (
    <div style={{ width: '100%' }}>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 4, background: tabBg, borderRadius: 8, padding: 3 }}>
          {[{ id: 'monthwise', label: 'Month Wise' }, { id: 'daywise', label: 'Day Wise' }].map(t => (
            <button key={t.id} onClick={() => setChartTab(t.id)} style={{
              background: chartTab === t.id ? `linear-gradient(135deg,${accent},${accent2})` : 'none',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              padding: '0.35rem 1rem', fontSize: '0.8rem',
              fontWeight: chartTab === t.id ? 700 : 500,
              color: chartTab === t.id ? 'white' : inactiveClr,
              transition: 'all 0.18s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {chartTab === 'monthwise' && <FilterBar mode="monthwise" onApply={fetchGraphData} isLoading={loading} />}

      {/* ── MONTH WISE ── */}
      {chartTab === 'monthwise' && (
        <>
          {error && (
            <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#c62828', fontSize: '0.82rem' }}>
              <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
            </div>
          )}
          {loading ? (
            <div className="sr-loader-overlay">
              <div className={`sr-loader-card${isDarkMode ? ' sr-loader-card-dark' : ''}`}>
                <div className="sr-loader-spinner" style={{ borderTopColor: accent }} />
                <div className="sr-loader-text">Generating Report</div>
                <div className="sr-loader-dots">
                  <span style={{ background: accent }} /><span style={{ background: accent }} /><span style={{ background: accent }} />
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              key={`${String(isMultiYear)}-${viewMode}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38 }}
            >
              {/* Section 1 — bar + pie, both clickable to drill down */}
              <div id="section1" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 20 }}>
                <BarChartCard
                  title={isMultiYear ? graphTitleYear : graphTitle}
                  data={isMultiYear ? yearlyBarData : monthlyBarData}
                  viewMode={viewMode} onViewModeChange={setViewMode}
                  onZoom={handleZoom}
                  isMultiYear={isMultiYear}
                  yrFilterMode={yrFilterMode} yrFilterSub={yrFilterSub}
                  yrSubOptions={yrSubOptions}
                  onYrModeChange={handleYrModeChange} onYrSubChange={setYrFilterSub}
                  onBarClick={isMultiYear ? handleYearPieClick : handlePieClick}
                />
                <PieChartCard
                  title={isMultiYear ? graphTitleYear : graphTitle}
                  data={isMultiYear ? yearlyBarData : monthlyBarData}
                  viewMode={viewMode} onViewModeChange={setViewMode}
                  onZoom={handleZoom}
                  isMultiYear={isMultiYear}
                  onPieClick={isMultiYear ? handleYearPieClick : handlePieClick}
                />
              </div>
            </motion.div>
          )}

          {/* Section 2 — 3 DrillPie cards */}
          {(catgroupLoading || pieData1.length > 0 || pieData2.length > 0 || pieData3.length > 0) && (
            <motion.div id="mw-section2" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {catgroupLoading ? <LoaderOverlay text="Loading Category Groups" /> : (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DrillPieCard title={pieTitle1} data={pieData1} onSliceClick={handlePie1Click} onZoom={handleZoom} />
                  <DrillPieCard title={pieTitle2} data={pieData2} onSliceClick={handlePie2Click} onZoom={handleZoom} />
                  <DrillPieCard title={pieTitle3} data={pieData3} onSliceClick={handlePie3Click} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* Section 3 — HBar (categories) → HBar (codes) */}
          {(categoryLoading || categoryData.length > 0 || codeLoading || codeData.length > 0) && (
            <motion.div id="mw-section3" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {categoryLoading ? <LoaderOverlay text="Loading Categories" /> : (
                categoryData.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <HBarCard title={hbarTitle} data={categoryData} onBarClick={handleCategoryClick} onZoom={handleZoom} />
                  </div>
                )
              )}
              {codeLoading ? <LoaderOverlay text="Loading Codes" /> : (
                codeData.length > 0 && (
                  <HBarCard title={hbar2Title} data={codeData} onZoom={handleZoom} />
                )
              )}
            </motion.div>
          )}
        </>
      )}

      {/* ── DAY WISE ── */}
      {chartTab === 'daywise' && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.6rem 0.75rem', background: filterBarBg, border: `1px solid ${filterBarBdr}`, borderRadius: 10 }}>
            <Select options={DW_DAYSEL_OPTIONS} value={DW_DAYSEL_OPTIONS.find(o => o.value === dwDaysel)}
              onChange={o => setDwDaysel(o.value)} styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed" placeholder="Period" />
            {showShopsOption && (
              <Select options={DW_METHOD_OPTIONS} value={DW_METHOD_OPTIONS.find(o => o.value === dwMethod)}
                onChange={o => setDwMethod(o.value)} styles={selStyles} isSearchable={false}
                menuPortalTarget={document.body} menuPosition="fixed" placeholder="Method" />
            )}
            <Select options={DW_COMPANY_OPTIONS} value={DW_COMPANY_OPTIONS.find(o => o.value === dwCompany)}
              onChange={o => setDwCompany(o.value)} styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed" placeholder="Company" />
            <Select options={DW_FILTER_OPTIONS} value={DW_FILTER_OPTIONS.find(o => o.value === dwFilter)}
              onChange={o => setDwFilter(o.value)} styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed" placeholder="Data View" />
            <Select options={DW_BASEDON_OPTIONS} value={DW_BASEDON_OPTIONS.find(o => o.value === dwBasedon)}
              onChange={o => setDwBasedon(o.value)} styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed" placeholder="Value" />
            <button onClick={fetchDwData} disabled={dwL1Loading} style={{
              background: `linear-gradient(135deg,${accent},${accent2})`,
              border: 'none', color: 'white', borderRadius: 6,
              padding: '0.35rem 1rem', fontSize: '0.78rem', fontWeight: 600,
              cursor: dwL1Loading ? 'not-allowed' : 'pointer', opacity: dwL1Loading ? 0.6 : 1,
            }}>
              {dwL1Loading ? 'Loading…' : 'Apply'}
            </button>
            <div style={{ display: 'flex', gap: 4, background: isDarkMode ? '#0f172a' : '#f1f5f9', borderRadius: 8, padding: 3, alignSelf: 'center' }}>
              {[{ id: 'topview', label: 'Top Selling' }, { id: 'lowview', label: 'Low Selling' }].map(t => (
                <button key={t.id} onClick={() => setDwSellingTab(t.id)} style={{
                  background: dwSellingTab === t.id ? accent : 'none',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  padding: '0.3rem 0.75rem', fontSize: '0.75rem',
                  fontWeight: dwSellingTab === t.id ? 700 : 500,
                  color: dwSellingTab === t.id ? 'white' : inactiveClr,
                  transition: 'all 0.18s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* DW Level 1 — table + chart side by side */}
          {(dwL1Loading || dwLevel1.length > 0) && (
            <motion.div id="dw-section1" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {dwL1Loading ? <LoaderOverlay text="Loading Day-Wise Data" /> : (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${dwCompany} ${dwMethod} Wise Overview (${dwDaysel})`}
                    data={sortedDwLevel1} basedon={dwBasedon} />
                  <HBarCard
                    title={`${dwSellingTab === 'topview' ? 'Top' : 'Low'} Selling — ${dwFilter} (${dwBasedon}) [${dwDaysel}]`}
                    data={sortedDwLevel1} onBarClick={handleDwBarClick} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* DW Level 2 — table + chart side by side */}
          {(dwL2Loading || dwLevel2.length > 0) && (
            <motion.div id="dw-section2" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {dwL2Loading ? <LoaderOverlay text="Loading Breakdown" /> : (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${dwCompany} ${dwMethod} And ${dwClickedCatgroup} Wise Overview (${dwDaysel})`}
                    data={sortedDwLevel2} basedon={dwBasedon} />
                  <HBarCard
                    title={`Day Wise — ${dwClickedCatgroup} breakdown (${dwBasedon})`}
                    data={sortedDwLevel2} onBarClick={handleDwCategoryClick} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* DW Level 3 — table + chart side by side */}
          {(dwL3Loading || dwLevel3.length > 0) && (
            <motion.div id="dw-section3" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {dwL3Loading ? <LoaderOverlay text="Loading Items" /> : (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${dwCompany} ${dwMethod} And ${dwClickedCatgroup} and ${dwClickedCategory} Category Wise Overview (${dwDaysel})`}
                    data={sortedDwLevel3} basedon={dwBasedon} />
                  <HBarCard
                    title={`Day Wise — ${dwClickedCatgroup} → ${dwClickedCategory} items (${dwBasedon})`}
                    data={sortedDwLevel3} onBarClick={null} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {!dwL1Loading && dwLevel1.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              Select filters and click <strong>Apply</strong> to load day-wise chart data.
            </div>
          )}
        </>
      )}

      {zoomChart && <ZoomModal chart={zoomChart} onClose={() => setZoomChart(null)} />}
    </div>
  );
}
