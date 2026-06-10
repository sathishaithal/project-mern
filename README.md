# Sri Bhagyalakshmi Group — Operations Dashboard

**Version:** `0.0.0`  
**Stack:** React 19 + Vite 7 frontend · Express + MySQL backend  
**Company:** Sri Bhagyalakshmi Group — Tested. Tasted. Trusted.

A full-stack business intelligence dashboard for sales, production, and supply-chain monitoring. All report modules connect to live APIs with real company data.

---

## Live Modules

| Module | Path | Status |
|---|---|---|
| Sign In | `/` | Live |
| Dashboard | `/dashboard` | Live — real API data |
| Production Report | `/reports/production` | Live |
| Sales Report | `/reports/sales` | Live |
| Short Supply | `/reports/sales` (tab) | Live |

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 7.2.2 | Build tool & dev server |
| React Router DOM | 7.9 | Client-side routing |
| Framer Motion | 12 | Page & component animations |
| Recharts | 3.6 | Bar, Pie, Line, Area charts |
| React Select | 5.10 | Themed multi-select dropdowns |
| MUI / Emotion | 7.3 | Date pickers, icon set |
| Bootstrap + Icons | 5.3 / 1.13 | Utility classes, icon font |
| Zustand | 5.0 | Global filter state store |
| Axios | 1.13 | HTTP API client |
| date-fns / dayjs / moment | latest | Date formatting utilities |
| xlsx / file-saver | latest | Excel export |

### Backend
| Package | Purpose |
|---|---|
| Express 4 | REST API server |
| mysql2 | MySQL database driver |
| jsonwebtoken | JWT auth tokens |
| cors | Cross-origin request handling |
| dotenv | Environment configuration |

---

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx                  # Animated sidebar with role-aware nav
│   ├── SummaryCardsSystem/          # Shared KPI card system (Dashboard + Reports)
│   └── ui/Tooltip.jsx               # Global themed tooltip (zero-re-render DOM impl)
├── context/
│   ├── AuthContext.jsx              # JWT auth state + protected route
│   └── SummaryCardsContext.jsx      # Shared API data for summary cards
├── hooks/
│   └── useTooltip.js                # Imperative tooltip attachment hook
├── layouts/
│   └── MainLayout.jsx               # App shell: sidebar + topbar + content area
├── pages/
│   ├── SignIn/SignIn.jsx            # Login page
│   ├── Dashboard.jsx                # Home dashboard with live stats
│   ├── Reports/
│   │   ├── Reports.jsx              # Reports hub page
│   │   ├── Production/Production.jsx
│   │   └── Sales/
│   │       ├── SalesDashboard.jsx   # Sales module root + tab host
│   │       ├── SalesReportPage.jsx  # Year-on-year multi-year sales table
│   │       ├── ChartsPage.jsx       # Month Wise / Day Wise charts
│   │       ├── DayWisePage.jsx      # Day-by-day sales grid
│   │       ├── ShortSupplyPage.jsx  # Short supply dispatch report
│   │       ├── Sales.css            # All static styles for Sales module
│   │       └── filters/             # Reusable filter components + hooks
│   └── Management/
│       ├── Employees.jsx            # Placeholder
│       └── Vendors.jsx              # Placeholder
├── store/
│   └── salesFilterStore.js          # Zustand store for Sales filter state
├── theme/
│   └── ThemeContext.jsx             # Dark/light mode + accent color system
└── utils/
    └── salesFormatters.js           # Date / number formatters
