import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tooltip from '../../../components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorMode } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../services/apiClient';
import { usePageIntro } from '../../../context/PageIntroContext';
import { appLog, appError } from '../../../config/appConfig';
import './Sales.css';
import { getAccessType, getHrDesignation, logLogin } from '../../../services/salesDashboardApi';
import SalesReportPage from './SalesReportPage';
import DayWisePage from './DayWisePage';
import ShortSupplyPage from './ShortSupplyPage';
import ChartsPage from './ChartsPage';
import SummaryCardsSystem from '../../../components/SummaryCardsSystem/SummaryCardsSystem';

const REPORT_TABS = [
  { id: 'monthwise',   label: 'Month Wise' },
  { id: 'daywise',     label: 'Day Wise' },
  { id: 'shortsupply', label: 'Short Supply' },
];

const TOP_TABS = [
  { id: 'reports', label: 'Reports' },
  { id: 'charts',  label: 'Charts' },
];

export default function SalesDashboard() {
  const { user } = useAuth();
  const employeename = user?.username;
  const { triggerIntro } = usePageIntro();

  const [topTab,          setTopTab]          = useState('reports');
  const [reportTab,       setReportTab]        = useState('monthwise');
  const [isFullscreen,    setIsFullscreen]     = useState(false);
  const [loggedInRole,    setLoggedInRole]     = useState(null);
  const [loggedInRolex,   setLoggedInRolex]    = useState(null);
  const [syncing,         setSyncing]          = useState(false);
  const [syncStatus,      setSyncStatus]       = useState(null); // 'ok' | 'err' | null
  const [syncKey,         setSyncKey]          = useState(0);
  const [lastUpdateDate,  setLastUpdateDate]   = useState(null);

  // Toast
  const [toast,        setToast]        = useState({ show: false, title: '', message: '', type: 'info' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  const showSyncToast = useCallback((title, message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, title, message, type });
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast({ show: false, title: '', message: '', type: 'info' }), 300);
    }, 3500);
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(false);
    setTimeout(() => setToast({ show: false, title: '', message: '', type: 'info' }), 300);
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus(null);
    const endpoint = '/api/batch/dashboardsync';
    appLog('[Sync] Request params:', { url: endpoint, method: 'GET', params: {} });
    triggerIntro(1400); // Start bhagya animation immediately on click
    try {
      const response = await apiClient.get(endpoint);
      appLog('[Sync] Response:', response?.data ?? response);
      setSyncStatus('ok');
      setSyncKey(k => k + 1);
      showSyncToast('Synced', 'Sales Dashboard data updated successfully!', 'success');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      appError('[Sync] Error:', err?.response?.data ?? err?.message ?? err);
      setSyncStatus('err');
      showSyncToast('Sync Failed', 'Could not connect to server. Try again.', 'error');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!employeename) return;
    const now = new Date().toISOString();
    getAccessType(employeename)
      .then(d => setLoggedInRole(Array.isArray(d) ? d[0] : d))
      .catch(() => null);
    getHrDesignation(employeename)
      .then(d => setLoggedInRolex(Array.isArray(d) ? d[0] : d))
      .catch(() => null);
    logLogin({ username: employeename, current_time: now }).catch(() => null);
  }, [employeename]);

  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent      = selectedAccent?.primary   || '#1a237e';
  const accent2     = selectedAccent?.secondary || '#283593';
  const tabBg       = isDarkMode ? '#1e293b' : 'white';
  const tabBorder   = isDarkMode ? '#334155' : 'rgba(148,163,184,0.18)';
  const inactiveClr = isDarkMode ? '#94a3b8' : '#475569';
  const mutedClr    = isDarkMode ? '#94a3b8' : '#64748b';
  const fontFamily  = selectedFont?.body || "'Manrope', sans-serif";

  const cssVars = {
    '--sr-accent':    accent,
    '--sr-accent2':   accent2,
    '--sr-label-clr': isDarkMode ? '#94a3b8' : accent,
    '--sr-text':      isDarkMode ? '#e2e8f0' : '#1e293b',
    '--sr-muted':     isDarkMode ? '#94a3b8' : '#64748b',
    '--sr-card-bg':   isDarkMode ? '#1e293b' : 'white',
    '--sr-border':    isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)',
    '--sr-font':      fontFamily,
    '--sr-zero-dim':  isDarkMode ? '#475569' : '#cbd5e1',
  };

  const toggleFullscreen = () => setIsFullscreen(p => !p);

  useEffect(() => {
    if (isFullscreen) document.body.classList.add('sales-report-fullscreen');
    else              document.body.classList.remove('sales-report-fullscreen');
    return () => document.body.classList.remove('sales-report-fullscreen');
  }, [isFullscreen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const activeTopBtn = (active) => ({
    background: active ? `linear-gradient(135deg, ${accent}, ${accent2})` : 'none',
    border: 'none', borderRadius: 7, cursor: 'pointer',
    padding: '0.45rem 1.4rem', fontSize: '0.85rem',
    fontWeight: active ? 700 : 500,
    color: active ? 'white' : inactiveClr,
    fontFamily, transition: 'all 0.18s', whiteSpace: 'nowrap',
  });

  const activeSubBtn = (active) => ({
    background: active ? `linear-gradient(135deg, ${accent}, ${accent2})` : 'none',
    border: 'none', borderRadius: 7, cursor: 'pointer',
    padding: '0.45rem 1.2rem', fontSize: '0.82rem',
    fontWeight: active ? 700 : 500,
    color: active ? 'white' : inactiveClr,
    fontFamily, transition: 'all 0.18s', whiteSpace: 'nowrap',
  });

  // Reusable Sync button + Last update row
  const SyncToolbar = ({ compact = false }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8, paddingRight: compact ? 2 : 4 }}>
      <span style={{ fontSize: '0.7rem', color: mutedClr, whiteSpace: 'nowrap' }}>
        Last update:{' '}
        {lastUpdateDate
          ? <strong style={{ color: accent, fontWeight: 700 }}>{lastUpdateDate}</strong>
          : <span style={{ fontStyle: 'italic' }}>unavailable</span>
        }
      </span>
      {syncStatus === 'ok' && (
        <span style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          <i className="bi bi-check-circle-fill" />
        </span>
      )}
      {syncStatus === 'err' && (
        <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          <i className="bi bi-exclamation-circle-fill" />
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="fb-sync-btn"
        style={{
          background: syncStatus === 'err'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : `linear-gradient(135deg, ${accent}, ${accent2})`,
          opacity: syncing ? 0.8 : 1,
          cursor: syncing ? 'not-allowed' : 'pointer',
        }}
      >
        {syncing ? (
          <>
            <motion.i
              className="bi bi-arrow-repeat"
              style={{ marginRight: 4, display: 'inline-block' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            />Syncing…
          </>
        ) : (
          <><i className="bi bi-arrow-repeat" style={{ marginRight: 4 }} />Sync</>
        )}
      </button>
    </div>
  );

  const toastIconCls = toast.type === 'success' ? 'bi-check-circle-fill' : toast.type === 'error' ? 'bi-x-circle-fill' : 'bi-info-circle-fill';
  const toastColor   = toast.type === 'success' ? '#22c55e'  : toast.type === 'error' ? '#ef4444'  : accent;
  const toastBorder  = toast.type === 'success' ? '#86efac'  : toast.type === 'error' ? '#fca5a5'  : '#93c5fd';
  const cardBg       = isDarkMode ? '#1e293b' : 'white';
  const textClr      = isDarkMode ? '#e2e8f0' : '#1e293b';

  return (
    <div
      className={isFullscreen ? undefined : 'dash-outer'}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        overflowY: 'auto',
        zIndex: 9999,
        background: isDarkMode ? '#0f172a' : 'white',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily,
        ...cssVars,
      } : {
        fontFamily,
        ...cssVars,
      }}
    >

      {/* ── Top tab bar + Full Screen button (hidden in fullscreen) ── */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="dash-top-row"
        >
          <div
            className="dash-tab-bar"
            style={{ background: tabBg, border: `1px solid ${tabBorder}` }}
          >
            {TOP_TABS.map(t => (
              <motion.button
                key={t.id}
                onClick={() => setTopTab(t.id)}
                style={activeTopBtn(topTab === t.id)}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {t.label}
              </motion.button>
            ))}
          </div>

          <Tooltip content="Full Screen">
            <button
              onClick={toggleFullscreen}
              className="dash-fullscreen-btn"
              style={{ background: tabBg, border: `1px solid ${accent}`, color: accent, fontFamily }}
            >
              <i className="bi bi-arrows-fullscreen" style={{ fontSize: '0.82rem' }} />
            Full Screen
            </button>
          </Tooltip>
        </motion.div>
      )}

      {/* ── Floating Exit Full Screen button ── */}
      {isFullscreen && (
        <div style={{ position: 'fixed', top: 14, right: 20, zIndex: 9999 }}>
          <button
            onClick={toggleFullscreen}
            className="dash-exit-btn"
            style={{ background: accent, color: 'white', fontFamily }}
          >
            <i className="bi bi-fullscreen-exit" style={{ fontSize: '0.82rem' }} />
            Close Full Screen
          </button>
        </div>
      )}

      {/* ── REPORTS tab ─────────────────────────────────────────────────── */}
      {topTab === 'reports' && (
        <>
          {/* Summary cards — hide in fullscreen */}
          {!isFullscreen && <SummaryCardsSystem context="sales" accent={accent} accent2={accent2} />}

          {/* Report sub-tab pills + Last update + global Sync button — hide in fullscreen */}
          {!isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.08 }}
              className="dash-report-tabs"
              style={{ background: tabBg, border: `1px solid ${tabBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex' }}>
                {REPORT_TABS.map(t => (
                  <motion.button
                    key={t.id}
                    onClick={() => { setReportTab(t.id); setLastUpdateDate(null); }}
                    style={activeSubBtn(reportTab === t.id)}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {t.label}
                  </motion.button>
                ))}
              </div>
              <SyncToolbar />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {reportTab === 'monthwise' && (
              <motion.div key="tab-monthwise" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <SalesReportPage loggedInRole={loggedInRole} loggedInRolex={loggedInRolex} syncKey={syncKey} onLastUpdateChange={setLastUpdateDate} />
              </motion.div>
            )}
            {reportTab === 'daywise' && (
              <motion.div key="tab-daywise" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <DayWisePage syncKey={syncKey} onLastUpdateChange={setLastUpdateDate} />
              </motion.div>
            )}
            {reportTab === 'shortsupply' && (
              <motion.div key="tab-shortsupply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <ShortSupplyPage syncKey={syncKey} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── CHARTS tab ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {topTab === 'charts' && (
          <motion.div key="top-charts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {!isFullscreen && <SummaryCardsSystem context="sales" accent={accent} accent2={accent2} />}
            {/* Charts Sync toolbar */}
            {!isFullscreen && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                background: tabBg, border: `1px solid ${tabBorder}`,
                borderRadius: 10, padding: '6px 10px', marginBottom: 10,
              }}>
                <SyncToolbar compact />
              </div>
            )}
            <ChartsPage loggedInRolex={loggedInRolex} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global Sync Toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {toast.show && toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed', top: 24, right: 24, zIndex: 10001,
              minWidth: 260, maxWidth: 340, fontFamily,
            }}
          >
            <div style={{
              background: cardBg,
              border: `1.5px solid ${toastBorder}`,
              borderRadius: 14, padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <i className={`bi ${toastIconCls}`} style={{ color: toastColor, fontSize: '1.15rem', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: textClr }}>{toast.title}</div>
                <div style={{ fontSize: '0.75rem', color: mutedClr, marginTop: 2 }}>{toast.message}</div>
              </div>
              <button
                onClick={closeToast}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedClr, fontSize: '1.2rem', lineHeight: 1, padding: 0, marginLeft: 4 }}
              >×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
