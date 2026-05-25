import React, { useEffect, useState } from 'react';
import './Sales.css';
import { getLastUpdatedDates, getDispatchHeaderTop } from '../../../services/salesDashboardApi';
import { fmtDate } from '../../../utils/salesFormatters';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';

const CARD_DEFS = [
  { key: 'currentmonthtonnage', label: 'Current Month Sales', icon: 'bi-graph-up',         suffix: ' T', isDate: false, source: 'header' },
  { key: 'shortsupplytonnage',  label: 'Short Supply',        icon: 'bi-exclamation-triangle', suffix: ' T', isDate: false, source: 'header' },
  { key: 'dispatchlastupdate',  label: 'Dispatch Updated',    icon: 'bi-truck',             suffix: '',   isDate: true,  source: 'dates'  },
  { key: 'daywisesaleslastupdate', label: 'Day-wise Updated', icon: 'bi-calendar-check',    suffix: '',   isDate: true,  source: 'dates'  },
];

const MIX_PAIRS = [
  ['#b71c1c', '#880e4f'],
  ['#e65100', '#bf360c'],
  ['#4a148c', '#311b92'],
  ['#004d40', '#1b5e20'],
];

export default function SummaryCards() {
  const { user } = useAuth();
  const employeename = user?.username;
  const { selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';

  const [headerData, setHeaderData] = useState(null);
  const [datesData,  setDatesData]  = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employeename) return;
    Promise.all([
      getDispatchHeaderTop(employeename).catch(() => null),
      getLastUpdatedDates(employeename).catch(() => null),
    ]).then(([header, dates]) => {
      setHeaderData(Array.isArray(header) ? header[0] : header ?? null);
      setDatesData(Array.isArray(dates)   ? dates[0]  : dates  ?? null);
    }).catch(setError);
  }, [employeename]);

  const cardBgs = CARD_DEFS.map((_, idx) => {
    const [mix1, mix2] = MIX_PAIRS[idx];
    return `linear-gradient(135deg, color-mix(in srgb, ${accent} 58%, ${mix1}), color-mix(in srgb, ${accent2} 52%, ${mix2}))`;
  });

  if (error) {
    return (
      <div style={{ padding: '0.5rem 1rem', color: '#c62828', fontSize: '0.8rem', marginBottom: '1rem' }}>
        <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />
        Unable to load summary data. {error?.message || ''}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: '1.25rem',
    }}>
      {CARD_DEFS.map((card, idx) => {
        const dataObj = card.source === 'header' ? headerData : datesData;
        const raw = dataObj?.[card.key];
        const display = raw == null ? '—'
          : card.isDate ? fmtDate(raw)
          : `${parseFloat(raw).toLocaleString('en-IN', { maximumFractionDigits: 2 })}${card.suffix}`;

        return (
          <div
            key={card.key}
            style={{
              minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
              background: cardBgs[idx],
              borderRadius: 14, padding: '1rem 1.2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
              display: 'flex', alignItems: 'center', gap: '0.9rem', color: 'white',
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className={`bi ${card.icon}`} style={{ fontSize: '1.4rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 2, letterSpacing: '-0.01em' }}>
                {dataObj === null
                  ? <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }} />
                  : display}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
