import React, { useState, useEffect, useRef } from 'react';
import Tooltip from '../../../components/ui/Tooltip';
import { motion } from 'framer-motion';
import { useColorMode } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import './Sales.css';
import { getAccessType, getHrDesignation, logLogin } from '../../../services/salesDashboardApi';
import SalesReportPage from './SalesReportPage';
import DayWisePage from './DayWisePage';
import ShortSupplyPage from './ShortSupplyPage';
import ChartsPage from './ChartsPage';
import SummaryCards from './SummaryCards';

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

  const [topTab,        setTopTab]        = useState('reports');
  const [reportTab,     setReportTab]     = useState('monthwise');
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [loggedInRole,  setLoggedInRole]  = useState(null);
  const [loggedInRolex, setLoggedInRolex] = useState(null);

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
              <button key={t.id} onClick={() => setTopTab(t.id)} style={activeTopBtn(topTab === t.id)}>
                {t.label}
              </button>
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
          {!isFullscreen && <SummaryCards accent={accent} accent2={accent2} />}

          {/* Report sub-tab pills — hide in fullscreen */}
          {!isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.08 }}
              className="dash-report-tabs"
              style={{ background: tabBg, border: `1px solid ${tabBorder}` }}
            >
              {REPORT_TABS.map(t => (
                <button key={t.id} onClick={() => setReportTab(t.id)} style={activeSubBtn(reportTab === t.id)}>
                  {t.label}
                </button>
              ))}
            </motion.div>
          )}

          {reportTab === 'monthwise'   && <SalesReportPage loggedInRole={loggedInRole} loggedInRolex={loggedInRolex} />}
          {reportTab === 'daywise'     && <DayWisePage />}
          {reportTab === 'shortsupply' && <ShortSupplyPage />}
        </>
      )}

      {/* ── CHARTS tab ──────────────────────────────────────────────────── */}
      {topTab === 'charts' && (
        <>
          {!isFullscreen && <SummaryCards accent={accent} accent2={accent2} />}
          <ChartsPage loggedInRolex={loggedInRolex} />
        </>
      )}
    </div>
  );
}
