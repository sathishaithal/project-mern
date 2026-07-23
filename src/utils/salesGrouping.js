/**
 * salesGrouping.js
 * Pure data-transformation utilities extracted from SalesReportPage.
 * No React imports — safe to use in any context or test.
 */

// All monthly + quarterly tonnage field keys used in Sales reports
export const ALL_NUM_KEYS = [
  'jantonnage','febtonnage','martonnage','aprtonnage','maytonnage','juntonnage',
  'jultonnage','augtonnage','septonnage','octtonnage','novtonnage','dectonnage',
  'jantonnage_last','febtonnage_last','martonnage_last','aprtonnage_last','maytonnage_last','juntonnage_last',
  'jultonnage_last','augtonnage_last','septonnage_last','octtonnage_last','novtonnage_last','dectonnage_last',
  'Q1','Q2','Q3','Q4','Q1_last','Q2_last','Q3_last','Q4_last',
  'ttltonnage_crnt','ttltonnage_crntwy','ttltonnagewy','currentmonthtonnage','currentmonthtonnage_last',
];

// Keys summed during grouping (superset — adds ttltonnage and lastmonthtonnage)
export const GROUP_SUM_KEYS = [...ALL_NUM_KEYS, 'ttltonnage', 'lastmonthtonnage'];

// Mirrors Angular datafilter_new() distfinf assignments: groupField → distfinf value
export const GROUP_FIELD_TO_DISTFINF = {
  description: 1, category: 2, catgroup: 3, year: 4,
  distname: 5, soff: 6, areaname: 7, asm: 8,
};

// Defines the next drill-down groupField for each tab and each parent groupField
export const FULL_DRILL_AFTER = {
  distributors: { distname: 'catgroup', catgroup: 'category', category: 'description', year: 'catgroup' },
  catgroup:     { catgroup: 'distname', distname: 'category', category: 'description', year: 'distname' },
  asm:          { asm: 'catgroup', catgroup: 'category', year: 'catgroup' },
  soff:         { soff: 'distname', distname: 'catgroup', catgroup: 'category', year: 'distname' },
};

/**
 * Groups a flat API response array by groupField, summing all numeric tonnage keys per group.
 * Mirrors Angular's datafilter_new() / datafilter() combination.
 *
 * @param {object[]} rows         - flat rows from the API
 * @param {string}   groupField   - field to group by (e.g. 'distname', 'catgroup')
 * @param {object}   parentFilters - accumulated drill-down filter chain
 * @returns {object[]} grouped + summed rows sorted by groupField
 */
export function groupByField(rows, groupField, parentFilters = {}) {
  const distfinf = GROUP_FIELD_TO_DISTFINF[groupField];
  const map = new Map();
  for (const row of rows) {
    const key = String(row[groupField] ?? '').trim();
    if (!key) continue;
    if (!map.has(key)) {
      const entry = { ...row, id: key, _groupField: groupField, _filters: { ...parentFilters, [groupField]: key } };
      GROUP_SUM_KEYS.forEach(k => { entry[k] = 0; });
      map.set(key, entry);
    }
    const entry = map.get(key);
    GROUP_SUM_KEYS.forEach(k => { entry[k] += parseFloat(row[k]) || 0; });
  }
  return Array.from(map.values())
    .sort((a, b) => String(a[groupField]).localeCompare(String(b[groupField])))
    .map(row => {
      if (distfinf !== undefined) row.distfinf = distfinf;
      return row;
    });
}

/**
 * Returns a { bg, text } colour pair based on Angular's distfinf colour classes.
 * distfinf 5/6/8 (distname/soff/asm) → traffic-light from Q degrowth count.
 * All other distfinf → fixed palette matching Angular SCSS classes.
 * distfinf 3 (catgroup) is intentionally excluded — those rows fall back to
 * the theme-based accent/dark-mode row background used everywhere else
 * (e.g. YoY Summary, deeper drill levels), instead of a fixed color.
 */
export function getDistfinfColor(row) {
  const df = parseInt(row.distfinf, 10);
  if (isNaN(df)) return null;
  if (df === 5 || df === 6 || df === 8) {
    const dg =
      ((parseFloat(row.Q1) || 0) <= (parseFloat(row.Q1_last) || 0) ? 1 : 0) +
      ((parseFloat(row.Q2) || 0) <= (parseFloat(row.Q2_last) || 0) ? 1 : 0) +
      ((parseFloat(row.Q3) || 0) <= (parseFloat(row.Q3_last) || 0) ? 1 : 0) +
      ((parseFloat(row.Q4) || 0) <= (parseFloat(row.Q4_last) || 0) ? 1 : 0);
    if (dg === 0) return { bg: 'green',       text: '#ffffff' };
    if (dg === 1) return { bg: 'lightgreen',  text: '#14532d' };
    if (dg === 2) return { bg: 'yellow',      text: '#713f12' };
    return           { bg: 'red',          text: '#ffffff' };
  }
  const MAP = {
    1: { bg: '#a3aba3',         text: '#1e293b' },
    2: { bg: '#f1a689',         text: '#1e293b' },
    4: { bg: '#e9d77c',         text: '#1e293b' },
    7: { bg: '#ebbad3',         text: '#1e293b' },
  };
  return MAP[df] || null;
}
