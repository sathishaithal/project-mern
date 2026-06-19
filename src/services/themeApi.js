import apiClient from './apiClient';

export const getTheme = () =>
  apiClient.get('/api/theme')
    .then(r => r.data?.theme_data || null)
    .catch(() => null);

export const saveTheme = (themeData) =>
  apiClient.post('/api/theme', { theme_data: themeData })
    .then(r => r.data)
    .catch(() => null);
