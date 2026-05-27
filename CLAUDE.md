# Claude Code — Project Rules

## GLOBAL RULE: Sales Changelog (runs on every prompt)

At the **start of every response** to any prompt in this project, Claude MUST:

1. Open `src/pages/Reports/Sales/SALES_CHANGELOG.md`
2. Append an entry under today's date (format: `## YYYY-MM-DD`) with the **current time (HH:MM)**, a short summary of what this prompt changed or investigated.
3. After all changes are done, also update the **## Overall Project Summary** section at the top of that file to reflect the latest state.

Entry format to append:
```
### HH:MM — <short title>
- <bullet: what changed / what was investigated>
- Files touched: `path/to/file.ext`
```

If the date heading already exists, append under it. If it is a new day, create the heading.
Do this **before** reporting results to the user.

---

## Project Constraints

- **DO NOT** change `C:\Users\Satish\Desktop\merndashboard\backend pg` (Node.js backend)
- **DO NOT** change `C:\Users\Satish\Desktop\merndashboard\dashboardreact` (Angular source — read-only reference)
- Only modify files inside `C:\Users\Satish\Desktop\merndashboard\merndashboard` (React frontend)
- **DO NOT** change Production Report files
- **DO NOT** change `appConfig.js` IS_CONSOLE toggle
- **DO NOT** change Angular source files

## Stack

- React 18 + Vite 7.2.2
- Framer Motion, React-Select, Bootstrap Icons
- CSS custom properties (`--sr-*`) for theme propagation set on SalesDashboard root
- Run `npm run build` after any significant change to verify zero errors
