import React from 'react';
import { useColorMode } from '../../../../theme/ThemeContext';
import YearSelector from './YearSelector';
import CompanySelector from './CompanySelector';
import DistTypeSelector from './DistTypeSelector';
import MonthSelector from './MonthSelector';
import '../Sales.css';

const FilterBar = ({ mode = 'monthwise', onApply, isLoading = false, lastUpdateDate, children }) => {
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#2563eb';
  const accent2 = selectedAccent?.secondary || '#1e40af';

  const barStyle = {
    background: isDarkMode ? '#1e293b' : 'white',
    border: `1px solid ${isDarkMode ? '#334155' : 'rgba(148,163,184,0.18)'}`,
    borderRadius: 14, boxShadow: '0 2px 12px rgba(37,99,235,0.06)',
    padding: '0.75rem 1.25rem', marginBottom: '1.25rem',
  };

  const syncBtnStyle = {
    height: 34,
    background: `linear-gradient(135deg, ${accent}, ${accent2})`,
    color: 'white', border: 'none', borderRadius: 8, padding: '0 1rem',
    fontWeight: 700, fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif",
    display: 'flex', alignItems: 'center', gap: 2,
    transition: 'opacity 0.2s', whiteSpace: 'nowrap',
  };

  return (
    <div style={barStyle}>
      <div className="fb-inner">
        <div className="fb-group">
          <YearSelector mode={mode} />
          {mode === 'daywise' && <MonthSelector />}
          <CompanySelector mode={mode} />
          <DistTypeSelector mode={mode} />
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
          {lastUpdateDate && (
            <span style={{ fontSize: '0.72rem', color: isDarkMode ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
              Last update on:&nbsp;
              <strong style={{ color: accent, fontWeight: 700 }}>{lastUpdateDate}</strong>
            </span>
          )}
          {onApply && (
            <button
              onClick={onApply}
              disabled={isLoading}
              style={{ ...syncBtnStyle, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
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
