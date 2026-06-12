import React from 'react';
import { useColorMode } from '../../../../theme/ThemeContext';
import YearSelector from './YearSelector';
import CompanySelector from './CompanySelector';
import DistTypeSelector from './DistTypeSelector';
import MonthSelector from './MonthSelector';
import '../Sales.css';

const FilterBar = ({ mode = 'monthwise', onApply, isLoading = false, lastUpdateDate, activeReportTab = '', children }) => {
  const { isDarkMode, selectedAccent } = useColorMode();
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
          {onApply && (
            <button
              onClick={onApply}
              disabled={isLoading}
              className="fb-sync-btn"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent2})`,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading
                ? <><i className="bi bi-arrow-clockwise" style={{ marginRight: 4 }} />Loading…</>
                : <><i className="bi bi-arrow-repeat" style={{ marginRight: 4 }} />Sync</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
