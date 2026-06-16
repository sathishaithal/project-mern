import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import ThemedTooltip from '../../../components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import './Sales.css';
import SrLoader from '../../../components/ui/SrLoader';
import { useSalesSelectStyles } from './filters/useSalesSelectStyles';
import FilterBar from './filters/FilterBar';
import { useSalesFilterStore } from '../../../store/salesFilterStore';
import { useAuth } from '../../../context/AuthContext';
import { useColorMode } from '../../../theme/ThemeContext';
import {
  getGraphMonthwise,
  getGraphCatgroup,
  getGraphCategoryWithCode,
  getGraphCategoryForCatgroup,
  getGraphSellingDataByCategory,
  getGraphSellingData,
  getGraphSellingDataByItem,
} from '../../../services/salesDashboardApi';
import {
  getChartColors, scrollTo,
  MONTH_LABELS, MONTH_KEYS, Q_KEYS,
  VIEW_OPTIONS, YR_FILTER_OPTIONS,
  SHOP_RESTRICTED_ROLES,
  DW_DAYSEL_OPTIONS, DW_METHOD_OPTIONS, DW_COMPANY_OPTIONS,
  DW_FILTER_OPTIONS, DW_BASEDON_OPTIONS,
  ZoomModal, BarChartCard, PieChartCard, DrillPieCard,
  HBarCard, MirroredHBarCard, DwTableCard,
} from './components/ChartComponents';


