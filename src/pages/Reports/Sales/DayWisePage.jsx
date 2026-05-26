import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import { getDaywiseSalesReport, getLastUpdatedDates } from '../../../services/salesDashboardApi';
import { appLog } from '../../../config/appConfig';
import { fmtAmt, fmtDate } from '../../../utils/salesFormatters';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

const sumTonnage = (row, days) => {
  let s = 0;
  for (let d = 1; d <= days; d++) s += parseFloat(row[`tonnage${d}`]) || 0;
  return s;
};

const priceKey = (row, d) =>
  (row.disttype === 'Distribution' || row.type === 'Distribution')
    ? `cobiprice${d}` : `basicprice${d}`;

export default function DayWisePage() {
  const { user } = useAuth();
  const employeename = user?.username;
  const { daywiseyear, daywisemonth, daywisecompany, daywisedisttype } = useSalesFilterStore();
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary || '#283593';
  const accentDark = `color-mix(in srgb, ${accent} 52%, #0a1628)`;
  const totalColBg = `color-mix(in srgb, ${accent} 55%, #c0392b)`;
  const cardBg     = isDarkMode ? '#1e293b' : 'white';
  const borderClr  = isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)';
  const textClr    = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr   = isDarkMode ? '#94a3b8' : '#64748b';
  const infoBg     = isDarkMode ? '#0f172a' : '#f8fafc';
  const infoBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const subRowBg   = isDarkMode ? '#1a2440' : '#f0f4ff';
  const fontFamily = selectedFont?.body || "'Manrope', sans-serif";

  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [expanded, setExpanded]       = useState({});
  const [thirdLevel, setThirdLevel]   = useState({});
  const [thirdLoading, setThirdLoading] = useState({});
  const [showValue, setShowValue]     = useState(false);
  const [lastUpdate, setLastUpdate]   = useState(null);

  const days    = daysInMonth(daywiseyear, daywisemonth);
  const dayNums = Array.from({ length: days }, (_, i) => i + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpanded({});
    setThirdLevel({});

    try {
      const data = await getDaywiseSalesReport({
        employeename, company: daywisecompany,
        disttype: daywisedisttype,
        year: daywiseyear, month: daywisemonth,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load day-wise data');
    } finally {
      setLoading(false);
    }
  }, [daywiseyear, daywisemonth, daywisecompany, daywisedisttype, employeename]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch last-updated dates once on mount — never on filter change
  useEffect(() => {
    if (!employeename) return;
    appLog('[INIT] Fetching last updated dates (DayWise) — runs once on mount');
    getLastUpdatedDates(employeename)
      .then(d => setLastUpdate(Array.isArray(d) ? d[0] : d))
      .catch(() => null);
  }, [employeename]);

  const handleExpand = async (row) => {
    const id = row.id;
    if (expanded[id]) { setExpanded(p => ({ ...p, [id]: false })); return; }
    if (thirdLevel[id]) { setExpanded(p => ({ ...p, [id]: true })); return; }
    if (row.disttype === 'Grand Total') return;

    setThirdLoading(p => ({ ...p, [id]: true }));
    try {
      // Angular: getsalesreportsecondlevel(year, month, company, disttype, type, employeename)
      // → daywisesalesreportsecondlevel_AR1.php?year=&month=&company=&disttype=&type=&employeename=
      const data = await getDaywiseSalesReport({
        year: daywiseyear, month: daywisemonth,
        company: daywisecompany, disttype: daywisedisttype,
        type: row.disttype, employeename,
      });
      setThirdLevel(p => ({ ...p, [id]: Array.isArray(data) ? data : [] }));
      setExpanded(p => ({ ...p, [id]: true }));
    } catch {
      setExpanded(p => ({ ...p, [id]: true }));
    } finally {
      setThirdLoading(p => ({ ...p, [id]: false }));
    }
  };

  const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const thStyle = {
    padding: '0.55rem 0.5rem', fontWeight: 700, fontSize: '0.72rem',
    color: 'white', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 52,
  };
  const tdStyle = {
    padding: '0.35rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap',
    fontSize: '0.75rem', color: mutedClr,
  };
  const expandBtnStyle = {
    background: 'none', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: 6, cursor: 'pointer', width: 20, height: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', color: mutedClr, padding: 0,
  };

  return (
    <div style={{ width: '100%', fontFamily }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{ marginBottom: '1rem' }}
      >
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: textClr, margin: 0 }}>
          Day-wise Sales Report
        </h2>
      </motion.div>

 

      {error && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: isDarkMode ? '#2d1515' : '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      <motion.div
        key={`${daywiseyear}-${daywisemonth}-${daywisecompany}-${daywisedisttype}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{ background: cardBg, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(37,99,235,0.06)', border: `1px solid ${borderClr}`, width: '100%' }}
      >
        <div style={{ padding: '0.6rem 1rem', background: infoBg, borderBottom: `1px solid ${infoBorder}`, fontSize: '0.8rem', color: mutedClr, fontWeight: 600 }}>
          <i className="bi bi-calendar3" style={{ marginRight: 6, color: accent }}></i>
          {MONTH_NAMES[daywisemonth]} {daywiseyear} · {daywisecompany} · {daywisedisttype}
          <span style={{ marginLeft: 8, background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent, borderRadius: 6, padding: '0 6px', fontSize: '0.72rem' }}>
            {days} days
          </span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: days * 60 + 200 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: accent, color: 'white' }}>
                <th style={{ ...thStyle, position: 'sticky', left: 0, background: accent, zIndex: 11, width: 28 }}></th>
                <th style={{ ...thStyle, position: 'sticky', left: 28, background: accent, zIndex: 11, textAlign: 'left', minWidth: 120 }}>
                  Dispatch Type
                </th>
                {dayNums.map(d => (
                  <th key={d} style={{ ...thStyle, background: accent }}>{d}</th>
                ))}
                <th style={{ ...thStyle, background: totalColBg, minWidth: 70 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={days + 3} style={{ textAlign: 'center', padding: '2rem', color: mutedClr, background: cardBg }}>
                  <i className="bi bi-arrow-clockwise" style={{ marginRight: 6 }}></i>Loading…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={days + 3} style={{ textAlign: 'center', padding: '3rem', color: mutedClr, background: cardBg }}>No data</td></tr>
              ) : rows.map((row, i) => {
                const id = row.id;
                const isGrand = row.disttype === 'Grand Total';
                const isOpen  = !!expanded[id];
                const total   = sumTonnage(row, days);
                const rowBg   = isGrand
                  ? (isDarkMode ? '#1c2410' : '#fef9e7')
                  : (isDarkMode ? (i % 2 === 0 ? '#1e293b' : '#192233') : (i % 2 === 0 ? 'white' : '#fafbfc'));
                const hoverBg = isDarkMode ? '#1e2d45' : '#eff6ff';

                return (
                  <React.Fragment key={i}>
                    <tr
                      style={{ background: rowBg, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}
                      onMouseEnter={e => !isGrand && (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={e => !isGrand && (e.currentTarget.style.background = rowBg)}
                    >
                      <td style={{ ...tdStyle, position: 'sticky', left: 0, background: 'inherit', textAlign: 'center' }}>
                        {!isGrand && (
                          <button onClick={() => handleExpand(row)} style={expandBtnStyle}>
                            {thirdLoading[id]
                              ? <i className="bi bi-arrow-clockwise"></i>
                              : <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>}
                          </button>
                        )}
                      </td>
                      <td style={{ ...tdStyle, position: 'sticky', left: 28, background: 'inherit', fontWeight: isGrand ? 800 : 600, color: isGrand ? (isDarkMode ? '#fbbf24' : '#b7791f') : textClr, textAlign: 'left' }}>
                        {row.disttype}
                      </td>
                      {dayNums.map(d => {
                        const tv = parseFloat(row[`tonnage${d}`]) || 0;
                        const pv = showValue ? parseFloat(row[priceKey(row, d)]) || 0 : null;
                        const isMax = tv > 0 && tv === parseFloat(row.maxvalue);
                        const isMin = tv > 0 && tv === parseFloat(row.minvalue);
                        return (
                          <td key={d} style={{ ...tdStyle, background: isMax ? 'rgba(16,185,129,0.12)' : isMin ? 'rgba(239,68,68,0.08)' : undefined }}>
                            {tv > 0 ? (
                              <>
                                <div style={{ fontWeight: 500, color: textClr }}>{tv.toFixed(2)}</div>
                                {pv !== null && pv > 0 && <div style={{ fontSize: '0.65rem', color: mutedClr }}>{fmtAmt(pv)}</div>}
                              </>
                            ) : <span style={{ color: isDarkMode ? '#475569' : '#cbd5e1' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ ...tdStyle, background: isGrand ? (isDarkMode ? '#2a1e08' : '#fef3c7') : (isDarkMode ? `color-mix(in srgb, ${accent} 18%, #1e293b)` : '#fff8f8'), fontWeight: 700, color: isGrand ? (isDarkMode ? '#fbbf24' : '#92400e') : '#c0392b' }}>
                        {total > 0 ? total.toFixed(2) : '—'}
                      </td>
                    </tr>

                    {isOpen && (thirdLevel[id] || []).map((sub, si) => {
                      const subTotal = sumTonnage(sub, days);
                      return (
                        <tr key={`sub-${si}`} style={{ background: subRowBg, borderBottom: `1px solid ${isDarkMode ? '#1e3a5f' : '#e0e8ff'}` }}>
                          <td style={{ ...tdStyle, position: 'sticky', left: 0, background: subRowBg }}></td>
                          <td style={{ ...tdStyle, position: 'sticky', left: 28, background: subRowBg, color: accent, fontWeight: 600, textAlign: 'left', paddingLeft: '1.5rem' }}>
                            ↳ {sub.disttype}
                          </td>
                          {dayNums.map(d => {
                            const tv = parseFloat(sub[`tonnage${d}`]) || 0;
                            return (
                              <td key={d} style={tdStyle}>
                                {tv > 0 ? <span style={{ color: textClr }}>{tv.toFixed(2)}</span> : <span style={{ color: isDarkMode ? '#475569' : '#e2e8f0' }}>—</span>}
                              </td>
                            );
                          })}
                          <td style={{ ...tdStyle, background: `color-mix(in srgb, ${accent} 20%, ${subRowBg})`, fontWeight: 600, color: accent }}>
                            {subTotal > 0 ? subTotal.toFixed(2) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
