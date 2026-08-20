/**
 * apiClient.js
 * Centralized Axios instance.
 * - Auth: httpOnly `authToken` cookie, sent automatically via withCredentials
 *   (no client-readable JWT anymore — nothing to attach manually here).
 * - Response interceptor: 401/403 → redirect; 5xx → log
 */

import axios from 'axios';
import { appError, appWarn } from '../config/appConfig';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let _redirecting = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && !_redirecting) {
      _redirecting = true;
      appWarn(`[apiClient] ${status} — session expired, redirecting to login`);
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
