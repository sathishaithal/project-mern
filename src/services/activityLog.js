import apiClient from './apiClient';

/**
 * Fire-and-forget activity log.
 * Matches the Angular logUserAction() payload to POST /api/auth/dashboardlogin.
 * Never throws — any failure is silently swallowed so it can never block UI.
 */
export function logActivity(mainModule, subModule = '', subSubModule = '') {
  const username =
    sessionStorage.getItem('username') ||
    localStorage.getItem('username')   ||
    'Unknown';

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  apiClient.post('/api/auth/dashboardlogin', {
    Username:        username,
    'Main Module':   mainModule,
    'Sub Module':    subModule,
    'Sub Sub Module': subSubModule,
    Timestamp:       timestamp,
  }).catch(() => {});
}
