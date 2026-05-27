import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  PieChart, Pie, Legend, ResponsiveContainer,
} from 'recharts';
import Select from 'react-select';
import './Sales.css';
import { useSalesSelectStyles } from './filters/useSalesSelectStyles';
import SummaryCards from './SummaryCards';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import {
  getGraphMonthwise,
  getGraphCatgroup,
  getGraphSellingDataByCategory,
  getGraphCategoryWithCode,
  getGraphSellingData,
  getGraphSellingDataByItem,
} from '../../../services/salesDashboardApi';

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
        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{title}</span>
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

function BarChartCard({ title, data, viewMode, onViewModeChange, onBarClick, onZoom }) {
  const selStyles = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6, minWidth: 130 });
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
  const selStyles = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6, minWidth: 130 });
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

const SHOP_RESTRICTED_ROLES = ['Distributor', 'Sales Man', 'Sales Executive', 'Asst. Manager Sales'];

const DW_DAYSEL_OPTIONS  = ['yesterday','today','7days','30days','month','lmonth'].map(v => ({ value: v, label: v }));
const DW_METHOD_OPTIONS  = [{ value: 'Distribution', label: 'Distribution' }, { value: 'Shops', label: 'Shops' }];
const DW_COMPANY_OPTIONS = ['ALL','SBL','BALAJI'].map(v => ({ value: v, label: v }));
const DW_FILTER_OPTIONS  = ['Category group','Category','Item'].map(v => ({ value: v, label: v }));
const DW_BASEDON_OPTIONS = ['Tonnage','Amount'].map(v => ({ value: v, label: v }));

