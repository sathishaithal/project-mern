/**
 * ChartComponents.jsx
 * All chart sub-components used by ChartsPage.
 * Extracted from ChartsPage.jsx to reduce file size.
 */
import React, { useState, useEffect, useRef } from 'react';
import ThemedTooltip from '../../../../components/ui/Tooltip';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  PieChart, Pie, ResponsiveContainer,
} from 'recharts';
import Select from 'react-select';
import { useColorMode } from '../../../../theme/ThemeContext';
import { useSalesSelectStyles } from '../filters/useSalesSelectStyles';

// ── Shared utilities ─────────────────────────────────────────────────────────

export function getChartColors(accent, accent2) {
  return [
    accent, accent2,
    '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#6366f1', '#14b8a6',
    '#f97316', '#a855f7',
  ];
}

export const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTH_KEYS   = ['jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
                             'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage'];
export const Q_KEYS = [
  ['jantonnage','febtonnage','martonnage'],
  ['aprtonnage','maytonnage','juntonnage'],
  ['jultonnage','augtonnage','septonnage'],
  ['octtonnage','novtonnage','dectonnage'],
];

export const scrollTo = (id) => {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
};

// ── Constants ─────────────────────────────────────────────────────────────────

export const VIEW_OPTIONS = [
  { value: 'Year',      label: 'Year (monthly)' },
  { value: 'Quarterly', label: 'Quarterly' },
];
export const YR_FILTER_OPTIONS = [
  { value: '-Select-',  label: '-Select-' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
];

export const SHOP_RESTRICTED_ROLES = ['Distributor', 'Sales Man', 'Sales Executive', 'Asst. Manager Sales'];

export const DW_DAYSEL_OPTIONS  = [
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'today',     label: 'Today' },
  { value: '7days',     label: 'Last 7 Days' },
  { value: '30days',    label: 'Last 30 Days' },
  { value: 'month',     label: 'This Month' },
  { value: 'lmonth',    label: 'Last Month' },
];
export const DW_METHOD_OPTIONS  = [{ value: 'Distribution', label: 'Distribution' }, { value: 'Shops', label: 'Shops' }];
export const DW_COMPANY_OPTIONS = [{ value: 'SBL', label: 'SBL' }, { value: 'BALAJI', label: 'BALAJI' }];
export const DW_FILTER_OPTIONS  = ['Category group','Category','Code'].map(v => ({ value: v, label: v }));
export const DW_BASEDON_OPTIONS = ['Tonnage','Amount'].map(v => ({ value: v, label: v }));
const DW_ENTRIES_OPTIONS = [5, 10, 15, 20, 25, 50];

// ── InsidePieLabel ─────────────────────────────────────────────────────────────

const InsidePieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.04) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text textAnchor="middle" fill="#fff" fontSize={8} fontWeight={600}>
      <tspan x={x} y={y - 5}>{parseFloat(value).toFixed(2)}</tspan>
      <tspan x={x} y={y + 6}>{(percent * 100).toFixed(0)}%</tspan>
    </text>
  );
};

// ── ZoomModal ──────────────────────────────────────────────────────────────────

export function ZoomModal({ chart, onClose }) {
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
          <ThemedTooltip content="Close">
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>✕</button>
          </ThemedTooltip>
        </div>
        {chart.content}
      </div>
    </div>
  );
}

// ── ChartCard ──────────────────────────────────────────────────────────────────

