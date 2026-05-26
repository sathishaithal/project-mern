import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShortSupplyByCategory } from '../../../services/salesDashboardApi';
import { AppDatePicker } from '../../../components/FormControls';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import { appLog } from '../../../config/appConfig';

const ROWS_PER_PAGE = 50;

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// YYYY-MM-DD string → Date object without timezone shift
const strToDate = (s) => {
  const [y, mo, d] = s.split('-').map(Number);
  return new Date(y, mo - 1, d);
};

const initDateStr = () => {
  const d = new Date();
  return toYMD(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()));
};

const ANIM_CSS = `
  @keyframes sspin { to { transform: rotate(360deg); } }
  @keyframes ssdot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40%           { transform: scale(1);   opacity: 1;   }
  }
  @keyframes ssprogress { from { width: 100%; } to { width: 0%; } }

  .ss-pg-btn {
    background: linear-gradient(135deg, var(--ss-accent, #1a237e), var(--ss-accent2, #283593));
    color: white;
    border: none;
    border-radius: 7px;
    height: 30px;
    padding: 0 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    white-space: nowrap;
  }
  .ss-pg-btn:not(:disabled):hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 5px 16px rgba(0,0,0,0.22);
  }
  .ss-pg-btn:not(:disabled):active {
    transform: translateY(0) scale(0.97);
    box-shadow: none;
  }
  .ss-pg-btn:disabled {
    background: linear-gradient(135deg, #94a3b8, #64748b);
    opacity: 0.42;
    cursor: not-allowed;
  }

  /* Flip calendar popup to open leftward — used for right-side table near viewport edge */
  .ss-flip-picker .appDateMenu {
    right: 0;
    left: auto;
  }
`;

