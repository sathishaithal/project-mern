import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      className="sr-loader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className={`sr-loader-card${isDarkMode ? ' sr-loader-card-dark' : ''}`}
        initial={{ scale: 0.94, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div className="sr-loader-spinner" style={{ borderTopColor: accent }} />
        <div className="sr-loader-text">{text}</div>
        <div className="sr-loader-dots">
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