```

---

## 1. Sign In Page

**Path:** `/`

- Username + password authentication via JWT
- Token stored in session; expired/invalid tokens redirect back to login
- Protected route wrapper (`ProtectedRoute`) guards all report pages
- Animated login card with theme-aware styling

**Files:** `src/pages/SignIn/SignIn.jsx`, `src/context/AuthContext.jsx`

---

## 2. Dashboard

**Path:** `/dashboard`

Live home page shown immediately after login. All data comes from real API calls.

**Features:**
- Animated count-up KPI stats: YTD Tonnage, Current Month Sales, Full Year YOY, Short Supply items
- Monthly Sales sparkline: 12 bar chart built from `jantonnage`–`dectonnage` fields; current month highlighted
- Year comparison: animated horizontal progress bars for each year in `multiYearData`
- Short supply ticker: infinite scrolling marquee listing all short supply items with tonnage
- Short supply progress bars: proportional bar per item with red gradient
- Summary Cards: shared KPI card system (also shown in Reports pages)
- Report quick-access cards linking to Production and Sales reports

**Files:** `src/pages/Dashboard.jsx`, `src/context/SummaryCardsContext.jsx`, `src/components/SummaryCardsSystem/`

---

## 3. Production Report

**Path:** `/reports/production`

Manufacturing output report with filters and multi-section data tables.

**Features:**
- Date-range filter + category group selector
- Finished Goods, Raw Materials, Packing sections with expand/collapse rows
- Totals and subtotals per section
- Visualization: Bar, Line, Pie, Area charts
- Quick item-category buttons + All mode
- Fullscreen report mode
- Theme-aware styling + mobile responsive
- Toast notifications

**Files:** `src/pages/Reports/Production/Production.jsx`, `src/pages/Reports/Production/Production.module.css`

---

## 4. Sales Module

**Root path:** `/reports/sales`

The most comprehensive module. Ported from an Angular legacy system, matching all Angular formulas, role conditions, and UI behavior exactly.

### 4.1 Sales Report (Year-on-Year Table)

**Tab:** Reports → Month Wise

Multi-year, multi-level drill-down YoY sales comparison table.

**Sub-tabs (role-based visibility):**
| Tab | Visible when |
|---|---|
| YoY Summary | Always |
| Distributors | Always |
| Catgroup | Always |
| ASM | `disttype !== Shops` AND role is not Distributor/Sales Man/Sales Executive |
| Sales Officer | `disttype !== Shops` AND role is not Distributor |

**Table features:**
- Multi-year column layout: Q1–Q4 (expand to months), Till Last Month, Current Tonnage, YTD, YTD Gr/Degr, YTD%, YOY, YOY Gr/Degr, YOY%
- All formulas match Angular source exactly (YTD%, YOY Gr/Degr, YOY% validated)
- Drill-down: up to 4 levels (Distributor → Catgroup → Category → Item)
- Dual expand buttons: `▼` single-level drill, `▼▼` year breakdown (multi-year mode)
- Cross-year YOY% patch for L3/L4 levels when prior-year data is absent in API response
- Row color coding: traffic-light (green/lightgreen/yellow/red) based on quarterly degrowth count; fixed palette per `distfinf` type
- Color legend for non-summary tabs
- Table virtualization: renders only visible rows + spacers (handles 20k+ rows without freeze)
- Pre-grouped cache: all tab groups computed once after fetch, tab switches are instant (O(1))
- Multi-select filters per tab with real checkbox dropdowns
- Cell tooltips on summary columns showing live formula values

**Files:** `src/pages/Reports/Sales/SalesReportPage.jsx`

---

### 4.2 Charts Page

**Tab:** Charts → Month Wise / Day Wise

**Month Wise charts:**
- Bar chart + Pie chart for monthly tonnage (single year or multi-year mode)
- Single year: Year (monthly) / Quarterly view modes
- Multi-year: Group by Monthly/Quarterly with month/quarter sub-filter
- Clicking bar or pie slice drills down to 3 category pie charts (DrillPieCard)
- Category pie clicks drill to HBar (category items) → HBar (item codes)
- Pie slices show value + % permanently on slice; hover tooltip with accent gradient header
- Custom div-based legend: all items always visible, hidden items strikethrough; click to toggle
- All chart tooltips: themed accent gradient header (centered) + centered value body

**Day Wise charts:**
- Date selector + Method/Company/Filter/Value dropdowns
- Apply isolation: dropdowns don't update charts until Apply clicked
- Level 1: DwTableCard (ranked table) + HBarCard side-by-side
- Level 2: Category breakdown HBar
- Level 3: Catgroup item HBar
- Level 4: Item code HBar
- Butterfly (mirrored) chart: Tonnage vs Amount comparison with split tooltips
- Full-screen `LoaderOverlay` on every drill click (no timer delay — always shows)

**Files:** `src/pages/Reports/Sales/ChartsPage.jsx`

---

### 4.3 Day Wise Page

**Tab:** Reports → Day Wise

Day-by-day sales grid for a selected month with expandable distributor rows.

**Files:** `src/pages/Reports/Sales/DayWisePage.jsx`

---

### 4.4 Short Supply Page

**Tab:** Reports → Short Supply

Short supply dispatch report by date range.

**Features:**
- Date range picker
- Paginated table with configurable page size (5/10/15/20/25/50)
- LY comparison with ▲/▼ triangle indicators (red = increased shortage, green = decreased)
- API "Total" row filtered out (dashboard computes its own total)
- Themed `SSEntriesSelect` custom dropdown for page size

**Files:** `src/pages/Reports/Sales/ShortSupplyPage.jsx`

---

### 4.5 Sales Module — Shared Architecture

**CSS variable system** (`SalesDashboard.jsx` sets on root):
| Variable | Purpose |
|---|---|
| `--sr-accent` | Primary accent color |
| `--sr-accent2` | Secondary accent color |
| `--sr-label-clr` | Filter label color (dark-mode safe) |
| `--sr-text` | Body text |
| `--sr-muted` | Muted text |
| `--sr-card-bg` | Card background |
| `--sr-border` | Border color |
| `--sr-font` | Font family |

**Filter bar:** Year, Company, Distribution Type, Month selectors — all themed via `useSalesSelectStyles` hook; sync button re-fetches from API.

**Files:** `src/pages/Reports/Sales/Sales.css`, `src/pages/Reports/Sales/filters/`

---

## 5. Theme System

Every page adapts to the selected theme automatically.

- **Dark / Light mode** toggle — stored in `ThemeContext`
- **Accent color** — 8 presets (Deep Blue, Crimson, Teal, Emerald, Amber, Violet, Slate, Rose); all charts, tooltips, headers, and cards derive from the selected accent
- **Sidebar** — active item shows continuous pulse/glow animation; accent propagated via `--sidebar-accent` CSS variable
- **Tooltip** — `src/components/ui/Tooltip.jsx` — global themed tooltip using direct DOM manipulation (zero React re-renders on mouse events); all interactive elements use this; no native `title=` attributes

---

## Placeholder Pages

The following pages exist for navigation structure only and contain no real data:

- Inventory
- Employees
- Vendors
- Profile
- System Settings

---

## Authentication Flow

- Login at `/` — submits credentials, receives JWT
- JWT stored in context + session
- `ProtectedRoute` wraps all pages behind `/dashboard`
- Invalid or expired token → redirected to `/`
- `window.salesReportBusy` flag prevents navigation away during active API loads

---

## Setup

### Frontend

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

**.env**
```env
VITE_API_URL=https://<your-server>:5000
```

### Backend

```bash
cd backend
npm install
node server.js
```

**.env**
```env
PORT=5000
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
JWT_SECRET=...
```

The backend serves the frontend production build from `dist/`.

---

## Routes

| Route | Page |
|---|---|
| `/` | Sign In |
| `/dashboard` | Dashboard |
| `/reports` | Reports hub |
| `/reports/production` | Production Report |
| `/reports/sales` | Sales module (Reports tab) |
| `/reports/sales?tab=charts` | Sales module (Charts tab) |

---

## Key Design Decisions

- **Tooltip implementation** — zero `useState` DOM-manipulation approach eliminates hover-triggered re-renders that were causing table flicker with 500+ visible rows
- **Table virtualization** — only visible rows rendered; top/bottom spacers maintain scroll position; virtualization disabled when drill rows are open (avoids spacer-height mismatch)
- **Pre-grouped cache** — all 4 non-summary tab groups computed once after API fetch; tab switches are O(1) cache reads, not repeated `groupByField` computations on 20k rows
- **Apply isolation** — chart filter dropdowns (Charts page + Day Wise) never update titles or trigger API calls until the Apply button is clicked (`appliedDw` snapshot state pattern)
- **Cross-year YOY% patch** — when L3/L4 APIs return `ttltonnagewy=0`, prior year is fetched separately and patched in by matching on `catgroup`/`description` key
