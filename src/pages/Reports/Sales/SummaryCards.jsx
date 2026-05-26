import React, { useEffect, useState } from 'react';
import './Sales.css';
import { getLastUpdatedDates, getDispatchHeaderTop } from '../../../services/salesDashboardApi';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import { appLog } from '../../../config/appConfig';

const MIX_PAIRS = [
  ['#b71c1c', '#880e4f'],
  ['#e65100', '#bf360c'],
  ['#4a148c', '#311b92'],
  ['#004d40', '#1b5e20'],
];

const CARD_ICONS = [
  'bi-graph-up',
  'bi-exclamation-triangle',
  'bi-bar-chart-line-fill',
  'bi-bar-chart-steps',
];

export default function SummaryCards() {
  const { user } = useAuth();
  const employeename = user?.username;
  const { selectedAccent } = useColorMode();
  const { monthwisedisttype } = useSalesFilterStore();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';

  const [datesData, setDatesData] = useState(null);
  const [headerTop, setHeaderTop] = useState(null);

  useEffect(() => {
    if (!employeename) return;
    appLog('[INIT] Fetching last updated dates and header top — runs once on mount');
    Promise.all([
      getLastUpdatedDates(employeename).catch(() => null),
      getDispatchHeaderTop(employeename).catch(() => null),
    ]).then(([dates, header]) => {
      setDatesData(Array.isArray(dates) ? dates[0] : (dates ?? null));
      setHeaderTop(header ?? null);
    });
  }, [employeename]);

  const cardBgs = MIX_PAIRS.map(([mix1, mix2]) =>
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 58%, ${mix1}), color-mix(in srgb, ${accent2} 52%, ${mix2}))`
  );

  const fmt = (val) =>
    val == null ? '—' : parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 3 });

  const cards = [
    {
      icon: CARD_ICONS[0],
      label: 'CURRENT MONTH SALES',
      subtitle: `(${monthwisedisttype || 'Distribution'})`,
      loading: datesData === null,
      content: `Total Tonnage : ${fmt(datesData?.currentmonthtonnage)}`,
    },
    {
      icon: CARD_ICONS[1],
      label: 'SHORT SUPPLY',
      subtitle: `(${datesData?.shortsupplydispdate ?? '—'})`,
      loading: datesData === null,
      content: `Short Supply Tonnage : ${fmt(datesData?.shortsupplytonnage)}`,
    },
    {
      icon: CARD_ICONS[2],
      label: 'TOP SELLING ITEM',
      subtitle: `(${headerTop?.list?.[0]?.ydate ?? '—'})`,
      loading: headerTop === null,
      list: headerTop?.list ?? [],
    },
    {
      icon: CARD_ICONS[3],
      label: 'LOW SELLING ITEM',
      subtitle: `(${headerTop?.list?.[0]?.ydate ?? '—'})`,
      loading: headerTop === null,
      list: headerTop?.list1 ?? [],
    },
  ];

  return (
    <div className="sc-grid">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="sc-card"
          style={{ background: cardBgs[idx] }}
        >
          <div className="sc-card-icon">
            <i className={`bi ${card.icon}`} style={{ fontSize: '1.4rem' }} />
          </div>
          <div className="sc-card-body">
            <div className="sc-card-label">{card.label}</div>
            <div className="sc-card-subtitle">
              {card.loading ? '—' : card.subtitle}
            </div>

            {'list' in card ? (
              card.loading ? (
                <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem', marginTop: 4, display: 'block' }} />
              ) : (
                <ul className="sc-card-list">
                  {card.list.slice(0, 5).map((item, i) => (
                    <li key={i}>
                      {item.description}&nbsp;&nbsp;(Tonnage: {fmt(item.tonnage)})
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="sc-card-value">
                {card.loading
                  ? <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }} />
                  : card.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