export default function ChartsPage({ loggedInRolex }) {
  const { user }     = useAuth();
  const employeename = user?.username;
  const { multiyear, monthwisecompany, monthwisedisttype } = useSalesFilterStore();

  const rolex           = typeof loggedInRolex === 'string' ? loggedInRolex : (loggedInRolex?.designation || '');
  const showShopsOption = !SHOP_RESTRICTED_ROLES.includes(rolex);
  const { isDarkMode, selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';
  const selStyles = useSalesSelectStyles({ minHeight: 30, height: 30, fontSize: '0.78rem', borderRadius: 6 });

  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);
  const [chartTab,  setChartTab]  = useState('monthwise');
  const [viewMode,  setViewMode]  = useState('Year');
  const [zoomChart, setZoomChart] = useState(null);
  const [error,     setError]     = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [dwBasedon,         setDwBasedon]        = useState('Tonnage');
  const [dwDaysel,          setDwDaysel]          = useState('yesterday');
  const [dwMethod,          setDwMethod]          = useState('Distribution');
  const [dwCompany,         setDwCompany]         = useState('SBL');
  const [dwFilter,          setDwFilter]          = useState('Category group');
  const [dwSellingTab,      setDwSellingTab]      = useState('topview');
  const [dwLevel1,          setDwLevel1]          = useState([]);
  const [dwLevel2,          setDwLevel2]          = useState([]);
  const [dwLevel3,          setDwLevel3]          = useState([]);
  const [dwL1Loading,       setDwL1Loading]       = useState(false);
  const [dwL2Loading,       setDwL2Loading]       = useState(false);
  const [dwL3Loading,       setDwL3Loading]       = useState(false);
  const [dwClickedCatgroup, setDwClickedCatgroup] = useState(null);
  const [dwClickedCategory, setDwClickedCategory] = useState(null);
  const [dwLevel4,          setDwLevel4]          = useState([]);
  const [dwL4Loading,       setDwL4Loading]       = useState(false);
  const [dwL2LoadingVisible, setDwL2LoadingVisible] = useState(false);
  const [dwL3LoadingVisible, setDwL3LoadingVisible] = useState(false);
  const [dwL4LoadingVisible, setDwL4LoadingVisible] = useState(false);
  const [dwClickedItem,     setDwClickedItem]     = useState(null);
  // Tracks filter values at last Apply — titles and drill-downs use these, not the live dropdown state
  const [appliedDw, setAppliedDw] = useState({ daysel: 'yesterday', method: 'Distribution', company: 'SBL', filter: 'Category group', basedon: 'Tonnage' });
  const [graphDataAll,      setGraphDataAll]      = useState([]);
  const [yrFilterMode,      setYrFilterMode]      = useState('-Select-');
  const [yrFilterSub,       setYrFilterSub]       = useState('-Select-');

  // Month-wise drill-down state
  const [pieData1,        setPieData1]        = useState([]);
  const [pieData2,        setPieData2]        = useState([]);
  const [pieData3,        setPieData3]        = useState([]);
  const [pieTitle1,       setPieTitle1]       = useState('');
  const [pieTitle2,       setPieTitle2]       = useState('');
  const [pieTitle3,       setPieTitle3]       = useState('');
  const [catgroupLoading, setCatgroupLoading] = useState(false);
  const [categoryData,    setCategoryData]    = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [codeData,        setCodeData]        = useState([]);
  const [codeLoading,     setCodeLoading]     = useState(false);
  const [clickedMonth,    setClickedMonth]    = useState(null);
  const [clickedCatgroup, setClickedCatgroup] = useState(null);
  const [clickedCategory, setClickedCategory] = useState(null);
  const [clickedPieNum,   setClickedPieNum]   = useState(null);
  const [hbarTitle,       setHbarTitle]       = useState('');
  const [hbar2Title,      setHbar2Title]      = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info', title: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((title, message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type, title });
    setToastVisible(true);
    const duration = type === 'success' ? 3000 : 5000;
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast({ show: false, message: '', type: 'info', title: '' }), 300);
    }, duration);
  }, []);

  // Refs — written synchronously before any await to avoid stale closures
  const mwMonthRef    = useRef(null);
  const mwYearRef     = useRef(null);
  const mwCatgroupRef = useRef(null);
  const mwPieNumRef   = useRef(null);
  const mwPieTitles   = useRef({ t1: '', t2: '', t3: '' });
  const mwHbarTitle   = useRef('');
  const dwL2LoadingTimer = useRef(null);
  const dwL3LoadingTimer = useRef(null);
  const dwL4LoadingTimer = useRef(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPieData1([]); setPieData2([]); setPieData3([]);
    setCategoryData([]); setCodeData([]);
    setClickedMonth(null); setClickedCatgroup(null); setClickedCategory(null); setClickedPieNum(null);
    try {
      const data = await getGraphMonthwise({ multiyear, employeename, monthwisecompany, monthwisedisttype });
      const list = Array.isArray(data) ? data : [];
      setGraphDataAll(list);
      setYrFilterMode('-Select-');
      setYrFilterSub('-Select-');
      const firstRow = list[0] && typeof list[0] === 'object' && !list[0].dist ? list[0] : (list[0]?.dist ?? list[0] ?? null);
      setGraphData(firstRow);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [multiyear, monthwisecompany, monthwisedisttype, employeename]);

  useEffect(() => { fetchGraphData(); }, [fetchGraphData]);

  useEffect(() => {
    if (chartTab === 'daywise' && employeename && dwLevel1.length === 0) fetchDwData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartTab, employeename]);

  const monthlyBarData = useMemo(() => {
    if (!graphData) return [];
    if (viewMode === 'Quarterly') {
      return ['Q1','Q2','Q3','Q4'].map((q, qi) => ({
        name: q,
        value: Math.round(Q_KEYS[qi].reduce((s, k) => s + (parseFloat(graphData[k]) || 0), 0)),
      }));
    }
    return MONTH_LABELS.map((label, i) => ({
      name: label,
      value: parseFloat(graphData[MONTH_KEYS[i]]) || 0,
    }));
  }, [graphData, viewMode]);

  const companyLabel   = monthwisecompany || 'SBL';
  const graphTitle     = `${companyLabel} Month Wise Overview (tonnage)`;
  const graphTitleYear = `${companyLabel} Year Wise Overview (tonnage)`;
  const isMultiYear    = Array.isArray(multiyear) && multiyear.length > 1;

  const yrSubOptions = useMemo(() => {
    if (yrFilterMode === 'monthly')   return ['-Select-','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (yrFilterMode === 'Quarterly') return ['-Select-','Qt1','Qt2','Qt3','Qt4'];
    return ['-Select-'];
  }, [yrFilterMode]);

  const yearlyBarData = useMemo(() => {
    if (!isMultiYear) return [];
    const rows = graphDataAll
      .map(item => (item && typeof item === 'object' && !item.dist) ? item : (item?.dist ?? item ?? {}))
      .filter(r => r && r.year != null && !isNaN(Number(r.year)));
    if (yrFilterMode === 'monthly' && yrFilterSub !== '-Select-') {
      const monthIdx = MONTH_LABELS.findIndex(m => m === yrFilterSub);
      if (monthIdx < 0) return [];
      return rows.map(row => ({ name: `${row.year}(${yrFilterSub})`, value: parseFloat(row[MONTH_KEYS[monthIdx]]) || 0 }));
    }
    if (yrFilterMode === 'Quarterly' && yrFilterSub !== '-Select-') {
      const qtIdx = { Qt1: 0, Qt2: 1, Qt3: 2, Qt4: 3 }[yrFilterSub];
      if (qtIdx === undefined) return [];
      return rows.map(row => ({
        name: `${row.year}(${yrFilterSub})`,
        value: Math.round(Q_KEYS[qtIdx].reduce((s, k) => s + (parseFloat(row[k]) || 0), 0)),
      }));
    }
    return rows.map(row => ({
      name: String(row.year),
      value: Math.round(MONTH_KEYS.reduce((s, k) => s + (parseFloat(row[k]) || 0), 0)),
    }));
  }, [isMultiYear, graphDataAll, yrFilterMode, yrFilterSub]);

  const sortedDwLevel1 = useMemo(() => {
    const copy = [...dwLevel1];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel1, dwSellingTab]);

  const sortedDwLevel2 = useMemo(() => {
    const copy = [...dwLevel2];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel2, dwSellingTab]);

  const sortedDwLevel3 = useMemo(() => {
    const copy = [...dwLevel3];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel3, dwSellingTab]);

  const sortedDwLevel4 = useMemo(() => {
    const copy = [...dwLevel4];
    copy.sort((a, b) => dwSellingTab === 'lowview' ? a.value - b.value : b.value - a.value);
    return copy;
  }, [dwLevel4, dwSellingTab]);

  // ── Day Wise fetch + drill-down (keeps raw fields for full table) ────────────
  const fetchDwData = useCallback(async () => {
    flushSync(() => setDwL1Loading(true));
    setDwLevel1([]); setDwLevel2([]); setDwLevel3([]); setDwLevel4([]);
    setDwClickedCatgroup(null); setDwClickedCategory(null);
    setDwClickedItem(null);
    try {
      const result = await getGraphSellingData({ daysel: dwDaysel, method: dwMethod, company: dwCompany, basedon: dwBasedon, grdaiyfilter: dwFilter, employeename });
      const list = Array.isArray(result) ? result : (result?.list ?? []);
      setDwLevel1(list.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(dwBasedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })));
    } catch { setDwLevel1([]); }
    setDwL1Loading(false);
  }, [dwDaysel, dwMethod, dwCompany, dwBasedon, dwFilter, employeename]);

  // Captures current dropdown values into appliedDw then fetches — titles/drill-downs use appliedDw
  const handleDwApply = useCallback(() => {
    setAppliedDw({ daysel: dwDaysel, method: dwMethod, company: dwCompany, filter: dwFilter, basedon: dwBasedon });
    fetchDwData();
  }, [dwDaysel, dwMethod, dwCompany, dwFilter, dwBasedon, fetchDwData]);

  const handleDwBarClick = useCallback(async (payload) => {
    if (!payload?.name) return;
    setDwClickedCatgroup(payload.name);
    setDwLevel2([]); setDwLevel3([]); setDwLevel4([]);
    setDwClickedCategory(null); setDwClickedItem(null);
    clearTimeout(dwL3LoadingTimer.current);
    clearTimeout(dwL4LoadingTimer.current);
    setDwL3Loading(false); setDwL3LoadingVisible(false);
    setDwL4Loading(false); setDwL4LoadingVisible(false);
    flushSync(() => { setDwL2LoadingVisible(true); setDwL2Loading(true); });
    try {
      const rows = await getGraphSellingDataByCategory({ label: payload.name, daysel: appliedDw.daysel, method: appliedDw.method, company: appliedDw.company, basedon: appliedDw.basedon });
      setDwLevel2(Array.isArray(rows) ? rows.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(appliedDw.basedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })) : []);
    } catch { setDwLevel2([]); }
    setDwL2LoadingVisible(false);
    setDwL2Loading(false);
    scrollTo('dw-section2');
  }, [appliedDw]);

  const handleDwCategoryClick = useCallback(async (payload) => {
    if (!payload?.name) return;
    setDwClickedCategory(payload.name);
    setDwLevel3([]); setDwLevel4([]);
    setDwClickedItem(null);
    clearTimeout(dwL4LoadingTimer.current);
    setDwL4Loading(false); setDwL4LoadingVisible(false);
    flushSync(() => { setDwL3LoadingVisible(true); setDwL3Loading(true); });
    try {
      const rows = await getGraphSellingDataByItem({ catgory: dwClickedCatgroup, label: payload.name, daysel: appliedDw.daysel, method: appliedDw.method, company: appliedDw.company, basedon: appliedDw.basedon });
      setDwLevel3(Array.isArray(rows) ? rows.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(appliedDw.basedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })) : []);
    } catch { setDwLevel3([]); }
    setDwL3LoadingVisible(false);
    setDwL3Loading(false);
    scrollTo('dw-section3');
  }, [dwClickedCatgroup, appliedDw]);

  const handleDwItemClick = useCallback(async (payload) => {
    if (!payload?.name) return;
    setDwClickedItem(payload.name);
    setDwLevel4([]);
    flushSync(() => { setDwL4LoadingVisible(true); setDwL4Loading(true); });
    try {
      const rows = await getGraphSellingDataByItem({
        catgory: dwClickedCatgroup,
        label:   payload.name,
        daysel:  appliedDw.daysel,
        method:  appliedDw.method,
        company: appliedDw.company,
        basedon: appliedDw.basedon,
      });
      setDwLevel4(Array.isArray(rows) ? rows.map(r => ({
        name:       r.catgroup,
        value:      parseFloat(appliedDw.basedon === 'Tonnage' ? r.tonnage : r.amount) || 0,
        tonnage:    parseFloat(r.tonnage)    || 0,
        amount:     parseFloat(r.amount)     || 0,
        ly_tonnage: parseFloat(r.ly_tonnage) || 0,
        ly_amount:  parseFloat(r.ly_amount)  || 0,
      })) : []);
    } catch { setDwLevel4([]); }
    setDwL4LoadingVisible(false);
    setDwL4Loading(false);
    scrollTo('dw-section4');
  }, [dwClickedCatgroup, appliedDw]);

  const handleZoom = (title, content) => setZoomChart({ title, content });

  // ── Month Wise drill-down — base function (used by single-year + multi-year) ─
  // Normalises Q1→Qt1 before calling API (chart labels Q1/Q2, API expects Qt1/Qt2)
  const handlePieClickForYear = useCallback(async (monthName, year) => {
    if (!monthName || !year) return;
    const apiMonth = (monthName.startsWith('Q') && !monthName.startsWith('Qt'))
      ? 'Qt' + monthName.slice(1)
      : monthName;
    mwMonthRef.current = apiMonth;
    mwYearRef.current  = String(year);
    setClickedMonth(apiMonth);
    setPieData1([]); setPieData2([]); setPieData3([]);
    setCategoryData([]); setCodeData([]);
    setClickedCatgroup(null); setClickedCategory(null); setClickedPieNum(null);

    const isQt  = apiMonth.startsWith('Qt');
    const qtNum = isQt ? apiMonth.replace('Qt', '') : '';
    const co    = companyLabel;
    let t1, t2, t3;
    if (monthwisedisttype === 'Distribution') {
      t1 = isQt ? `${co} Quarterly ${qtNum} Wise Distribution Overview (tonnage)` : `${co} ${apiMonth} Month Wise Distribution Overview (tonnage)`;
      t2 = isQt ? `${co} Quarterly ${qtNum} Wise institution Overview (tonnage)`   : `${co} ${apiMonth} Month Wise institution Overview (tonnage)`;
      t3 = isQt ? `${co} Quarterly ${qtNum} Wise Govt Orders Overview (tonnage)`   : `${co} ${apiMonth} Month Wise Govt Orders Overview (tonnage)`;
    } else if (monthwisedisttype === 'Shops') {
      t1 = isQt ? `${co} Quarterly ${qtNum} Wise NTPet Shop Overview (tonnage)`       : `${co} ${apiMonth} Month Wise NTPet Shop Overview (tonnage)`;
      t2 = isQt ? `${co} Quarterly ${qtNum} Wise SBL OTHERS Overview (tonnage)`       : `${co} ${apiMonth} Month Wise SBL OTHERS Overview (tonnage)`;
      t3 = isQt ? `${co} Quarterly ${qtNum} Wise Yeshwantpur Shop Overview (tonnage)` : `${co} ${apiMonth} Month Wise Yeshwantpur Shop Overview (tonnage)`;
    } else {
      t1 = isQt ? `${co} Quarterly ${qtNum} Wise Overall Overview (tonnage)`      : `${co} ${apiMonth} Month Wise Overall Overview (tonnage)`;
      t2 = isQt ? `${co} Quarterly ${qtNum} Wise Distribution Overview (tonnage)` : `${co} ${apiMonth} Month Wise Distribution Overview (tonnage)`;
      t3 = isQt ? `${co} Quarterly ${qtNum} Wise Shops Overview (tonnage)`        : `${co} ${apiMonth} Month Wise Shops Overview (tonnage)`;
    }
    mwPieTitles.current = { t1, t2, t3 };
    setPieTitle1(t1); setPieTitle2(t2); setPieTitle3(t3);

    flushSync(() => setCatgroupLoading(true));
    try {
      const rows = await getGraphCatgroup({ selectedyear: String(year), month: apiMonth, monthwisecompany, monthwisedisttype, employeename });
      const arr1 = [], arr2 = [], arr3 = [];
      (Array.isArray(rows) ? rows : []).forEach(r => {
        const val     = parseFloat(r.monthval) || 0;
        const distVal = parseFloat(r.distval)  || 0;
        const shopVal = parseFloat(r.shopval)  || 0;
        if (val <= 0 && distVal <= 0 && shopVal <= 0) return;
        if (String(r.checkda1) === '1') {
          if (val     > 0) arr1.push({ name: r.catgroup, value: val });
          if (distVal > 0) arr2.push({ name: r.catgroup, value: distVal });
          if (shopVal > 0) arr3.push({ name: r.catgroup, value: shopVal });
        } else {
          if (r.dispatchtype === 'Distribution' || r.areaname === 'Govt Orders') {
            if (r.areaname === 'Govt Orders')                                            arr3.push({ name: r.catgroup, value: val });
            else if (String(r.institute) === 'Yes' && r.dispatchtype === 'Distribution') arr2.push({ name: r.catgroup, value: val });
            else                                                                         arr1.push({ name: r.catgroup, value: val });
          } else if (r.dispatchtype === 'NTPet Shop')       arr1.push({ name: r.catgroup, value: val });
          else if   (r.dispatchtype === 'SBL OTHERS')       arr2.push({ name: r.catgroup, value: val });
          else if   (r.dispatchtype === 'Yeshwantpur Shop') arr3.push({ name: r.catgroup, value: val });
        }
      });
      setPieData1(arr1); setPieData2(arr2); setPieData3(arr3);
    } catch { setPieData1([]); setPieData2([]); setPieData3([]); }
    setCatgroupLoading(false);
    scrollTo('mw-section2');
  }, [companyLabel, monthwisecompany, monthwisedisttype, employeename]);

  // Single-year pie/bar click — reads year from graphData
  const handlePieClick = useCallback((monthName) => {
    if (!monthName) return;
    // For single year, we always have data so just proceed
    const year = graphData?.year || (Array.isArray(multiyear) ? multiyear[0] : multiyear);
    handlePieClickForYear(monthName, year);
  }, [graphData, multiyear, handlePieClickForYear]);

  // Multi-year pie/bar click — extracts year from the clicked bar/slice label
  const handleYearPieClick = useCallback((yearLabel) => {
    if (!yearLabel) return;
    const yearStr = String(yearLabel).slice(0, 4);
    
    if (yrFilterMode === 'monthly' || yrFilterMode === 'Quarterly') {
      // Filter mode IS selected
      if (yrFilterSub !== '-Select-') {
        // Both filter AND sub-filter selected: show level 2 (3 pies) for that month/year
        handlePieClickForYear(yrFilterSub, yearStr);
      } else {
        // Filter mode selected but no sub yet: show notification
        showToast('Select a Period', `"Group by" is set to ${yrFilterMode}. Now pick a value in the "Period" dropdown to see the breakdown`, 'warning');
      }
    } else {
      // No filter mode selected: show notification
      showToast('Filter Required', 'Use the "Group by" dropdown to select Monthly or Quarterly, then choose a "Period" to see the breakdown', 'info');
    }
  }, [yrFilterMode, yrFilterSub, graphDataAll, handlePieClickForYear, showToast]);

  // DrillPie slice click → Level 2 HBar (reads month + year from refs)
  const handleCatgroupClick = useCallback(async (catgroupName, pieNum) => {
    if (!catgroupName) return;
    const month = mwMonthRef.current;
    const year  = mwYearRef.current;
    const { t1, t2, t3 } = mwPieTitles.current;
    const hTitle = ([t1, t2, t3][pieNum - 1] || '').replace('Overview', `and ${catgroupName} Overview`);

    mwCatgroupRef.current = catgroupName;
    mwPieNumRef.current   = pieNum;
    mwHbarTitle.current   = hTitle;

    setClickedCatgroup(catgroupName);
    setClickedPieNum(pieNum);
    setCategoryData([]); setCodeData([]);
    setClickedCategory(null);
    setHbarTitle(hTitle);
    setHbar2Title('');
    flushSync(() => setCategoryLoading(true));
    try {
      const rows = await getGraphCategoryForCatgroup({ selectedyear: year, month, catgroup: catgroupName, dataget: pieNum, monthwisedisttype, monthwisecompany });
      setCategoryData(Array.isArray(rows) ? rows.map(r => ({ name: r.category ?? r.catgroup ?? r.name, value: parseFloat(r.monthval) || 0 })) : []);
    } catch { setCategoryData([]); }
    setCategoryLoading(false);
    scrollTo('mw-section3');
  }, [monthwisedisttype, monthwisecompany, employeename]);

  // HBar category click → Level 3 HBar of codes (reads all from refs)
  const handleCategoryClick = useCallback(async (payload) => {
    const categoryName = payload?.name;
    if (!categoryName) return;
    const month    = mwMonthRef.current;
    const year     = mwYearRef.current;
    const catgroup = mwCatgroupRef.current;
    const pieNum   = mwPieNumRef.current;
    const hTitle   = mwHbarTitle.current;

    if (!catgroup || !month || !year || pieNum == null) {
      return;
    }

    setClickedCategory(categoryName);
    setCodeData([]);
    setHbar2Title(hTitle.replace('Overview', `with ${categoryName} Category Overview`));
    flushSync(() => setCodeLoading(true));
    try {
      const rows = await getGraphCategoryWithCode({ selectedyear: year, month, catgroup, category: categoryName, dataget: pieNum, monthwisedisttype, monthwisecompany, employeename });
      setCodeData(Array.isArray(rows) ? rows.map(r => ({ name: r.code ?? r.category ?? r.name, value: parseFloat(r.monthval) || 0 })) : []);
    } catch { setCodeData([]); }
    setCodeLoading(false);
    scrollTo('mw-section3');
  }, [monthwisedisttype, monthwisecompany, employeename]);

  const handlePie1Click = useCallback((name) => handleCatgroupClick(name, 1), [handleCatgroupClick]);
  const handlePie2Click = useCallback((name) => handleCatgroupClick(name, 2), [handleCatgroupClick]);
  const handlePie3Click = useCallback((name) => handleCatgroupClick(name, 3), [handleCatgroupClick]);

  // Year filter mode change — clears drill-down when reset to -Select-
  // Year filter mode change — clears drill-down when mode changes
  const handleYrModeChange = useCallback((mode) => {
    setYrFilterMode(mode);
    setYrFilterSub('-Select-');
    // Clear all level 2 data when filter mode changes
    setPieData1([]); setPieData2([]); setPieData3([]);
    setCategoryData([]); setCodeData([]);
    setClickedMonth(null); setClickedCatgroup(null); setClickedCategory(null); setClickedPieNum(null);
  }, []);

  // Handle sub-filter (month/quarter) change: clear level 2 whenever it changes so it refreshes with new month/quarter when year is clicked
  const handleYrSubChange = useCallback((sub) => {
    setYrFilterSub(sub);
    // Clear level 2 data when sub-filter changes (whether to '-Select-' or to a new month/quarter)
    // This ensures clean state for next year click with new filter
    setPieData1([]); setPieData2([]); setPieData3([]);
    setCategoryData([]); setCodeData([]);
    setClickedMonth(null); setClickedCatgroup(null); setClickedCategory(null); setClickedPieNum(null);
  }, []);

  const LoaderOverlay = () => <SrLoader accent={accent} isDarkMode={isDarkMode} text="Loading..." />;


  const tabBg        = isDarkMode ? '#1e293b' : '#f1f5f9';
  const inactiveClr  = isDarkMode ? '#94a3b8' : '#475569';
  const filterBarBg  = isDarkMode ? '#0f172a'  : '#f8fafc';
  const filterBarBdr = isDarkMode ? '#334155'  : '#e2e8f0';

  return (
    <div style={{ width: '100%' }}>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 4, background: tabBg, borderRadius: 8, padding: 3 }}>
          {[{ id: 'monthwise', label: 'Month Wise' }, { id: 'daywise', label: 'Day Wise' }].map(t => (
            <button key={t.id} onClick={() => setChartTab(t.id)} style={{
              background: chartTab === t.id ? `linear-gradient(135deg,${accent},${accent2})` : 'none',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              padding: '0.35rem 1rem', fontSize: '0.8rem',
              fontWeight: chartTab === t.id ? 700 : 500,
              color: chartTab === t.id ? 'white' : inactiveClr,
              transition: 'all 0.18s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {chartTab === 'monthwise' && <FilterBar mode="monthwise" isLoading={loading} />}

      {/* ── MONTH WISE / DAY WISE — tab-switch animation ── */}
      <AnimatePresence mode="wait">
      {chartTab === 'monthwise' && (
        <motion.div key="ct-monthwise" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#c62828', fontSize: '0.82rem' }}>
              <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />{error}
            </div>
          )}
          {loading ? (
            <SrLoader accent={accent} isDarkMode={isDarkMode} text="Generating Report" />
          ) : (
            <motion.div
              key={`${String(isMultiYear)}-${viewMode}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38 }}
            >
              {/* Section 1 — bar + pie, both clickable to drill down */}
              <div id="section1" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 20 }}>
                <BarChartCard
                  title={isMultiYear ? graphTitleYear : graphTitle}
                  data={isMultiYear ? yearlyBarData : monthlyBarData}
                  viewMode={viewMode} onViewModeChange={setViewMode}
                  onZoom={handleZoom}
                  isMultiYear={isMultiYear}
                  yrFilterMode={yrFilterMode} yrFilterSub={yrFilterSub}
                  yrSubOptions={yrSubOptions}
                  onYrModeChange={handleYrModeChange} onYrSubChange={handleYrSubChange}
                  onBarClick={isMultiYear ? handleYearPieClick : handlePieClick}
                />
                <PieChartCard
                  title={isMultiYear ? graphTitleYear : graphTitle}
                  data={isMultiYear ? yearlyBarData : monthlyBarData}
                  viewMode={viewMode} onViewModeChange={setViewMode}
                  onZoom={handleZoom}
                  isMultiYear={isMultiYear}
                  yrFilterMode={yrFilterMode} yrFilterSub={yrFilterSub}
                  yrSubOptions={yrSubOptions}
                  onYrModeChange={handleYrModeChange} onYrSubChange={handleYrSubChange}
                  onPieClick={isMultiYear ? handleYearPieClick : handlePieClick}
                />
              </div>
            </motion.div>
          )}

          {/* Section 2 — 3 DrillPie cards */}
          {catgroupLoading && <LoaderOverlay />}
          {(catgroupLoading || pieData1.length > 0 || pieData2.length > 0 || pieData3.length > 0) && (
            <motion.div id="mw-section2" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {!catgroupLoading && (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DrillPieCard title={pieTitle1} data={pieData1} onSliceClick={handlePie1Click} onZoom={handleZoom} />
                  <DrillPieCard title={pieTitle2} data={pieData2} onSliceClick={handlePie2Click} onZoom={handleZoom} />
                  <DrillPieCard title={pieTitle3} data={pieData3} onSliceClick={handlePie3Click} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* Section 3 — category HBar, then code HBar below */}
          {categoryLoading && <LoaderOverlay />}
          {codeLoading && <LoaderOverlay />}
          {(categoryLoading || categoryData.length > 0 || codeLoading || codeData.length > 0) && (
            <motion.div id="mw-section3" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {!categoryLoading && categoryData.length > 0 && (
                <HBarCard
                  title={hbarTitle}
                  data={categoryData}
                  onBarClick={handleCategoryClick}
                  onZoom={handleZoom}
                />
              )}
              {!codeLoading && codeData.length > 0 && (
                <motion.div style={{ marginTop: 16 }}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <HBarCard
                    title={hbar2Title}
                    data={codeData}
                    onBarClick={null}
                    onZoom={handleZoom}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── DAY WISE ── */}
      {chartTab === 'daywise' && (
        <motion.div key="ct-daywise" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.65rem 0.85rem', background: filterBarBg, border: `1px solid ${filterBarBdr}`, borderRadius: 10 }}>
            <div className="sr-sel-wrap">
              <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Dates :</label>
              <Select options={DW_DAYSEL_OPTIONS} value={DW_DAYSEL_OPTIONS.find(o => o.value === dwDaysel)}
                onChange={o => setDwDaysel(o.value)} styles={selStyles} isSearchable={false}
                menuPortalTarget={document.body} menuPosition="fixed" />
            </div>
            {showShopsOption && (
              <div className="sr-sel-wrap">
                <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Methods :</label>
                <Select options={DW_METHOD_OPTIONS} value={DW_METHOD_OPTIONS.find(o => o.value === dwMethod)}
                  onChange={o => setDwMethod(o.value)} styles={selStyles} isSearchable={false}
                  menuPortalTarget={document.body} menuPosition="fixed" />
              </div>
            )}
            <div className="sr-sel-wrap">
              <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Company :</label>
              <Select options={DW_COMPANY_OPTIONS} value={DW_COMPANY_OPTIONS.find(o => o.value === dwCompany)}
                onChange={o => setDwCompany(o.value)} styles={selStyles} isSearchable={false}
                menuPortalTarget={document.body} menuPosition="fixed" />
            </div>
            <div className="sr-sel-wrap">
              <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Data View :</label>
              <Select options={DW_FILTER_OPTIONS} value={DW_FILTER_OPTIONS.find(o => o.value === dwFilter)}
                onChange={o => setDwFilter(o.value)} styles={selStyles} isSearchable={false}
                menuPortalTarget={document.body} menuPosition="fixed" />
            </div>
            <div className="sr-sel-wrap">
              <label className="sr-filter-label" style={{ color: isDarkMode ? '#94a3b8' : accent }}>Value :</label>
              <Select options={DW_BASEDON_OPTIONS} value={DW_BASEDON_OPTIONS.find(o => o.value === dwBasedon)}
                onChange={o => setDwBasedon(o.value)} styles={selStyles} isSearchable={false}
                menuPortalTarget={document.body} menuPosition="fixed" />
            </div>
            <button onClick={handleDwApply} disabled={dwL1Loading} className="btn-generate-anim" style={{
              background: `linear-gradient(135deg,${accent},${accent2})`,
              border: 'none', color: 'white', borderRadius: 6,
              padding: '0.35rem 1rem', fontSize: '0.78rem', fontWeight: 600,
              cursor: dwL1Loading ? 'not-allowed' : 'pointer', opacity: dwL1Loading ? 0.6 : 1,
              alignSelf: 'flex-end',
            }}>
              {dwL1Loading ? 'Loading…' : 'Generate'}
            </button>
            <div style={{ display: 'flex', gap: 4, background: isDarkMode ? '#0f172a' : '#f1f5f9', borderRadius: 8, padding: 3, alignSelf: 'flex-end' }}>
              {[{ id: 'topview', label: 'Top Selling' }, { id: 'lowview', label: 'Low Selling' }].map(t => (
                <button key={t.id} onClick={() => setDwSellingTab(t.id)} style={{
                  background: dwSellingTab === t.id ? accent : 'none',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  padding: '0.3rem 0.75rem', fontSize: '0.75rem',
                  fontWeight: dwSellingTab === t.id ? 700 : 500,
                  color: dwSellingTab === t.id ? 'white' : inactiveClr,
                  transition: 'all 0.18s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* DW Level 1 — table + chart side by side */}
          {dwL1Loading && <LoaderOverlay />}
          {(dwL1Loading || dwLevel1.length > 0) && (
            <motion.div id="dw-section1" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {!dwL1Loading && (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${appliedDw.company} ${appliedDw.method} Wise Overview (${appliedDw.daysel})`}
                    data={sortedDwLevel1} basedon={appliedDw.basedon} />
                  <MirroredHBarCard
                    title={`${dwSellingTab === 'topview' ? 'Top' : 'Low'} Selling — ${appliedDw.filter} (${appliedDw.basedon}) [${appliedDw.daysel}]`}
                    data={sortedDwLevel1} onBarClick={handleDwBarClick} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* DW Level 2 — table + chart side by side */}
          {dwL2LoadingVisible && <LoaderOverlay />}
          {(dwL2Loading || dwLevel2.length > 0) && (
            <motion.div id="dw-section2" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {!dwL2LoadingVisible && dwLevel2.length > 0 && (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${appliedDw.company} ${appliedDw.method} And ${dwClickedCatgroup} Wise Overview (${appliedDw.daysel})`}
                    data={sortedDwLevel2} basedon={appliedDw.basedon} />
                  <MirroredHBarCard
                    title={`Day Wise — ${dwClickedCatgroup} breakdown (${appliedDw.basedon})`}
                    data={sortedDwLevel2} onBarClick={handleDwCategoryClick} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* DW Level 3 — table + chart side by side */}
          {dwL3LoadingVisible && <LoaderOverlay />}
          {(dwL3Loading || dwLevel3.length > 0) && (
            <motion.div id="dw-section3" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {!dwL3LoadingVisible && dwLevel3.length > 0 && (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${appliedDw.company} ${appliedDw.method} And ${dwClickedCatgroup} and ${dwClickedCategory} Category Wise Overview (${appliedDw.daysel})`}
                    data={sortedDwLevel3} basedon={appliedDw.basedon} />
                  <MirroredHBarCard
                    title={`Day Wise — ${dwClickedCatgroup} → ${dwClickedCategory} items (${appliedDw.basedon})`}
                    data={sortedDwLevel3} onBarClick={handleDwItemClick} onZoom={handleZoom} />
                </div>
              )}
            </motion.div>
          )}

          {/* DW Level 4 — table + chart side by side */}
          {dwL4LoadingVisible && <LoaderOverlay />}
          {(dwL4Loading || dwLevel4.length > 0) && (
            <motion.div id="dw-section4" style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              {!dwL4LoadingVisible && dwLevel4.length > 0 && (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                  <DwTableCard
                    title={`${appliedDw.company} ${appliedDw.method} — ${dwClickedCatgroup} → ${dwClickedCategory} → ${dwClickedItem} Items (${appliedDw.daysel})`}
                    data={sortedDwLevel4}
                    basedon={appliedDw.basedon}
                  />
                  <MirroredHBarCard
                    title={`Day Wise — ${dwClickedCatgroup} → ${dwClickedCategory} → ${dwClickedItem} (${appliedDw.basedon})`}
                    data={sortedDwLevel4}
                    onBarClick={null}
                    onZoom={handleZoom}
                  />
                </div>
              )}
            </motion.div>
          )}

          {!dwL1Loading && dwLevel1.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              Select filters and click <strong>Apply</strong> to load day-wise chart data.
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {zoomChart && <ZoomModal chart={zoomChart} onClose={() => setZoomChart(null)} />}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, minWidth: 300, maxWidth: 420 }}
          >
            <div style={{ 
              background: isDarkMode ? '#1e293b' : 'white', 
              border: `1px solid ${toast.type === 'error' ? '#fca5a5' : toast.type === 'warning' ? '#fbbf24' : toast.type === 'success' ? '#86efac' : '#93c5fd'}`, 
              borderRadius: 12, 
              padding: '0.9rem 1rem', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 10 
            }}>
              <i className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : toast.type === 'error' ? 'exclamation-triangle-fill' : toast.type === 'warning' ? 'exclamation-circle-fill' : 'info-circle-fill'}`}
                style={{ 
                  color: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : toast.type === 'success' ? '#10b981' : '#3b82f6',
                  minWidth: 20,
                  marginTop: 2,
                  fontSize: '1.1rem'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>{toast.title}</div>
                <div style={{ fontSize: '0.78rem', color: isDarkMode ? '#94a3b8' : '#64748b', marginTop: 2 }}>{toast.message}</div>
              </div>
              <button onClick={() => setToastVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#94a3b8' : '#9ca3af', fontSize: '1.2rem', padding: 0 }}>×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
