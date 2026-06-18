import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import React, { useMemo, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logActivity } from "../services/activityLog";
import { useColorMode } from "../theme/ThemeContext";
import { useSummaryCards } from "../context/SummaryCardsContext";
import SummaryCardsSystem from "../components/SummaryCardsSystem/SummaryCardsSystem";

const fmtT = (v) => {
  const n = parseFloat(v);
  if (!n || isNaN(n)) return null;
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K T';
  return n.toFixed(1) + ' T';
};

const fmtNum = (v) => {
  const n = parseFloat(v);
  if (!n || isNaN(n)) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(1);
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MON_KEYS = ['jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
                  'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage'];

// Animated count-up
function CountUp({ target, duration = 1.2, isDarkMode, style = {} }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return <span style={style}>{val.toLocaleString()}</span>;
}

// Short supply ticker
function ShortSupplyTicker({ items, isDarkMode }) {
  if (!items.length) return null;
  const { all, dur } = useMemo(() => {
    const chunks = items.map(i =>
      `⚠  ${i.description}  ${parseFloat(i.shortsupplytonnage).toFixed(1)} T`
    );
    return { all: [...chunks, ...chunks], dur: Math.max(18, items.length * 3.5) };
  }, [items]);
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
    <div style={{
      overflow: 'hidden',
      background: isDarkMode ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.22)',
      borderRadius: 8,
      padding: '6px 0',
      marginTop: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{
          flexShrink: 0, padding: '0 12px',
          borderRight: '1px solid rgba(239,68,68,0.25)',
          marginRight: 8,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <i className="bi bi-exclamation-circle-fill" style={{ color: '#ef4444', fontSize: '0.72rem' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Short Supply</span>
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: dur, ease: 'linear', repeat: Infinity }}
            style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}
          >
            {all.map((t, i) => (
              <span key={i} style={{ padding: '0 20px', fontSize: '0.72rem', fontWeight: 600, color: isDarkMode ? '#fca5a5' : '#b91c1c' }}>
                {t}
                <span style={{ padding: '0 14px', color: isDarkMode ? '#475569' : '#d1d5db' }}>·</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
    </motion.div>
  );
}

// Monthly mini bar chart
function MonthlyBars({ curRow, accent, accent2, isDarkMode }) {
  const now = new Date();
  const curMon = now.getMonth();
  const vals = MON_KEYS.map(k => parseFloat(curRow?.[k]) || 0);
  const max = Math.max(...vals, 1);
  const hasData = vals.some(v => v > 0);
  if (!hasData) return null;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 56 }}>
      {MONTHS.map((m, i) => {
        const v = vals[i];
        const pct = v > 0 ? Math.max((v / max) * 100, 3) : 0;
        const isCurrent = i === curMon && v > 0;
        const isFuture = i > curMon && v === 0;
        return (
          <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: 44, display: 'flex', alignItems: 'flex-end' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: pct > 0 ? `${pct}%` : '2px' }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.55, ease: 'easeOut' }}
                style={{
                  width: '100%',
                  borderRadius: '2px 2px 0 0',
                  background: isFuture
                    ? (isDarkMode ? '#1e293b' : '#f1f5f9')
                    : isCurrent
                    ? `linear-gradient(180deg, ${accent2}, ${accent})`
                    : `${accent}bb`,
                  border: isFuture ? `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` : 'none',
                }}
              />
            </div>
            <span style={{ fontSize: '0.46rem', color: isDarkMode ? '#64748b' : '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>{m}</span>
          </div>
        );
      })}
    </div>
  );
}

