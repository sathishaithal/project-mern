/**
 * salesDashboardApi.js
 * All 19 Sales Dashboard API functions wired to backend pg (/Report/sales-dashboard/...)
 * Auth: Bearer token read from sessionStorage/localStorage via Mern dashboard's auth setup.
 */

import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL || ''}/Report/sales-dashboard`;

function authHeaders() {
  const token =
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken');
  if (!token) console.warn('[salesApi] No auth token found in storage!');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── REPORT APIs ──────────────────────────────────────────────────────────────

export async function getAccessType(employeename) {
  const res = await axios.get(`${BASE}/access-type`, {
    params: { employeename },
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getHrDesignation(employeename) {
  const res = await axios.get(`${BASE}/hr-designation`, {
    params: { employeename },
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

/** No auth required — call on app load to log login events */
export async function logLogin(params) {
  if (params?.method === 'POST') {
    const { username, main_module, sub_module, sub_sub_module, current_time } = params;
    const res = await axios.post(`${BASE}/login-log`, {
      username, main_module, sub_module, sub_sub_module, current_time,
    });
    return res.data;
  }
  const { username, current_time } = params;
  const res = await axios.get(`${BASE}/login-log`, {
    params: { username, current_time },
  });
  return res.data;
}

export async function getLastUpdatedDates(employeename) {
  console.log('[salesApi] getLastUpdatedDates employeename:', employeename);
  try {
    const res = await axios.get(`${BASE}/last-updated-dates`, {
      params: { employeename },
      headers: authHeaders(),
    });
    console.log('[salesApi] getLastUpdatedDates response:', res.status, res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    console.error('[salesApi] getLastUpdatedDates FAILED:', err.response?.status, err.response?.data);
    throw err;
  }
}

export async function getDispatchHeaderTop(employeename) {
  console.log('[salesApi] getDispatchHeaderTop employeename:', employeename);
  try {
    const res = await axios.get(`${BASE}/dispatch-header-top`, {
      params: { employeename },
      headers: authHeaders(),
    });
    console.log('[salesApi] getDispatchHeaderTop response:', res.status, res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    console.error('[salesApi] getDispatchHeaderTop FAILED:', err.response?.status, err.response?.data);
    throw err;
  }
}

export async function getShortSupplyByCategory(employeename) {
  const res = await axios.get(`${BASE}/short-supply-by-category`, {
    params: { employeename },
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getCatgroupForCategory(label, employeename) {
  const res = await axios.get(`${BASE}/catgroup-for-category`, {
    params: { label, employeename },
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getFourthLevelDispatch(params) {
  const res = await axios.get(`${BASE}/fourth-level-dispatch`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getThirdLevelDispatch(params) {
  const res = await axios.get(`${BASE}/third-level-dispatch`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getDaywiseSalesReport(params) {
  const res = await axios.get(`${BASE}/daywise-sales-report`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getMultiYearSales(params) {
  const p = {
    ...params,
    multiyear: Array.isArray(params.multiyear) ? params.multiyear.join(',') : params.multiyear,
  };
  console.log('[salesApi] getMultiYearSales params:', p);
  try {
    const res = await axios.get(`${BASE}/multi-year-sales`, {
      params: p,
      headers: authHeaders(),
    });
    console.log('[salesApi] getMultiYearSales response:', res.status, res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    console.error('[salesApi] getMultiYearSales FAILED:', err.response?.status, err.response?.data, 'sent params:', p);
    throw err;
  }
}

export async function getMonthwiseFiltersDist(params) {
  const res = await axios.get(`${BASE}/monthwise-filters-dist`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getMonthwiseFiltersNew(params) {
  if (params?.method === 'POST') {
    const { jsonData } = params;
    const res = await axios.post(
      `${BASE}/monthwise-filters-new`,
      { jsonData },
      { headers: authHeaders() },
    );
    return res.data.list ?? res.data;
  }
  const { jsonData } = params;
  const res = await axios.get(`${BASE}/monthwise-filters-new`, {
    params: { jsonData: typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData) },
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

// ─── CHART APIs ───────────────────────────────────────────────────────────────

export async function getGraphCategoryWithCode(params) {
  // params: { month, monthwisedisttype, monthwisecompany, employeename }
  const res = await axios.get(`${BASE}/graph-category-with-code`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getGraphCatgroup(params) {
  // params: { month, monthwisedisttype, monthwisecompany, employeename }
  const res = await axios.get(`${BASE}/graph-catgroup`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getGraphSellingDataByCategory(params) {
  // NOTE: intentional PHP legacy typo — param is "catgory" (no second 'e')
  // params: { catgory, daysel, method, company, basedon }
  const res = await axios.get(`${BASE}/graph-selling-data-by-category`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getGraphSellingDataByItem(params) {
  // NOTE: intentional PHP legacy typo — param is "catgory" (no second 'e')
  // params: { catgory, label, daysel, method, company, basedon }
  const res = await axios.get(`${BASE}/graph-selling-data-by-item`, {
    params,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}

export async function getGraphSellingData(params) {
  // NOTE: intentional PHP legacy typo — param is "grdaiyfilter" (not "gridfilter")
  // params: { daysel, method, company, basedon, grdaiyfilter, employeename }
  // Returns res.data (NOT .list) — special case matching original PHP behavior
  const res = await axios.get(`${BASE}/graph-selling-data`, {
    params,
    headers: authHeaders(),
  });
  return res.data;
}

export async function getGraphMonthwise(params) {
  const p = {
    ...params,
    multiyear: Array.isArray(params.multiyear) ? params.multiyear.join(',') : params.multiyear,
  };
  const res = await axios.get(`${BASE}/graph-monthwise`, {
    params: p,
    headers: authHeaders(),
  });
  return res.data.list ?? res.data;
}
