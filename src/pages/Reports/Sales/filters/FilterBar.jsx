import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useColorMode } from '../../../../theme/ThemeContext';
import { usePageIntro } from '../../../../context/PageIntroContext';
import apiClient from '../../../../services/apiClient';
import YearSelector from './YearSelector';
import CompanySelector from './CompanySelector';
import DistTypeSelector from './DistTypeSelector';
import MonthSelector from './MonthSelector';
import '../Sales.css';

const FilterBar = ({ mode = 'monthwise', onApply, onSync, isLoading = false, lastUpdateDate, activeReportTab = '', children }) => {
  const { isDarkMode, selectedAccent } = useColorMode();
  const { triggerIntro } = usePageIntro();
  const [syncing,    setSyncing]    = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'ok' | 'err' | null

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus(null);
    try {
      await apiClient.get('/api/batch/dashboardsync');
      setSyncStatus('ok');
      triggerIntro(1400);
      onSync?.();
      setTimeout(() => setSyncStatus(null), 3000);
    } catch {
      setSyncStatus('err');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };
  const accent  = selectedAccent?.primary   || '#2563eb';
  const accent2 = selectedAccent?.secondary || '#1e40af';

  return (
    <div
      className="fb-bar"
      style={{
        background: isDarkMode ? '#1e293b' : 'white',
        border: `1px solid ${isDarkMode ? '#334155' : 'rgba(148,163,184,0.18)'}`,
      }}
    >
      <div className="fb-inner">
        <div className="fb-group">
          <YearSelector mode={mode} />
          {mode === 'daywise' && <MonthSelector />}
          <CompanySelector mode={mode} />
          <DistTypeSelector mode={mode} activeReportTab={activeReportTab} />
          {onApply && (
            <>
              <div style={{ width: 1, height: 28, background: isDarkMode ? '#334155' : '#e2e8f0', alignSelf: 'center' }} />
              <button
                onClick={onApply}
                disabled={isLoading}
                className="fb-generate-btn btn-generate-anim"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading
                  ? <><i className="bi bi-arrow-clockwise" style={{ marginRight: 4 }} />Loading…</>
                  : <><i className="bi bi-play-fill" style={{ marginRight: 4 }} />Generate</>
                }
              </button>
            </>
          )}
        </div>

        {children && (
          <div
            className="fb-group"
            style={{ borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, paddingLeft: '1rem' }}
          >
            {children}
          </div>
        )}

        <div className="fb-actions">
          {lastUpdateDate ? (
            <span className="fb-last-update" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              Last update on:&nbsp;
              <strong style={{ color: accent, fontWeight: 700 }}>{lastUpdateDate}</strong>
            </span>
          ) : (
            <span className="fb-last-update" style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }}>
              Last update: unavailable
            </span>
          )}

          {syncStatus === 'ok' && (
            <span style={{ color: accent, fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="bi bi-check-circle-fill" />Synced
            </span>
          )}
          {syncStatus === 'err' && (
            <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="bi bi-exclamation-circle-fill" />Sync failed
            </span>
          )}

          {onApply && (
            <button
              onClick={handleSync}
              disabled={isLoading || syncing}
              className="fb-sync-btn"
              style={{
                background: syncStatus === 'err'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : `linear-gradient(135deg, ${accent}, ${accent2})`,
                opacity: (isLoading || syncing) ? 0.8 : 1,
                cursor: (isLoading || syncing) ? 'not-allowed' : 'pointer',
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
              ) : isLoading ? (
                <><i className="bi bi-arrow-clockwise" style={{ marginRight: 4 }} />Loading…</>
              ) : (
                <><i className="bi bi-arrow-repeat" style={{ marginRight: 4 }} />Sync</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
