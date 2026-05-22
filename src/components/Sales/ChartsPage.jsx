import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  PieChart, Pie, Legend, ResponsiveContainer,
} from 'recharts';
import Select from 'react-select';
import SummaryCards from './SummaryCards';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../store/salesFilterStore';
import { useAuth } from '../../context/AuthContext';
import { useColorMode } from '../../theme/ThemeContext';
import {
  getGraphMonthwise,
  getGraphCatgroup,
  getGraphSellingDataByCategory,
  getGraphCategoryWithCode,
} from '../../services/salesDashboardApi';

const MONTH_COLORS = [
  '#FF00CC','#ADD8E6','#99CC00','#FF3333','#CCCC00','#9900FF',
  '#00CC99','#FF9900','#33CCFF','#FF66FF','#66FF66','#FF6600',
];
const PIE_COLORS = [
  '#FF00CC','#ADD8E6','#99CC00','#FF3333','#CCCC00','#9900FF',
  '#00CC99','#FF9900','#33CCFF','#FF66FF','#66FF66','#FF6600',
  '#FF3366','#66FFFF','#FFCC00','#9933CC','#CC3300','#66CC33',
];
const BAR_COLORS = [
  '#FF00CC','#0033FF','#99CC00','#CCCC00','#9900FF','#00CC99',
  '#FF9900','#33CCFF','#FF66FF','#66FF66','#FF6600',
];

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

const ExpandSVG = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    {active
      ? <path d="M5.5 0v5.5H0v1h6.5V0h-1zM10.5 0v1h4.5v4.5h1V0h-5.5zM0 10.5v5.5h5.5v-1H1v-4.5H0zM15 10.5V15h-4.5v1H16v-5.5h-1z"/>
      : <path d="M1 1v4.5h1V2h3.5V1H1zM10.5 1v1H14v3.5h1V1h-4.5zM1 10.5V15h4.5v-1H2v-3.5H1zM14 11.5V15h-3.5v1H15v-4.5h-1z"/>
    }
  </svg>
);

function ZoomModal({ chart, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.55)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '88vw', maxWidth: 1100, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{chart.title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>✕</button>
        </div>
        {chart.content}
      </div>
    </div>
  );
}

function ChartCard({ title, onZoom, children, style = {} }) {
  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'visible', boxShadow: '0 2px 10px rgba(37,99,235,0.07)', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', lineHeight: 1.3 }}>{title}</span>
        <button onClick={onZoom} title="Expand" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>⛶</button>
      </div>
      <div style={{ padding: '0.8rem 1rem' }}>{children}</div>
    </div>
  );
}

const BarTopLabel = (props) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return <text x={x + width / 2} y={y - 4} fill="#475569" textAnchor="middle" fontSize={10} fontWeight={600}>{value}</text>;
};

