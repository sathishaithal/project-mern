/**
 * salesDashboardApi.js
 * All 19 Sales Dashboard API functions wired to backend pg (/Report/sales-dashboard/...)
 * Auth: Bearer token read from sessionStorage/localStorage via Mern dashboard's auth setup.
 */

import axios from 'axios';
import { appLog, appWarn, appError } from '../config/appConfig';

const BASE = `${import.meta.env.VITE_API_URL || ''}/Report/sales-dashboard`;

function authHeaders() {
  const token =
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken');
  if (!token) appWarn('[API] authHeaders → No auth token found in storage!');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── REPORT APIs ──────────────────────────────────────────────────────────────

export async function getAccessType(employeename) {
  const url = `${BASE}/access-type`;
  appLog('[API] getAccessType → REQUEST ', url, '\nPARAMS', { employeename });
  try {
    const res = await axios.get(url, {
      params: { employeename },
      headers: authHeaders(),
    });
    appLog('[API] getAccessType → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getAccessType → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getHrDesignation(employeename) {
  const url = `${BASE}/hr-designation`;
  appLog('[API] getHrDesignation → REQUEST ', url, '\nPARAMS', { employeename });
  try {
    const res = await axios.get(url, {
      params: { employeename },
      headers: authHeaders(),
    });
    appLog('[API] getHrDesignation → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getHrDesignation → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

/** No auth required — call on app load to log login events */
export async function logLogin(params) {
  const url = `${BASE}/login-log`;
  appLog('[API] logLogin → REQUEST ', url, '\nPARAMS', params);
  try {
    if (params?.method === 'POST') {
      const { username, main_module, sub_module, sub_sub_module, current_time } = params;
      const res = await axios.post(url, {
        username, main_module, sub_module, sub_sub_module, current_time,
      });
      appLog('[API] logLogin (POST) → RESPONSE', res.data);
      return res.data;
    }
    const { username, current_time } = params;
    const res = await axios.get(url, {
      params: { username, current_time },
    });
    appLog('[API] logLogin (GET) → RESPONSE', res.data);
    return res.data;
  } catch (err) {
    appError('[API] logLogin → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getLastUpdatedDates(employeename) {
  const url = `${BASE}/last-updated-dates`;
  appLog('[API] getLastUpdatedDates → REQUEST ', url, '\nPARAMS', { employeename });
  try {
    const res = await axios.get(url, {
      params: { employeename },
      headers: authHeaders(),
    });
    appLog('[API] getLastUpdatedDates → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getLastUpdatedDates → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getDispatchHeaderTop(employeename) {
  const url = `${BASE}/dispatch-header-top`;
  appLog('[API] getDispatchHeaderTop → REQUEST ', url, '\nPARAMS', { employeename });
  try {
    const res = await axios.get(url, {
      params: { employeename },
      headers: authHeaders(),
    });
    appLog('[API] getDispatchHeaderTop → RESPONSE', res.data);
    return res.data;
  } catch (err) {
    appError('[API] getDispatchHeaderTop → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getShortSupplyByCategory(params) {
  // params: { fromdate, todate, employeename }
  // also accepts a bare string (legacy: employeename only)
  const p = typeof params === 'string' ? { employeename: params } : params;
  const url = `${BASE}/short-supply-by-category`;
  appLog('[API] getShortSupplyByCategory → REQUEST ', url, '\nPARAMS', p);
  try {
    const res = await axios.get(url, {
      params: p,
      headers: authHeaders(),
    });
    appLog('[API] getShortSupplyByCategory → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getShortSupplyByCategory → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getCatgroupForCategory(params) {
  // params: { selectedyear, employeename, monthwisecompany, id }
  const url = `${BASE}/catgroup-for-category`;
  appLog('[API] getCatgroupForCategory → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getCatgroupForCategory → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getCatgroupForCategory → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getFourthLevelDispatch(params) {
  const url = `${BASE}/fourth-level-dispatch`;
  appLog('[API] getFourthLevelDispatch → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getFourthLevelDispatch → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getFourthLevelDispatch → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getThirdLevelDispatch(params) {
  const url = `${BASE}/third-level-dispatch`;
  appLog('[API] getThirdLevelDispatch → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getThirdLevelDispatch → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getThirdLevelDispatch → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getDaywiseSalesReport(params) {
  const url = `${BASE}/daywise-sales-report`;
  appLog('[API] getDaywiseSalesReport → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getDaywiseSalesReport → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getDaywiseSalesReport → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getMultiYearSales(params) {
  const p = {
    ...params,
    multiyear: Array.isArray(params.multiyear) ? params.multiyear.join(',') : params.multiyear,
  };
  const url = `${BASE}/multi-year-sales`;
  appLog('[API] getMultiYearSales → REQUEST ', url, '\nPARAMS', p);
  try {
    const res = await axios.get(url, {
      params: p,
      headers: authHeaders(),
    });
    appLog('[API] getMultiYearSales → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getMultiYearSales → ERROR', url, err?.response?.data || err.message, 'sent params:', p);
    throw err;
  }
}

export async function getMonthwiseFiltersDist(params) {
  const url = `${BASE}/monthwise-filters-dist`;
  appLog('[API] getMonthwiseFiltersDist → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getMonthwiseFiltersDist → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getMonthwiseFiltersDist → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getMonthwiseFiltersNew(params) {
  const url = `${BASE}/monthwise-filters-new`;
  // Accept flat params OR legacy { jsonData: {...} } wrapper — always POST (matches Angular behavior)
  const raw  = (params?.jsonData && typeof params.jsonData === 'object') ? params.jsonData : params;
  const body = {
    ...raw,
    multiyear: Array.isArray(raw?.multiyear)
      ? raw.multiyear
      : String(raw?.multiyear ?? '').split(',').filter(Boolean),
  };
  appLog('[API] getMonthwiseFiltersNew → REQUEST (POST)', url, '\nBODY', body);
  try {
    const res = await axios.post(url, body, { headers: authHeaders() });
    appLog('[API] getMonthwiseFiltersNew → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getMonthwiseFiltersNew → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

// ─── CHART APIs ───────────────────────────────────────────────────────────────

export async function getGraphCategoryWithCode(params) {
  // params: { selectedyear, month, catgroup, category, dataget, monthwisedisttype, monthwisecompany }
  const url = `${BASE}/graph-category-with-code`;
  appLog('[API] getGraphCategoryWithCode → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getGraphCategoryWithCode → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getGraphCategoryWithCode → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getGraphCatgroup(params) {
  // params: { selectedyear, month, monthwisecompany, monthwisedisttype }
  const url = `${BASE}/graph-catgroup`;
  appLog('[API] getGraphCatgroup → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getGraphCatgroup → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getGraphCatgroup → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getGraphSellingDataByCategory(params) {
  // params: { label, daysel, method, company, basedon }  (label = catgroup name)
  const url = `${BASE}/graph-selling-data-by-category`;
  appLog('[API] getGraphSellingDataByCategory → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getGraphSellingDataByCategory → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getGraphSellingDataByCategory → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getGraphSellingDataByItem(params) {
  // NOTE: intentional PHP legacy typo — param is "catgory" (no second 'e')
  // params: { catgory, label, daysel, method, company, basedon }
  const url = `${BASE}/graph-selling-data-by-item`;
  appLog('[API] getGraphSellingDataByItem → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getGraphSellingDataByItem → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getGraphSellingDataByItem → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getGraphSellingData(params) {
  // NOTE: intentional PHP legacy typo — param is "grdaiyfilter" (not "gridfilter")
  // params: { daysel, method, company, basedon, grdaiyfilter, employeename }
  // Returns res.data (NOT .list) — special case matching original PHP behavior
  const url = `${BASE}/graph-selling-data`;
  appLog('[API] getGraphSellingData → REQUEST ', url, '\nPARAMS', params);
  try {
    const res = await axios.get(url, {
      params,
      headers: authHeaders(),
    });
    appLog('[API] getGraphSellingData → RESPONSE', res.data);
    return res.data;
  } catch (err) {
    appError('[API] getGraphSellingData → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}

export async function getGraphMonthwise(params) {
  const p = {
    ...params,
    multiyear: Array.isArray(params.multiyear) ? params.multiyear.join(',') : params.multiyear,
  };
  const url = `${BASE}/graph-monthwise`;
  appLog('[API] getGraphMonthwise → REQUEST ', url, '\nPARAMS', p);
  try {
    const res = await axios.get(url, {
      params: p,
      headers: authHeaders(),
    });
    appLog('[API] getGraphMonthwise → RESPONSE', res.data);
    return res.data.list ?? res.data;
  } catch (err) {
    appError('[API] getGraphMonthwise → ERROR', url, err?.response?.data || err.message);
    throw err;
  }
}
