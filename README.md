# MERN Dashboard

Version: `0.0.0`

A React + Vite dashboard application with an Express backend. In this project, the two main real working modules are:

- `SignIn` page
- `Production Report` page

Most other pages are dummy or placeholder screens used for dashboard flow, layout, and navigation only.

## Core Focus

This project mainly demonstrates:

- JWT-based authentication and protected routing
- A production dashboard with filters, tables, totals, charts, theme support, and fullscreen viewing

## Tech Stack

- Frontend: React 19, Vite, React Router, Framer Motion, Recharts, Bootstrap, MUI
- Backend: Express, MySQL, JWT, Axios
- Styling: CSS Modules

## Main Working Pages

## 1. SignIn Page

Path: `/`

Purpose:

- Authenticates users before giving access to protected routes
- Stores user token/session
- Redirects unauthorized users back to login

Main implemented features:

- Username and password login
- JWT/session handling
- Logout/session-expiry message support
- Protected route integration
- Styled animated login experience

Related files:

- [SignIn.jsx](/src/pages/SignIn.jsx)
- [AuthContext.jsx](/src/context/AuthContext.jsx)
- [main.jsx](/src/main.jsx)

## 2. Production Report Page

Path: `/reports/production`

Purpose:

- Fetches production report data from API
- Displays finished goods, raw materials, and packing summaries
- Supports visualization and fullscreen report reading

Main implemented features:

- Date-range filter
- Category group selector
- Generate report action
- Sticky / collapsible filter area
- Fullscreen report mode
- Finished goods section
- Raw materials usage section
- Packing section
- Totals and subtotals
- Rounded production percentage display
- Expand / collapse subtotal rows
- Visualization with:
  - Bar chart
  - Line chart
  - Pie chart
  - Area chart
- `All` item-category support
- Quick item-category buttons
- Theme-aware styling
- Mobile responsive behavior
- Toast notifications

Related files:

- [Production.jsx](/src/pages/Reports/Production.jsx)
- [Production.module.css](/src/pages/Reports/Production.module.css)
- [MainLayout.jsx](/src/layouts/MainLayout.jsx)
- [Sidebar.jsx](/src/components/Sidebar.jsx)

## Dummy / Placeholder Pages

These pages currently exist mainly for navigation/demo layout and are not the core project focus:

- Dashboard
- Reports home
- Sales
- Inventory
- Employees
- Vendors
- Profile
- System Settings

## Authentication Flow

- Login page is available at `/`
- Protected routes are wrapped using `ProtectedRoute`
- If token is missing or invalid, the user is redirected to login
- Report pages are not meant to be opened without authentication

## Frontend Setup

1. Install dependencies

```bash
npm install
```

2. Configure frontend `.env`

```env
VITE_API_URL=http://localhost:5000
```

Current configured value in this project:

```env
VITE_API_URL=http://103.117.236.163:5000
```

3. Start frontend

```bash
npm run dev
```

4. Build frontend

```bash
npm run build
```

5. Preview build

```bash
npm run preview
```

## Backend Setup

Backend folder:

- [backend](/backend)

1. Install backend dependencies

```bash
cd backend
npm install
```

2. Configure backend environment

Example:

```env
PORT=5000
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
JWT_SECRET=...
```

3. Start backend

```bash
node server.js
```

Note:

- Backend `package.json` does not currently include a `start` or `dev` script
- Backend serves the frontend production build from `dist`

## Useful Scripts

- `npm run dev` - start frontend development server
- `npm run build` - build frontend
- `npm run preview` - preview built frontend
- `npm run lint` - run ESLint

## Important Routes

- `/` - SignIn
- `/dashboard` - Dashboard
- `/reports/production` - Production Report

## Production Visualization Notes

- Pie chart percentages are calculated by `Recharts`, not taken directly from the API
- The displayed pie `%` depends on:
  - selected metric
  - visible pie slices
  - positive values only
- In `All` mode, finished-goods visualization data is aggregated by category

## Current Scope

If you are documenting or presenting this project, the two main pages to highlight are:

1. SignIn page
2. Production Report page

Everything else can be treated as supporting dashboard structure unless expanded later.

## Suggested Additions

- Add backend `start` and `dev` scripts
- Add a root script for frontend + backend together
- Add database setup documentation
- Add screenshots for SignIn and Production pages
- Add deployment notes
- Add automated tests