const OuterPieLabel = ({ cx, cy, midAngle, outerRadius, value, percent }) => {
  if (percent < 0.03 || !value) return null;
  const R = Math.PI / 180;
  const r = outerRadius + 32;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="#333" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={9.5} fontWeight={600}>
      {`${Math.round(value)} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

function makeHBarLabel(total) {
  return function HBarLabel({ x, y, width, height, value }) {
    const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
    return (
      <text x={x + width + 6} y={y + height / 2} fill="#475569" dominantBaseline="central" fontSize={9}>
        {value} ({pct}%)
      </text>
    );
  };
}

const VIEW_OPTIONS = [
  { value: 'Year', label: 'Year (monthly)' },
  { value: 'Quarterly', label: 'Quarterly' },
];

function useSelStyles() {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#2563eb';
  return {
    accent,
    styles: {
      control: (base, state) => ({
        ...base,
        minHeight: 30, height: 30,
        fontSize: '0.78rem', fontFamily: "'Manrope',sans-serif",
        borderColor: state.isFocused ? accent : (isDarkMode ? '#334155' : '#cbd5e1'),
        boxShadow: state.isFocused ? `0 0 0 2px ${accent}30` : 'none',
        '&:hover': { borderColor: accent },
        borderRadius: 6, cursor: 'pointer',
        background: isDarkMode ? '#0f172a' : 'white',
        minWidth: 130,
      }),
      valueContainer: (base) => ({ ...base, padding: '0 0.5rem' }),
      indicatorsContainer: (base) => ({ ...base, height: 30 }),
      menuPortal: (base) => ({ ...base, zIndex: 99999 }),
      menu: (base) => ({ ...base, fontSize: '0.78rem', fontFamily: "'Manrope',sans-serif", background: isDarkMode ? '#1e293b' : 'white' }),
      option: (base, state) => ({
        ...base,
        background: state.isSelected ? accent : state.isFocused ? (isDarkMode ? '#334155' : '#eff6ff') : (isDarkMode ? '#1e293b' : 'white'),
        color: state.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
        cursor: 'pointer',
      }),
      singleValue: (base) => ({ ...base, color: isDarkMode ? '#e2e8f0' : '#1e293b' }),
      dropdownIndicator: (base) => ({ ...base, color: accent, padding: '0 4px' }),
      indicatorSeparator: () => ({ display: 'none' }),
    },
  };
}

function BarChartCard({ title, data, viewMode, onViewModeChange, onBarClick, onZoom }) {
  const { styles: selStyles } = useSelStyles();
  const chart = (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} onClick={onBarClick} style={{ cursor: 'pointer' }} margin={{ top: 22, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
        <Tooltip formatter={(v) => [`${v} T`, 'Tonnage']} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => <Cell key={i} fill={MONTH_COLORS[i % MONTH_COLORS.length]} />)}
          <LabelList dataKey="value" content={BarTopLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <Select
          options={VIEW_OPTIONS}
          value={VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0]}
          onChange={sel => onViewModeChange(sel.value)}
          styles={selStyles}
          isSearchable={false}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </div>
      {chart}
    </ChartCard>
  );
}

function PieChartCard({ title, data, viewMode, onViewModeChange, onPieClick, onZoom }) {
  const { styles: selStyles } = useSelStyles();
  const nonZero = data.filter(d => d.value > 0);
  const chart = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80, flexShrink: 0 }}>
        {nonZero.map((d) => {
          const origIdx = data.indexOf(d);
          return (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', color: '#475569', lineHeight: 1.4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, flexShrink: 0, background: MONTH_COLORS[origIdx % MONTH_COLORS.length] }} />
              {d.name}
            </div>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart margin={{ top: 30, right: 60, bottom: 20, left: 60 }}>
          <Pie data={nonZero} cx="50%" cy="50%" outerRadius={85} labelLine label={OuterPieLabel}
            onClick={(entry) => onPieClick && onPieClick(entry)} style={{ cursor: 'pointer' }}>
            {nonZero.map((d) => {
              const origIdx = data.indexOf(d);
              return <Cell key={d.name} fill={MONTH_COLORS[origIdx % MONTH_COLORS.length]} />;
            })}
          </Pie>
          <Tooltip formatter={(v) => [`${v} T`, 'Tonnage']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <Select
          options={VIEW_OPTIONS}
          value={VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0]}
          onChange={sel => onViewModeChange(sel.value)}
          styles={selStyles}
          isSearchable={false}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </div>
      {chart}
    </ChartCard>
  );
}

function DrillPieCard({ title, data, onSliceClick, onZoom }) {
  const total = data.reduce((s, r) => s + r.value, 0);
  const chart = (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart margin={{ top: 30, right: 70, bottom: 60, left: 70 }}>
        <Pie data={data} cx="50%" cy="46%" outerRadius={80} labelLine label={OuterPieLabel}
          onClick={(entry) => onSliceClick && onSliceClick(entry.name)} style={{ cursor: onSliceClick ? 'pointer' : 'default' }}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={9}
          wrapperStyle={{ fontSize: 10, paddingTop: 8, maxWidth: '100%', lineHeight: '18px' }}
          formatter={(value, entry) => `${value}: ${Math.round(entry.payload.value)} (${total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0}%)`}
        />
        <Tooltip formatter={(v) => [`${v} T (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, 'Tonnage']} />
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
  const total    = data.reduce((s, r) => s + r.value, 0);
  const HBarLabel = useMemo(() => makeHBarLabel(total), [total]);
  const barH     = Math.max(200, data.length * 40 + 40);
  const chart = (
    <ResponsiveContainer width="100%" height={barH}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 130, left: 10, bottom: 0 }}
        onClick={onBarClick ? (d) => { const p = d?.activePayload?.[0]?.payload; if (p) onBarClick(p); } : undefined}
        style={{ cursor: onBarClick ? 'pointer' : 'default' }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#1e293b', fontWeight: 500 }} />
        <Tooltip formatter={(v) => [`${v} T (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, 'Tonnage']} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
          <LabelList dataKey="value" content={HBarLabel} />
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
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => v < 0 ? Math.abs(v) : `${v.toFixed(1)}L`} />
        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9, fill: '#1e293b', fontWeight: 500 }} />
        <Tooltip
          formatter={(v, name, props) => {
            const row = props.payload;
            if (name === 'tonnage') return [`${row._tonnage} T`, 'Tonnage'];
            if (name === 'amount')  return [`${(row._amount / 100000).toFixed(2)} Lacs`, 'Amount'];
            return [Math.abs(v), name];
          }}
        />
        <Bar dataKey="tonnage" fill="#FF00CC" stackId="m" maxBarSize={22} />
        <Bar dataKey="amount"  fill="#FF6600" stackId="m" maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)} style={{ flex: 1 }}>
      {chart}
    </ChartCard>
  );
}

function Spinner({ text = 'Loading…' }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
      <i className="bi bi-arrow-clockwise" style={{ marginRight: 6 }} />{text}
    </div>
  );
}

const MAIN_TABS = [
  { id: 'monthwise', label: 'Month Wise' },
];

export default function ChartsPage() {
  const { user }    = useAuth();
  const employeename = user?.username;
  const { multiyear, monthwisecompany, monthwisedisttype } = useSalesFilterStore();

  const [viewMode, setViewMode]           = useState('Year');
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [zoomChart, setZoomChart]         = useState(null);
  const [error, setError]                 = useState(null);

  const [graphData,    setGraphData]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [catgroupRaw,  setCatgroupRaw]  = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [codeData,     setCodeData]     = useState([]);

  const [catgroupLoading,  setCatgroupLoading]  = useState(false);
  const [categoryLoading,  setCategoryLoading]  = useState(false);
  const [codeLoading,      setCodeLoading]      = useState(false);

  const [clickedMonth,    setClickedMonth]    = useState(null);
  const [clickedCatgroup, setClickedCatgroup] = useState(null);
  const [clickedCategory, setClickedCategory] = useState(null);
  const [clickedPieGroup, setClickedPieGroup] = useState(null);

  useEffect(() => {
    if (isFullscreen) document.body.classList.add('is-fullscreen');
    else document.body.classList.remove('is-fullscreen');
    return () => document.body.classList.remove('is-fullscreen');
  }, [isFullscreen]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isFullscreen]);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCatgroupRaw([]); setCategoryData([]); setCodeData([]);
    setClickedMonth(null); setClickedCatgroup(null); setClickedCategory(null); setClickedPieGroup(null);
    try {
      const data = await getGraphMonthwise({
        multiyear, employeename, monthwisecompany, monthwisedisttype,
      });
      // API 19 special case: single year → last element may be { dist:{...}, shop:{...} }
      const list = Array.isArray(data) ? data : [];
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

  const companyLabel = monthwisecompany || 'SBL';
  const graphTitle   = `${companyLabel} Month Wise Overview (tonnage)`;

  const handleBarClick = useCallback(async (data) => {
    const label = data?.activeLabel || data?.name;
    if (!label) return;
    setClickedMonth(label);
    setCatgroupRaw([]); setCategoryData([]); setCodeData([]);
    setCatgroupLoading(true);
    try {
      const rows = await getGraphCatgroup({
        month: label, monthwisedisttype, monthwisecompany, employeename,
      });
      setCatgroupRaw(Array.isArray(rows) ? rows : []);
    } catch { setCatgroupRaw([]); }
    setCatgroupLoading(false);
    scrollTo('section2');
  }, [monthwisedisttype, monthwisecompany, employeename]);

  const { distPie, instPie, govtPie } = useMemo(() => ({
    distPie: catgroupRaw.filter(r => r.institute !== 'Yes' && r.areaname !== 'Govt Orders')
      .map(r => ({ name: r.catgroup, value: parseFloat(r.monthval) || 0 })),
    instPie: catgroupRaw.filter(r => r.institute === 'Yes')
      .map(r => ({ name: r.catgroup, value: parseFloat(r.monthval) || 0 })),
    govtPie: catgroupRaw.filter(r => r.areaname === 'Govt Orders')
      .map(r => ({ name: r.catgroup, value: parseFloat(r.monthval) || 0 })),
  }), [catgroupRaw]);

  const showSection2 = catgroupRaw.length > 0 || catgroupLoading;

  const handlePieSliceClick = useCallback(async (catgroupName, pieGroup) => {
    setClickedCatgroup(catgroupName);
    setClickedPieGroup(pieGroup);
    setCategoryData([]); setCodeData([]);
    setCategoryLoading(true);
    try {
      // NOTE: intentional PHP legacy typo — "catgory" (no second 'e')
      const rows = await getGraphSellingDataByCategory({
        catgory: catgroupName,
        daysel: clickedMonth,
        method: monthwisedisttype,
        company: monthwisecompany,
        basedon: 'tonnage',
      });
      setCategoryData(Array.isArray(rows)
        ? rows.map(r => ({ name: r.category, value: parseFloat(r.monthval) || 0 }))
        : []);
    } catch { setCategoryData([]); }
    setCategoryLoading(false);
    scrollTo('section3');
  }, [clickedMonth, monthwisedisttype, monthwisecompany]);

  const showSection3 = categoryData.length > 0 || categoryLoading;

  const handleCategoryBarClick = useCallback(async (payload) => {
    if (!payload?.name) return;
    setClickedCategory(payload.name);
    setCodeData([]);
    setCodeLoading(true);
    try {
      const rows = await getGraphCategoryWithCode({
        month: clickedMonth,
        monthwisedisttype,
        monthwisecompany,
        employeename,
      });
      setCodeData(Array.isArray(rows)
        ? rows.map(r => ({
            name:    r.code,
            value:   parseFloat(r.monthval) || 0,
            tonnage: parseFloat(r.tonnage ?? r.monthval) || 0,
            amount:  parseFloat(r.amount) || 0,
          }))
        : []);
    } catch { setCodeData([]); }
    setCodeLoading(false);
    scrollTo('section3b');
  }, [clickedMonth, monthwisedisttype, monthwisecompany, employeename]);

  const showSection3b = codeData.length > 0 || codeLoading;

  const handleZoom = (title, content) => setZoomChart({ title, content });

  const pieGroupLabel = clickedPieGroup === 2 ? 'institution'
    : clickedPieGroup === 3 ? 'Govt Orders' : 'Distribution';

  return (
    <div className={isFullscreen ? 'fullscreen-content' : ''} style={{ width: '100%' }}>
      {!isFullscreen && <SummaryCards />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
          Sales Charts
        </div>
        <button onClick={() => setIsFullscreen(p => !p)}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{ background: isFullscreen ? '#1565c0' : 'transparent', border: '2px solid #1565c0', borderRadius: 4, color: isFullscreen ? 'white' : '#1565c0', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, transition: 'all 0.18s' }}>
          <ExpandSVG active={isFullscreen} />
        </button>
      </div>

      <FilterBar mode="monthwise" onApply={fetchGraphData} isLoading={loading} />

      {error && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#c62828', fontSize: '0.82rem' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
          <i className="bi bi-arrow-clockwise" style={{ fontSize: '2rem' }} />
          <p style={{ marginTop: 8 }}>Loading chart data…</p>
        </div>
      ) : (
        <>
          {/* SECTION 1 */}
          <div id="section1" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <BarChartCard title={graphTitle} data={monthlyBarData}
              viewMode={viewMode} onViewModeChange={setViewMode}
              onBarClick={handleBarClick} onZoom={handleZoom} />
            <PieChartCard title={graphTitle} data={monthlyBarData}
              viewMode={viewMode} onViewModeChange={setViewMode}
              onPieClick={(entry) => handleBarClick({ activeLabel: entry.name })}
              onZoom={handleZoom} />
          </div>

          {/* SECTION 2 */}
          {showSection2 && (
            <div key={clickedMonth} id="section2" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e3a5f', marginBottom: 10 }}>
                Category Group — {clickedMonth}
              </div>
              {catgroupLoading ? <Spinner text="Loading category groups…" /> : (
                <div style={{ display: 'flex', gap: 16 }}>
                  <DrillPieCard
                    title={`${companyLabel} ${clickedMonth} Month Wise Distribution Overview (tonnage)`}
                    data={distPie}
                    onSliceClick={(name) => handlePieSliceClick(name, 1)}
                    onZoom={handleZoom} />
                  <DrillPieCard
                    title={`${companyLabel} ${clickedMonth} Month Wise institution Overview (tonnage)`}
                    data={instPie}
                    onSliceClick={(name) => handlePieSliceClick(name, 2)}
                    onZoom={handleZoom} />
                  <DrillPieCard
                    title={`${companyLabel} ${clickedMonth} Month Wise Govt Orders Overview (tonnage)`}
                    data={govtPie}
                    onSliceClick={null}
                    onZoom={handleZoom} />
                </div>
              )}
            </div>
          )}

          {/* SECTION 3 + 3b */}
          {showSection3 && (
            <div key={clickedCatgroup} id="section3" style={{ marginBottom: 20 }}>
              {categoryLoading ? <Spinner text="Loading categories…" /> : (
                <div style={{ display: 'flex', gap: 16 }}>
                  <HBarCard
                    title={`${companyLabel} ${clickedMonth} Month Wise ${pieGroupLabel} and ${clickedCatgroup} Overview (tonnage)`}
                    data={categoryData}
                    onBarClick={handleCategoryBarClick}
                    onZoom={handleZoom} />
                  {showSection3b && (
                    <div key={clickedCategory} id="section3b" style={{ flex: 1 }}>
                      {codeLoading ? <Spinner text="Loading items…" /> : (
                        <MirroredHBarCard
                          title={`${companyLabel} ${clickedMonth} Month Wise ${pieGroupLabel} and ${clickedCatgroup} with ${clickedCategory} Category Overview (tonnage)`}
                          data={codeData}
                          onZoom={handleZoom} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {zoomChart && <ZoomModal chart={zoomChart} onClose={() => setZoomChart(null)} />}
    </div>
  );
}
