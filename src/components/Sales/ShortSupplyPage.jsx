import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getShortSupplyByCategory } from '../../services/salesDashboardApi';
import { useAuth } from '../../context/AuthContext';
import { useColorMode } from '../../theme/ThemeContext';

function ShortSupplyTable({ title, data, loading, error, accent, accentDark, cardBg, borderClr, textClr, mutedClr, isDarkMode }) {
  const totals = useMemo(() => ({
    order:    data.reduce((s, r) => s + (parseFloat(r.order)       || 0), 0),
    supply:   data.reduce((s, r) => s + (parseFloat(r.supply)      || 0), 0),
    short:    data.reduce((s, r) => s + (parseFloat(r.shortsupply) || 0), 0),
    lastYear: data.reduce((s, r) => s + (parseFloat(r.lastYear)    || 0), 0),
  }), [data]);

  const thS = {
    padding: '0.5rem 0.6rem', fontWeight: 700, fontSize: '0.71rem',
    color: 'white', textAlign: 'right', whiteSpace: 'nowrap',
  };
  const tdS = {
    padding: '0.4rem 0.6rem', textAlign: 'right',
    fontSize: '0.75rem', color: mutedClr,
  };
  const totalRowBg = `color-mix(in srgb, ${accent} 18%, ${isDarkMode ? '#1e293b' : '#e8eaf6'})`;

  return (
    <div style={{ flex: 1, minWidth: 0, background: cardBg, borderRadius: 12, border: `1px solid ${borderClr}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(37,99,235,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: `1px solid ${borderClr}`, background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: textClr, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-table" style={{ color: accent }} />
          {title}
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>
            <i className="bi bi-arrow-clockwise" style={{ marginRight: 6 }} />Loading…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c62828', fontSize: '0.82rem' }}>
            <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />
            {error}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ background: accent, color: 'white' }}>
                <th style={{ ...thS, textAlign: 'center', width: 36 }}>#</th>
                <th style={{ ...thS, textAlign: 'left', minWidth: 180 }}>Description</th>
                <th style={{ ...thS, minWidth: 70 }}>Order</th>
                <th style={{ ...thS, minWidth: 70 }}>Supply</th>
                <th style={{ ...thS, background: accentDark, minWidth: 80 }}>Shortsupply</th>
                <th style={{ ...thS, background: accentDark, minWidth: 110 }}>Last Year<br />Shortsupply</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>No data</td></tr>
              ) : data.map((row, idx) => {
                const evenBg = isDarkMode ? '#1e293b' : '#ffffff';
                const oddBg  = isDarkMode ? '#192233' : '#f8fafc';
                const rowBg  = idx % 2 === 0 ? evenBg : oddBg;
                return (
                  <tr key={row.id ?? idx}
                    style={{ background: rowBg, borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}
                    onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? '#1e2d45' : '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    <td style={{ ...tdS, textAlign: 'center', color: mutedClr }}>{idx + 1}</td>
                    <td style={{ ...tdS, textAlign: 'left', color: textClr, fontWeight: 500, whiteSpace: 'normal' }}>
                      {row.description}
                    </td>
                    <td style={tdS}>{parseFloat(row.order || 0).toFixed(3)}</td>
                    <td style={tdS}>{parseFloat(row.supply || 0).toFixed(3)}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: parseFloat(row.shortsupply) > 0 ? '#c62828' : mutedClr }}>
                      {parseFloat(row.shortsupply || 0).toFixed(3)}
                    </td>
                    <td style={tdS}>
                      <span style={{ color: '#c62828' }}>
                        <i className="bi bi-arrow-up" style={{ fontSize: '0.65rem', marginRight: 2 }} />
                        {parseFloat(row.lastYear || 0).toFixed(3)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {data.length > 0 && (
                <tr style={{ background: totalRowBg, borderTop: `2px solid ${borderClr}`, fontWeight: 700 }}>
                  <td style={{ ...tdS, textAlign: 'center', color: accent }}>{data.length + 1}</td>
                  <td style={{ ...tdS, textAlign: 'left', color: accent }}>Total</td>
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
    </div>
  );
}

export default function ShortSupplyPage() {
  const { user } = useAuth();
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();

  const accent     = selectedAccent?.primary   || '#1a237e';
  const accent2    = selectedAccent?.secondary || '#283593';
  const accentDark = `color-mix(in srgb, ${accent} 52%, #0a1628)`;
  const cardBg     = isDarkMode ? '#1e293b' : 'white';
  const borderClr  = isDarkMode ? '#334155' : 'rgba(148,163,184,0.15)';
  const textClr    = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr   = isDarkMode ? '#94a3b8' : '#64748b';
  const fontFamily = selectedFont?.body || "'Manrope', sans-serif";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getShortSupplyByCategory(user?.username)
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err?.message || 'Failed to load short supply data');
        setLoading(false);
      });
  }, [user?.username]);

  const highToLow = useMemo(() =>
    [...rows].sort((a, b) => (parseFloat(b.shortsupply) || 0) - (parseFloat(a.shortsupply) || 0)),
  [rows]);

  const lowToHigh = useMemo(() =>
    [...rows].sort((a, b) => (parseFloat(a.shortsupply) || 0) - (parseFloat(b.shortsupply) || 0)),
  [rows]);

  const tableProps = { accent, accentDark, cardBg, borderClr, textClr, mutedClr, isDarkMode, loading, error };

  return (
    <div style={{ width: '100%', fontFamily }}>
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

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
      >
        <ShortSupplyTable {...tableProps} title="Short supply tonnage (High to Low)" data={highToLow} />
        <ShortSupplyTable {...tableProps} title="Short supply tonnage (Low to High)" data={lowToHigh} />
      </motion.div>
    </div>
  );
}