export default function ChartsPage({ loggedInRolex }) {
  const { user }    = useAuth();
  const employeename = user?.username;
  const { multiyear, monthwisecompany, monthwisedisttype } = useSalesFilterStore();

  const rolex = typeof loggedInRolex === 'string' ? loggedInRolex : (loggedInRolex?.designation || '');
  const showShopsOption = !SHOP_RESTRICTED_ROLES.includes(rolex);
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent = selectedAccent?.primary || '#1a237e';
  const selStyles = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [chartTab,     setChartTab]     = useState('monthwise');
  const [viewMode,     setViewMode]     = useState('Year');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomChart,    setZoomChart]    = useState(null);
  const [error,        setError]        = useState(null);

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

  const [dwBasedon,         setDwBasedon]         = useState('Tonnage');
  const [dwDaysel,          setDwDaysel]           = useState('yesterday');
  const [dwMethod,          setDwMethod]           = useState('Distribution');
  const [dwCompany,         setDwCompany]          = useState('ALL');
  const [dwFilter,          setDwFilter]           = useState('Category group');
  const [dwSortAsc,         setDwSortAsc]          = useState(false);
  const [dwLevel1,          setDwLevel1]           = useState([]);
  const [dwLevel2,          setDwLevel2]           = useState([]);
  const [dwLevel3,          setDwLevel3]           = useState([]);
  const [dwL1Loading,       setDwL1Loading]        = useState(false);
  const [dwL2Loading,       setDwL2Loading]        = useState(false);
  const [dwL3Loading,       setDwL3Loading]        = useState(false);
  const [dwClickedCatgroup, setDwClickedCatgroup]  = useState(null);
  const [dwClickedCategory, setDwClickedCategory]  = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

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
      const selectedyear = Array.isArray(multiyear)
        ? String(multiyear[multiyear.length - 1])
        : String(multiyear);
      const rows = await getGraphCatgroup({
        selectedyear, month: label, monthwisedisttype, monthwisecompany,
      });
      setCatgroupRaw(Array.isArray(rows) ? rows : []);
    } catch { setCatgroupRaw([]); }
    setCatgroupLoading(false);
    scrollTo('section2');
  }, [multiyear, monthwisedisttype, monthwisecompany]);

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
      // backend: getsellingdata1_SVS.php — param is "label" (the catgroup name)
      const rows = await getGraphSellingDataByCategory({
        label: catgroupName,
        daysel: clickedMonth,
        method: monthwisedisttype,
        company: monthwisecompany,
        basedon: 'Tonnage',
      });
      setCategoryData(Array.isArray(rows)
        ? rows.map(r => ({ name: r.catgroup, value: parseFloat(r.tonnage) || 0 }))
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
      const selectedyear = Array.isArray(multiyear)
        ? String(multiyear[multiyear.length - 1])
        : String(multiyear);
      const rows = await getGraphCategoryWithCode({
        selectedyear,
        month: clickedMonth,
        catgroup: clickedCatgroup,
        category: payload.name,
        dataget: String(clickedPieGroup || 1),
        monthwisedisttype,
        monthwisecompany,
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
  }, [multiyear, clickedMonth, clickedCatgroup, clickedPieGroup, monthwisedisttype, monthwisecompany]);

  const showSection3b = codeData.length > 0 || codeLoading;

  const sortedDwLevel1 = useMemo(() => {
    const copy = [...dwLevel1];
    copy.sort((a, b) => dwSortAsc ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel1, dwSortAsc]);

  const sortedDwLevel2 = useMemo(() => {
    const copy = [...dwLevel2];
    copy.sort((a, b) => dwSortAsc ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel2, dwSortAsc]);

  const sortedDwLevel3 = useMemo(() => {
    const copy = [...dwLevel3];
    copy.sort((a, b) => dwSortAsc ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel3, dwSortAsc]);

  const fetchDwData = useCallback(async () => {
    setDwL1Loading(true);
    setDwLevel1([]); setDwLevel2([]); setDwLevel3([]);
    setDwClickedCatgroup(null); setDwClickedCategory(null);
    try {
      // Route 17: getGraphSellingData returns res.data (not .list) — shape: { list: [...], list1: [...] }
      const result = await getGraphSellingData({
        daysel: dwDaysel, method: dwMethod, company: dwCompany,
        basedon: dwBasedon, grdaiyfilter: dwFilter, employeename,
      });
      const list = Array.isArray(result) ? result : (result?.list ?? []);
      setDwLevel1(list.map(r => ({
        name:  r.catgroup,
        value: parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
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
      // Route 16: getGraphSellingDataByCategory — returns array of { catgroup, tonnage, amount, ... }
      const rows = await getGraphSellingDataByCategory({
        label: payload.name, daysel: dwDaysel, method: dwMethod,
        company: dwCompany, basedon: dwBasedon,
      });
      setDwLevel2(Array.isArray(rows) ? rows.map(r => ({
        name:  r.catgroup,
        value: parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
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
      // Route 18: getGraphSellingDataByItem — NOTE: "catgory" is intentional PHP typo
      const rows = await getGraphSellingDataByItem({
        catgory: dwClickedCatgroup, label: payload.name,
        daysel: dwDaysel, method: dwMethod, company: dwCompany, basedon: dwBasedon,
      });
      setDwLevel3(Array.isArray(rows) ? rows.map(r => ({
        name:  r.catgroup,
        value: parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
      })) : []);
    } catch { setDwLevel3([]); }
    setDwL3Loading(false);
    scrollTo('dw-section3');
  }, [dwClickedCatgroup, dwDaysel, dwMethod, dwCompany, dwBasedon]);

  const handleZoom = (title, content) => setZoomChart({ title, content });

  const pieGroupLabel = clickedPieGroup === 2 ? 'institution'
    : clickedPieGroup === 3 ? 'Govt Orders' : 'Distribution';

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

  return (
    <div className={isFullscreen ? 'fullscreen-content' : ''} style={{ width: '100%' }}>
      {!isFullscreen && <SummaryCards />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
          {[{ id: 'monthwise', label: 'Month Wise' }, { id: 'daywise', label: 'Day Wise' }].map(t => (
            <button key={t.id} onClick={() => setChartTab(t.id)} style={{
              background: chartTab === t.id ? '#1565c0' : 'none',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              padding: '0.35rem 1rem', fontSize: '0.8rem',
              fontWeight: chartTab === t.id ? 700 : 500,
              color: chartTab === t.id ? 'white' : '#475569',
              transition: 'all 0.18s',
            }}>{t.label}</button>
          ))}
        </div>
        <button onClick={() => setIsFullscreen(p => !p)}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{ background: isFullscreen ? '#1565c0' : 'transparent', border: '2px solid #1565c0', borderRadius: 4, color: isFullscreen ? 'white' : '#1565c0', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, transition: 'all 0.18s' }}>
          <ExpandSVG active={isFullscreen} />
        </button>
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
                  <span style={{ background: accent }} />
                  <span style={{ background: accent }} />
                  <span style={{ background: accent }} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1 */}
              <div id="section1" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 20 }}>
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
                  {catgroupLoading ? <LoaderOverlay text="Loading Category Groups" /> : (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
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
                  {categoryLoading ? <LoaderOverlay text="Loading Categories" /> : (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                      <HBarCard
                        title={`${companyLabel} ${clickedMonth} Month Wise ${pieGroupLabel} and ${clickedCatgroup} Overview (tonnage)`}
                        data={categoryData}
                        onBarClick={handleCategoryBarClick}
                        onZoom={handleZoom} />
                      {showSection3b && (
                        <div key={clickedCategory} id="section3b" style={{ flex: 1 }}>
                          {codeLoading ? <LoaderOverlay text="Loading Items" /> : (
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
        </>
      )}

      {/* ── DAY WISE ── */}
      {chartTab === 'daywise' && (
        <>
          {/* Day-Wise filter bar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <Select
              options={DW_DAYSEL_OPTIONS}
              value={DW_DAYSEL_OPTIONS.find(o => o.value === dwDaysel)}
              onChange={o => setDwDaysel(o.value)}
              styles={selStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Period"
            />
            {showShopsOption && (
              <Select
                options={DW_METHOD_OPTIONS}
                value={DW_METHOD_OPTIONS.find(o => o.value === dwMethod)}
                onChange={o => setDwMethod(o.value)}
                styles={selStyles}
                isSearchable={false}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                placeholder="Method"
              />
            )}
            <Select
              options={DW_COMPANY_OPTIONS}
              value={DW_COMPANY_OPTIONS.find(o => o.value === dwCompany)}
              onChange={o => setDwCompany(o.value)}
              styles={selStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Company"
            />
            <Select
              options={DW_FILTER_OPTIONS}
              value={DW_FILTER_OPTIONS.find(o => o.value === dwFilter)}
              onChange={o => setDwFilter(o.value)}
              styles={selStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Group by"
            />
            <Select
              options={DW_BASEDON_OPTIONS}
              value={DW_BASEDON_OPTIONS.find(o => o.value === dwBasedon)}
              onChange={o => setDwBasedon(o.value)}
              styles={selStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              placeholder="Based on"
            />
            <button onClick={fetchDwData} disabled={dwL1Loading} style={{
              background: '#1565c0', border: 'none', color: 'white', borderRadius: 6,
              padding: '0.35rem 1rem', fontSize: '0.78rem', fontWeight: 600,
              cursor: dwL1Loading ? 'not-allowed' : 'pointer', opacity: dwL1Loading ? 0.6 : 1,
            }}>
              {dwL1Loading ? 'Loading…' : 'Apply'}
            </button>
            <button onClick={() => setDwSortAsc(p => !p)} title="Toggle sort order" style={{
              background: 'none', border: '1px solid #cbd5e1', color: '#475569',
              borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer',
            }}>
              {dwSortAsc ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>

          {/* Day-Wise Level 1 */}
          {(dwL1Loading || dwLevel1.length > 0) && (
            <div id="dw-section1" style={{ marginBottom: 20 }}>
              {dwL1Loading ? <LoaderOverlay text="Loading Day-Wise Data" /> : (
                <HBarCard
                  title={`Day Wise — ${dwFilter} (${dwBasedon}) [${dwDaysel}]`}
                  data={sortedDwLevel1}
                  onBarClick={handleDwBarClick}
                  onZoom={handleZoom} />
              )}
            </div>
          )}

          {/* Day-Wise Level 2 */}
          {(dwL2Loading || dwLevel2.length > 0) && (
            <div id="dw-section2" style={{ marginBottom: 20 }}>
              {dwL2Loading ? <LoaderOverlay text="Loading Breakdown" /> : (
                <HBarCard
                  title={`Day Wise — ${dwClickedCatgroup} breakdown (${dwBasedon})`}
                  data={sortedDwLevel2}
                  onBarClick={handleDwCategoryClick}
                  onZoom={handleZoom} />
              )}
            </div>
          )}

          {/* Day-Wise Level 3 */}
          {(dwL3Loading || dwLevel3.length > 0) && (
            <div id="dw-section3" style={{ marginBottom: 20 }}>
              {dwL3Loading ? <LoaderOverlay text="Loading Items" /> : (
                <HBarCard
                  title={`Day Wise — ${dwClickedCatgroup} → ${dwClickedCategory} items (${dwBasedon})`}
                  data={sortedDwLevel3}
                  onBarClick={null}
                  onZoom={handleZoom} />
              )}
            </div>
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
