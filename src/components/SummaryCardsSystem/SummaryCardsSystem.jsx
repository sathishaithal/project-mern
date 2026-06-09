import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorMode } from '../../theme/ThemeContext';
import { useSummaryCards } from '../../context/SummaryCardsContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CARDS = 5;
const STORAGE_KEY        = 'summaryCards_global';
const STORAGE_HIDDEN_KEY = 'summaryCardsHidden_global';

const SPIN_CSS    = `@keyframes sc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
const SHIMMER_CSS = `@keyframes sc-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(500%)}}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (val) =>
  val == null || val === '' ? '—'
    : parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 3 });

const getSublabel = (card, d) =>
  typeof card.sublabel === 'function' ? card.sublabel(d) : card.sublabel;

// ─── All card definitions ─────────────────────────────────────────────────────
// CONFIRMED FIELDS (from PHP backend):
// getLastUpdatedDates list[0]: currentmonthtonnage, shortsupplytonnage, shortsupplydispdate,
//                              dispatchlastupdate, daywisesaleslastupdate
// getDispatchHeaderTop: { list:[{description,tonnage,ydate}], list1:[{description,tonnage}] }
// getShortSupplyByCategory: [{description, ordertonnage, supplytonnage, shortsupplytonnage, ...}]
// production-report: finished{brand:[{description,opening,purchased/transfer in,sold,
//   returned/return/sales return,closing,prod_percentage}]}, finishedOthers{...},
//   raw{"All Raw Materials":[{description,opening,purchased/transfer in,
//   consumed/transfer out,returned/return,closing}]}
const ALL_CARDS = [

  // ── Sales & Distribution ─────────────────────────────────────────────────
  {
    id: 'current_month_dist',
    label: 'CURRENT MONTH SALES',
    sublabel: '(Distribution - SBL)',
    icon: 'bi-graph-up-arrow',
    section: 'sales',
    grad: 0,
    isLoading: (d) => d.dates === null && d.multiYearData === null,
    getValue: (d) => {
      const v = d.dates?.currentmonthtonnage
        || (d.multiYearData ?? []).find(r => r.currentmonthtonnage > 0)?.currentmonthtonnage;
      return `Tonnage: ${fmt(v)}`;
    },
  },
  {
    id: 'short_supply',
    label: 'SHORT SUPPLY',
    sublabel: (d) => d.dates?.shortsupplydispdate ? `(${d.dates.shortsupplydispdate})` : '(Date —)',
    icon: 'bi-exclamation-triangle',
    section: 'sales',
    grad: 4,
    isLoading: (d) => d.dates === null,
    getValue: (d) => `Tonnage: ${fmt(d.dates?.shortsupplytonnage)}`,
  },
  {
    id: 'dispatch_last_update',
    label: 'LAST DISPATCH UPDATE',
    sublabel: '(System)',
    icon: 'bi-truck',
    section: 'sales',
    grad: 6,
    isLoading: (d) => d.dates === null,
    getValue: (d) => d.dates?.dispatchlastupdate ?? '—',
  },
  {
    id: 'short_supply_high_top3',
    label: 'HIGH TO LOW TOP 3',
    sublabel: '(Short Supply — Yesterday)',
    icon: 'bi-sort-numeric-down-alt',
    section: 'sales',
    grad: 4,
    isLoading: (d) => d.shortSupply === null,
    isList: true,
    getList: (d) => {
      const arr = Array.isArray(d.shortSupply) ? d.shortSupply : [];
      return [...arr]
        .filter(r => (parseFloat(r.shortsupplytonnage) || 0) > 0)
        .sort((a, b) => (parseFloat(b.shortsupplytonnage) || 0) - (parseFloat(a.shortsupplytonnage) || 0))
        .slice(0, 3);
    },
    renderItem: (item) => `${item.description}  (${fmt(item.shortsupplytonnage)} T)`,
  },
  {
    id: 'short_supply_low_top3',
    label: 'LOW TO HIGH TOP 3',
    sublabel: '(Short Supply — Yesterday)',
    icon: 'bi-sort-numeric-up',
    section: 'sales',
    grad: 3,
    isLoading: (d) => d.shortSupply === null,
    isList: true,
    getList: (d) => {
      const arr = Array.isArray(d.shortSupply) ? d.shortSupply : [];
      return [...arr]
        .filter(r => (parseFloat(r.shortsupplytonnage) || 0) > 0)
        .sort((a, b) => (parseFloat(a.shortsupplytonnage) || 0) - (parseFloat(b.shortsupplytonnage) || 0))
        .slice(0, 3);
    },
    renderItem: (item) => `${item.description}  (${fmt(item.shortsupplytonnage)} T)`,
  },
  {
    id: 'top_selling_items',
    label: 'TOP SELLING ITEMS',
    sublabel: '(Current Month — SBL Dist)',
    icon: 'bi-bar-chart-line-fill',
    section: 'sales',
    grad: 5,
    isLoading: (d) => d.sellingData === null,
    isList: true,
    getList: (d) => {
      const arr = Array.isArray(d.sellingData) ? d.sellingData : (d.sellingData?.list ?? []);
      return [...arr].sort((a, b) => (parseFloat(b.tonnage) || 0) - (parseFloat(a.tonnage) || 0)).slice(0, 5);
    },
    renderItem: (item) => `${item.catgroup ?? item.name}  (${fmt(item.tonnage)} T)`,
  },
  {
    id: 'low_selling_items',
    label: 'LOW SELLING ITEMS',
    sublabel: '(Current Month — SBL Dist)',
    icon: 'bi-bar-chart-steps',
    section: 'sales',
    grad: 3,
    isLoading: (d) => d.sellingData === null,
    isList: true,
    getList: (d) => {
      const arr = Array.isArray(d.sellingData) ? d.sellingData : (d.sellingData?.list ?? []);
      return [...arr]
        .filter(r => (parseFloat(r.tonnage) || 0) > 0)
        .sort((a, b) => (parseFloat(a.tonnage) || 0) - (parseFloat(b.tonnage) || 0))
        .slice(0, 5);
    },
    renderItem: (item) => `${item.catgroup ?? item.name}  (${fmt(item.tonnage)} T)`,
  },
  {
    id: 'top_item_1',
    label: 'TOP ITEM #1',
    sublabel: '(Yesterday Tonnage)',
    icon: 'bi-1-circle-fill',
    section: 'sales',
    grad: 5,
    isLoading: (d) => d.header === null,
    getValue: (d) => {
      const item = d.header?.list?.[0];
      return item ? `${item.description} — ${fmt(item.tonnage)} T` : '—';
    },
  },
  {
    id: 'top_item_2',
    label: 'TOP ITEM #2',
    sublabel: '(Yesterday Tonnage)',
    icon: 'bi-2-circle-fill',
    section: 'sales',
    grad: 5,
    isLoading: (d) => d.header === null,
    getValue: (d) => {
      const item = d.header?.list?.[1];
      return item ? `${item.description} — ${fmt(item.tonnage)} T` : '—';
    },
  },
  {
    id: 'top_item_3',
    label: 'TOP ITEM #3',
    sublabel: '(Yesterday Tonnage)',
    icon: 'bi-3-circle-fill',
    section: 'sales',
    grad: 5,
    isLoading: (d) => d.header === null,
    getValue: (d) => {
      const item = d.header?.list?.[2];
      return item ? `${item.description} — ${fmt(item.tonnage)} T` : '—';
    },
  },
  {
    id: 'low_item_1',
    label: 'LOW ITEM #1',
    sublabel: '(Yesterday Tonnage)',
    icon: 'bi-1-circle',
    section: 'sales',
    grad: 3,
    isLoading: (d) => d.header === null,
    getValue: (d) => {
      const item = d.header?.list1?.[0];
      return item ? `${item.description} — ${fmt(item.tonnage)} T` : '—';
    },
  },
  {
    id: 'low_item_2',
    label: 'LOW ITEM #2',
    sublabel: '(Yesterday Tonnage)',
    icon: 'bi-2-circle',
    section: 'sales',
    grad: 3,
    isLoading: (d) => d.header === null,
    getValue: (d) => {
      const item = d.header?.list1?.[1];
      return item ? `${item.description} — ${fmt(item.tonnage)} T` : '—';
    },
  },

  // ── Sales Report API cards (from getMultiYearSales — same data as SalesReportPage) ──
  // Uses last element = current year (arr[0] may be hidden prior-year row from API)
  {
    id: 'sales_rpt_month',
    label: 'SALES THIS MONTH',
    sublabel: '(SBL Distribution — Report)',
    icon: 'bi-calendar2-check',
    section: 'sales',
    grad: 0,
    isLoading: (d) => d.multiYearData === null,
    getValue: (d) => {
      const arr = d.multiYearData ?? [];
      const row = arr[arr.length - 1];
      return row ? `${fmt(row.currentmonthtonnage)} T` : '—';
    },
  },
  {
    id: 'sales_rpt_ytd',
    label: 'SALES YTD',
    sublabel: '(SBL Distribution — Report)',
    icon: 'bi-graph-up',
    section: 'sales',
    grad: 1,
    isLoading: (d) => d.multiYearData === null,
    getValue: (d) => {
      const arr = d.multiYearData ?? [];
      const row = arr[arr.length - 1];
      return row ? `${fmt(row.ttltonnage_crnt)} T` : '—';
    },
  },
  {
    id: 'sales_rpt_q1',
    label: 'SALES Q1',
    sublabel: '(Jan–Mar SBL Distribution)',
    icon: 'bi-bar-chart',
    section: 'sales',
    grad: 2,
    isLoading: (d) => d.multiYearData === null,
    getValue: (d) => {
      const arr = d.multiYearData ?? [];
      const row = arr[arr.length - 1];
      return row ? `${fmt(row.Q1)} T` : '—';
    },
  },
  {
    id: 'sales_rpt_q2',
    label: 'SALES Q2',
    sublabel: '(Apr–Jun SBL Distribution)',
    icon: 'bi-bar-chart',
    section: 'sales',
    grad: 3,
    isLoading: (d) => d.multiYearData === null,
    getValue: (d) => {
      const arr = d.multiYearData ?? [];
      const row = arr[arr.length - 1];
      return row ? `${fmt(row.Q2)} T` : '—';
    },
  },
  {
    id: 'sales_rpt_q3',
    label: 'SALES Q3',
    sublabel: '(Jul–Sep SBL Distribution)',
    icon: 'bi-bar-chart',
    section: 'sales',
    grad: 4,
    isLoading: (d) => d.multiYearData === null,
    getValue: (d) => {
      const arr = d.multiYearData ?? [];
      const row = arr[arr.length - 1];
      return row ? `${fmt(row.Q3)} T` : '—';
    },
  },
  {
    id: 'sales_rpt_q4',
    label: 'SALES Q4',
    sublabel: '(Oct–Dec SBL Distribution)',
    icon: 'bi-bar-chart',
    section: 'sales',
    grad: 5,
    isLoading: (d) => d.multiYearData === null,
    getValue: (d) => {
      const arr = d.multiYearData ?? [];
      const row = arr[arr.length - 1];
      return row ? `${fmt(row.Q4)} T` : '—';
    },
  },
  // ── Production ───────────────────────────────────────────────────────────
  {
    id: 'fg_total_production',
    label: 'FG TOTAL PRODUCTION',
    sublabel: '(Finished Goods - Current Month)',
    icon: 'bi-box-seam',
    section: 'production',
    grad: 0,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const total = Object.values(d.prodData.finished).flat()
        .reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'fg_opening_stock',
    label: 'FG OPENING STOCK',
    sublabel: '(Finished Goods)',
    icon: 'bi-box-arrow-in-down',
    section: 'production',
    grad: 1,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const total = Object.values(d.prodData.finished).flat()
        .reduce((s, i) => s + (parseFloat(i.opening) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'fg_closing_stock',
    label: 'FG CLOSING STOCK',
    sublabel: '(Finished Goods)',
    icon: 'bi-archive',
    section: 'production',
    grad: 3,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const total = Object.values(d.prodData.finished).flat()
        .reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'fg_dispatch',
    label: 'FG DISPATCHED',
    sublabel: '(Sold - Current Month)',
    icon: 'bi-send',
    section: 'production',
    grad: 5,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const total = Object.values(d.prodData.finished).flat()
        .reduce((s, i) => s + (parseFloat(i.sold) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'fg_returned',
    label: 'FG RETURNED',
    sublabel: '(Sales Return)',
    icon: 'bi-arrow-counterclockwise',
    section: 'production',
    grad: 4,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const total = Object.values(d.prodData.finished).flat()
        .reduce((s, i) => s + (parseFloat(i.returned ?? i.return ?? i['sales return']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'raw_total_used',
    label: 'RAW MATERIAL USED',
    sublabel: '(Consumed / Transfer Out)',
    icon: 'bi-cpu',
    section: 'production',
    grad: 4,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i['consumed/transfer out']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'raw_opening_stock',
    label: 'RAW MATERIAL OPENING',
    sublabel: '(Stock)',
    icon: 'bi-box-arrow-in-up',
    section: 'production',
    grad: 2,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i.opening) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'raw_closing_stock',
    label: 'RAW MATERIAL CLOSING',
    sublabel: '(Stock)',
    icon: 'bi-database',
    section: 'production',
    grad: 6,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'raw_arrival',
    label: 'RAW MATERIAL ARRIVAL',
    sublabel: '(Purchased / Transfer In)',
    icon: 'bi-truck-front',
    section: 'production',
    grad: 6,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'byproducts_total',
    label: 'BY-PRODUCTS PRODUCTION',
    sublabel: '(Total)',
    icon: 'bi-boxes',
    section: 'production',
    grad: 2,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finishedOthers) return '—';
      const total = Object.values(d.prodData.finishedOthers).flat()
        .reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'byproducts_closing',
    label: 'BY-PRODUCTS CLOSING',
    sublabel: '(Stock)',
    icon: 'bi-boxes',
    section: 'production',
    grad: 5,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finishedOthers) return '—';
      const total = Object.values(d.prodData.finishedOthers).flat()
        .reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'total_packing_fg',
    label: 'TOTAL PACKING',
    sublabel: '(Fried + Bengal Gram)',
    icon: 'bi-box',
    section: 'production',
    grad: 5,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const fg = (d.prodData.finished['FRIED GRAM'] ?? [])
        .reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      const bg = (d.prodData.finished['BENGAL GRAM'] ?? [])
        .reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${fmt(fg + bg)} KG`;
    },
  },
  {
    id: 'fried_gram_production',
    label: 'FRIED GRAM PRODUCTION',
    sublabel: '(Total)',
    icon: 'bi-fire',
    section: 'production',
    grad: 4,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.finished?.['FRIED GRAM'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'bengal_gram_production',
    label: 'BENGAL GRAM PRODUCTION',
    sublabel: '(Total)',
    icon: 'bi-droplet-half',
    section: 'production',
    grad: 2,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.finished?.['BENGAL GRAM'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'gram100kg_used',
    label: 'GRAM 100 KG USED',
    sublabel: '(Raw Material)',
    icon: 'bi-moisture',
    section: 'production',
    grad: 0,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const item = items.find(i => i.description?.toUpperCase().trim() === 'GRAM 100 KG');
      return item ? `${fmt(parseFloat(item['consumed/transfer out']) || 0)} KG` : '—';
    },
  },
  {
    id: 'production_ratio',
    label: 'PRODUCTION RATIO',
    sublabel: '(FG / Raw 100 KG %)',
    icon: 'bi-bar-chart-steps',
    section: 'production',
    grad: 1,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const gram100 = items.find(i => i.description?.toUpperCase().trim() === 'GRAM 100 KG');
      const used = parseFloat(gram100?.['consumed/transfer out']) || 0;
      if (!used || !d.prodData?.finished) return '—';
      const fgTotal = Object.values(d.prodData.finished).flat()
        .reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
      return `${((fgTotal / used) * 100).toFixed(2)}%`;
    },
  },
  {
    id: 'fg_net_sold',
    label: 'FG NET SOLD',
    sublabel: '(Sold − Returned)',
    icon: 'bi-cart-check',
    section: 'production',
    grad: 3,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const items = Object.values(d.prodData.finished).flat();
      const sold     = items.reduce((s, i) => s + (parseFloat(i.sold) || 0), 0);
      const returned = items.reduce((s, i) => s + (parseFloat(i.returned ?? i.return ?? i['sales return']) || 0), 0);
      return `${fmt(sold - returned)} KG`;
    },
  },
  {
    id: 'fg_stock_delta',
    label: 'FG STOCK CHANGE',
    sublabel: '(Closing − Opening)',
    icon: 'bi-arrow-left-right',
    section: 'production',
    grad: 2,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const items   = Object.values(d.prodData.finished).flat();
      const opening = items.reduce((s, i) => s + (parseFloat(i.opening) || 0), 0);
      const closing = items.reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      const delta   = closing - opening;
      return `${delta >= 0 ? '+' : ''}${fmt(delta)} KG`;
    },
  },
  {
    id: 'raw_stock_delta',
    label: 'RAW STOCK CHANGE',
    sublabel: '(Closing − Opening)',
    icon: 'bi-arrow-left-right',
    section: 'production',
    grad: 6,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items   = d.prodData?.raw?.['All Raw Materials'] ?? [];
      const opening = items.reduce((s, i) => s + (parseFloat(i.opening) || 0), 0);
      const closing = items.reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      const delta   = closing - opening;
      return `${delta >= 0 ? '+' : ''}${fmt(delta)} KG`;
    },
  },
  {
    id: 'fried_gram_closing',
    label: 'FRIED GRAM CLOSING',
    sublabel: '(Finished Goods Stock)',
    icon: 'bi-fire',
    section: 'production',
    grad: 4,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.finished?.['FRIED GRAM'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'bengal_gram_closing',
    label: 'BENGAL GRAM CLOSING',
    sublabel: '(Finished Goods Stock)',
    icon: 'bi-droplet-half',
    section: 'production',
    grad: 2,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      const items = d.prodData?.finished?.['BENGAL GRAM'] ?? [];
      const total = items.reduce((s, i) => s + (parseFloat(i.closing) || 0), 0);
      return `${fmt(total)} KG`;
    },
  },
  {
    id: 'fg_efficiency',
    label: 'PRODUCTION EFFICIENCY',
    sublabel: '(Avg % across all brands)',
    icon: 'bi-speedometer2',
    section: 'production',
    grad: 1,
    isLoading: (d) => d.prodLoading,
    getValue: (d) => {
      if (!d.prodData?.finished) return '—';
      const items = Object.values(d.prodData.finished).flat()
        .filter(i => parseFloat(i.prod_percentage) > 0);
      if (items.length === 0) return '—';
      const avg = items.reduce((s, i) => s + (parseFloat(i.prod_percentage) || 0), 0) / items.length;
      return `${avg.toFixed(2)}%`;
    },
  },
];

// IDs of all valid cards (used for validation)
const VALID_IDS = new Set(ALL_CARDS.map(c => c.id));

// Default selection — mix of sales + production shown on all pages
const DEFAULT_SELECTION = [
  'current_month_dist',
  'short_supply',
  'fg_closing_stock',
  'raw_total_used',
];

// Validate stored IDs and return only those that exist in ALL_CARDS
function loadStoredSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTION;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SELECTION;
    const valid = parsed.filter(id => VALID_IDS.has(id));
    return valid.length > 0 ? valid : DEFAULT_SELECTION;
  } catch {
    return DEFAULT_SELECTION;
  }
}

// ─── Gradient builder ─────────────────────────────────────────────────────────
function buildGradients(accent, accent2) {
  return [
    `linear-gradient(135deg, ${accent}, ${accent2})`,
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 80%, #b45309), color-mix(in srgb, ${accent2} 75%, #92400e))`,
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 70%, #4c1d95), color-mix(in srgb, ${accent2} 65%, #2e1065))`,
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 60%, #134e4a), color-mix(in srgb, ${accent2} 55%, #042f2e))`,
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 75%, #7f1d1d), color-mix(in srgb, ${accent2} 70%, #450a0a))`,
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 65%, #14532d), color-mix(in srgb, ${accent2} 60%, #052e16))`,
    `linear-gradient(135deg, color-mix(in srgb, ${accent} 72%, #1e3a5f), color-mix(in srgb, ${accent2} 67%, #0c1a2e))`,
  ];
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', opacity: 0.85 }}>
      <i className="bi bi-arrow-clockwise" style={{ animation: 'sc-spin 0.9s linear infinite', display: 'inline-block' }} />
      Loading...
    </span>
  );
}

// ─── Single summary card ──────────────────────────────────────────────────────
function SummaryCard({ card, apiData, gradient, index }) {
  const loading   = card.isLoading(apiData);
  const sublabel  = getSublabel(card, apiData);
  const listItems = card.isList && !loading ? card.getList(apiData).slice(0, 5) : [];

  return (
    <div style={{
      background: gradient,
      borderRadius: 12,
      padding: '0.85rem 1rem',
      color: 'white',
      flex: '1 1 180px',
      minWidth: 170,
      maxWidth: 280,
      display: 'flex',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
    }}>
      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        width: '35%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
        animation: 'sc-shimmer 2.5s ease-in-out infinite',
        animationDelay: `${(index ?? 0) * 0.75}s`,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      <div style={{ fontSize: '1.5rem', opacity: 0.9, flexShrink: 0, paddingTop: 2, position: 'relative', zIndex: 2 }}>
        <i className={`bi ${card.icon}`} />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.07em', opacity: 0.85, textTransform: 'uppercase' }}>
          {card.label}
        </div>
        <div style={{ fontSize: '0.68rem', opacity: 0.75, marginBottom: 4 }}>
          {loading ? '—' : sublabel}
        </div>
        {card.isList ? (
          loading ? <Spinner /> : (
            listItems.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.68rem', lineHeight: 1.6 }}>
                {listItems.map((item, i) => (
                  <li key={i} style={{ opacity: 0.92, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {card.renderItem(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontStyle: 'italic' }}>No data</div>
            )
          )
        ) : (
          <div style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.3 }}>
            {loading ? <Spinner /> : card.getValue(apiData)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Picker Modal ────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'sales',      label: 'Sales & Distribution', icon: '📊' },
  { key: 'production', label: 'Production',            icon: '🏭' },
];

function CardPickerModal({ selectedCards, onSave, onClose, accent, accent2, isDarkMode, apiData }) {
  // Only initialise draft with valid IDs that actually exist in ALL_CARDS
  const [draft, setDraft] = useState(
    () => selectedCards.filter(id => VALID_IDS.has(id))
  );

  const toggle = useCallback((id) => {
    setDraft(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_CARDS) return prev;
      return [...prev, id];
    });
  }, []);

  const modalBg  = isDarkMode ? '#0f172a' : '#ffffff';
  const cardBg   = isDarkMode ? '#1e293b' : '#f8fafc';
  const cardBdr  = isDarkMode ? '#334155' : '#e2e8f0';
  const textClr  = isDarkMode ? '#e2e8f0' : '#1e293b';
  const mutedClr = isDarkMode ? '#94a3b8' : '#64748b';

  const getPreview = (card) => {
    if (card.isLoading(apiData)) return '⏳ Loading...';
    if (card.isList) {
      const list = card.getList(apiData);
      if (list.length === 0) return 'No data yet';
      return list.slice(0, 3).map(item => {
        const name = item.description ?? item.catgroup ?? item.name ?? '?';
        return name.length > 15 ? name.slice(0, 15) + '…' : name;
      }).join(' · ');
    }
    try {
      return card.getValue(apiData) || '—';
    } catch { return '—'; }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        style={{
          background: modalBg, borderRadius: 16,
          width: '100%', maxWidth: 860, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem 0.9rem',
          borderBottom: `1px solid ${cardBdr}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: textClr }}>Customize Summary Cards</div>
            <div style={{ fontSize: '0.76rem', color: mutedClr, marginTop: 2 }}>
              Select up to {MAX_CARDS} cards — shown on every page.&nbsp;
              <span style={{
                background: accent, color: 'white', borderRadius: 10,
                padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700,
              }}>
                {draft.length} / {MAX_CARDS} selected
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: mutedClr, fontSize: '1.2rem', padding: 4,
          }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Card grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem' }}>
          {SECTIONS.map(sec => {
            const cards = ALL_CARDS.filter(c => c.section === sec.key);
            return (
              <div key={sec.key}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: accent, textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  paddingTop: 8, paddingBottom: 6,
                  borderBottom: `1px solid ${cardBdr}`,
                  marginBottom: 8,
                }}>
                  {sec.icon} {sec.label}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: 10, marginBottom: 18,
                }}>
                  {cards.map((card, cardIdx) => {
                    const isSelected = draft.includes(card.id);
                    const isDisabled = !isSelected && draft.length >= MAX_CARDS;
                    return (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: isDisabled ? 0.45 : 1,
                          y: 0,
                          scale: isSelected ? 1.02 : 1,
                          boxShadow: isSelected ? `0 0 0 3px ${accent}33, 0 4px 16px rgba(0,0,0,0.18)` : '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                        transition={{ duration: 0.18, delay: cardIdx * 0.02 }}
                        whileHover={!isDisabled ? { y: -3, boxShadow: `0 6px 20px rgba(0,0,0,0.15)` } : {}}
                        whileTap={!isDisabled ? { scale: 0.97 } : {}}
                        onClick={() => !isDisabled && toggle(card.id)}
                        style={{
                          background: isSelected
                            ? (isDarkMode ? `color-mix(in srgb, ${accent} 18%, #1e293b)` : `color-mix(in srgb, ${accent} 8%, #f8fafc)`)
                            : cardBg,
                          border: `2px solid ${isSelected ? accent : cardBdr}`,
                          borderRadius: 10,
                          padding: '0.7rem 0.85rem',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {/* Selected pulse ring */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{
                              position: 'absolute', inset: 0, borderRadius: 8,
                              border: `2px solid ${accent}`,
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <motion.div
                          animate={{
                            background: isSelected ? accent : (isDarkMode ? '#334155' : '#e2e8f0'),
                            color: isSelected ? 'white' : mutedClr,
                          }}
                          transition={{ duration: 0.2 }}
                          style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.95rem',
                          }}
                        >
                          <i className={`bi ${card.icon}`} />
                        </motion.div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.72rem', fontWeight: 700, color: textClr,
                            textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.3,
                          }}>
                            {card.label}
                          </div>
                          <div style={{ fontSize: '0.67rem', color: mutedClr, marginTop: 1 }}>
                            {typeof card.sublabel === 'string' ? card.sublabel : '—'}
                          </div>
                          <div style={{
                            fontSize: '0.65rem',
                            color: isSelected ? accent : (isDarkMode ? '#64748b' : '#94a3b8'),
                            marginTop: 3, fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {getPreview(card)}
                          </div>
                        </div>
                        <motion.div
                          animate={{ scale: isSelected ? 1.15 : 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                          style={{ marginTop: 2, flexShrink: 0 }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {}}
                            onClick={(e) => { e.stopPropagation(); if (!isDisabled) toggle(card.id); }}
                            style={{ accentColor: accent, width: 15, height: 15, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                          />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.85rem 1.4rem',
          borderTop: `1px solid ${cardBdr}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${cardBdr}`, borderRadius: 8,
            padding: '0.45rem 1.2rem', cursor: 'pointer', color: textClr,
            fontSize: '0.82rem', fontWeight: 500,
          }}>
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={draft.length === 0}
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent2 || accent})`,
              border: 'none', borderRadius: 8,
              padding: '0.45rem 1.4rem',
              cursor: draft.length === 0 ? 'not-allowed' : 'pointer',
              color: 'white', fontSize: '0.82rem', fontWeight: 600,
              opacity: draft.length === 0 ? 0.5 : 1,
            }}
          >
            Save Selection
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SummaryCardsSystem({
  context = 'sales',                    // kept for callers, used for logging only
  productionData: prodDataProp = null,  // optional prop from Production.jsx (date-range override)
  accent: accentProp,
  accent2: accent2Prop,
}) {
  const { isDarkMode, selectedAccent } = useColorMode();
  // All API data comes from the global context — fetched once on login, shared across all pages
  const ctx = useSummaryCards();

  const accent  = accentProp  || selectedAccent?.primary   || '#1a237e';
  const accent2 = accent2Prop || selectedAccent?.secondary || '#283593';

  const [selectedCards, setSelectedCards] = useState(loadStoredSelection);
  const [isHidden,      setIsHidden]      = useState(() => localStorage.getItem(STORAGE_HIDDEN_KEY) === 'true');
  const [showPicker,    setShowPicker]    = useState(false);

  // Production page can pass its own date-filtered data to override the cached default
  const prodData = prodDataProp ?? ctx?.prodData ?? null;
  const apiData  = {
    dates:         ctx?.dates         ?? null,
    header:        ctx?.header        ?? null,
    shortSupply:   ctx?.shortSupply   ?? null,
    multiYearData: ctx?.multiYearData ?? null,
    sellingData:   ctx?.sellingData   ?? null,
    prodData,
    prodLoading:   (ctx?.prodLoading ?? false) && !prodData,
  };

  const gradients = buildGradients(accent, accent2);

  // visibleCards — find any selected ID in ALL_CARDS (no context filter)
  const visibleCards = selectedCards
    .slice(0, MAX_CARDS)
    .map(id => ALL_CARDS.find(c => c.id === id))
    .filter(Boolean);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleHide = () => {
    const next = !isHidden;
    setIsHidden(next);
    localStorage.setItem(STORAGE_HIDDEN_KEY, String(next));
  };

  const handleSave = (newSelected) => {
    const trimmed = newSelected.slice(0, MAX_CARDS);
    setSelectedCards(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    setShowPicker(false);
  };

  const hideCardsBtnStyle = {
    background: isHidden
      ? `linear-gradient(135deg, ${accent}, ${accent2})`
      : isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${isHidden ? accent : (isDarkMode ? '#334155' : '#e2e8f0')}`,
    cursor: 'pointer',
    fontSize: '0.73rem', fontWeight: 600,
    padding: '4px 13px', borderRadius: 7,
    display: 'flex', alignItems: 'center', gap: 5,
    color: isHidden ? 'white' : (isDarkMode ? '#94a3b8' : '#475569'),
    transition: 'all 0.18s',
  };

  return (
    <>
      <style>{SPIN_CSS + SHIMMER_CSS}</style>
      <div style={{ marginBottom: 8 }}>
        {/* Control row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4, gap: 6 }}>
          <button onClick={toggleHide} style={hideCardsBtnStyle}>
            <i className={`bi bi-${isHidden ? 'eye' : 'eye-slash'}`} />
            {isHidden ? 'Show Cards' : 'Hide Cards'}
          </button>
        </div>

        {!isHidden && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'stretch' }}>
            {visibleCards.map((card, idx) => (
              <SummaryCard
                key={card.id}
                card={card}
                apiData={apiData}
                gradient={gradients[card.grad] || gradients[0]}
                index={idx}
              />
            ))}

            {/* More Cards button */}
            <button
              onClick={() => setShowPicker(true)}
              style={{
                minWidth: 110,
                borderRadius: 12,
                border: `2px dashed ${accent}`,
                background: 'transparent',
                color: accent,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: '0.7rem 0.9rem',
                fontSize: '0.75rem', fontWeight: 600,
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${accent}11`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.3rem' }} />
              More Cards
              <span style={{ fontSize: '0.64rem', opacity: 0.7 }}>
                {visibleCards.length}/{MAX_CARDS} shown
              </span>
            </button>
          </div>
        )}

        <AnimatePresence>
          {showPicker && (
            <CardPickerModal
              selectedCards={selectedCards}
              onSave={handleSave}
              onClose={() => setShowPicker(false)}
              accent={accent}
              accent2={accent2}
              isDarkMode={isDarkMode}
              apiData={apiData}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
