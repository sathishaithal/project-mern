/**
 * productionHelpers.js
 * Pure utility functions for Production Report — no React/DOM dependencies.
 */

export const toNumber = (value) => Number(value) || 0;

export const flattenUnitArray = (arr) => {
  const result = {};
  (arr || []).forEach(obj => { Object.assign(result, obj); });
  return result;
};

export const hasRoundedDisplayValue = (...values) =>
  values.some((value) => Math.round(toNumber(value)) !== 0);

export const hasFinishedDisplayValue = (item = {}) =>
  hasRoundedDisplayValue(
    item.opening,
    item["purchased/transfer in"],
    item.sold,
    item.returned ?? item.return ?? item["sales return"],
    item.closing,
    item.prod_percentage
  );

export const hasRawDisplayValue = (item = {}) =>
  hasRoundedDisplayValue(
    item.opening,
    item["purchased/transfer in"],
    item["consumed/transfer out"],
    item.returned ?? item.return,
    item.closing
  );

export const filterGroupedData = (grouped = {}, predicate) =>
  Object.entries(grouped || {}).reduce((acc, [key, items]) => {
    const filteredItems = (items || []).filter(predicate);
    if (filteredItems.length > 0) {
      acc[key] = filteredItems;
    }
    return acc;
  }, {});
