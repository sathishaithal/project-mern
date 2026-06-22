import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  getLastUpdatedDates,
  getDispatchHeaderTop,
  getShortSupplyByCategory,
  getMultiYearSales,
  getGraphSellingData,
} from '../services/salesDashboardApi';
import { getProductionReportTonnage } from '../services/productionApi';
import { flattenUnitArray } from '../utils/productionHelpers';

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
  const employeename = user?.empname || user?.username;

  const [dates,         setDates]         = useState(null);
  const [header,        setHeader]        = useState(null);
  const [shortSupply,   setShortSupply]   = useState(null);
  const [multiYearData, setMultiYearData] = useState(null);
  const [sellingData,   setSellingData]   = useState(null);
  const [prodData,      setProdData]      = useState(null); // raw API response for SummaryCardsSystem
  const [prodSummary,   setProdSummary]   = useState(null); // derived flat values for Dashboard/Reports mini-card
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

    // Use same endpoint + KG unit as Production Report page for consistent values
    setProdLoading(true);
    getProductionReportTonnage({ fromdate, todate })
      .then(res => {
        if (!res || Object.keys(res).length === 0) { setProdData(null); setProdSummary(null); return; }
        // KG unit variant — matches Production Report page when "Kg" is selected
        const d = flattenUnitArray(res.kg);
        if (!d || Object.keys(d).length === 0) { setProdData(null); setProdSummary(null); return; }
        // Keep raw for SummaryCardsSystem production cards
        setProdData(d);
        // Derive flat summary for Dashboard/Reports Production Today mini-card
        const allFinished = Object.values(d.finished || {}).flat();
        const fgNetProd   = allFinished.reduce((s, i) => s + (parseFloat(i['purchased/transfer in']) || 0), 0);
        const allRaw      = d.raw?.['All Raw Materials'] ?? [];
        const rawUsed     = allRaw.reduce((s, i) => s + (parseFloat(i['consumed/transfer out']) || 0), 0);
        const eff         = rawUsed > 0 && fgNetProd > 0 ? ((fgNetProd / rawUsed) * 100).toFixed(1) : null;
        setProdSummary(fgNetProd > 0 || rawUsed > 0
          ? { fgnetproduction: fgNetProd, rawmaterialused: rawUsed, efficiency: eff }
          : null);
      })
      .catch(() => {})
      .finally(() => setProdLoading(false));
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
      setProdSummary(null);
    }
  }, [user]);

  return (
    <SummaryCardsContext.Provider value={{
      dates, header, shortSupply, multiYearData, sellingData,
      prodData, prodSummary, prodLoading: prodLoading && !prodData,
    }}>
      {children}
    </SummaryCardsContext.Provider>
  );
}
