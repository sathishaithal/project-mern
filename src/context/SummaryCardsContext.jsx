import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import {
  getLastUpdatedDates,
  getDispatchHeaderTop,
  getShortSupplyByCategory,
  getMultiYearSales,
  getGraphSellingData,
} from '../services/salesDashboardApi';

const SummaryCardsContext = createContext(null);
export const useSummaryCards = () => useContext(SummaryCardsContext);

const fmtDate = (d) => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function SummaryCardsProvider({ children }) {
  const { user } = useAuth();
  const employeename = user?.username;

  const [dates,         setDates]         = useState(null);
  const [header,        setHeader]        = useState(null);
  const [shortSupply,   setShortSupply]   = useState(null);
  const [multiYearData, setMultiYearData] = useState(null);
  const [sellingData,   setSellingData]   = useState(null);
  const [prodData,      setProdData]      = useState(null);
  const [prodLoading,   setProdLoading]   = useState(false);
  const [fetched,       setFetched]       = useState(false);

  // Fetch all card data once when user logs in
  useEffect(() => {
    if (!employeename || fetched) return;
    setFetched(true);

    const today    = new Date();
    const fromdate = fmtDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todate   = fmtDate(today);

    Promise.all([
      getLastUpdatedDates(employeename).catch(() => null),
      getDispatchHeaderTop(employeename).catch(() => null),
    ]).then(([d, h]) => {
      setDates(Array.isArray(d) ? d[0] : (d ?? null));
      setHeader(h ?? null);
    });

    getShortSupplyByCategory({ fromdate, todate, employeename })
      .then(data => setShortSupply(Array.isArray(data) ? data : []))
      .catch(() => setShortSupply([]));

    getMultiYearSales({
      multiyear: String(today.getFullYear()),
      employeename,
      monthwisecompany:  'SBL',
      monthwisedisttype: 'Distribution',
    })
      .then(data => {
        const arr = Array.isArray(data)
          ? data.filter(r => r.disttype !== 'Grand Total' && String(r.year) !== 'Grand Total' && r.id !== '')
          : [];
        setMultiYearData(arr);
      })
      .catch(() => setMultiYearData([]));

    getGraphSellingData({
      daysel: 'month', method: 'Distribution', company: 'SBL',
      basedon: 'Tonnage', grdaiyfilter: 'Category group', employeename,
    })
      .then(data => setSellingData(Array.isArray(data) ? data : (data?.list ?? [])))
      .catch(() => setSellingData([]));

    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token');
    if (token) {
      setProdLoading(true);
      axios.post(
        `${import.meta.env.VITE_API_URL || ''}/Report/production-report`,
        { fromdate, todate, catgroup: 'Fried Gram Mill' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
        .then(res => {
          const d = res.data;
          setProdData(d && Object.keys(d).length > 0 ? d : null);
        })
        .catch(() => {})
        .finally(() => setProdLoading(false));
    }
  }, [employeename, fetched]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      setFetched(false);
      setDates(null);
      setHeader(null);
      setShortSupply(null);
      setMultiYearData(null);
      setSellingData(null);
      setProdData(null);
    }
  }, [user]);

  return (
    <SummaryCardsContext.Provider value={{
      dates, header, shortSupply, multiYearData, sellingData,
      prodData, prodLoading: prodLoading && !prodData,
    }}>
      {children}
    </SummaryCardsContext.Provider>
  );
}
