# Sales Report — Angular vs MERN Field Comparison

Reference: `dashboardreport_working_SSO/src/app/libdash/libdash.component.ts/.html`  
MERN file: `src/pages/Reports/Sales/SalesReportPage.jsx` (`SummaryCells` component)

---

## Column Formulas

### YTD Gr/Degr
| | Angular | MERN (after fix) |
|---|---|---|
| **Function** | `CastNumber_per(i, ttltonnage_crnt, list, year)` | Inline in `SummaryCells` |
| **i = 0 (first row)** | Returns 0 | `ttltonnage_crnt − sum(jantonnage_last…dectonnage_last)` |
| **i = 1 (second row)** | `ttltonnage_crnt − accumulated(_last fields from row[0])` | `ttltonnage_crnt − ttltonnage_crnt[prev row]` (row-to-row) |
| **i > 1** | `ttltonnage_crnt[i] − ttltonnage_crnt[i-1]` | `ttltonnage_crnt[i] − ttltonnage_crnt[i-1]` |

> **Note:** Angular needs a hidden comparison-year row in the list (e.g. 2024 when user selects 2025 & 2026). MERN avoids this by using `_last` fields embedded in each row for the first displayed year.

---

### YTD %
| | Angular | MERN (after fix) |
|---|---|---|
| **Function** | `CastNumber_per_per(i, currentmonthtonnage, list, year)` | Inline in `SummaryCells` |
| **Formula** | Find `prevRow = list.find(r => r.year === currentYear - 1)`; use `prevRow.currentmonthtonnage_last ?? prevRow.currentmonthtonnage` | **L0 Summary:** `rows.find(r => r.year === row.year - 1)`, use that row's `currentmonthtonnage_last ?? currentmonthtonnage`; **L1+ / non-summary:** `row.currentmonthtonnage_last` directly |
| **Key** | Uses current month comparison, **NOT** YTD-over-YTD | Same — different source depending on level |
| **Why split?** | — | L0 API (`getMultiYearSales`) does not return `currentmonthtonnage_last`; L1+ drill APIs do |

> **IMPORTANT:** Despite the column name "YTD %", this is actually a **current month % vs same month last year**. First year always shows 0% (no previous year in the display list).

---

### Total (YOY)
| | Angular | MERN |
|---|---|---|
| **Field** | `ttltonnage_crntwy` | `ttltonnage_crntwy` |
| **Formula** | Direct value | Direct value |
| **Arrow** | `totaltonnagecurrentwy(i, ttltonnage_crntwy, list)` | `row-to-row diff or row.ttltonnagewy diff` |

---

### YOY Gr/Degr
| | Angular | MERN (after fix) |
|---|---|---|
| **Function** | `CastNumber_perwy(i, ttltonnage_crntwy, list, year)` | Inline in `SummaryCells` |
| **Formula** | `ttltonnage_crntwy[i] − list[i-1].ttltonnagewy` | L0: `ttltonnage_crntwy − rows[i-1].ttltonnagewy`; L1+: `ttltonnage_crntwy − row.ttltonnagewy` |
| **i = 0** | Returns 0 | null (shows 0) |

---

### YOY %
| | Angular | MERN (after fix) |
|---|---|---|
| **Function** | `CastNumber_per_perwy(i, ttltonnage_crntwy, list)` | Inline in `SummaryCells` |
| **Formula** | `(ttltonnage_crntwy[i] − list[i-1].ttltonnagewy) / list[i-1].ttltonnagewy × 100` | L0: `yoyGr / rows[i-1].ttltonnagewy × 100`; L1+: `yoyGr / row.ttltonnagewy × 100` |
| **Bug (old)** | — | Used `row.ttltonnagewy` (current row) as denominator — was 0, giving 0% always |

---

## API Fields Reference

| API Field | Meaning |
|---|---|
| `ttltonnage_crnt` | Current year YTD total (sum up to current month) |
| `ttltonnagewy` | Previous year's WY (full-year) tonnage — used as YOY comparison base |
| `ttltonnage_crntwy` | Current year's full-year-comparable tonnage (YOY column value) |
| `currentmonthtonnage` | This year's current month tonnage |
| `currentmonthtonnage_last` | Previous year's same-month tonnage |
| `jantonnage` … `dectonnage` | This year's monthly tonnage (future months = 0) |
| `jantonnage_last` … `dectonnage_last` | Previous year's monthly tonnage (future months = 0) |
| `Q1`, `Q2`, `Q3`, `Q4` | Quarterly aggregates (computed by frontend or API) |
| `Q1_last` … `Q4_last` | Previous year quarterly aggregates |
| `distfinf` | Row type code → color/style (1=item, 2=cat, 3=catgroup, 4=year, 5=distname, 6=soff, 7=areaname, 8=asm) |
| `final` | 1 = leaf node, no further drill-down available |

---

## Drill-Down Hierarchy

### YoY Summary Tab (API-backed)
```
L0: Year rows
  ↓ getCatgroupForCategory or getSecondLevelDispatch
L1: Disttype / Category Group rows
  ↓ getThirdLevelDispatch / getCatgroupForCatAR1
L2: Category / Distributor rows
  ↓ getFourthLevelDispatch / getFifthLevelDispatch
L3: Item description rows
  ↓ getSixthLevelDispatch (Shops only)
L4+: Product codes (Shops only)
```

### Non-Summary Tabs (client-side groupByField)
```
Distributors: distname → catgroup → category → description
Catgroup:     catgroup → distname → category → description
ASM:          asm → areaname → catgroup → category
Sales Officer: soff → distname → catgroup → category
```

---

## Tab Visibility Rules
- **ASM tab:** hidden when `monthwisedisttype === 'Shops'` OR role is `Distributor` OR role is `Sales Man`/`Sales Executive`
- **Sales Officer tab:** hidden when `monthwisedisttype === 'Shops'` OR role is `Distributor`
- **Distributors/Catgroup:** always visible

---

## Bugs Fixed (2026-06-09)

1. **YTD Gr/Degr first row showed 0** — fixed by computing `ttltonnage_crnt − lyYtd` using `_last` monthly fields
2. **YTD % always 0%** — formula changed from `ytdGr/ttltonnagewy` to current-month comparison `(curMon−curMonLy)/curMonLy×100`
3. **YOY % always 0%** — denominator fixed from `row.ttltonnagewy` (current row, which is 0) to `rows[i-1].ttltonnagewy` (prev row)
