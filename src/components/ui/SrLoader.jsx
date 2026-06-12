import React from 'react';

/**
 * SrLoader — shared full-page loading overlay used across all Sales and Day-wise pages.
 * Replaces the repeated sr-loader-overlay HTML block that was copy-pasted in
 * SalesReportPage, DayWisePage, ShortSupplyPage, and ChartsPage.
 *
 * @param {string}  accent     — accent hex colour for spinner border + dots
 * @param {boolean} isDarkMode — dark card background when true
 * @param {string}  text       — label shown below the spinner (default "Generating Report")
 */
export default function SrLoader({ accent, isDarkMode, text = 'Generating Report' }) {
  return (
    <div className="sr-loader-overlay">
      <div className={`sr-loader-card${isDarkMode ? ' sr-loader-card-dark' : ''}`}>
        <div className="sr-loader-spinner" style={{ borderTopColor: accent }} />
        <div className="sr-loader-text">{text}</div>
        <div className="sr-loader-dots">
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
        </div>
      </div>
    </div>
  );
}