function ShortSupplyTable({
  title, data, loading, error,
  fromDate, toDate, setFromDate, setToDate, onApply,
  accent, accent2, cardBg, borderClr, textClr, mutedClr, isDarkMode, fontFamily,
  flipPicker,
}) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [data]);

  const totals = useMemo(() => ({
    order:    data.reduce((s, r) => s + (parseFloat(r.ordertonnage)          || 0), 0),
    supply:   data.reduce((s, r) => s + (parseFloat(r.supplytonnage)         || 0), 0),
    short:    data.reduce((s, r) => s + (parseFloat(r.shortsupplytonnage)    || 0), 0),
    lastYear: data.reduce((s, r) => s + (parseFloat(r.ly_shortsupplytonnage) || 0), 0),
  }), [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const pagedRows  = data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const thS = {
    padding: '0.5rem 0.6rem', fontWeight: 700, fontSize: '0.71rem',
    color: 'white', textAlign: 'right', whiteSpace: 'nowrap',
  };
  const tdS = {
    padding: '0.4rem 0.6rem', textAlign: 'right',
    fontSize: '0.75rem', color: mutedClr,
  };
  const totalRowBg = `color-mix(in srgb, ${accent} 18%, ${isDarkMode ? '#1e293b' : '#e8eaf6'})`;
  const labelStyle = {
    fontWeight: 600, fontSize: '0.72rem', color: mutedClr,
    whiteSpace: 'nowrap', display: 'block', marginBottom: 2,
  };
  // Styling handled by .ss-pg-btn CSS class (accent via CSS variable on parent)

  return (
    <div style={{ width: '100%' }}>

      {/* ── Filter row — OUTSIDE the card so calendar popup is never clipped ── */}
      {/* ss-flip-picker reverses popup direction when table is near the right viewport edge */}
      <div className={flipPicker ? 'ss-flip-picker' : ''} style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
        alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 1rem', marginBottom: 8,
        background: isDarkMode ? '#0f172a' : '#f8fafc',
        border: `1px solid ${borderClr}`, borderRadius: 12,
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: textClr, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-table" style={{ color: accent }} />
          {title}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>From Date</label>
            {/* state holds YYYY-MM-DD string; AppDatePicker receives a Date object */}
            <AppDatePicker
              value={strToDate(fromDate)}
              onChange={(d) => setFromDate(toYMD(d))}
              max={strToDate(toDate)}
            />
          </div>
          <div>
            <label style={labelStyle}>To Date</label>
            <AppDatePicker
              value={strToDate(toDate)}
              onChange={(d) => setToDate(toYMD(d))}
              min={strToDate(fromDate)}
            />
          </div>
          {/* Invisible spacer label above Apply so it aligns with the date inputs, not the labels */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ ...labelStyle, visibility: 'hidden' }}>x</span>
            <button
              onClick={onApply}
              disabled={loading}
              style={{
                height: 32,
                background: `linear-gradient(135deg,${accent},${accent2})`,
                color: 'white', border: 'none', borderRadius: 7,
                padding: '0 0.9rem', fontWeight: 700, fontSize: '0.78rem',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <i className="bi bi-funnel-fill" style={{ marginRight: 4 }} />
              {loading ? 'Loading…' : 'Apply'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Table card — overflow: hidden is safe here (no dropdowns inside) ── */}
      <div style={{
        background: cardBg, borderRadius: 12,
        border: `1px solid ${borderClr}`, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(37,99,235,0.07)',
        position: 'relative',
      }}>
        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: isDarkMode ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', marginBottom: 16,
              border: `3px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              borderTopColor: accent,
              animation: 'sspin 1s linear infinite',
            }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textClr, marginBottom: 14 }}>
              Generating Report
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: accent,
                  animation: `ssdot 1.4s infinite ${i * 0.22}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#c62828', fontSize: '0.82rem' }}>
              <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: accent }}>
                  <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                  <th style={{ ...thS, textAlign: 'left', minWidth: 180 }}>Description</th>
                  <th style={{ ...thS, minWidth: 70 }}>Order</th>
                  <th style={{ ...thS, minWidth: 70 }}>Supply</th>
                  <th style={{ ...thS, minWidth: 80 }}>Shortsupply</th>
                  <th style={{ ...thS, minWidth: 110 }}>Last Year<br />Shortsupply</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>No data</td>
                  </tr>
                ) : pagedRows.map((row, idx) => {
                  const globalNum = (page - 1) * ROWS_PER_PAGE + idx + 1;
                  const evenBg = isDarkMode ? '#1e293b' : '#ffffff';
                  const oddBg  = isDarkMode ? '#192233' : '#f8fafc';
                  const rowBg  = idx % 2 === 0 ? evenBg : oddBg;
                  return (
                    <tr
                      key={row.id ?? globalNum}
                      style={{ background: rowBg, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}
                      onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? '#1e2d45' : '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ ...tdS, textAlign: 'center' }}>{globalNum}</td>
                      <td style={{ ...tdS, textAlign: 'left', color: textClr, fontWeight: 500, whiteSpace: 'normal' }}>
                        {row.description}
                      </td>
                      <td style={tdS}>{parseFloat(row.ordertonnage          || 0).toFixed(3)}</td>
                      <td style={tdS}>{parseFloat(row.supplytonnage          || 0).toFixed(3)}</td>
                      <td style={tdS}>{parseFloat(row.shortsupplytonnage     || 0).toFixed(3)}</td>
                      <td style={tdS}>{parseFloat(row.ly_shortsupplytonnage  || 0).toFixed(3)}</td>
                    </tr>
                  );
                })}

                {/* Total row — always visible, outside pagination slice */}
                {data.length > 0 && (
                  <tr style={{ background: totalRowBg, borderTop: `2px solid ${borderClr}`, fontWeight: 700 }}>
                    <td style={{ ...tdS, textAlign: 'center', color: accent }}>{data.length + 1}</td>
                    <td style={{ ...tdS, textAlign: 'left',   color: accent, fontWeight: 800 }}>Total</td>
                    <td style={{ ...tdS, color: accent }}>{totals.order.toFixed(3)}</td>
                    <td style={{ ...tdS, color: accent }}>{totals.supply.toFixed(3)}</td>
                    <td style={{ ...tdS, color: accent }}>{totals.short.toFixed(3)}</td>
                    <td style={{ ...tdS, color: accent }}>{totals.lastYear.toFixed(3)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '8px 12px',
            borderTop: `1px solid ${borderClr}`,
            background: isDarkMode ? '#0f172a' : '#f8fafc',
          }}>
            <button
              className="ss-pg-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ fontSize: '0.74rem', fontFamily }}
            >← Prev</button>
            <span style={{ fontSize: '0.76rem', color: mutedClr, fontWeight: 600 }}>
              Page {page} of {totalPages}
              <span style={{ marginLeft: 6, opacity: 0.65 }}>({data.length} rows)</span>
            </span>
            <button
              className="ss-pg-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ fontSize: '0.74rem', fontFamily }}
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShortSupplyPage() {
  const { user } = useAuth();
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary || '#283593';
  const cardBg     = isDarkMode ? '#1e293b' : 'white';
  const borderClr  = isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)';
  const textClr    = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr   = isDarkMode ? '#94a3b8' : '#64748b';
  const fontFamily = selectedFont?.body || "'Manrope', sans-serif";

  // Responsive: stack vertically on mobile
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Left table — High to Low (DESC sort)
  const [leftFrom,    setLeftFrom]    = useState(initDateStr);
  const [leftTo,      setLeftTo]      = useState(initDateStr);
  const [leftData,    setLeftData]    = useState([]);
  const [leftLoading, setLeftLoading] = useState(true);
  const [leftError,   setLeftError]   = useState(null);

  // Right table — Low to High (ASC sort), independent date range + separate API call
  const [rightFrom,    setRightFrom]    = useState(initDateStr);
  const [rightTo,      setRightTo]      = useState(initDateStr);
  const [rightData,    setRightData]    = useState([]);
  const [rightLoading, setRightLoading] = useState(true);
  const [rightError,   setRightError]   = useState(null);

  // Toast
  const [toast,        setToast]        = useState({ show: false, title: '', message: '', type: 'info' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((title, message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, title, message, type });
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast({ show: false, title: '', message: '', type: 'info' }), 300);
    }, 5000);
  }, []);

  const closeToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(false);
    setTimeout(() => setToast({ show: false, title: '', message: '', type: 'info' }), 300);
  };

  const fetchLeft = useCallback(() => {
    appLog('[ShortSupply] fetchLeft', leftFrom, '→', leftTo);
    setLeftLoading(true);
    setLeftError(null);
    showToast('Loading', 'Fetching short supply data...', 'info');
    getShortSupplyByCategory({ fromdate: leftFrom, todate: leftTo, employeename: user?.username })
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setLeftData([...arr].sort((a, b) => (parseFloat(b.shortsupplytonnage) || 0) - (parseFloat(a.shortsupplytonnage) || 0)));
        setLeftLoading(false);
        showToast('Success', 'Data loaded successfully!', 'success');
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
        setLeftError(msg);
        setLeftLoading(false);
        showToast('Error', msg, 'error');
      });
  }, [leftFrom, leftTo, user?.username, showToast]);

  const fetchRight = useCallback(() => {
    appLog('[ShortSupply] fetchRight', rightFrom, '→', rightTo);
    setRightLoading(true);
    setRightError(null);
    showToast('Loading', 'Fetching short supply data...', 'info');
    getShortSupplyByCategory({ fromdate: rightFrom, todate: rightTo, employeename: user?.username })
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setRightData([...arr].sort((a, b) => (parseFloat(a.shortsupplytonnage) || 0) - (parseFloat(b.shortsupplytonnage) || 0)));
        setRightLoading(false);
        showToast('Success', 'Data loaded successfully!', 'success');
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load data';
        setRightError(msg);
        setRightLoading(false);
        showToast('Error', msg, 'error');
      });
  }, [rightFrom, rightTo, user?.username, showToast]);

  // Initial load — fires once when user becomes available
  useEffect(() => {
    if (!user?.username) return;
    fetchLeft();
    fetchRight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  const toastAccentMap = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: accent };
  const toastIconMap   = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const toastAccent    = toastAccentMap[toast.type] || accent;

  const commonProps = { accent, accent2, cardBg, borderClr, textClr, mutedClr, isDarkMode, fontFamily };

  return (
    <div style={{ width: '100%', fontFamily, '--ss-accent': accent, '--ss-accent2': accent2 }}>
      <style>{ANIM_CSS}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && toastVisible && (
          <motion.div
            key="ss-toast"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.26 }}
            style={{ position: 'fixed', top: 88, right: 24, zIndex: 9999 }}
          >
            <div
              onClick={closeToast}
              style={{
                minWidth: 260, maxWidth: 340, cursor: 'pointer', overflow: 'hidden',
                background: isDarkMode ? '#1e293b' : 'white',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                borderLeft: `4px solid ${toastAccent}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <i className={`bi ${toastIconMap[toast.type]}`} style={{ fontSize: '1.15rem', flexShrink: 0, color: toastAccent }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: textClr }}>{toast.title}</div>
                  <div style={{ fontSize: '0.73rem', color: mutedClr, marginTop: 1 }}>{toast.message}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); closeToast(); }}
                  style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: mutedClr, padding: '0 2px' }}
                >×</button>
              </div>
              <div style={{ height: 3, background: toastAccent, animation: 'ssprogress 5s linear forwards' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{ marginBottom: '1rem' }}
      >
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: textClr, margin: 0 }}>
          Short Supply
        </h2>
      </motion.div>

      {/*
        Desktop: side by side (flex row)
        Mobile (<768px): stacked vertically (flex column)
      */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
          <ShortSupplyTable
            {...commonProps}
            title="Short supply tonnage (High to Low)"
            data={leftData}
            loading={leftLoading}
            error={leftError}
            fromDate={leftFrom}
            toDate={leftTo}
            setFromDate={setLeftFrom}
            setToDate={setLeftTo}
            onApply={fetchLeft}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }}>
          <ShortSupplyTable
            {...commonProps}
            flipPicker={!isMobile}
            title="Short supply tonnage (Low to High)"
            data={rightData}
            loading={rightLoading}
            error={rightError}
            fromDate={rightFrom}
            toDate={rightTo}
            setFromDate={setRightFrom}
            setToDate={setRightTo}
            onApply={fetchRight}
          />
        </div>
      </motion.div>
    </div>
  );
}
