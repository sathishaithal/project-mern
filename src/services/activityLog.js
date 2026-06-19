import apiClient from './apiClient';

/**
 * Fire-and-forget activity log.
 * Matches the Angular logUserAction() payload to POST /api/auth/dashboardlogin.
 * Never throws — any failure is silently swallowed so it can never block UI.
 */
// module      — top-level section  e.g. 'Dashboard', 'Sales', 'Production', 'Reports'
// section     — page/tab           e.g. 'Month Wise', 'Day Wise', 'Charts', 'Report'
// actionDetail — sub-tab name      e.g. 'YoY Summary', 'Distributors', 'Month Wise'
// actionType  — what user did      e.g. 'view', 'generate', 'sync', 'drill_down', 'export'
// filters     — report params obj  e.g. { year: '2026', company: 'SBL', method: 'Distribution' }
export function logActivity(module, section = '', actionDetail = '', actionType = 'view', filters = null) {
  const username =
    sessionStorage.getItem('username') ||
    localStorage.getItem('username')   ||
    'Unknown';

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  apiClient.post('/api/auth/dashboardlogin', {
    Username:          username,
    'Main Module':     module,        // kept for backend backward-compat
    'Sub Module':      section,
    'Sub Sub Module':  actionDetail,
    Timestamp:         timestamp,
    action_type:       actionType,
    filters_applied:   filters ? JSON.stringify(filters) : null,
  }).catch(() => {});
}