// Year-over-year comparison bars
function YearBars({ multiYearData, accent, accent2, isDarkMode, border }) {
  const rows = useMemo(() => {
    return (multiYearData ?? [])
      .map(r => ({
        year: String(r.year || r.dispatchyear || ''),
        value: parseFloat(r.ttltonnage_crnt) || parseFloat(r.ttltonnage_crntwy) || 0,
      }))
      .filter(r => r.value > 0 && r.year);
  }, [multiYearData]);
  if (!rows.length) return null;
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        const isLatest = i === rows.length - 1;
        const color = isLatest ? accent : accent2;
        return (
          <div key={r.year}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: isLatest ? 700 : 500, color: isLatest ? (isDarkMode ? '#f1f5f9' : '#0f172a') : (isDarkMode ? '#94a3b8' : '#64748b') }}>
                {r.year}
                {isLatest && <span style={{ marginLeft: 5, fontSize: '0.58rem', background: `${accent}22`, color: accent, padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>Latest</span>}
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>{fmtT(r.value)}</span>
            </div>
            <div style={{ height: 7, background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 4, border: `1px solid ${border}`, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.65, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 4 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Short supply progress bars
function ShortSupplyBars({ items, isDarkMode, border }) {
  if (!items.length) return null;
  const max = Math.max(...items.map(r => parseFloat(r.shortsupplytonnage) || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((item, i) => {
        const v = parseFloat(item.shortsupplytonnage) || 0;
        const pct = (v / max) * 100;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.69rem', fontWeight: 600, color: isDarkMode ? '#fca5a5' : '#b91c1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%' }}>
                {item.description}
              </span>
              <span style={{ fontSize: '0.66rem', color: isDarkMode ? '#94a3b8' : '#64748b', flexShrink: 0 }}>
                {v.toFixed(1)} T
              </span>
            </div>
            <div style={{ height: 5, background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 3, border: `1px solid ${border}`, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.55, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: 3 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const ReportCard = ({ title, desc, icon, path, accent, badge, isDarkMode, border, delay = 0 }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      style={{
        flex: '1 1 240px', maxWidth: 340, cursor: 'pointer',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        borderRadius: 16, padding: '1.3rem 1.4rem',
        border: `1px solid ${border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at 100% 0%, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px ${accent}44`,
        }}>
          <i className={`bi ${icon}`} style={{ fontSize: '1.3rem', color: 'white' }} />
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8', lineHeight: 1.55 }}>
          {desc}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: accent, fontSize: '0.75rem', fontWeight: 700 }}>
        Open Report <i className="bi bi-arrow-right" />
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user }    = useAuth();
  const { isDarkMode, selectedAccent } = useColorMode();
  const { dates, multiYearData, shortSupply, sellingData, prodData, prodLoading } = useSummaryCards();

  useEffect(() => { logActivity('Dashboard'); }, []);

  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  const username = user?.username || 'User';
  const textMut  = isDarkMode ? '#94a3b8' : '#64748b';
  const border   = isDarkMode ? '#334155' : '#e2e8f0';
  const cardBg   = isDarkMode ? '#1e293b' : '#ffffff';

  const curRow = useMemo(() => {
    if (!multiYearData?.length) return null;
    return multiYearData[multiYearData.length - 1];
  }, [multiYearData]);

  const ytd    = parseFloat(curRow?.ttltonnage_crnt)   || 0;
  const yoy    = parseFloat(curRow?.ttltonnage_crntwy) || 0;
  const curMon = parseFloat(dates?.currentmonthtonnage
    || (multiYearData ?? []).find(r => parseFloat(r.currentmonthtonnage) > 0)?.currentmonthtonnage) || 0;

  const allShortSupply = useMemo(() =>
    (shortSupply ?? []).filter(r => (parseFloat(r.shortsupplytonnage) || 0) > 0)
      .sort((a, b) => (parseFloat(b.shortsupplytonnage) || 0) - (parseFloat(a.shortsupplytonnage) || 0)),
  [shortSupply]);
  const topShortSupply = allShortSupply.slice(0, 6);

  const reportLinks = [
    { title: 'Production Report', desc: 'Manufacturing output, efficiency metrics and production timelines', icon: 'bi-gear-wide-connected', path: '/reports/production', accent },
    { title: 'Sales Report',      desc: 'Month-wise and year-on-year sales performance with multi-year drill-down', icon: 'bi-graph-up-arrow', path: '/reports/sales', accent: accent2 },
  ];

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  // Pulse animation for live indicator dots
  const pulse = {
    animate: { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  };

  const statItems = [
    ytd > 0    && { label: 'YTD Tonnage',    value: ytd,    icon: 'bi-bar-chart-line-fill', color: accent,   suffix: 'T' },
    curMon > 0 && { label: monthName + ' Sales', value: curMon, icon: 'bi-calendar3',       color: accent2,  suffix: 'T' },
    yoy > 0    && { label: 'Full Year (YOY)', value: yoy,   icon: 'bi-arrow-repeat',        color: accent,   suffix: 'T' },
    allShortSupply.length > 0 && { label: 'Short Supply Items', value: allShortSupply.length, icon: 'bi-exclamation-triangle', color: '#ef4444', suffix: '' },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ padding: '0 4px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            Welcome back, {username}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: textMut }}>
            {monthName} {year} · Operational snapshot
          </p>
        </div>
        {/* Animated live pulse dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {[0, 0.4, 0.8].map((d, i) => (
            <motion.span key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: d }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }}
            />
          ))}
        </div>
      </div>

      {/* Short supply alert ticker */}
      <ShortSupplyTicker items={allShortSupply} isDarkMode={isDarkMode} />

      {/* Summary Cards */}
      <div style={{ marginTop: 16 }}>
        <SummaryCardsSystem context="dashboard" accent={accent} accent2={accent2} />
      </div>

      {/* Animated stat counters */}
      {(statItems.length > 0 || multiYearData === null) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginTop: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <motion.i className="bi bi-lightning-charge-fill"
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ color: accent, fontSize: '0.85rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
              Sales Snapshot — {year}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {multiYearData === null
              ? [0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{
                      flex: '1 1 150px', minWidth: 0,
                      background: isDarkMode ? '#1e293b' : '#f1f5f9',
                      border: `1px solid ${border}`,
                      borderRadius: 14, padding: '13px 15px',
                      height: 68,
                    }}
                  />
                ))
              : statItems.map((s, i) => (
                  <motion.div key={s.label}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + i * 0.07, duration: 0.35 }}
                    style={{
                      flex: '1 1 150px', minWidth: 0,
                      background: isDarkMode ? `${s.color}18` : `${s.color}0d`,
                      border: `1px solid ${s.color}30`,
                      borderRadius: 14, padding: '13px 15px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                      background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 12px ${s.color}44` }}>
                      <i className={`bi ${s.icon}`} style={{ fontSize: '1.1rem', color: 'white' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: textMut, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isDarkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.15 }}>
                        {s.suffix === 'T'
                          ? <><CountUp target={Math.round(s.value)} duration={1.2} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color }}>T</span></>
                          : <CountUp target={s.value} duration={0.9} />
                        }
                      </div>
                    </div>
                  </motion.div>
                ))
            }
          </div>
        </motion.div>
      )}

      {/* Category Breakdown */}
      {sellingData !== null && sellingData !== undefined && sellingData.length > 0 && (() => {
        const sorted = [...sellingData]
          .map(item => ({ ...item, _ton: parseFloat(item.tonnage || item.totaltonnage || item.value || 0) }))
          .filter(item => item._ton > 0)
          .sort((a, b) => b._ton - a._ton)
          .slice(0, 5);
        if (!sorted.length) return null;
        const catMax = sorted[0]._ton;
        const opacitySuffix = ['ff', 'dd', 'bb', '99', '77'];
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            style={{ marginTop: 20 }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                style={{ flex: '1.5 1 240px', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <i className="bi bi-pie-chart-fill" style={{ color: accent, fontSize: '0.82rem' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                    Category Sales — {monthName}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {sorted.map((item, i) => {
                    const pct = catMax > 0 ? (item._ton / catMax) * 100 : 0;
                    const label = item.catgroup || item.catdescription || item.description || item.category || item.group || `Item ${i + 1}`;
                    const barColor = `${accent}${opacitySuffix[i] || '77'}`;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 + i * 0.06 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.69rem', fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%' }}>
                            {label}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: textMut, flexShrink: 0 }}>
                            {fmtT(item._ton) || item._ton.toFixed(1) + ' T'}
                          </span>
                        </div>
                        <div style={{ height: 6, background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 4, border: `1px solid ${border}`, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.22 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                            style={{ height: '100%', background: barColor, borderRadius: 4 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      })()}
      {sellingData === null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{ marginTop: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              style={{ flex: '1.5 1 240px', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}
            >
              <div style={{ width: 22, height: 22, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Mid row: Monthly trend + Year comparison */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
        {/* Monthly trend */}
        {curRow && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{ flex: '2 1 260px', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="bi bi-bar-chart-fill" style={{ color: accent, fontSize: '0.82rem' }} />
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>Monthly Sales — {year}</span>
              </div>
              <span style={{ fontSize: '0.62rem', color: textMut }}>Tonnage</span>
            </div>
            <MonthlyBars curRow={curRow} accent={accent} accent2={accent2} isDarkMode={isDarkMode} />
          </motion.div>
        )}

        {/* Year comparison */}
        {multiYearData?.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            style={{ flex: '1 1 200px', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <i className="bi bi-arrow-left-right" style={{ color: accent2, fontSize: '0.82rem' }} />
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>Year Comparison</span>
            </div>
            <YearBars multiYearData={multiYearData} accent={accent} accent2={accent2} isDarkMode={isDarkMode} border={border} />
          </motion.div>
        )}

        {/* Production Today */}
        {(prodLoading || prodData) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            style={{ flex: '1 1 180px', background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <i className="bi bi-gear-wide-connected" style={{ color: accent2, fontSize: '0.82rem' }} />
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>Production Today</span>
            </div>
            {prodLoading && !prodData
              ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        style={{ height: 28, borderRadius: 6, background: isDarkMode ? '#1e293b' : '#f1f5f9' }}
                      />
                    ))}
                  </div>
                )
              : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      { label: 'FG Net Production', val: prodData?.fgnetproduction ?? prodData?.fg_net ?? prodData?.netproduction, unit: 'Kg' },
                      { label: 'Raw Material',      val: prodData?.rawmaterialused ?? prodData?.raw_material,                      unit: 'Kg' },
                      { label: 'Efficiency',        val: prodData?.efficiency ?? prodData?.efficiencypct,                          unit: '%' },
                    ].map(({ label, val, unit }) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.60rem', fontWeight: 600, color: textMut, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: isDarkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.2 }}>
                          {val !== null && val !== undefined && val !== '' ? `${val} ${unit}` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </motion.div>
        )}
      </div>

      {/* Bottom row: Reports + Short Supply */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20 }}>
        {/* Reports */}
        <div style={{ flex: '2 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="bi bi-grid-1x2-fill" style={{ color: accent, fontSize: '0.85rem' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>Reports</span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {reportLinks.map((r, i) => (
              <ReportCard key={r.path} {...r} isDarkMode={isDarkMode} border={border} delay={0.22 + i * 0.07} />
            ))}
          </div>
        </div>

        {/* Short Supply */}
        {topShortSupply.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={{ flex: '1 1 240px', minWidth: 220, background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <motion.i className="bi bi-exclamation-circle-fill"
                  animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ color: '#ef4444', fontSize: '0.82rem' }} />
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>Short Supply</span>
              </div>
              <motion.span
                animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '2px 8px', borderRadius: 999 }}
              >
                {allShortSupply.length} items
              </motion.span>
            </div>
            <ShortSupplyBars items={topShortSupply} isDarkMode={isDarkMode} border={border} />
            {allShortSupply.length > 6 && (
              <div style={{ fontSize: '0.66rem', color: textMut, marginTop: 8, textAlign: 'center' }}>
                +{allShortSupply.length - 6} more items
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
