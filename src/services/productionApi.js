/**
 * productionApi.js
 * All Production Report API functions.
 * Auth: Bearer token read from localStorage/sessionStorage.
 */

import apiClient from './apiClient';
const axios = apiClient;
import { appLog, appWarn, appError } from '../config/appConfig';

const BASE = import.meta.env.VITE_API_URL || '';

/**
 * Fetch production report for all three units (bags / tonnage / kg).
 * Returns { bags, tonnage, kg } — each value is the raw array from the API.
 * @param {{ fromdate: string, todate: string, catgroup?: string }} params
 */
export async function getProductionReportTonnage(params) {
  const url = `${BASE}/Report/production-report-tonnage`;
  const body = { catgroup: 'Fried Gram Mill', ...params };
  appLog('[productionApi] getProductionReportTonnage → REQUEST', url, '\nBODY', body);
  try {
    const res = await axios.post(url, body);
    appLog('[productionApi] getProductionReportTonnage → RESPONSE', res.data);
    return res.data;
  } catch (err) {
    appError('[productionApi] getProductionReportTonnage → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}
