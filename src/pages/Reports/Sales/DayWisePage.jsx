import React, { useEffect, useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';
import Tooltip from '../../../components/ui/Tooltip';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import {
  getDaywiseSalesReport,
  getDaywiseSalesSecondLevel,
  getDaywiseSalesThirdLevel,
  getLastUpdatedDates,
} from '../../../services/salesDashboardApi';
import { appLog } from '../../../config/appConfig';
import { logActivity } from '../../../services/activityLog';
import { fmtAmt, fmtDate } from '../../../utils/salesFormatters';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import SrLoader from '../../../components/ui/SrLoader';
import './Sales.css';

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

const sumTonnage = (row, days) => {
  let s = 0;
  for (let d = 1; d <= days; d++) s += parseFloat(row[`tonnage${d}`]) || 0;
  return s;
};

const priceKey = (row, d) =>
  (row.disttype === 'Distribution' || row.type === 'Distribution')
    ? `cobiprice${d}` : `basicprice${d}`;

// Angular: second-level rows expandable only when type === 'Distribution' || type === 'SBL OTHERS'
const canExpandToThird = (subRow) =>
  subRow.type === 'Distribution' || subRow.type === 'SBL OTHERS';

export default function DayWisePage({ syncKey = 0, onLastUpdateChange, loggedInRole = null, loggedInRolex = null }) {
  const { user } = useAuth();
  const employeename = user?.empname || user?.username;
  const { daywiseyear, daywisemonth, daywisecompany, daywisedisttype } = useSalesFilterStore();
  // Refs keep current filter values so fetchData doesn't auto-refetch on filter change
  const daywiseyearRef     = useRef(daywiseyear);
  const daywisemonthRef    = useRef(daywisemonth);
  const daywisecompanyRef  = useRef(daywisecompany);
  const daywisedisttypeRef = useRef(daywisedisttype);
  useEffect(() => { daywiseyearRef.current = daywiseyear; }, [daywiseyear]);
  useEffect(() => { daywisemonthRef.current = daywisemonth; }, [daywisemonth]);
  useEffect(() => { daywisecompanyRef.current = daywisecompany; }, [daywisecompany]);
  useEffect(() => { daywisedisttypeRef.current = daywisedisttype; }, [daywisedisttype]);
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary || '#283593';
  const accentDark = `color-mix(in srgb, ${accent} 52%, #0a1628)`;
  const totalColBg = `color-mix(in srgb, ${accent} 55%, #c0392b)`;
  const gtBg       = `color-mix(in srgb, ${accent} 60%, #050505)`;
  const cardBg     = isDarkMode ? '#1e293b' : 'white';
  const borderClr  = isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)';
  const textClr    = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr   = isDarkMode ? '#94a3b8' : '#64748b';
  const infoBg     = isDarkMode ? '#0f172a' : '#f8fafc';
  const infoBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const subRowBg   = isDarkMode ? '#1a2440' : '#f0f4ff';
  const sub2RowBg  = isDarkMode ? '#0f1e36' : '#e8f0fe';
  const fontFamily = selectedFont?.body || "'Manrope', sans-serif";

  // Level 0: main rows
  const [rows, setRows]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [showValue, setShowValue]         = useState(false);
  const [lastUpdate, setLastUpdate]       = useState(null);

  // Level 1 (second level): expanded state per L0 row id
  const [expandedL1, setExpandedL1]       = useState({});
  const [secondLevel, setSecondLevel]     = useState({});
  const [secondLoading, setSecondLoading] = useState({});

  // Level 2 (third level): expanded state per L1 row key
  const [expandedL2, setExpandedL2]       = useState({});
  const [thirdLevel, setThirdLevel]       = useState({});
  const [thirdLoading, setThirdLoading]   = useState({});

  // Applied filters — only update when Generate is clicked, keeping label/columns stable
  const [appliedFilters, setAppliedFilters] = useState({
    year: daywiseyear, month: daywisemonth, company: daywisecompany, disttype: daywisedisttype,
  });

  const days    = daysInMonth(appliedFilters.year, appliedFilters.month);
  const dayNums = Array.from({ length: days }, (_, i) => i + 1);

  const fetchData = useCallback(async () => {
    // Read current filter values from refs — avoids auto-refetch when filters change
    const daywiseyear    = daywiseyearRef.current;
    const daywisemonth   = daywisemonthRef.current;
    const daywisecompany = daywisecompanyRef.current;
    const daywisedisttype = daywisedisttypeRef.current;
    setLoading(true);
    setError(null);
    setExpandedL1({});
    setSecondLevel({});
    setSecondLoading({});
    setExpandedL2({});
    setThirdLevel({});
    setThirdLoading({});

    try {
      const data = await getDaywiseSalesReport({
        employeename, company: daywisecompany,
        disttype: daywisedisttype,
        year: daywiseyear, month: daywisemonth,
      });
      setRows(Array.isArray(data) ? data : []);
      setAppliedFilters({ year: daywiseyear, month: daywisemonth, company: daywisecompany, disttype: daywisedisttype });
      logActivity('Sales', 'Day Wise', '', 'generate', { year: daywiseyear, month: daywisemonth, company: daywisecompany, method: daywisedisttype });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load day-wise data');
    } finally {
      setLoading(false);
    }
  }, [employeename]); // filter values read from refs; avoids auto-refetch on filter change

  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch when global Sync completes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (syncKey > 0) fetchData(); }, [syncKey]);

  // Fetch last-updated dates once on mount — never on filter change
  useEffect(() => {
    if (!employeename) return;
    appLog('[INIT] Fetching last updated dates (DayWise) — runs once on mount');
    getLastUpdatedDates(employeename)
      .then(d => setLastUpdate(Array.isArray(d) ? d[0] : d))
      .catch(() => null);
  }, [employeename]);

  // L0 → L1: expand main row to show second-level data
  // Angular Distribution: calls getdaywisethirdlevel DIRECTLY — skips SBL company level
  // Angular Shops/other: calls getsalesreportsecondlevel
  const handleExpandL1 = useCallback(async (row) => {
    const id = row.id;
    if (row.disttype === 'Grand Total') return;
    if (expandedL1[id]) { setExpandedL1(p => ({ ...p, [id]: false })); return; }
    if (secondLevel[id]) { setExpandedL1(p => ({ ...p, [id]: true })); return; }

    flushSync(() => setSecondLoading(p => ({ ...p, [id]: true })));
    try {
      let data;
      if (row.disttype === 'Distribution') {
        // Angular skips company level for Distribution — goes directly to distributor rows
        data = await getDaywiseSalesThirdLevel({
          year: daywiseyear, month: daywisemonth,
          company: daywisecompany, disttype: daywisedisttype,
          type: row.disttype, companytype: daywisecompany,
          employeename,
        });
      } else {
        data = await getDaywiseSalesSecondLevel({
          year: daywiseyear, month: daywisemonth,
          company: daywisecompany, disttype: daywisedisttype,
          type: row.disttype, employeename,
        });
      }
      setSecondLevel(p => ({ ...p, [id]: Array.isArray(data) ? data : [] }));
      setExpandedL1(p => ({ ...p, [id]: true }));
    } catch {
      setExpandedL1(p => ({ ...p, [id]: true }));
    } finally {
      setSecondLoading(p => ({ ...p, [id]: false }));
    }
  }, [daywiseyear, daywisemonth, daywisecompany, daywisedisttype, employeename, expandedL1, secondLevel]);

  // L1 → L2: expand second-level row to show third-level data
  // Angular: getsalesreportthirdlevel(year, month, company, disttype, type=sub.type, companytype=sub.disttype, employeename)
  // Only for rows where type === 'Distribution' || type === 'SBL OTHERS'
  const handleExpandL2 = useCallback(async (mainRowId, subRow, subKey) => {
    if (!canExpandToThird(subRow)) return;
    if (expandedL2[subKey]) { setExpandedL2(p => ({ ...p, [subKey]: false })); return; }
    if (thirdLevel[subKey]) { setExpandedL2(p => ({ ...p, [subKey]: true })); return; }

    flushSync(() => setThirdLoading(p => ({ ...p, [subKey]: true })));
    try {
      const data = await getDaywiseSalesThirdLevel({
        year: daywiseyear, month: daywisemonth,
        company: daywisecompany, disttype: daywisedisttype,
        type: subRow.type, companytype: subRow.disttype,
        employeename,
      });
      setThirdLevel(p => ({ ...p, [subKey]: Array.isArray(data) ? data : [] }));
      setExpandedL2(p => ({ ...p, [subKey]: true }));
    } catch {
      setExpandedL2(p => ({ ...p, [subKey]: true }));
    } finally {
      setThirdLoading(p => ({ ...p, [subKey]: false }));
    }
  }, [daywiseyear, daywisemonth, daywisecompany, daywisedisttype, employeename, expandedL2, thirdLevel]);

  const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const lastUpdateDate = lastUpdate ? fmtDate(lastUpdate.dispatchlastupdate) : null;

  // Propagate last update date to parent (SalesDashboard tab bar)
  useEffect(() => { onLastUpdateChange?.(lastUpdateDate); }, [lastUpdateDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDrillLoading = Object.values(secondLoading).some(Boolean) || Object.values(thirdLoading).some(Boolean);

  return (
    <div style={{ width: '100%', fontFamily, '--dw-muted': mutedClr }}>
      {/* Full-page overlay for row expand API calls — same as Generate loading */}
      {isDrillLoading && (
        <SrLoader accent={accent} isDarkMode={isDarkMode} text="Loading..." />
      )}

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

      <FilterBar mode="daywise" onApply={fetchData} isLoading={loading} lastUpdateDate={lastUpdateDate} loggedInRole={loggedInRole} loggedInRolex={loggedInRolex} />

      {error && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: isDarkMode ? '#2d1515' : '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      <motion.div
        key={`${appliedFilters.year}-${appliedFilters.month}-${appliedFilters.company}-${appliedFilters.disttype}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="dw-card"
        style={{ background: cardBg, border: `1px solid ${borderClr}` }}
      >
        <div
          className="dw-info-bar"
          style={{ background: infoBg, borderBottom: `1px solid ${infoBorder}`, color: mutedClr }}
        >
          <i className="bi bi-calendar3" style={{ marginRight: 6, color: accent }}></i>
          {MONTH_NAMES[appliedFilters.month]} {appliedFilters.year} · {appliedFilters.company} · {appliedFilters.disttype}
          <span style={{ marginLeft: 8, background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent, borderRadius: 6, padding: '0 6px', fontSize: '0.72rem' }}>
            {days} days
          </span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: days * 60 + 200 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: accent, color: 'white' }}>
                <th className="dw-th" style={{ position: 'sticky', left: 0, background: accent, zIndex: 11, width: 28 }}></th>
                <th className="dw-th" style={{ position: 'sticky', left: 28, background: accent, zIndex: 11, textAlign: 'left', minWidth: 120 }}>
                  {appliedFilters.disttype === 'Distribution' ? 'Distributor Name' : 'Dispatch Type'}
                </th>
                {dayNums.map(d => (
                  <th key={d} className="dw-th" style={{ background: accent }}>{d}</th>
                ))}
                <th className="dw-th" style={{ background: totalColBg, minWidth: 70 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={days + 3} className="dw-td" style={{ textAlign: 'center', padding: '2rem', background: cardBg }}>
                  <i className="bi bi-arrow-clockwise" style={{ marginRight: 6 }}></i>Loading…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={days + 3} className="dw-td" style={{ textAlign: 'center', padding: '3rem', background: cardBg, color: mutedClr }}>
                  <i className="bi bi-inbox" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.4rem', opacity: 0.45 }} />
                  No data for the selected filters
                </td></tr>
              ) : rows.map((row, i) => {
                const id = row.id;
                const isGrand = row.disttype === 'Grand Total';
                const isOpenL1  = !!expandedL1[id];
                const total   = sumTonnage(row, days);
                const rowBg   = isGrand
                  ? gtBg
                  : (isDarkMode ? (i % 2 === 0 ? '#1e293b' : '#192233') : (i % 2 === 0 ? 'white' : '#fafbfc'));
                const hoverBg = isDarkMode ? '#1e2d45' : '#eff6ff';

                const isDistributionParent = row.disttype === 'Distribution';
              return (
                  <React.Fragment key={i}>
                    {/* ── L0: Main row ── */}
                    <tr
                      style={{ background: rowBg, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}
                      onMouseEnter={e => !isGrand && (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={e => !isGrand && (e.currentTarget.style.background = rowBg)}
                    >
                      <td className="dw-td" style={{ position: 'sticky', left: 0, background: 'inherit', textAlign: 'center' }}>
                        {!isGrand && (
                          <Tooltip content={isOpenL1 ? 'Collapse' : 'Expand'}>
                            <button
                              onClick={() => handleExpandL1(row)}
                              className="dw-expand-btn"
                              aria-label={isOpenL1 ? 'Collapse row' : 'Expand row'}
                              style={{ border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, color: mutedClr }}
                            >
                              {secondLoading[id]
                                ? <i className="bi bi-arrow-clockwise sr-spin"></i>
                                : <motion.i
                                    className={`bi ${isOpenL1 ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                                    animate={{ rotate: isOpenL1 ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ display: 'inline-block' }}
                                  />}
                            </button>
                          </Tooltip>
                        )}
                      </td>
                      <td className="dw-td" style={{ position: 'sticky', left: 28, background: 'inherit', fontWeight: isGrand ? 800 : 600, color: isGrand ? 'white' : textClr, textAlign: 'left' }}>
                        {row.disttype}
                      </td>
                      {dayNums.map(d => {
                        const tv = parseFloat(row[`tonnage${d}`]) || 0;
                        const pv = showValue ? parseFloat(row[priceKey(row, d)]) || 0 : null;
                        return (
                          <td key={d} className="dw-td">
                            {tv > 0 ? (
                              <>
                                <div style={{ fontWeight: 500, color: isGrand ? 'rgba(255,255,255,0.9)' : textClr }}>{tv.toFixed(2)}</div>
                                {pv !== null && pv > 0 && <div style={{ fontSize: '0.65rem', color: mutedClr }}>{fmtAmt(pv)}</div>}
                              </>
                            ) : <span style={{ color: isGrand ? 'rgba(255,255,255,0.4)' : ('var(--sr-zero-dim, #cbd5e1)') }}>0.00</span>}
                          </td>
                        );
                      })}
                      <td className="dw-td" style={{ background: isGrand ? gtBg : undefined, fontWeight: 700, color: isGrand ? 'white' : textClr }}>
                        {total > 0 ? total.toFixed(2) : (isGrand ? <span style={{ color: 'rgba(255,255,255,0.4)' }}>0.00</span> : <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>0.00</span>)}
                      </td>
                    </tr>

                    {/* ── L1: Second-level rows ── */}
                    {isOpenL1 && (secondLevel[id] || []).map((sub, si) => {
                      const subKey    = `${id}__${si}`;
                      const subTotal  = sumTonnage(sub, days);
                      const isOpenL2  = !!expandedL2[subKey];
                      const canExpand = !isDistributionParent && canExpandToThird(sub);

                      return (
                        <React.Fragment key={subKey}>
                          <motion.tr
                            style={{ background: subRowBg, borderBottom: `1px solid ${isDarkMode ? '#1e3a5f' : '#e0e8ff'}` }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: Math.min(si, 12) * 0.035 }}
                          >
                            <td className="dw-td" style={{ position: 'sticky', left: 0, background: subRowBg, textAlign: 'center' }}>
                              {canExpand && (
                                <Tooltip content={isOpenL2 ? 'Collapse' : 'Expand'}>
                                  <button
                                    onClick={() => handleExpandL2(id, sub, subKey)}
                                    className="dw-expand-btn"
                                    aria-label={isOpenL2 ? 'Collapse sub-row' : 'Expand sub-row'}
                                    style={{ border: `1px solid ${isDarkMode ? '#334155' : '#c7d2fe'}`, color: accent }}
                                  >
                                    {thirdLoading[subKey]
                                      ? <i className="bi bi-arrow-clockwise sr-spin"></i>
                                      : <motion.i
                                          className={`bi ${isOpenL2 ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                                          animate={{ rotate: isOpenL2 ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                          style={{ display: 'inline-block' }}
                                        />}
                                  </button>
                                </Tooltip>
                              )}
                            </td>
                            <td className="dw-td" style={{ position: 'sticky', left: 28, background: subRowBg, color: textClr, fontWeight: 600, textAlign: 'left', paddingLeft: '1.5rem' }}>
                              ↳ {sub.disttype || sub.type}
                            </td>
                            {dayNums.map(d => {
                              const tv = parseFloat(sub[`tonnage${d}`]) || 0;
                              return (
                                <td key={d} className="dw-td" style={{ background: subRowBg }}>
                                  {tv > 0 ? <span style={{ color: textClr }}>{tv.toFixed(2)}</span> : <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>0.00</span>}
                                </td>
                              );
                            })}
                            <td className="dw-td" style={{ fontWeight: 600, color: textClr }}>
                              {subTotal > 0 ? subTotal.toFixed(2) : <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>0.00</span>}
                            </td>
                          </motion.tr>

                          {/* ── L2: Third-level rows (no further expand — leaf nodes) ── */}
                          {isOpenL2 && (thirdLevel[subKey] || []).map((deep, di) => {
                            const deepTotal = sumTonnage(deep, days);
                            return (
                              <motion.tr key={`${subKey}__${di}`} style={{ background: sub2RowBg, borderBottom: `1px solid ${isDarkMode ? '#1a3050' : '#c7d2fe'}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, delay: Math.min(di, 10) * 0.03 }}>
                                <td className="dw-td" style={{ position: 'sticky', left: 0, background: sub2RowBg }}></td>
                                <td className="dw-td" style={{ position: 'sticky', left: 28, background: sub2RowBg, color: textClr, fontWeight: 500, textAlign: 'left', paddingLeft: '2.5rem' }}>
                                  ↳↳ {deep.disttype || deep.type}
                                </td>
                                {dayNums.map(d => {
                                  const tv = parseFloat(deep[`tonnage${d}`]) || 0;
                                  return (
                                    <td key={d} className="dw-td" style={{ background: sub2RowBg }}>
                                      {tv > 0 ? <span style={{ color: textClr, fontSize: '0.72rem' }}>{tv.toFixed(2)}</span> : <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)', fontSize: '0.72rem' }}>0.00</span>}
                                    </td>
                                  );
                                })}
                                <td className="dw-td" style={{ fontWeight: 600, color: textClr, fontSize: '0.72rem' }}>
                                  {deepTotal > 0 ? deepTotal.toFixed(2) : <span style={{ color: 'var(--sr-zero-dim, #cbd5e1)' }}>0.00</span>}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {loading && (
        <SrLoader accent={accent} isDarkMode={isDarkMode} text="Generating Report" />
      )}
    </div>
  );
}
