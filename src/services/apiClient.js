/**
 * apiClient.js
 * Centralized Axios instance.
 * - Request interceptor: injects Bearer token from storage
 * - Response interceptor: 401/403 → redirect; 5xx → log
 */

import axios from 'axios';
import { appError, appWarn } from '../config/appConfig';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    appWarn('[apiClient] No auth token found in storage — request will be unauthenticated');
  }
  return config;
});

let _redirecting = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && !_redirecting) {
      _redirecting = true;
      appWarn(`[apiClient] ${status} — session expired, redirecting to login`);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');
      sessionStorage.setItem('logoutMessage', status === 401 ? 'Session expired. Please log in again.' : 'Access denied.');
      window.location.href = '/';
      return new Promise(() => {});
    }

    if (status >= 500 || !error.response) {
      appError('[apiClient] Server/network error', status || 'no response', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