export function ChartCard({ title, onZoom, children, style = {} }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent    = selectedAccent?.primary   || '#1a237e';
  const accent2   = selectedAccent?.secondary || '#283593';
  const cardBg    = isDarkMode ? '#1e293b' : 'white';
  const borderClr = isDarkMode ? '#334155' : '#e2e8f0';
  return (
    <div style={{ flex: 1, background: cardBg, borderRadius: 12, border: `1px solid ${borderClr}`, overflow: 'visible', boxShadow: '0 2px 10px rgba(37,99,235,0.07)', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 1rem', background: `linear-gradient(90deg, ${accent}, ${accent2})`, borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{title}</span>
        <ThemedTooltip content="Expand">
          <button onClick={onZoom} aria-label="Expand chart" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>⛶</button>
        </ThemedTooltip>
      </div>
      <div style={{ padding: '0.8rem 1rem' }}>{children}</div>
    </div>
  );
}

// ── BarChartCard ───────────────────────────────────────────────────────────────

export function BarChartCard({ title, data, viewMode, onViewModeChange, onZoom,
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
    return <text x={x + width / 2} y={y - 4} fill={labelFill} textAnchor="middle" fontSize={10} fontWeight={600}>{parseFloat(value).toFixed(2)}</text>;
  };

  const barTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', minWidth: 110 }}>
        <div style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})`, padding: '5px 10px', color: 'white', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
          {label}
        </div>
        <div style={{ padding: '6px 10px', color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>
          {parseFloat(payload[0].value).toFixed(2)}
        </div>
      </div>
    );
  };

  const chart = (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 22, right: 10, left: 0, bottom: 0 }}
        onClick={onBarClick ? (d) => { const lbl = d?.activeLabel || d?.activePayload?.[0]?.payload?.name; if (lbl) onBarClick(lbl); } : undefined}
        style={{ cursor: onBarClick ? 'pointer' : 'default' }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisClr }} />
        <YAxis tick={{ fontSize: 10, fill: axisClr }} />
        <Tooltip content={barTooltip} cursor={false} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive animationDuration={600}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          <LabelList dataKey="value" content={topLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
        {isMultiYear ? (
          <>
            <span style={{ fontSize: '0.7rem', color: labelFill, fontWeight: 600, whiteSpace: 'nowrap' }}>Group by :</span>
            <Select
              options={YR_FILTER_OPTIONS}
              value={YR_FILTER_OPTIONS.find(o => o.value === yrFilterMode) || YR_FILTER_OPTIONS[0]}
              onChange={sel => { onYrModeChange(sel.value); onYrSubChange('-Select-'); }}
              styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
            <span style={{ fontSize: '0.7rem', color: labelFill, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {yrFilterMode === 'monthly' ? 'Month :' : yrFilterMode === 'Quarterly' ? 'Quarter :' : 'Period :'}
            </span>
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
          <>
            <span style={{ fontSize: '0.7rem', color: labelFill, fontWeight: 600 }}>View :</span>
            <Select
              options={VIEW_OPTIONS}
              value={VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0]}
              onChange={sel => onViewModeChange(sel.value)}
              styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
          </>
        )}
      </div>
      {chart}
    </ChartCard>
  );
}

// ── PieChartCard ───────────────────────────────────────────────────────────────

export function PieChartCard({ title, data, viewMode, onViewModeChange, onZoom, onPieClick, isMultiYear,
  yrFilterMode, yrFilterSub, yrSubOptions, onYrModeChange, onYrSubChange }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const selStyles  = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6, minWidth: 130 });
  const legendClr  = isDarkMode ? '#94a3b8' : '#475569';
  const labelFill  = isDarkMode ? '#94a3b8' : '#475569';
  const nonZero    = data.filter(d => d.value > 0);
  const total      = nonZero.reduce((s, d) => s + d.value, 0);
  const yrSubSelOpts = (yrSubOptions || []).map(v => ({ value: v, label: v }));

  const [hiddenNames, setHiddenNames] = React.useState(new Set());
  const toggleHidden = React.useCallback((name) => {
    setHiddenNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  const visibleData = nonZero.filter(d => !hiddenNames.has(d.name));

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', minWidth: 130 }}>
        <div style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})`, padding: '5px 10px', color: 'white', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
          {d.name}
        </div>
        <div style={{ padding: '6px 10px', color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>
          {parseFloat(d.value).toFixed(2)}
        </div>
      </div>
    );
  };

  const chart = (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie data={visibleData} cx="50%" cy="50%" outerRadius={100}
            labelLine={false} label={InsidePieLabel} dataKey="value"
            onClick={onPieClick ? (entry) => onPieClick(entry.name) : undefined}
            style={{ cursor: onPieClick ? 'pointer' : 'default' }}
            isAnimationActive animationDuration={700}>
            {visibleData.map((d) => {
              const origIdx = data.indexOf(d);
              return <Cell key={d.name} fill={colors[origIdx % colors.length]} />;
            })}
          </Pie>
          <Tooltip content={renderTooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6, justifyContent: 'center', paddingBottom: 2 }}>
        {nonZero.map((d) => {
          const origIdx = data.indexOf(d);
          const isHidden = hiddenNames.has(d.name);
          const color = colors[origIdx % colors.length];
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={d.name} onClick={() => toggleHidden(d.name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.66rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: isHidden ? '#9ca3af' : color, flexShrink: 0 }} />
              <span style={{ textDecoration: isHidden ? 'line-through' : 'none', opacity: isHidden ? 0.45 : 1, color: legendClr }}>
                {d.name} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
        {isMultiYear ? (
          <>
            <span style={{ fontSize: '0.7rem', color: labelFill, fontWeight: 600, whiteSpace: 'nowrap' }}>Group by :</span>
            <Select
              options={YR_FILTER_OPTIONS}
              value={YR_FILTER_OPTIONS.find(o => o.value === yrFilterMode) || YR_FILTER_OPTIONS[0]}
              onChange={sel => { onYrModeChange(sel.value); onYrSubChange('-Select-'); }}
              styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
            <span style={{ fontSize: '0.7rem', color: labelFill, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {yrFilterMode === 'monthly' ? 'Month :' : yrFilterMode === 'Quarterly' ? 'Quarter :' : 'Period :'}
            </span>
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
          <>
            <span style={{ fontSize: '0.7rem', color: labelFill, fontWeight: 600 }}>View :</span>
            <Select options={VIEW_OPTIONS}
              value={VIEW_OPTIONS.find(o => o.value === viewMode) || VIEW_OPTIONS[0]}
              onChange={sel => onViewModeChange(sel.value)}
              styles={selStyles} isSearchable={false}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
          </>
        )}
      </div>
      {chart}
    </ChartCard>
  );
}

// ── DrillPieCard ───────────────────────────────────────────────────────────────

export function DrillPieCard({ title, data, onSliceClick, onZoom }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const legendClr = isDarkMode ? '#94a3b8' : '#475569';
  const total = data.reduce((s, r) => s + r.value, 0);

  const [hiddenNames, setHiddenNames] = React.useState(new Set());
  const toggleHidden = React.useCallback((name) => {
    setHiddenNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  const visibleData = data.filter(d => !hiddenNames.has(d.name));

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', minWidth: 130 }}>
        <div style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})`, padding: '5px 10px', color: 'white', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
          {d.name}
        </div>
        <div style={{ padding: '6px 10px', color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>
          {parseFloat(d.value).toFixed(2)}
        </div>
      </div>
    );
  };

  const chart = (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie data={visibleData} cx="50%" cy="50%" outerRadius={90}
            labelLine={false} label={InsidePieLabel} dataKey="value"
            onClick={(entry) => onSliceClick && onSliceClick(entry.name)}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            isAnimationActive animationDuration={700}>
            {visibleData.map((d) => {
              const origIdx = data.indexOf(d);
              return <Cell key={d.name} fill={colors[origIdx % colors.length]} />;
            })}
          </Pie>
          <Tooltip content={renderTooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6, justifyContent: 'center', paddingBottom: 2 }}>
        {data.map((d, i) => {
          const isHidden = hiddenNames.has(d.name);
          const color = colors[i % colors.length];
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={d.name} onClick={() => toggleHidden(d.name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.66rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: isHidden ? '#9ca3af' : color, flexShrink: 0 }} />
              <span style={{ textDecoration: isHidden ? 'line-through' : 'none', opacity: isHidden ? 0.45 : 1, color: legendClr }}>
                {d.name}: {parseFloat(d.value).toFixed(2)} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)} style={{ flex: 1 }}>
      {data.length === 0
        ? <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No data</div>
        : chart}
    </ChartCard>
  );
}

// ── DwFullTooltip ──────────────────────────────────────────────────────────────

export function DwFullTooltip({ active, payload, isDarkMode: dark }) {
  const { selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  if (!active || !payload?.[0]) return null;
  const d   = payload[0].payload;
  const clr = dark ? '#e2e8f0' : '#1e293b';
  const mut = dark ? '#94a3b8' : '#64748b';
  const bg  = dark ? '#1e293b' : '#fff';
  const n   = (v) => (parseFloat(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return (
    <div style={{ background: bg, border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.22)', minWidth: 190, fontSize: '0.73rem' }}>
      <div style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})`, padding: '5px 10px', color: 'white', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>{d.name}</div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ color: clr }}>Tonnage : <b>{n(d.tonnage ?? d.value)}</b></div>
        <div style={{ color: mut }}>LY Tonnage : {n(d.ly_tonnage)}</div>
        <div style={{ color: clr, marginTop: 3 }}>Amount : <b>{n(d.amount)}</b></div>
        <div style={{ color: mut }}>LY Amount : {n(d.ly_amount)}</div>
      </div>
    </div>
  );
}

// ── HBarCard ───────────────────────────────────────────────────────────────────

export function HBarCard({ title, data, onBarClick, onZoom, showFullTooltip = false }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent   = selectedAccent?.primary   || '#1a237e';
  const accent2  = selectedAccent?.secondary || '#283593';
  const colors   = getChartColors(accent, accent2);
  const axisClr  = isDarkMode ? '#94a3b8' : '#64748b';
  const textClr  = isDarkMode ? '#e2e8f0' : '#1e293b';
  const gridClr  = isDarkMode ? '#334155' : '#f1f5f9';
  const labelClr = isDarkMode ? '#94a3b8' : '#475569';
  const total    = data.reduce((s, r) => s + r.value, 0);
  const hbarTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', minWidth: 120 }}>
        <div style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})`, padding: '5px 10px', color: 'white', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
          {d.name}
        </div>
        <div style={{ padding: '6px 10px', color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>
          {parseFloat(d.value).toFixed(2)}
        </div>
      </div>
    );
  };
  const hbarLabel = ({ x, y, width, height, value }) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return (
      <text x={x + width + 6} y={y + height / 2} fill={labelClr} dominantBaseline="central" fontSize={9}>
        {parseFloat(value).toFixed(2)} ({pct}%)
      </text>
    );
  };
  const barH = Math.max(200, data.length * 40 + 40);
  const chart = (
    <ResponsiveContainer width="100%" height={barH}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 130, left: 10, bottom: 0 }}
        style={{ cursor: onBarClick ? 'pointer' : 'default' }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridClr} />
        <XAxis type="number" tick={{ fontSize: 10, fill: axisClr }} />
        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fill: textClr, fontWeight: 500 }} />
        <Tooltip content={showFullTooltip ? <DwFullTooltip isDarkMode={isDarkMode} /> : hbarTooltip} cursor={false} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive animationDuration={600}
          onClick={onBarClick ? (barData) => { if (barData) onBarClick(barData); } : undefined}>
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

// ── MirroredHBarCard ───────────────────────────────────────────────────────────

export function MirroredHBarCard({ title, data, onBarClick, onZoom }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  const colors  = getChartColors(accent, accent2);
  const axisClr = isDarkMode ? '#94a3b8' : '#64748b';
  const textClr = isDarkMode ? '#e2e8f0' : '#1e293b';
  const gridClr = isDarkMode ? '#334155' : '#f1f5f9';
  const bdrClr  = isDarkMode ? '#334155' : '#e2e8f0';

  const chartData = data.map(r => ({
    name:       r.name,
    tonnage:    Math.abs(parseFloat(r.tonnage ?? r.value ?? 0)),
    amount:     parseFloat(r.amount ?? 0) / 100000,
    _tonnage:   parseFloat(r.tonnage ?? r.value ?? 0),
    _amount:    parseFloat(r.amount ?? 0),
    ly_tonnage: parseFloat(r.ly_tonnage ?? 0) || 0,
    ly_amount:  parseFloat(r.ly_amount ?? 0)  || 0,
  }));

  const maxTonnage = Math.max(...chartData.map(r => r.tonnage), 0.1);
  const maxAmount  = Math.max(...chartData.map(r => r.amount),  0.1);
  const tonPadded  = maxTonnage * 1.2;
  const amtPadded  = maxAmount  * 1.2;

  const barH = Math.max(180, data.length * 28 + 40);
  const handleBarClick = onBarClick ? (barData) => { if (barData?.name) onBarClick(barData); } : undefined;

  const makeTooltip = (field, lyField, label, lyLabel) => ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d   = payload[0].payload;
    const bg  = isDarkMode ? '#1e293b' : '#ffffff';
    const clr = isDarkMode ? '#e2e8f0' : '#1e293b';
    const mut = isDarkMode ? '#94a3b8' : '#64748b';
    const n   = v => Math.abs(parseFloat(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return (
      <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.26)', minWidth: 175, fontSize: '0.72rem' }}>
        <div style={{ background: accent, padding: '7px 13px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.03em' }}>{d.name}</div>
        </div>
        <div style={{ background: bg, border: `1px solid ${bdrClr}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '8px 13px', textAlign: 'center' }}>
          <div style={{ color: mut, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', marginBottom: 4 }}>THIS YEAR</div>
          <div style={{ color: clr, marginBottom: 6 }}>{label} : <b>{n(d[field])}</b></div>
          <div style={{ height: 1, background: bdrClr, margin: '6px 0' }} />
          <div style={{ color: mut, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', marginBottom: 4 }}>LAST YEAR</div>
          <div style={{ color: mut }}>{lyLabel} : {n(d[lyField])}</div>
        </div>
      </div>
    );
  };
  const tonnageTooltip = makeTooltip('_tonnage', 'ly_tonnage', 'Tonnage', 'LY Tonnage');
  const amountTooltip  = makeTooltip('_amount',  'ly_amount',  'Amount',  'LY Amount');

  const centerTick = ({ x, y, payload }) => {
    const full = payload.value;
    if (full.length <= 17) {
      return (
        <text x={x + 60} y={y} fill={textClr} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={500}>
          {full}
        </text>
      );
    }
    const mid = Math.floor(full.length / 2);
    let split = full.lastIndexOf(' ', mid + 5);
    if (split < 2) split = mid;
    const l1 = full.slice(0, split).trim();
    const l2 = full.slice(split).trim();
    return (
      <text textAnchor="middle" fontSize={8} fontWeight={500}>
        <tspan x={x + 60} y={y - 5} fill={textClr}>{l1.length > 17 ? l1.slice(0, 16) + '…' : l1}</tspan>
        <tspan x={x + 60} y={y + 6} fill={textClr}>{l2.length > 17 ? l2.slice(0, 16) + '…' : l2}</tspan>
      </text>
    );
  };

  const chart = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', cursor: onBarClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', width: '100%', marginBottom: 2 }}>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>◄ Tonnage</div>
        <div style={{ width: 120, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: accent2 || accent, letterSpacing: '0.04em' }}>Amount (Lacs) ►</div>
      </div>
      <div style={{ display: 'flex', width: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={barH}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="35%"
              margin={{ top: 0, right: 0, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridClr} />
              <XAxis type="number" domain={[0, tonPadded]} reversed
                tick={{ fontSize: 9, fill: axisClr }}
                tickFormatter={v => v === 0 ? '' : parseFloat(v).toFixed(2)}
              />
              <YAxis dataKey="name" type="category" orientation="right" width={120}
                tick={centerTick} tickLine={false} axisLine={false}
              />
              <Tooltip content={tonnageTooltip} cursor={false} />
              <Bar dataKey="tonnage" barSize={16} isAnimationActive animationDuration={600} animationBegin={0} onClick={handleBarClick}>
                {chartData.map((_, i) => <Cell key={`t${i}`} fill={colors[(i + 6) % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={barH}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="35%"
              margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridClr} />
              <XAxis type="number" domain={[0, amtPadded]}
                tick={{ fontSize: 9, fill: axisClr }}
                tickFormatter={v => v === 0 ? '' : `${v % 1 === 0 ? v : v.toFixed(1)}Lacs`}
              />
              <YAxis dataKey="name" type="category" hide width={0} />
              <Tooltip content={amountTooltip} cursor={false} />
              <Bar dataKey="amount" barSize={16} isAnimationActive animationDuration={600} animationBegin={0} onClick={handleBarClick}>
                {chartData.map((_, i) => <Cell key={`a${i}`} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <ChartCard title={title} onZoom={() => onZoom(title, chart)} style={{ flex: 1 }}>
      {chart}
    </ChartCard>
  );
}

// ── EntriesSelect ──────────────────────────────────────────────────────────────

function EntriesSelect({ value, onChange, accent, isDarkMode, borderClr }) {
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
        border: `1.5px solid ${accent}`,
        background: isDarkMode ? '#1e293b' : '#fff',
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
          {DW_ENTRIES_OPTIONS.map(n => (
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

// ── DwTableCard ────────────────────────────────────────────────────────────────

export function DwTableCard({ title, data, basedon }) {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent    = selectedAccent?.primary   || '#1a237e';
  const accent2   = selectedAccent?.secondary || '#283593';
  const cardBg    = isDarkMode ? '#1e293b' : 'white';
  const borderClr = isDarkMode ? '#334155' : '#e2e8f0';
  const headerBg  = isDarkMode ? 'rgba(0,0,0,0.22)' : '#f8fafc';
  const titleClr  = isDarkMode ? '#e2e8f0' : '#1e293b';
  const rowEven   = isDarkMode ? '#0f172a' : 'white';
  const rowOdd    = isDarkMode ? '#1e293b' : '#f8fafc';
  const muted     = isDarkMode ? '#94a3b8' : '#64748b';
  const dz = (v) => { const n = parseFloat(v) || 0; const s = n.toFixed(2); return n === 0 ? <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>{s}</span> : s; };

  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  useEffect(() => { setPage(1); }, [data, rowsPerPage]);
  const totalPages  = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const pageRows    = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startNum    = data.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endNum      = Math.min(page * rowsPerPage, data.length);

  const pgBtn = (disabled, onClick, label) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? 'transparent' : accent,
      color: disabled ? muted : 'white',
      border: `1px solid ${disabled ? borderClr : accent}`,
      borderRadius: 5, padding: '2px 8px', fontSize: '0.72rem',
      cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600,
    }}>{label}</button>
  );

  const pageNums = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pageNums.push(p);
    else if (Math.abs(p - page) === 2) pageNums.push('…');
  }
  const deduped = pageNums.filter((v, i, a) => v !== '…' || a[i - 1] !== '…');

  return (
    <div style={{ flex: 1, background: cardBg, borderRadius: 12, border: `1px solid ${borderClr}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(37,99,235,0.07)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.55rem 1rem', borderBottom: `1px solid ${borderClr}`, background: `linear-gradient(90deg, ${accent}, ${accent2})`, borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr style={{ background: headerBg, position: 'sticky', top: 0 }}>
              <th style={{ padding: '5px 8px', textAlign: 'center',  borderBottom: `1px solid ${borderClr}`, color: accent, fontWeight: 600 }}>#</th>
              <th style={{ padding: '5px 8px', textAlign: 'left',   borderBottom: `1px solid ${borderClr}`, color: accent, fontWeight: 600 }}>Category</th>
              <th style={{ padding: '5px 8px', textAlign: 'right',  borderBottom: `1px solid ${borderClr}`, color: accent, fontWeight: 600 }}>Tonnage</th>
              <th style={{ padding: '5px 8px', textAlign: 'right',  borderBottom: `1px solid ${borderClr}`, color: accent, fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '5px 8px', textAlign: 'right',  borderBottom: `1px solid ${borderClr}`, color: accent, fontWeight: 600 }}>LY Tonnage</th>
              <th style={{ padding: '5px 8px', textAlign: 'right',  borderBottom: `1px solid ${borderClr}`, color: accent, fontWeight: 600 }}>LY Amount</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const globalIdx = (page - 1) * rowsPerPage + i + 1;
              return (
                <tr key={r.name} style={{ background: i % 2 === 0 ? rowEven : rowOdd }}>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: muted }}>{globalIdx}</td>
                  <td style={{ padding: '4px 8px', color: titleClr, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: titleClr }}>{dz(r.tonnage ?? r.value)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: titleClr }}>{dz(r.amount)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: titleClr }}>{dz(r.ly_tonnage)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: titleClr }}>{dz(r.ly_amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderTop: `1px solid ${borderClr}`, background: headerBg, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.67rem', color: muted, fontWeight: 600 }}>Show</span>
          <EntriesSelect value={rowsPerPage} onChange={(n) => { setRowsPerPage(n); setPage(1); }} accent={accent} isDarkMode={isDarkMode} borderClr={borderClr} />
          <span style={{ fontSize: '0.67rem', color: muted, fontWeight: 600 }}>entries</span>
          <span style={{ fontSize: '0.67rem', color: muted, marginLeft: 8 }}>
            {data.length === 0 ? 'No data' : `Showing ${startNum} to ${endNum} of ${data.length}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {pgBtn(page <= 1, () => setPage(1), '«')}
          {pgBtn(page <= 1, () => setPage(p => p - 1), '‹')}
          {deduped.map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} style={{ color: muted, fontSize: '0.72rem', padding: '0 2px' }}>…</span>
              : <button key={p} onClick={() => setPage(p)} style={{
                  background: p === page ? accent : 'transparent',
                  color: p === page ? 'white' : titleClr,
                  border: `1px solid ${p === page ? accent : borderClr}`,
                  borderRadius: 5, padding: '2px 7px', fontSize: '0.72rem',
                  cursor: 'pointer', fontWeight: p === page ? 700 : 400,
                }}>{p}</button>
          )}
          {pgBtn(page >= totalPages, () => setPage(p => p + 1), '›')}
          {pgBtn(page >= totalPages, () => setPage(totalPages), '»')}
        </div>
      </div>
    </div>
  );
}
