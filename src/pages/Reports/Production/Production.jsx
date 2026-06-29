import React, { useState, useEffect, useMemo, useRef } from "react";
import ThemedTooltip from "../../../components/ui/Tooltip";
import { logActivity } from '../../../services/activityLog';
import { motion, AnimatePresence } from "framer-motion";
import { getProductionReportTonnage, getByProductReport } from '../../../services/productionApi';
import {
  toNumber, flattenUnitArray,
  hasRoundedDisplayValue, hasFinishedDisplayValue,
  hasRawDisplayValue, filterGroupedData,
} from '../../../utils/productionHelpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useColorMode } from "../../../theme/ThemeContext";
import { AppDatePicker, AppSelect } from "../../../components/FormControls";
import styles from "./Production.module.css";
import SummaryCardsSystem from "../../../components/SummaryCardsSystem/SummaryCardsSystem";


const PRODUCTION_TABS = [
  { id: "reports", label: "Reports" },
  { id: "charts", label: "Charts" },
];

const Production = () => {
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(window.innerWidth >= 768);
  const [activeProductionTab, setActiveProductionTab] = useState("reports");

  useEffect(() => {
    if (activeProductionTab === 'charts') logActivity('Production', 'Charts', '', 'view', { from: formatPayloadDate(fromDate), to: formatPayloadDate(toDate) });
  }, [activeProductionTab]);
  const [catGroup, setCatGroup] = useState("Fried Gram Mill");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [isReportFullscreen, setIsReportFullscreen] = useState(false);
  const filterBarRef = useRef(null);

  const [finishedCollapsed, setFinishedCollapsed] = useState(false);
  const [othersCollapsed, setOthersCollapsed] = useState(false);
  const [rawCollapsed, setRawCollapsed] = useState(false);
  const [productionRatioCollapsed, setProductionRatioCollapsed] = useState(false);
  const [packingCollapsed, setPackingCollapsed] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState({});

  // Manual Entry By Products section
  const [byProductAllUnitsData, setByProductAllUnitsData] = useState(null);
  const [byProductData, setByProductData] = useState([]);
  const [byProductGrandTotal, setByProductGrandTotal] = useState({});
  const [byProductCollapsed, setByProductCollapsed] = useState(false);

  // Unit toggle (bags / tonnage / kg)
  const [unitType, setUnitType] = useState('tonnage');
  const [allUnitsData, setAllUnitsData] = useState(null);

  // Chart states
  const [selectedCategory, setSelectedCategory] = useState("finished");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [metricType, setMetricType] = useState("opening");
  const [chartType, setChartType] = useState("bar");
  const [dataView, setDataView] = useState("produced");

  // Pie chart slice toggle (click legend to hide/show)
  const [hiddenPieNames, setHiddenPieNames] = useState(new Set());
  const toggleHiddenPie = React.useCallback((name) => {
    setHiddenPieNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  const [periodType, setPeriodType] = useState('today');
  const [customFrom, setCustomFrom] = useState(new Date());
  const [customTo,   setCustomTo]   = useState(new Date());

  const [selectedMonthYear, setSelectedMonthYear] = useState(() => String(new Date().getFullYear()));
  const [selectedMonthVal,  setSelectedMonthVal]  = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0');
  });

  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const [quarterType,     setQuarterType]     = useState('financial');
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [selectedQYear,   setSelectedQYear]   = useState(() => {
    const now = new Date();
    return String(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1);
  });

  const [selectedFY, setSelectedFY] = useState(() => {
    const now = new Date();
    return String(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1);
  });

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
    title: ""
  });
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  // Sticky filter bar detection
  useEffect(() => {
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsFilterSticky(rect.top <= 72);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileScreen(mobile);
      if (!mobile) {
        setMobileFiltersOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("production-report-fullscreen", isReportFullscreen);

    return () => {
      document.body.classList.remove("production-report-fullscreen");
    };
  }, [isReportFullscreen]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("production-report-fullscreen");
    };
  }, []);

  const computeDateRange = (type, opts = {}) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = (y, m, day) => new Date(y, m, day);

    switch (type) {
      case 'today':
        return { from: new Date(today), to: new Date(today) };

      case 'yesterday': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { from: y, to: new Date(y) };
      }

      case 'thisweek': {
        const day = today.getDay();
        const mon = new Date(today);
        mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
        return { from: mon, to: new Date(today) };
      }

      case 'thismonth':
        return { from: d(today.getFullYear(), today.getMonth(), 1), to: new Date(today) };

      case 'lastmonth': {
        const first = d(today.getFullYear(), today.getMonth() - 1, 1);
        const last  = d(today.getFullYear(), today.getMonth(), 0);
        return { from: first, to: last };
      }

      case 'quarter': {
        const yr = parseInt(opts.qYear || (today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1), 10);
        if (opts.quarterType === 'calendar') {
          const calMap = {
            Q1: { from: d(yr, 0,  1), to: d(yr, 2,  31) },
            Q2: { from: d(yr, 3,  1), to: d(yr, 5,  30) },
            Q3: { from: d(yr, 6,  1), to: d(yr, 8,  30) },
            Q4: { from: d(yr, 9,  1), to: d(yr, 11, 31) },
          };
          return calMap[opts.quarter] || calMap['Q1'];
        } else {
          const fyMap = {
            Q1: { from: d(yr,     3, 1), to: d(yr,     5, 30) },
            Q2: { from: d(yr,     6, 1), to: d(yr,     8, 30) },
            Q3: { from: d(yr,     9, 1), to: d(yr,    11, 31) },
            Q4: { from: d(yr + 1, 0, 1), to: d(yr + 1,  2, 31) },
          };
          return fyMap[opts.quarter] || fyMap['Q1'];
        }
      }

      case 'financialyear': {
        const fy = parseInt(opts.fy || (today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1), 10);
        return { from: d(fy, 3, 1), to: d(fy + 1, 2, 31) };
      }

      case 'year': {
        const yr = parseInt(opts.year || today.getFullYear(), 10);
        return { from: d(yr, 0, 1), to: d(yr, 11, 31) };
      }

      case 'month': {
        const yr = parseInt(opts.monthYear || today.getFullYear(), 10);
        const mo = parseInt(opts.monthVal  || 1, 10);
        if (!yr || !mo) return { from: new Date(today), to: new Date(today) };
        return { from: d(yr, mo - 1, 1), to: d(yr, mo, 0) };
      }

      case 'custom':
      default:
        return { from: opts.customFrom || new Date(today), to: opts.customTo || new Date(today) };
    }
  };

  useEffect(() => {
    const { from, to } = computeDateRange(periodType, {
      quarterType: quarterType,
      quarter:     selectedQuarter,
      qYear:       selectedQYear,
      fy:          selectedFY,
      year:        selectedYear,
      monthYear:   selectedMonthYear,
      monthVal:    selectedMonthVal,
      customFrom:  customFrom,
      customTo:    customTo,
    });
    setFromDate(from);
    setToDate(to);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, quarterType, selectedQuarter, selectedQYear, selectedFY, selectedYear, selectedMonthYear, selectedMonthVal, customFrom, customTo]);

  const showToast = (title, message, type = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ show: true, message, type, title });
    setToastVisible(true);

    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => {
        setToast({ show: false, message: "", type: "info", title: "" });
      }, 300);
    }, 12000);
  };

  const closeToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastVisible(false);
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info", title: "" });
    }, 300);
  };

  const toggleReportFullscreen = () => {
    const nextValue = !isReportFullscreen;
    setIsReportFullscreen(nextValue);
    setMobileFiltersOpen(nextValue ? false : !isMobileScreen);
  };

  const mergeGroupedData = (primary = {}, secondary = {}) => {
    const merged = {};
    [...Object.keys(primary || {}), ...Object.keys(secondary || {})].forEach((key) => {
      merged[key] = [
        ...((primary && primary[key]) || []),
        ...((secondary && secondary[key]) || []),
      ];
    });
    return merged;
  };

  const finishedData = useMemo(() => {
    if (!data) return {};
    const source =
      dataView === "unproduced"
        ? data.finished2 || {}
        : dataView === "all"
        ? mergeGroupedData(data.finished, data.finished2)
        : data.finished || {};

    return filterGroupedData(source, hasFinishedDisplayValue);
  }, [data, dataView]);

  const finishedOthersData = useMemo(() => {
    if (!data) return {};
    const source =
      dataView === "unproduced"
        ? data.finishedOthers2 || {}
        : dataView === "all"
        ? mergeGroupedData(data.finishedOthers, data.finishedOthers2)
        : data.finishedOthers || {};

    return filterGroupedData(source, hasFinishedDisplayValue);
  }, [data, dataView]);

  const rawData = useMemo(() => {
    if (!data) return {};
    const source =
      dataView === "unproduced"
        ? data.raw2 || {}
        : dataView === "all"
        ? mergeGroupedData(data.raw, data.raw2)
        : data.raw || {};

    return filterGroupedData(source, hasRawDisplayValue);
  }, [data, dataView]);

  const derivePackingProduction = (sourceFinished = {}) => [
    ...((sourceFinished && sourceFinished["FRIED GRAM"]) || []).map((item) => ({
      ...item,
      category: "FRIED GRAM",
    })),
    ...((sourceFinished && sourceFinished["BENGAL GRAM"]) || []).map((item) => ({
      ...item,
      category: "BENGAL GRAM",
    })),
  ];

  const packingProductionData = useMemo(() => {
    if (!data) return [];
    const producedPacking = data.fried_gram_production || derivePackingProduction(data.finished);
    const unproducedPacking = data.fried_gram_production2 || derivePackingProduction(data.finished2);
    const source =
      dataView === "unproduced"
        ? unproducedPacking
        : dataView === "all"
        ? [...producedPacking, ...unproducedPacking]
        : producedPacking;

    return source.filter((item) => hasRoundedDisplayValue(item["purchased/transfer in"]));
  }, [data, dataView]);

  const dataViewLabel = {
    produced: "Produced Items",
    unproduced: "Unproduced Items",
    all: "All Items",
  }[dataView];

  const brands = useMemo(() => {
    if (!data) return [];
    return Object.keys(finishedData || {}).filter(
      (b) => Array.isArray(finishedData[b]) && finishedData[b].length
    );
  }, [data, finishedData]);

  const othersBrands = useMemo(() => {
    if (!data) return [];
    return Object.keys(finishedOthersData || {}).filter(
      (b) => Array.isArray(finishedOthersData[b]) && finishedOthersData[b].length
    );
  }, [data, finishedOthersData]);

  const chartCategoryBrands = selectedCategory === "others" ? othersBrands : brands;

  useEffect(() => {
    if (
      ["finished", "others"].includes(selectedCategory) &&
      selectedBrand !== "all" &&
      !chartCategoryBrands.includes(selectedBrand)
    ) {
      setSelectedBrand("all");
    }
  }, [chartCategoryBrands, selectedBrand, selectedCategory]);

  const calculateGrandTotals = (sourceData = finishedData, categories = brands) => {
    if (!data || !categories || categories.length === 0) return { opening: 0, production: 0, total: 0, dispatch: 0, returned: 0, closing: 0 };

    let grand = { opening: 0, production: 0, total: 0, dispatch: 0, returned: 0, closing: 0 };

    categories.forEach((cat) => {
      const items = sourceData[cat] || [];
      items.forEach(i => {
        const metrics = getFinishedItemMetrics(i);
        grand.opening += metrics.opening;
        grand.production += metrics.production;
        grand.total += metrics.total;
        grand.dispatch += metrics.dispatch;
        grand.returned += metrics.returned;
        grand.closing += metrics.closing;
      });
    });

    return grand;
  };

  const fmt = (n) => {
    if (!n && n !== 0) return "0.00";
    const abs = Math.abs(n);
    const [intPart, decPart] = abs.toFixed(2).split('.');
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    const formatted = rest ? `${rest},${last3}` : last3;
    return (n < 0 ? '-' : '') + formatted + '.' + decPart;
  };


  const formatIndianNumber = (num) => {
  if (num == null || isNaN(num)) return '';
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(2).split('.');
  if (intPart === '0' && decPart === '00') return '0.00';
  const lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  let formatted = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;
  if (num < 0) formatted = '-' + formatted;
  return formatted + '.' + decPart;
};
  const dimProd = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v) || 0;
    return n === 0
      ? <span style={{ color: isDarkMode ? '#475569' : '#cbd5e1' }}>{formatIndianNumber(v)}</span>
      : formatIndianNumber(v);
  };

const CustomXAxisTick = ({ x, y, payload }) => {
  const text = payload.value || "";

  const words = text.split(" ");
  const firstLine = words.slice(0, 3).join(" ");
  const secondLine = words.slice(3).join(" ");

  return (
    <g transform={`translate(${x},${y + 10}) rotate(-45)`}>
        <text
          textAnchor="end"
          fill={isDarkMode ? "#e5e7eb" : "#666"}
          fontSize={12}
        >
        <tspan x={0} dy={0}>{firstLine}</tspan>
        <tspan x={0} dy={14}>{secondLine}</tspan>
      </text>
    </g>
  );
};


  const formatPercentage = (value) => {
    const num = Number(value) || 0;
    return `${num.toFixed(2)}%`;
  };

  const formatPayloadDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

let fgProdPercentage = 0;

  const getFinishedOthersTotals = () => {
    if (dataView === "produced") {
      const totals = data?.finished_grand_total_others || {};
      return {
        totalOpening: totals.totalOpeningOthers || 0,
        totalProduction: totals.totalProductionOthers || 0,
        totalDispatch: totals.totalDispatchOthers || 0,
        totalReturn: totals.totalReturnOthers || 0,
        totalClosing: totals.totalClosingOthers || 0,
      };
    }

    if (dataView === "unproduced") {
      const totals = data?.finished_grand_total_others2 || {};
      return {
        totalOpening: totals.totalOpeningOthers2 || 0,
        totalProduction: totals.totalProductionOthers2 || 0,
        totalDispatch: totals.totalDispatchOthers2 || 0,
        totalReturn: totals.totalReturnOthers2 || 0,
        totalClosing: totals.totalClosingOthers2 || 0,
      };
    }

    return {
      totalOpening:
        (data?.finished_grand_total_others?.totalOpeningOthers || 0) +
        (data?.finished_grand_total_others2?.totalOpeningOthers2 || 0),

      totalProduction:
        (data?.finished_grand_total_others?.totalProductionOthers || 0) +
        (data?.finished_grand_total_others2?.totalProductionOthers2 || 0),

      totalDispatch:
        (data?.finished_grand_total_others?.totalDispatchOthers || 0) +
        (data?.finished_grand_total_others2?.totalDispatchOthers2 || 0),

      totalReturn:
        (data?.finished_grand_total_others?.totalReturnOthers || 0) +
        (data?.finished_grand_total_others2?.totalReturnOthers2 || 0),

      totalClosing:
        (data?.finished_grand_total_others?.totalClosingOthers || 0) +
        (data?.finished_grand_total_others2?.totalClosingOthers2 || 0),
    };
  };

const othersTotals = getFinishedOthersTotals();
const othersOpening = othersTotals.totalOpening || 0;
const othersProduction = othersTotals.totalProduction || 0;
const othersDispatch = othersTotals.totalDispatch || 0;
const othersReturned = othersTotals.totalReturn || 0;
const othersClosing = othersTotals.totalClosing || 0;
const othersTotal = othersOpening + othersProduction;
let othersProdPercentage = 0;

  const getFinishedItemMetrics = (item = {}) => {
    const opening = toNumber(item.opening);
    const production = toNumber(item["purchased/transfer in"]);

    return {
      opening,
      production,
      total: opening + production,
      dispatch: toNumber(item.sold),
      returned: toNumber(item.returned ?? item.return ?? item["sales return"]),
      closing: toNumber(item.closing),
      prodPercentage: toNumber(item.prod_percentage),
    };
  };

  const getRawItemMetrics = (item = {}) => {
    const opening = toNumber(item.opening);
    const arrival = toNumber(item["purchased/transfer in"]);

    return {
      opening,
      arrival,
      total: opening + arrival,
      used: toNumber(item["consumed/transfer out"]),
      returned: toNumber(item.returned ?? item.return),
      closing: toNumber(item.closing),
    };
  };

  const calcTotals = (items) =>
    items.reduce(
      (a, item) => {
        const metrics = getFinishedItemMetrics(item);
        return {
          o: a.o + metrics.opening,
          p: a.p + metrics.production,
          d: a.d + metrics.dispatch,
          r: a.r + metrics.returned,
          c: a.c + metrics.closing,
        };
      },
      { o: 0, p: 0, d: 0, r: 0, c: 0 }
    );

  const calcProdPercentage = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce(
      (total, item) => total + getFinishedItemMetrics(item).prodPercentage,
      0
    );
  };

  const calcRoundedProdPercentage = calcProdPercentage;

  const fgSummaryTotals = calculateGrandTotals(finishedData, brands);
  const fgOpening = fgSummaryTotals.opening;
  const fgProduction = fgSummaryTotals.production;
  const fgDispatch = fgSummaryTotals.dispatch;
  const fgReturned = fgSummaryTotals.returned;
  const fgClosing = fgSummaryTotals.closing;
  const fgTotal = fgSummaryTotals.total;

  fgProdPercentage = calcProdPercentage(brands.flatMap(cat => finishedData[cat] || []));
  othersProdPercentage = calcProdPercentage(othersBrands.flatMap(cat => finishedOthersData[cat] || []));

  const fetchReport = async () => {
    setLoading(true);
    setAllUnitsData(null);
    setData(null);
    setByProductAllUnitsData(null);
    setByProductData([]);
    setByProductGrandTotal({});
    showToast("Loading", "Fetching production report...", "info");

    try {
      const res = await getProductionReportTonnage({
        fromdate: formatPayloadDate(fromDate),
        todate: formatPayloadDate(toDate),
      });

      if (!res || Object.keys(res).length === 0) {
        setData(null);
        setAllUnitsData(null);
        setIsReportFullscreen(false);
        showToast("No Data", "No production data found for selected date range.", "warning");
        return;
      }

      const parsed = {
        bags:    flattenUnitArray(res.bags),
        tonnage: flattenUnitArray(res.tonnage),
        kg:      flattenUnitArray(res.kg),
      };
      setAllUnitsData(parsed);

      const activeData = parsed[unitType] || parsed.tonnage;
      setData(activeData);
      logActivity('Production', 'Report', '', 'generate', { from: formatPayloadDate(fromDate), to: formatPayloadDate(toDate) });

      const obj = {};
      [...Object.keys(activeData.finished || {}), ...Object.keys(activeData.finished2 || {})].forEach((k) => (obj[k] = true));
      [...Object.keys(activeData.finishedOthers || {}), ...Object.keys(activeData.finishedOthers2 || {})].forEach((k) => (obj[`others:${k}`] = true));
      setCollapsedCats(obj);

      if (activeData.finished && Object.keys(activeData.finished).length > 0) {
        const availableBrands = Object.keys(activeData.finished).filter(
          (b) => Array.isArray(activeData.finished[b]) && activeData.finished[b].length > 0
        );
        if (availableBrands.length > 0) {
          setSelectedBrand("all");
        }
      }

      showToast("Success", "Report loaded successfully!", "success");

      // Fetch Manual Entry By Products (independent — failure doesn't block main report)
      try {
        const bpRes = await getByProductReport({
          fromdate: formatPayloadDate(fromDate),
          todate: formatPayloadDate(toDate),
        });
        if (bpRes && (bpRes.bags || bpRes.tonnage || bpRes.kg)) {
          setByProductAllUnitsData(bpRes);
          const activeUnit = parsed[unitType] ? unitType : 'tonnage';
          setByProductData(bpRes[activeUnit] || []);
          setByProductGrandTotal(bpRes[`grand_total_${activeUnit}`] || {});
        }
      } catch (_bpErr) {
        // By-product section stays empty — non-blocking
      }

    } catch (err) {
      let errorTitle = "Error";
      let errorMessage = "Failed to fetch production report";

      if (err.response) {
        if (err.response.status === 401) {
          errorTitle = "Authentication Error";
          errorMessage = "Your session has expired. Please login again.";
        } else if (err.response.status === 404) {
          errorTitle = "Not Found";
          errorMessage = "Production report endpoint not found.";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Server error (${err.response.status})`;
        }
      } else if (err.request) {
        errorTitle = "Connection Error";
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = err.message;
      }

      setData(null);
      setIsReportFullscreen(false);
      showToast(errorTitle, errorMessage, "error");

    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on initial mount (uses default 'today' date range)
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prepareChartData = () => {
    if (!data) return [];

    if (selectedCategory === "finished" || selectedCategory === "others") {
      const chartSourceData = selectedCategory === "others" ? finishedOthersData : finishedData;
      const chartBrands = selectedCategory === "others" ? othersBrands : brands;

      if (selectedBrand === "all") {
        return chartBrands.map((brand) => {
          const items = chartSourceData[brand] || [];

          return items.reduce(
            (acc, item) => {
              const metrics = getFinishedItemMetrics(item);
              return {
                name: brand,
                Opening: acc.Opening + metrics.opening,
                Production: acc.Production + metrics.production,
                Total: acc.Total + metrics.total,
                Dispatch: acc.Dispatch + metrics.dispatch,
                Returned: acc.Returned + metrics.returned,
                Closing: acc.Closing + metrics.closing,
              };
            },
            {
              name: brand,
              Opening: 0,
              Production: 0,
              Total: 0,
              Dispatch: 0,
              Returned: 0,
              Closing: 0,
            }
          );
        });
      }

      if (!selectedBrand || !chartSourceData[selectedBrand]) return [];
      const items = chartSourceData[selectedBrand];

      return items.map(item => {
        const metrics = getFinishedItemMetrics(item);
        return {
          name: item.description || "Unknown",
          Opening: metrics.opening,
          Production: metrics.production,
          Total: metrics.total,
          Dispatch: metrics.dispatch,
          Returned: metrics.returned,
          Closing: metrics.closing,
        };
      });
    }
    else if (selectedCategory === "raw") {
      const rawItems = rawData?.["All Raw Materials"] || [];

      return rawItems.map(item => {
        const metrics = getRawItemMetrics(item);
        return {
          name: item.description || "Unknown",
          Opening: metrics.opening,
          Arrival: metrics.arrival,
          Total: metrics.total,
          Used: metrics.used,
          Returned: metrics.returned,
          Closing: metrics.closing,
        };
      });
    }
    else if (selectedCategory === "byproducts") {
      const bpItems = byProductData || [];
      return bpItems.map(item => {
        const opening    = toNumber(item.opening);
        const production = toNumber(item.production);
        return {
          name:       item.description || item.code || "Unknown",
          Opening:    opening,
          Production: production,
          Total:      opening + production,
          Dispatch:   toNumber(item.dispatch),
          Closing:    toNumber(item.closing),
        };
      });
    }
    else if (selectedCategory === "packing") {
      const packingData = [];
      const source = packingProductionData || [];

      const friedGram = source.filter(item => item.category === "FRIED GRAM");
      friedGram.forEach(item => {
        packingData.push({
          name: `FG: ${item.description || "Unknown"}`,
          Production: toNumber(item["purchased/transfer in"]),
          category: "Fried Gram"
        });
      });

      const bengalGram = source.filter(item => item.category === "BENGAL GRAM");
      bengalGram.forEach(item => {
        packingData.push({
          name: `BG: ${item.description || "Unknown"}`,
          Production: toNumber(item["purchased/transfer in"]),
          category: "Bengal Gram"
        });
      });

      return packingData;
    }

    return [];
  };
  const getMetricLabel = () => {
    if (selectedCategory === "raw") {
      const rawMap = {
        opening: "Opening",
        arrival: "Arrival",
        total: "Total",
        used: "Used",
        returned: "Returned",
        closing: "Closing",
      };
      return rawMap[metricType] || "Opening";
    }

    if (selectedCategory === "byproducts") {
      const bpMap = {
        opening:    "Opening",
        production: "Production",
        total:      "Total",
        dispatch:   "Dispatch",
        closing:    "Closing",
      };
      return bpMap[metricType] || "Opening";
    }

    const finishedMap = {
      opening: "Opening",
      produced: "Production",
      arrival: "Arrival",
      total: "Total",
      dispatch: "Dispatch",
      returned: "Returned",
      closing: "Closing",
    };
    return finishedMap[metricType] || "Production";
  };

  const getChartColors = () => {
    const baseColors = [
      selectedAccent?.primary || '#2563eb',
      selectedAccent?.secondary || '#1e40af',
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#ec489a",
      "#6366f1",
      "#14b8a6",
    ];
    return baseColors;
  };

  const renderChart = () => {
    const chartData = prepareChartData();
    const colors = getChartColors();
    const metricLabel = getMetricLabel();
    const isMobile = window.innerWidth < 768;

    if (chartData.length === 0) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-bar-chart-line"></i>
          <p>No data available for the selected filters</p>
        </div>
      );
    }

    const isSingleMetric = ["finished", "others", "raw", "byproducts"].includes(selectedCategory) && metricType;
    const pieMetricKey = isSingleMetric ? metricLabel : "Production";
    const pieChartData = chartData.filter((item) => Number(item[pieMetricKey]) > 0);

    const negativeItems = chartData.filter(
      (item) => Number(item[pieMetricKey]) <= 0
    );

    const totalValue = pieChartData.reduce(
      (sum, item) => sum + Number(item[pieMetricKey] || 0),
      0
    );


    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: isMobile ? 40 : 60, bottom: 90 }
    };

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className={`${styles.tooltip} ${isDarkMode ? styles.tooltipDark : ''}`}>
            <strong>{label}</strong>
            {payload.map((entry, index) => (
              <div key={index} style={{ color: entry.color }}>
                {entry.name}: {formatIndianNumber(entry.value)}
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (chartType) {
      case "bar":
        return (

          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#e0e0e0'} />
              {/* <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={110} // Increased for long labels
                interval={0} // Show all labels
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
              /> */}

              <XAxis
                dataKey="name"
                tick={<CustomXAxisTick />}
                height={100}
              />


              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
                tickFormatter={(value) => formatIndianNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend />
              {isSingleMetric ? (
                <Bar dataKey={metricLabel} fill={colors[0]} name={metricLabel} radius={[4, 4, 0, 0]} />
              ) : (
                chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['name', 'category'].includes(key))
                  .map((key, index) => (
                    <Bar key={key} dataKey={key} fill={colors[index % colors.length]} name={key} radius={[4, 4, 0, 0]} />
                  ))
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#e0e0e0'} />
              {/* <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
              /> */}

              <XAxis
                dataKey="name"
                tick={<CustomXAxisTick />}
                height={100}
              />

              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
                tickFormatter={(value) => formatIndianNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend />
              {isSingleMetric ? (
                <Line type="monotone" dataKey={metricLabel} stroke={colors[0]} name={metricLabel} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ) : (
                chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['name', 'category'].includes(key))
                  .map((key, index) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} name={key} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  ))
              )}
            </LineChart>
          </ResponsiveContainer>
        );


case "pie": {
  if (pieChartData.length === 0) {
    return (
      <div className={styles.noDataMessage}>
        <i className="bi bi-pie-chart"></i>
        <p>No positive values available for pie chart</p>
      </div>
    );
  }

  const visiblePieData = pieChartData.filter(d => !hiddenPieNames.has(d.name));
  const visibleTotal   = visiblePieData.reduce((s, d) => s + Number(d[pieMetricKey] || 0), 0);
  const legendClr      = isDarkMode ? '#cbd5e1' : '#374151';

  const PieInsideLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (percent <= 0.03) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="600">
        {formatIndianNumber(value)}{'\n'}{(percent * 100).toFixed(0)}%
      </text>
    );
  };

  const renderPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    const val = Number(d[pieMetricKey] || 0);
    const pct = visibleTotal > 0 ? ((val / visibleTotal) * 100).toFixed(1) : '0';
    return (
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', minWidth: 130 }}>
        <div style={{ background: `linear-gradient(90deg, ${selectedAccent.primary}, ${selectedAccent.secondary})`, padding: '5px 10px', color: 'white', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
          {d.name}
        </div>
        <div style={{ padding: '6px 10px', color: isDarkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>
          {formatIndianNumber(val)} ({pct}%)
        </div>
      </div>
    );
  };

  return (
    <>
      {negativeItems.length > 0 && (
        <div style={{ fontSize: '12px', color: isDarkMode ? '#fbbf24' : '#b45309', marginBottom: '6px' }}>
          ⚠ Negative / zero values are excluded from pie chart
        </div>
      )}

      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chart */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visiblePieData}
                cx="50%" cy="50%"
                labelLine={false}
                label={PieInsideLabel}
                outerRadius={isMobile ? 60 : 130}
                innerRadius={0}
                dataKey={pieMetricKey}
                isAnimationActive
                animationDuration={500}
              >
                {visiblePieData.map((entry) => {
                  const origIdx = pieChartData.indexOf(entry);
                  return <Cell key={`cell-${entry.name}`} fill={colors[origIdx % colors.length]} />;
                })}
              </Pie>
              <Tooltip content={renderPieTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Clickable custom legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8, justifyContent: 'center', paddingBottom: 4 }}>
          {pieChartData.map((d, origIdx) => {
            const isHidden = hiddenPieNames.has(d.name);
            const color    = colors[origIdx % colors.length];
            const val      = Number(d[pieMetricKey] || 0);
            const pct      = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0';
            return (
              <div
                key={d.name}
                onClick={() => toggleHiddenPie(d.name)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', userSelect: 'none' }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 2, background: isHidden ? '#9ca3af' : color, flexShrink: 0, transition: 'background 0.2s' }} />
                <span style={{ textDecoration: isHidden ? 'line-through' : 'none', opacity: isHidden ? 0.45 : 1, color: legendClr, transition: 'all 0.2s' }}>
                  {d.name} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>

        {negativeItems.length > 0 && (
          <div style={{ paddingTop: '8px', textAlign: 'center', fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#555', flexShrink: 0 }}>
            <strong>Excluded Items:</strong>
            <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxHeight: '60px', overflowY: 'auto' }}>
              {negativeItems.map((item, index) => (
                <span key={index} style={{ margin: '4px 10px', whiteSpace: 'nowrap' }}>
                  • {item.name} ({formatIndianNumber(item[pieMetricKey])})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#e0e0e0'} />
              {/* <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
              /> */}

                <XAxis
                  dataKey="name"
                  tick={<CustomXAxisTick />}
                  height={100}
                />

              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
                tickFormatter={(value) => formatIndianNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend />
              {isSingleMetric ? (
                <Area type="monotone" dataKey={metricLabel} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} name={metricLabel} />
              ) : (
                chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['name', 'category'].includes(key))
                  .map((key, index) => (
                    <Area key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.6} name={key} />
                  ))
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className={styles.noDataMessage}>
            <p>Select a chart type</p>
          </div>
        );
    }
  };

  // Mobile Row Component
  const MobileRow = ({ label, value, highlight }) => (
    <div className={`${styles.mobileRow} ${highlight ? styles.mobileRowHighlight : ''}`}>
      <span>{label}</span>
      <span className={styles.mobileRowValue}>{value}</span>
    </div>
  );

  // Render Finished Goods Table (keep your existing working version)
  const renderFinishedGoodsTable = () => {
    const isMobile = window.innerWidth < 768;

    if (!data || !brands.length) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-inbox"></i>
          <p>No data available</p>
        </div>
      );
    }

    const grandTotals = calculateGrandTotals();

    if (isMobile) {
      let grand = { o: 0, p: 0, d: 0, r: 0, c: 0 };

      return (
        <div className={styles.mobileTableContainer}>
          {brands.map((cat) => {
            const items = finishedData[cat] || [];
            const sub = calcTotals(items);
            const pct = calcRoundedProdPercentage(items);

            grand.o += sub.o;
            grand.p += sub.p;
            grand.d += sub.d;
            grand.r += sub.r;
            grand.c += sub.c;

            return (
              <div key={cat} className={`${styles.mobileCard} ${isDarkMode ? styles.mobileCardDark : ''}`}>
                <div className={styles.mobileCardHeader} onClick={() => setCollapsedCats((p) => ({ ...p, [cat]: !p[cat] }))}>
                  <span className={styles.mobileCardTitle}>Sub Total - {cat}</span>
                  <motion.i
                    className="bi bi-chevron-down"
                    animate={{ rotate: collapsedCats[cat] ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                {!collapsedCats[cat] && (
                  <div className={styles.mobileCardBody}>
                    {items.map((i, idx) => (
                      <motion.div
                        key={idx}
                        className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: Math.min(idx, 12) * 0.035 }}
                      >
                        <div className={styles.mobileItemTitle}>{i.description}</div>
                        <MobileRow label="Opening" value={fmt(getFinishedItemMetrics(i).opening)} />
                        <MobileRow label="Production" value={fmt(getFinishedItemMetrics(i).production)} />
                        <MobileRow label="Total" value={fmt(getFinishedItemMetrics(i).total)} />
                        <MobileRow label="Dispatch" value={fmt(getFinishedItemMetrics(i).dispatch)} />
                        <MobileRow label="Returned" value={fmt(getFinishedItemMetrics(i).returned)} />
                        <MobileRow label="Closing" value={fmt(getFinishedItemMetrics(i).closing)} />
                        <MobileRow label="Prod %" value={formatPercentage(i.prod_percentage)} />
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className={styles.mobileCardFooter}>
                  <div className={styles.mobileCardFooterTitle}>Sub Total</div>
                  <MobileRow label="Opening" value={fmt(sub.o)} />
                  <MobileRow label="Production" value={fmt(sub.p)} />
                  <MobileRow label="Total" value={fmt(sub.o + sub.p)} />
                  <MobileRow label="Dispatch" value={fmt(sub.d)} />
                  <MobileRow label="Returned" value={fmt(sub.r)} />
                  <MobileRow label="Closing" value={fmt(sub.c)} />
                  <MobileRow label="Prod %" value={formatPercentage(pct)} />
                </div>
              </div>
            );
          })}

          <div className={`${styles.mobileCard} ${styles.grandTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - Finished Goods</div>
              <MobileRow label="Opening" value={formatIndianNumber(grand.o)} />
              <MobileRow label="Production" value={formatIndianNumber(grand.p)} />
              <MobileRow label="Total" value={formatIndianNumber(grand.o + grand.p)} />
              <MobileRow label="Dispatch" value={formatIndianNumber(grand.d)} />
              <MobileRow label="Returned" value={formatIndianNumber(grand.r)} />
              <MobileRow label="Closing" value={formatIndianNumber(grand.c)} />
              <MobileRow label="Prod %" value={formatPercentage(fgProdPercentage)} />
            </div>
          </div>
        </div>
      );
    }

    // Desktop version
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.tableCellArrow}></th>
              <th className={styles.tableCellDescription}>Fried Gram</th>
              <th className={styles.tableCellNumber}>Opening</th>
              <th className={styles.tableCellNumber}>Production</th>
              <th className={styles.tableCellNumber}>Total</th>
              <th className={styles.tableCellNumber}>Dispatch</th>
              <th className={styles.tableCellNumber}>Returned</th>
              <th className={styles.tableCellNumber}>Closing</th>
              <th className={styles.tableCellPercentage}>Prod %</th>
              </tr>
            </thead>
          <tbody>
            {brands.map((cat, brandIndex) => {
              const items = finishedData[cat] || [];
              const subtotal = items.reduce((acc, item) => {
                const metrics = getFinishedItemMetrics(item);
                return {
                  opening: acc.opening + metrics.opening,
                  produced: acc.produced + metrics.production,
                  total: acc.total + metrics.total,
                  dispatch: acc.dispatch + metrics.dispatch,
                  returned: acc.returned + metrics.returned,
                  closing: acc.closing + metrics.closing,
                };
              }, { opening: 0, produced: 0, total: 0, dispatch: 0, returned: 0, closing: 0 });

              const subtotalPercentage = calcRoundedProdPercentage(items);

              return (
                <React.Fragment key={cat}>
                  <tr
                    className={`${styles.tableRow} ${styles.tableSubTotalRow} ${brandIndex % 2 === 0 ? styles.tableSubTotalRowEven : styles.tableSubTotalRowOdd}`}
                    onClick={() => setCollapsedCats((p) => ({ ...p, [cat]: !p[cat] }))}
                  >
                    <td className={styles.tableCellArrow}>
                      <ThemedTooltip content={collapsedCats[cat] ? 'Expand' : 'Collapse'}>
                        <motion.i
                          className="bi bi-chevron-down"
                          animate={{ rotate: collapsedCats[cat] ? 0 : 180 }}
                          transition={{ duration: 0.2 }}
                        />
                      </ThemedTooltip>
                    </td>
                    <td className={`${styles.tableCellDescription} ${styles.tableCellBold}`}>
                      Sub Total - {cat}
                    </td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.opening)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.produced)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.total)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.dispatch)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.returned)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.closing)}</td>
                    <td className={styles.tableCellPercentage}>{formatPercentage(subtotalPercentage)}</td>
                  </tr>

                  {!collapsedCats[cat] && items.map((item, i) => (
                    <motion.tr
                      key={i}
                      className={`${styles.tableSubRow} ${i % 2 === 0 ? styles.tableSubRowEven : styles.tableSubRowOdd}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.035 }}
                    >
                      <td className={styles.tableCellArrow}></td>
                      <td className={`${styles.tableCellDescription} ${styles.tableCellIndented}`}>
                        {item.description || 'No Description'}
                      </td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).opening)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).production)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).total)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).dispatch)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).returned)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).closing)}</td>
                      <td className={styles.tableCellPercentage}>{formatPercentage(item.prod_percentage)}</td>
                    </motion.tr>
                  ))}
                </React.Fragment>
              );
            })}

            <tr className={styles.tableGrandTotal}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Finished Goods</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.production)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.total)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.dispatch)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.returned)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.closing)}</td>
              <td className={styles.tableCellPercentage}>{formatPercentage(calcRoundedProdPercentage(brands.flatMap(cat => finishedData[cat] || [])))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderOthersTable = () => {
    const isMobile = window.innerWidth < 768;

    if (!data || !othersBrands.length) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-inbox"></i>
          <p>No data available</p>
        </div>
      );
    }

    const grandTotals = calculateGrandTotals(finishedOthersData, othersBrands);

    if (isMobile) {
      let grand = { o: 0, p: 0, d: 0, r: 0, c: 0 };

      return (
        <div className={styles.mobileTableContainer}>
          {othersBrands.map((cat) => {
            const items = finishedOthersData[cat] || [];
            const sub = calcTotals(items);
            const pct = calcRoundedProdPercentage(items);
            const collapseKey = `others:${cat}`;

            grand.o += sub.o;
            grand.p += sub.p;
            grand.d += sub.d;
            grand.r += sub.r;
            grand.c += sub.c;

            return (
              <div key={cat} className={`${styles.mobileCard} ${isDarkMode ? styles.mobileCardDark : ''}`}>
                <div className={styles.mobileCardHeader} onClick={() => setCollapsedCats((p) => ({ ...p, [collapseKey]: !p[collapseKey] }))}>
                  <span className={styles.mobileCardTitle}>Sub Total - {cat}</span>
                  <motion.i
                    className="bi bi-chevron-down"
                    animate={{ rotate: collapsedCats[collapseKey] ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                {!collapsedCats[collapseKey] && (
                  <div className={styles.mobileCardBody}>
                    {items.map((i, idx) => (
                      <motion.div
                        key={idx}
                        className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: Math.min(idx, 12) * 0.035 }}
                      >
                        <div className={styles.mobileItemTitle}>{i.description}</div>
                        <MobileRow label="Opening" value={formatIndianNumber(getFinishedItemMetrics(i).opening)} />
                        <MobileRow label="Production" value={formatIndianNumber(getFinishedItemMetrics(i).production)} />
                        <MobileRow label="Total" value={formatIndianNumber(getFinishedItemMetrics(i).total)} />
                        <MobileRow label="Dispatch" value={formatIndianNumber(getFinishedItemMetrics(i).dispatch)} />
                        <MobileRow label="Returned" value={formatIndianNumber(getFinishedItemMetrics(i).returned)} />
                        <MobileRow label="Closing" value={formatIndianNumber(getFinishedItemMetrics(i).closing)} />
                        <MobileRow label="Prod %" value={formatPercentage(i.prod_percentage)} />
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className={styles.mobileCardFooter}>
                  <div className={styles.mobileCardFooterTitle}>Sub Total</div>
                  <MobileRow label="Opening" value={formatIndianNumber(sub.o)} />
                  <MobileRow label="Production" value={formatIndianNumber(sub.p)} />
                  <MobileRow label="Total" value={formatIndianNumber(sub.o + sub.p)} />
                  <MobileRow label="Dispatch" value={formatIndianNumber(sub.d)} />
                  <MobileRow label="Returned" value={formatIndianNumber(sub.r)} />
                  <MobileRow label="Closing" value={formatIndianNumber(sub.c)} />
                  <MobileRow label="Prod %" value={formatPercentage(pct)} />
                </div>
              </div>
            );
          })}

          <div className={`${styles.mobileCard} ${styles.othersTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - By Products and Packing Section Material</div>
              <MobileRow label="Opening" value={formatIndianNumber(grand.o)} />
              <MobileRow label="Production" value={formatIndianNumber(grand.p)} />
              <MobileRow label="Total" value={formatIndianNumber(grand.o + grand.p)} />
              <MobileRow label="Dispatch" value={formatIndianNumber(grand.d)} />
              <MobileRow label="Returned" value={formatIndianNumber(grand.r)} />
              <MobileRow label="Closing" value={formatIndianNumber(grand.c)} />
              <MobileRow label="Prod %" value={formatPercentage(othersProdPercentage)} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.tableCellArrow}></th>
              <th className={styles.tableCellDescription}>By Products and Packing Section Material</th>
              <th className={styles.tableCellNumber}>Opening</th>
              <th className={styles.tableCellNumber}>Production</th>
              <th className={styles.tableCellNumber}>Total</th>
              <th className={styles.tableCellNumber}>Dispatch</th>
              <th className={styles.tableCellNumber}>Returned</th>
              <th className={styles.tableCellNumber}>Closing</th>
              <th className={styles.tableCellPercentage}>Prod %</th>
            </tr>
          </thead>
          <tbody>
            {othersBrands.map((cat, brandIndex) => {
              const items = finishedOthersData[cat] || [];
              const subtotal = items.reduce((acc, item) => {
                const metrics = getFinishedItemMetrics(item);
                return {
                  opening: acc.opening + metrics.opening,
                  produced: acc.produced + metrics.production,
                  total: acc.total + metrics.total,
                  dispatch: acc.dispatch + metrics.dispatch,
                  returned: acc.returned + metrics.returned,
                  closing: acc.closing + metrics.closing,
                };
              }, { opening: 0, produced: 0, total: 0, dispatch: 0, returned: 0, closing: 0 });

              const subtotalPercentage = calcRoundedProdPercentage(items);
              const collapseKey = `others:${cat}`;

              return (
                <React.Fragment key={cat}>
                  <tr
                    className={`${styles.tableRow} ${styles.tableSubTotalRow} ${brandIndex % 2 === 0 ? styles.tableSubTotalRowEven : styles.tableSubTotalRowOdd}`}
                    onClick={() => setCollapsedCats((p) => ({ ...p, [collapseKey]: !p[collapseKey] }))}
                  >
                    <td className={styles.tableCellArrow}>
                      <ThemedTooltip content={collapsedCats[collapseKey] ? 'Expand' : 'Collapse'}>
                        <motion.i
                          className="bi bi-chevron-down"
                          animate={{ rotate: collapsedCats[collapseKey] ? 0 : 180 }}
                          transition={{ duration: 0.2 }}
                        />
                      </ThemedTooltip>
                    </td>
                    <td className={`${styles.tableCellDescription} ${styles.tableCellBold}`}>
                      Sub Total - {cat}
                    </td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.opening)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.produced)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.total)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.dispatch)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.returned)}</td>
                    <td className={styles.tableCellNumber}>{dimProd(subtotal.closing)}</td>
                    <td className={styles.tableCellPercentage}>{formatPercentage(subtotalPercentage)}</td>
                  </tr>

                  {!collapsedCats[collapseKey] && items.map((item, i) => (
                    <motion.tr
                      key={i}
                      className={`${styles.tableSubRow} ${i % 2 === 0 ? styles.tableSubRowEven : styles.tableSubRowOdd}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.035 }}
                    >
                      <td className={styles.tableCellArrow}></td>
                      <td className={`${styles.tableCellDescription} ${styles.tableCellIndented}`}>
                        {item.description || 'No Description'}
                      </td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).opening)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).production)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).total)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).dispatch)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).returned)}</td>
                      <td className={styles.tableCellNumber}>{dimProd(getFinishedItemMetrics(item).closing)}</td>
                      <td className={styles.tableCellPercentage}>{formatPercentage(item.prod_percentage)}</td>
                    </motion.tr>
                  ))}
                </React.Fragment>
              );
            })}

            <tr className={styles.tableGrandTotalOthers}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - By Products and Packing Section Material</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.production)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.total)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.dispatch)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.returned)}</td>
              <td className={styles.tableCellNumber}>{dimProd(grandTotals.closing)}</td>
              <td className={styles.tableCellPercentage}>{formatPercentage(calcRoundedProdPercentage(othersBrands.flatMap(cat => finishedOthersData[cat] || [])))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderByProductsTable = () => {
    const isMobile = window.innerWidth < 768;
    const items = byProductData || [];
    const gt = byProductGrandTotal || {};

    if (!items.length) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-inbox"></i>
          <p>No data available</p>
        </div>
      );
    }

    const gtOpening    = toNumber(gt.totalOpening);
    const gtProduction = toNumber(gt.totalProduction);
    const gtTotal      = gtOpening + gtProduction;
    const gtDispatch   = toNumber(gt.totalDispatch);
    const gtClosing    = toNumber(gt.totalClosing);

    if (isMobile) {
      return (
        <div className={styles.mobileTableContainer}>
          {items.map((item, idx) => {
            const opening    = toNumber(item.opening);
            const production = toNumber(item.production);
            return (
              <motion.div
                key={idx}
                className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(idx, 12) * 0.035 }}
              >
                <div className={styles.mobileItemTitle}>{item.description || item.code}</div>
                <MobileRow label="Opening"    value={formatIndianNumber(opening)} />
                <MobileRow label="Production" value={formatIndianNumber(production)} />
                <MobileRow label="Total"      value={formatIndianNumber(opening + production)} />
                <MobileRow label="Dispatch"   value={formatIndianNumber(toNumber(item.dispatch))} />
                <MobileRow label="Closing"    value={formatIndianNumber(toNumber(item.closing))} />
              </motion.div>
            );
          })}
          <div className={`${styles.mobileCard} ${styles.rawTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - Manual Entry By Products</div>
              <MobileRow label="Opening"    value={formatIndianNumber(gtOpening)} />
              <MobileRow label="Production" value={formatIndianNumber(gtProduction)} />
              <MobileRow label="Total"      value={formatIndianNumber(gtTotal)} />
              <MobileRow label="Dispatch"   value={formatIndianNumber(gtDispatch)} />
              <MobileRow label="Closing"    value={formatIndianNumber(gtClosing)} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable} style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className={styles.tableCellArrow}></th>
              <th className={styles.tableCellDescription}>Manual By Products</th>
              <th className={styles.tableCellNumber} style={{ width: 164 }}>Opening</th>
              <th className={styles.tableCellNumber} style={{ width: 164 }}>Production</th>
              <th className={styles.tableCellNumber} style={{ width: 164 }}>Total</th>
              <th className={styles.tableCellNumber} style={{ width: 164 }}>Dispatch</th>
              <th className={styles.tableCellNumber} style={{ width: 164 }}>Closing</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const opening    = toNumber(item.opening);
              const production = toNumber(item.production);
              return (
                <tr key={i} className={i % 2 === 0 ? styles.tableRowEven : ''}>
                  <td className={styles.tableCellArrow}></td>
                  <td className={styles.tableCellDescription}>{item.description || item.code || '—'}</td>
                  <td className={styles.tableCellNumber}>{dimProd(opening)}</td>
                  <td className={styles.tableCellNumber}>{dimProd(production)}</td>
                  <td className={styles.tableCellNumber}>{dimProd(opening + production)}</td>
                  <td className={styles.tableCellNumber}>{dimProd(toNumber(item.dispatch))}</td>
                  <td className={styles.tableCellNumber}>{dimProd(toNumber(item.closing))}</td>
                </tr>
              );
            })}
            <tr className={styles.tableGrandTotalRaw}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Manual Entry By Products</td>
              <td className={styles.tableCellNumber}>{dimProd(gtOpening)}</td>
              <td className={styles.tableCellNumber}>{dimProd(gtProduction)}</td>
              <td className={styles.tableCellNumber}>{dimProd(gtTotal)}</td>
              <td className={styles.tableCellNumber}>{dimProd(gtDispatch)}</td>
              <td className={styles.tableCellNumber}>{dimProd(gtClosing)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Raw Materials Table (keep your existing working version)
  const renderRawMaterialsTable = () => {
    const isMobile = window.innerWidth < 768;

    if (!rawData?.["All Raw Materials"] || rawData["All Raw Materials"].length === 0) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-database"></i>
          <p>No data available</p>
        </div>
      );
    }

    const rawItems = rawData["All Raw Materials"] || [];
    const rawTotals = rawItems.reduce((acc, item) => {
      const metrics = getRawItemMetrics(item);
      return {
        opening: acc.opening + metrics.opening,
        arrival: acc.arrival + metrics.arrival,
        used: acc.used + metrics.used,
        returned: acc.returned + metrics.returned,
        closing: acc.closing + metrics.closing,
      };
    }, { opening: 0, arrival: 0, used: 0, returned: 0, closing: 0 });
    rawTotals.total = rawTotals.opening + rawTotals.arrival;

    if (isMobile) {
      return (
        <div className={styles.mobileTableContainer}>
          {rawItems.map((item, idx) => (
            <div key={idx} className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}>
              <div className={styles.mobileItemTitle}>{item.description}</div>
              <MobileRow label="Opening" value={formatIndianNumber(getRawItemMetrics(item).opening)} />
              <MobileRow label="Arrival" value={formatIndianNumber(toNumber(item["purchased/transfer in"]))} />
              <MobileRow label="Total" value={formatIndianNumber(getRawItemMetrics(item).total)} />
              <MobileRow label="Used" value={formatIndianNumber(getRawItemMetrics(item).used)} />
              <MobileRow label="Returned" value={formatIndianNumber(getRawItemMetrics(item).returned)} />
              <MobileRow label="Closing" value={formatIndianNumber(getRawItemMetrics(item).closing)} />
            </div>
          ))}

          <div className={`${styles.mobileCard} ${styles.rawTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - Raw Materials</div>
              <MobileRow label="Opening" value={formatIndianNumber(rawTotals.opening)} />
              <MobileRow label="Arrival" value={formatIndianNumber(rawTotals.arrival)} />
              <MobileRow label="Total" value={formatIndianNumber(rawTotals.total)} />
              <MobileRow label="Used" value={formatIndianNumber(rawTotals.used)} />
              <MobileRow label="Returned" value={formatIndianNumber(rawTotals.returned)} />
              <MobileRow label="Closing" value={formatIndianNumber(rawTotals.closing)} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable} style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className={styles.tableCellArrow}></th>
              <th className={styles.tableCellDescription}>Raw Material</th>
              <th className={styles.tableCellNumber} style={{ width: 137 }}>Opening</th>
              <th className={styles.tableCellNumber} style={{ width: 137 }}>Arrival</th>
              <th className={styles.tableCellNumber} style={{ width: 137 }}>Total</th>
              <th className={styles.tableCellNumber} style={{ width: 137 }}>Used</th>
              <th className={styles.tableCellNumber} style={{ width: 137 }}>Returned</th>
              <th className={styles.tableCellNumber} style={{ width: 137 }}>Closing</th>
            </tr>
          </thead>
          <tbody>
            {rawItems.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? styles.tableRowEven : ''}>
                <td className={styles.tableCellArrow}></td>
                <td className={styles.tableCellDescription}>{item.description || 'No Description'}</td>
                <td className={styles.tableCellNumber}>{dimProd(getRawItemMetrics(item).opening)}</td>
                <td className={styles.tableCellNumber}>{dimProd(toNumber(item["purchased/transfer in"]))}</td>
                <td className={styles.tableCellNumber}>{dimProd(getRawItemMetrics(item).total)}</td>
                <td className={styles.tableCellNumber}>{dimProd(getRawItemMetrics(item).used)}</td>
                <td className={styles.tableCellNumber}>{dimProd(getRawItemMetrics(item).returned)}</td>
                <td className={styles.tableCellNumber}>{dimProd(getRawItemMetrics(item).closing)}</td>
              </tr>
            ))}
            <tr className={styles.tableGrandTotalRaw}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Raw Materials</td>
              <td className={styles.tableCellNumber}>{dimProd(rawTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{dimProd(rawTotals.arrival)}</td>
              <td className={styles.tableCellNumber}>{dimProd(rawTotals.total)}</td>
              <td className={styles.tableCellNumber}>{dimProd(rawTotals.used)}</td>
              <td className={styles.tableCellNumber}>{dimProd(rawTotals.returned)}</td>
              <td className={styles.tableCellNumber}>{dimProd(rawTotals.closing)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderProductionRatioTable = () => {
    const unitLabelMap = { bags: 'Bags', tonnage: 'Tonnage', kg: 'KG' };
    const unitLabel = unitLabelMap[unitType] || 'KG';

    const rawItems = rawData?.["All Raw Materials"] || [];
    const gram100KGItem = rawItems.find(
      (item) => item.description?.toUpperCase().trim() === "GRAM 100 KG"
    );
    const gram100KGUsed = gram100KGItem ? getRawItemMetrics(gram100KGItem).used : 0;

    const gramBrokenItem = othersBrands
      .flatMap((cat) => finishedOthersData[cat] || [])
      .find((item) => item.description?.toUpperCase().includes("GRAM BROKEN"));
    const gramBrokenQty = gramBrokenItem ? getFinishedItemMetrics(gramBrokenItem).production : null;

    const gramHuskPackingItem = (byProductData || []).find(
      (item) => item.description?.toUpperCase().includes("GRAM HUSK PACKING")
    );
    const gramHuskPackingQty = gramHuskPackingItem ? toNumber(gramHuskPackingItem.production) : null;

    const calcPct = (qty) =>
      gram100KGUsed > 0 ? ((qty / gram100KGUsed) * 100).toFixed(2) + "%" : "-";

    const makeTooltip = (label, qty) =>
      gram100KGUsed > 0
        ? `${label} (${formatIndianNumber(qty)}) / GRAM 100 KG Raw Materials Usage (${formatIndianNumber(gram100KGUsed)}) × 100 = ${calcPct(qty)}`
        : `GRAM 100 KG usage not available`;

    const makeQtyLabel = (label) => `${label} Qty in ${unitLabel}`;

    const rows = [
      {
        name: "Finished Goods",
        qty: fgProduction,
        hasData: true,
        qtyLabel: makeQtyLabel("Finished Goods"),
        pctTooltip: makeTooltip(`Finished Goods Qty in ${unitLabel}`, fgProduction),
      },
      {
        name: "Gram Husk Packing 18KG",
        qty: gramHuskPackingQty,
        hasData: gramHuskPackingQty !== null,
        qtyLabel: makeQtyLabel("Gram Husk Packing 18KG"),
        pctTooltip: gramHuskPackingQty !== null
          ? makeTooltip(`Gram Husk Packing 18KG Qty in ${unitLabel}`, gramHuskPackingQty)
          : "",
      },
      {
        name: "Fried Gram Chikal",
        qty: null,
        hasData: false,
      },
      {
        name: "Fried Gram Broken",
        qty: gramBrokenQty,
        hasData: gramBrokenQty !== null,
        qtyLabel: makeQtyLabel("Fried Gram Broken"),
        pctTooltip: gramBrokenQty !== null
          ? makeTooltip(`Fried Gram Broken Qty in ${unitLabel}`, gramBrokenQty)
          : "",
      },
      {
        name: "Fried Gram Powder",
        qty: null,
        hasData: false,
      },
    ];

    const totalQty = rows.reduce((sum, row) => sum + (row.hasData ? (row.qty || 0) : 0), 0);
    const totalPct = gram100KGUsed > 0 ? ((totalQty / gram100KGUsed) * 100).toFixed(2) + "%" : "-";

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.tableCellDescription} style={{ width: "60%" }}>Item</th>
              <th className={styles.tableCellNumber}>Qty in {unitLabel}</th>
              <th className={styles.tableCellNumber}>Production %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`${styles.tableSubRow} ${i % 2 === 0 ? styles.tableSubRowEven : styles.tableSubRowOdd}`}
              >
                <td className={`${styles.tableCellDescription} ${styles.tableCellBold}`}>{row.name}</td>
                <td className={styles.tableCellNumber}>
                  {row.hasData ? (
                    <ThemedTooltip content={row.qtyLabel}>
                      <span>{formatIndianNumber(row.qty)}</span>
                    </ThemedTooltip>
                  ) : "-"}
                </td>
                <td className={styles.tableCellNumber}>
                  {row.hasData ? (
                    <ThemedTooltip content={row.pctTooltip} header="Production %">
                      <span>{calcPct(row.qty)}</span>
                    </ThemedTooltip>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.tableGrandTotal}>
              <td className={styles.tableCellDescription}>Total</td>
              <td className={styles.tableCellNumber}>{dimProd(totalQty)}</td>
              <td className={styles.tableCellNumber}>{totalPct}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // Render Packing Table (keep your existing working version)
  const renderPackingTable = () => {
    const isMobile = window.innerWidth < 768;

    const packingData = packingProductionData || [];

    const friedGram = packingData.filter(
      item => item.category === "FRIED GRAM"
    );

    const bengalGram = packingData.filter(
      item => item.category === "BENGAL GRAM"
    );


    // const friedGram = data?.finished?.["FRIED GRAM"] || [];
    // const bengalGram = data?.finished?.["BENGAL GRAM"] || [];

    if (friedGram.length === 0 && bengalGram.length === 0) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-box"></i>
          <p>No data available</p>
        </div>
      );
    }

    const friedGramTotal = friedGram.reduce((sum, i) => sum + (i["purchased/transfer in"] || 0), 0);
    const bengalGramTotal = bengalGram.reduce((sum, i) => sum + (i["purchased/transfer in"] || 0), 0);

    if (isMobile) {
      return (
        <div className={styles.mobileTableContainer}>
          {friedGram.length > 0 && (
            <div className={`${styles.mobileCard} ${isDarkMode ? styles.mobileCardDark : ''}`}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileCardTitle}>Fried Gram</span>
              </div>
              <div className={styles.mobileCardBody}>
                {friedGram.map((item, idx) => (
                  <div key={idx} className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}>
                    <div className={styles.mobileItemTitle}>{item.description}</div>
                    <MobileRow label="Production" value={fmt(toNumber(item["purchased/transfer in"]))} />
                  </div>
                ))}
                <div className={styles.mobileCardFooter}>
                  <div className={styles.mobileCardFooterTitle}>Sub Total: {fmt(friedGramTotal)}</div>
                </div>
              </div>
            </div>
          )}

          {bengalGram.length > 0 && (
            <div className={`${styles.mobileCard} ${isDarkMode ? styles.mobileCardDark : ''}`}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileCardTitle}>Bengal Gram</span>
              </div>
              <div className={styles.mobileCardBody}>
                {bengalGram.map((item, idx) => (
                  <div key={idx} className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}>
                    <div className={styles.mobileItemTitle}>{item.description}</div>
                    <MobileRow label="Production" value={fmt(toNumber(item["purchased/transfer in"]))} />
                  </div>
                ))}
                <div className={styles.mobileCardFooter}>
                  <div className={styles.mobileCardFooterTitle}>Sub Total: {fmt(bengalGramTotal)}</div>
                </div>
              </div>
            </div>
          )}

          <div className={`${styles.mobileCard} ${styles.packingTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - Packing</div>
              <MobileRow label="Fried Gram" value={fmt(friedGramTotal)} />
              <MobileRow label="Bengal Gram" value={fmt(bengalGramTotal)} />
              <div className={styles.mobileCardTotal}>Total: {formatIndianNumber(friedGramTotal + bengalGramTotal)}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.tableCellArrow}></th>
              <th className={styles.tableCellDescription}>Packing Item</th>
              <th className={styles.tableCellNumber}>Production</th>
              </tr>
            </thead>
          <tbody>
            {friedGram.map((item, i) => (
              <tr key={`fried-${i}`}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>{item.description || 'No Description'}</td>
                <td className={styles.tableCellNumber}>{dimProd(toNumber(item["purchased/transfer in"]))}</td>
              </tr>
            ))}
            {friedGram.length > 0 && (
              <tr className={styles.tableSubTotal}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>Sub Total - FRIED GRAM</td>
                <td className={styles.tableCellNumber}>{dimProd(friedGramTotal)}</td>
              </tr>
            )}
            {bengalGram.map((item, i) => (
              <tr key={`bengal-${i}`}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>{item.description || 'No Description'}</td>
                <td className={styles.tableCellNumber}>{dimProd(toNumber(item["purchased/transfer in"]))}</td>
              </tr>
            ))}
            {bengalGram.length > 0 && (
              <tr className={styles.tableSubTotal}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>Sub Total - BENGAL GRAM</td>
                <td className={styles.tableCellNumber}>{dimProd(bengalGramTotal)}</td>
              </tr>
            )}
            <tr className={styles.tableGrandTotalPacking}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Packing</td>
              <td className={styles.tableCellNumber}>{dimProd(friedGramTotal + bengalGramTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}
      style={{
        "--production-accent": selectedAccent.primary,
        "--production-accent-strong": selectedAccent.secondary,
        "--production-accent-soft": selectedAccent.soft,
        "--production-accent-glow": selectedAccent.glow,
        "--production-finished-start": selectedAccent.primary,
        "--production-finished-end": selectedAccent.secondary,
        // dark navy base — accent stays dominant, muted/grounded shade
        "--production-others-start": `color-mix(in srgb, ${selectedAccent.primary} 80%, #1e293b)`,
        "--production-others-end": `color-mix(in srgb, ${selectedAccent.secondary} 75%, #0f172a)`,
        // dark forest base — accent dominant, subtly cooler/deeper
        "--production-raw-start": `color-mix(in srgb, ${selectedAccent.primary} 76%, #14532d)`,
        "--production-raw-end": `color-mix(in srgb, ${selectedAccent.secondary} 71%, #052e16)`,
        // dark violet base — accent dominant, subtly deeper cool
        "--production-packing-start": `color-mix(in srgb, ${selectedAccent.primary} 78%, #3b0764)`,
        "--production-packing-end": `color-mix(in srgb, ${selectedAccent.secondary} 73%, #2e1065)`,
        // dark warm-brown base — accent dominant, subtly warmer
        "--production-chart-start": `color-mix(in srgb, ${selectedAccent.primary} 74%, #431407)`,
        "--production-chart-end": `color-mix(in srgb, ${selectedAccent.secondary} 69%, #3c0f05)`,
        // dark neutral-warm base — distinct from chart, still accent-dominant
        "--production-ratio-start": `color-mix(in srgb, ${selectedAccent.primary} 79%, #292524)`,
        "--production-ratio-end": `color-mix(in srgb, ${selectedAccent.secondary} 74%, #1c1917)`,
        "--production-display-font": selectedFont.display,
        "--production-body-font": selectedFont.body,
      }}
    >
      {/* Header */}
      {!isReportFullscreen && (
        <div className={styles.headerSection}>
          {/* <h1 className={styles.title}>Fried Gram Production Report</h1> */}
          <p className={styles.subtitle}>
            Real-time data on raw material consumption, finished goods, and packing efficiency
          </p>
        </div>
      )}

      {!isReportFullscreen && (
        <SummaryCardsSystem
          context="production"
          productionData={data}
          accent={selectedAccent.primary}
          accent2={selectedAccent.secondary}
        />
      )}

      {!isReportFullscreen && (
        <div className={styles.productionTabBar}>
          {PRODUCTION_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`${styles.productionTabButton} ${
                activeProductionTab === tab.id ? styles.productionTabButtonActive : ""
              }`}
              onClick={() => setActiveProductionTab(tab.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      )}

      <div className={styles.reportActionRow}>
        <button
          type="button"
          className={styles.mobileFilterToggle}
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
        >
          <span>
            <i className="bi bi-sliders"></i>
            {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </span>
          <i className={`bi ${mobileFiltersOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
        </button>

        {data && !isReportFullscreen && (
          <ThemedTooltip content="Enter full screen">
            <button
              type="button"
              onClick={toggleReportFullscreen}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0.38rem 0.85rem',
                borderRadius: 8,
                border: `1px solid ${selectedAccent.primary}`,
                background: isDarkMode ? '#1e293b' : '#fff',
                color: selectedAccent.primary,
                fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="bi bi-arrows-fullscreen" style={{ fontSize: '0.82rem' }} />
              Full Screen
            </button>
          </ThemedTooltip>
        )}

        {isReportFullscreen && (
          <button
            type="button"
            onClick={toggleReportFullscreen}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.42rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: selectedAccent.primary,
              color: '#fff',
              fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(0,0,0,0.28)',
              whiteSpace: 'nowrap',
            }}
          >
            <i className="bi bi-fullscreen-exit" style={{ fontSize: '0.82rem' }} />
            Close Full Screen
          </button>
        )}
      </div>

      <div
        ref={filterBarRef}
        className={`${styles.filterBar} ${isFilterSticky ? styles.filterBarSticky : ''} ${!mobileFiltersOpen ? styles.filterBarCollapsed : ''}`}
      >
        <div className={styles.filterGrid}>
          {/* Category Group */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            whileHover={{ y: -2 }}
          >
            <label className={styles.filterLabel}>
              <i className="bi bi-tags"></i> Category Group
            </label>
            <AppSelect
              value={catGroup}
              onChange={setCatGroup}
              options={[{ value: "Fried Gram Mill", label: "Fried Gram Mill" }]}
            />
          </motion.div>

          {/* Data View */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            whileHover={{ y: -2 }}
          >
            <label className={styles.filterLabel}>
              <i className="bi bi-layers"></i> Data View
            </label>
            <AppSelect
              value={dataView}
              onChange={setDataView}
              options={[
                { value: "produced", label: "Produced Items" },
                { value: "unproduced", label: "Unproduced Items" },
                { value: "all", label: "All Items" },
              ]}
            />
          </motion.div>
          {/* Period Type */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            whileHover={{ y: -2 }}
          >
            <label className={styles.filterLabel}>
              <i className="bi bi-calendar-range"></i> Period
            </label>
            <AppSelect
              value={periodType}
              onChange={setPeriodType}
              options={[
                { value: 'today',         label: 'Today' },
                { value: 'yesterday',     label: 'Yesterday' },
                { value: 'thisweek',      label: 'This Week' },
                { value: 'thismonth',     label: 'This Month' },
                { value: 'lastmonth',     label: 'Last Month' },
                { value: 'quarter',       label: 'Quarter' },
                { value: 'financialyear', label: 'Financial Year' },
                { value: 'year',          label: 'Year' },
                { value: 'month',         label: 'Month' },
                { value: 'custom',        label: 'Custom Range' },
              ]}
            />
          </motion.div>

          {/* Quarter sub-selectors */}
          {periodType === 'quarter' && (
            <>
              <motion.div className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}>
                <label className={styles.filterLabel}>
                  <i className="bi bi-pie-chart"></i> Quarter Type
                </label>
                <AppSelect
                  value={quarterType}
                  onChange={(val) => { setQuarterType(val); setSelectedQuarter('Q1'); }}
                  options={[
                    { value: 'financial', label: 'Financial Year Quarter (Apr–Mar)' },
                    { value: 'calendar',  label: 'Calendar Year Quarter (Jan–Dec)' },
                  ]}
                />
              </motion.div>

              <motion.div className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}>
                <label className={styles.filterLabel}>
                  <i className="bi bi-calendar2"></i> {quarterType === 'financial' ? 'FY Start Year' : 'Year'}
                </label>
                <AppSelect
                  value={selectedQYear}
                  onChange={setSelectedQYear}
                  options={(() => {
                    const curr = new Date().getFullYear();
                    return Array.from({ length: 10 }, (_, i) => ({
                      value: String(curr - i),
                      label: quarterType === 'financial'
                        ? `FY ${curr - i}–${(curr - i + 1).toString().slice(-2)}`
                        : String(curr - i),
                    }));
                  })()}
                />
              </motion.div>

              <motion.div className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}>
                <label className={styles.filterLabel}>
                  <i className="bi bi-pie-chart"></i> Quarter
                </label>
                <AppSelect
                  value={selectedQuarter}
                  onChange={setSelectedQuarter}
                  options={quarterType === 'financial' ? [
                    { value: 'Q1', label: 'Q1 (Apr – Jun)' },
                    { value: 'Q2', label: 'Q2 (Jul – Sep)' },
                    { value: 'Q3', label: 'Q3 (Oct – Dec)' },
                    { value: 'Q4', label: 'Q4 (Jan – Mar)' },
                  ] : [
                    { value: 'Q1', label: 'Q1 (Jan – Mar)' },
                    { value: 'Q2', label: 'Q2 (Apr – Jun)' },
                    { value: 'Q3', label: 'Q3 (Jul – Sep)' },
                    { value: 'Q4', label: 'Q4 (Oct – Dec)' },
                  ]}
                />
              </motion.div>
            </>
          )}

          {/* Financial Year sub-selector */}
          {periodType === 'financialyear' && (
            <motion.div className={styles.filterItem}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              whileHover={{ y: -2 }}>
              <label className={styles.filterLabel}>
                <i className="bi bi-calendar2-range"></i> Financial Year
              </label>
              <AppSelect
                value={selectedFY}
                onChange={setSelectedFY}
                options={(() => {
                  const curr = new Date().getFullYear();
                  const currFY = new Date().getMonth() >= 3 ? curr : curr - 1;
                  return Array.from({ length: 10 }, (_, i) => {
                    const fy = currFY - i;
                    return { value: String(fy), label: `FY ${fy}–${(fy + 1).toString().slice(-2)}` };
                  });
                })()}
              />
            </motion.div>
          )}

          {/* Year sub-selector */}
          {periodType === 'year' && (
            <motion.div
              className={styles.filterItem}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -2 }}
            >
              <label className={styles.filterLabel}>
                <i className="bi bi-calendar2"></i> Year
              </label>
              <AppSelect
                value={selectedYear}
                onChange={setSelectedYear}
                options={(() => {
                  const curr = new Date().getFullYear();
                  return Array.from({ length: 10 }, (_, i) => {
                    const y = String(curr - i);
                    return { value: y, label: y };
                  });
                })()}
              />
            </motion.div>
          )}

          {/* Month sub-selectors */}
          {periodType === 'month' && (
            <>
              <motion.div className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}>
                <label className={styles.filterLabel}>
                  <i className="bi bi-calendar2"></i> Year
                </label>
                <AppSelect
                  value={selectedMonthYear}
                  onChange={setSelectedMonthYear}
                  options={(() => {
                    const curr = new Date().getFullYear();
                    return Array.from({ length: 10 }, (_, i) => ({
                      value: String(curr - i), label: String(curr - i),
                    }));
                  })()}
                />
              </motion.div>

              <motion.div className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}>
                <label className={styles.filterLabel}>
                  <i className="bi bi-calendar3"></i> Month
                </label>
                <AppSelect
                  value={selectedMonthVal}
                  onChange={setSelectedMonthVal}
                  options={[
                    { value: '01', label: 'January'   },
                    { value: '02', label: 'February'  },
                    { value: '03', label: 'March'     },
                    { value: '04', label: 'April'     },
                    { value: '05', label: 'May'       },
                    { value: '06', label: 'June'      },
                    { value: '07', label: 'July'      },
                    { value: '08', label: 'August'    },
                    { value: '09', label: 'September' },
                    { value: '10', label: 'October'   },
                    { value: '11', label: 'November'  },
                    { value: '12', label: 'December'  },
                  ]}
                />
              </motion.div>
            </>
          )}

          {/* Custom Range — two date pickers */}
          {periodType === 'custom' && (
            <>
              <motion.div
                className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <label className={styles.filterLabel}>
                  <i className="bi bi-calendar3"></i> From Date
                </label>
                <AppDatePicker
                  value={customFrom}
                  onChange={setCustomFrom}
                  max={customTo}
                />
              </motion.div>

              <motion.div
                className={styles.filterItem}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <label className={styles.filterLabel}>
                  <i className="bi bi-calendar3"></i> To Date
                </label>
                <AppDatePicker
                  value={customTo}
                  onChange={setCustomTo}
                  min={customFrom}
                />
              </motion.div>
            </>
          )}

          {/* Generate Button */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            {periodType !== 'custom' && (
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--production-accent)',
                marginBottom: 4,
                textAlign: 'center',
                opacity: 0.8,
              }}>
                {fromDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' → '}
                {toDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            )}
            <motion.button
              className={styles.generateBtn}
              onClick={fetchReport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Generating...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat"></i>
                  Generate
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Unit Toggle — shown after data is loaded */}
      <AnimatePresence>
        {allUnitsData && (
          <motion.div
            key="unit-toggle"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              margin: '14px 0 6px',
              padding: '10px 16px',
              borderRadius: 12,
              background: isDarkMode ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              flexWrap: 'wrap',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
              color: isDarkMode ? '#94a3b8' : '#64748b',
              textTransform: 'uppercase', marginRight: 4,
            }}>
              View Unit
            </span>
            {[
              { key: 'tonnage', label: 'Tonnage', icon: 'bi-stack'   },
              { key: 'bags',    label: 'Bags',    icon: 'bi-bag'     },
              { key: 'kg',      label: 'Kg',      icon: 'bi-speedometer2' },
            ].map(({ key, label, icon }, idx) => {
              const isActive = unitType === key;
              return (
                <ThemedTooltip key={key} content={`Switch to ${label}`}>
                <motion.button
                  onClick={() => {
                    setUnitType(key);
                    setData(allUnitsData[key]);
                    if (byProductAllUnitsData) {
                      setByProductData(byProductAllUnitsData[key] || []);
                      setByProductGrandTotal(byProductAllUnitsData[`grand_total_${key}`] || {});
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.22, delay: idx * 0.06 }}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 16px',
                    borderRadius: 20,
                    border: `1.5px solid ${isActive ? selectedAccent.primary : (isDarkMode ? '#475569' : '#cbd5e1')}`,
                    background: isActive
                      ? `linear-gradient(90deg, ${selectedAccent.primary}, ${selectedAccent.secondary})`
                      : (isDarkMode ? '#0f172a' : '#fff'),
                    color: isActive ? '#fff' : (isDarkMode ? '#94a3b8' : '#475569'),
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                    boxShadow: isActive ? `0 3px 10px ${selectedAccent.primary}44` : 'none',
                  }}
                >
                  <i className={`bi ${icon}`} style={{ fontSize: '0.82rem' }} />
                  {label}
                </motion.button>
                </ThemedTooltip>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Content */}
      {data && (
        <>
          <AnimatePresence mode="wait">
          {activeProductionTab === "reports" && (
            <motion.div
              key="prod-tab-reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              {/* 1. Finished Goods Report */}
              <div className={styles.reportCard}>
                <div
                  className={`${styles.reportCardHeader} ${styles.finishedHeader}`}
                  role="button" aria-expanded={!finishedCollapsed} aria-label="Toggle Finished Goods section"
                  onClick={() => setFinishedCollapsed(!finishedCollapsed)}
                >
                  <div className={styles.reportCardTitle}>
                    <i className="bi bi-box-seam"></i>
                    <span>Finished Goods</span>
                  </div>
                  <ThemedTooltip content={finishedCollapsed ? 'Expand' : 'Collapse'}>
                    <motion.i className="bi bi-chevron-down" animate={{ rotate: finishedCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
                  </ThemedTooltip>
                </div>
                <AnimatePresence>
                  {!finishedCollapsed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                      <div className={styles.reportCardBody}>
                        {renderFinishedGoodsTable()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={styles.reportCard}>
                <div
                  className={`${styles.reportCardHeader} ${styles.othersHeader}`}
                  role="button" aria-expanded={!othersCollapsed} aria-label="Toggle Others section"
                  onClick={() => setOthersCollapsed(!othersCollapsed)}
                >
                  <div className={styles.reportCardTitle}>
                    <i className="bi bi-boxes"></i>
                    <span>By Products and Packing Section Material</span>
                  </div>
                  <ThemedTooltip content={othersCollapsed ? 'Expand' : 'Collapse'}>
                    <motion.i className="bi bi-chevron-down" animate={{ rotate: othersCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
                  </ThemedTooltip>
                </div>
                <AnimatePresence>
                  {!othersCollapsed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                      <div className={styles.reportCardBody}>
                        {renderOthersTable()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

          <div className={styles.totalCardWrapper}>
            <div className={styles.totalCard}>
              <div className={styles.totalCardContent}>
                <div className={styles.totalCardHeader}>
                  <div className={styles.totalCardLabel}>Grand Total</div>
                  <div className={styles.totalCardSubLabel}>{dataViewLabel}</div>
                  <div style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.75)",
                    marginTop: "6px",
                    lineHeight: 1.4,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "5px",
                  }}>
                    <i className="bi bi-info-circle" style={{ marginTop: "1px", flexShrink: 0 }}></i>
                    <span>Finished Goods + By Products and Packing Section Material</span>
                  </div>
                </div>
                {[
                  { label: "Opening",    value: fgOpening + othersOpening },
                  { label: "Production", value: fgProduction + othersProduction },
                  { label: "Total",      value: fgTotal + othersTotal },
                  { label: "Dispatch",   value: fgDispatch + othersDispatch },
                  { label: "Returned",   value: fgReturned + othersReturned },
                  { label: "Closing",    value: fgClosing + othersClosing },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className={styles.totalCardItem}
                    initial={{ rotateX: 90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + i * 0.1,
                      ease: [0.22, 0.61, 0.36, 1],
                    }}
                    style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
                  >
                    <div className={styles.totalCardItemLabel}>{item.label}</div>
                    <div className={styles.totalCardItemValue}>{dimProd(item.value)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          {/* Manual Entry By Products */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.othersHeader}`}
              role="button" aria-expanded={!byProductCollapsed} aria-label="Toggle Manual Entry By Products section"
              onClick={() => setByProductCollapsed(!byProductCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-journal-text"></i>
                <span>Manual Entry By Products</span>
              </div>
              <ThemedTooltip content={byProductCollapsed ? 'Expand' : 'Collapse'}>
                <motion.i className="bi bi-chevron-down" animate={{ rotate: byProductCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
              </ThemedTooltip>
            </div>
            <AnimatePresence>
              {!byProductCollapsed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                  <div className={styles.reportCardBody}>
                    {renderByProductsTable()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Raw Materials Usage */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.rawHeader}`}
              role="button" aria-expanded={!rawCollapsed} aria-label="Toggle Raw Materials section"
              onClick={() => setRawCollapsed(!rawCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-cpu"></i>
                <span>Raw Materials Usage</span>
              </div>
              <ThemedTooltip content={rawCollapsed ? 'Expand' : 'Collapse'}>
                <motion.i className="bi bi-chevron-down" animate={{ rotate: rawCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
              </ThemedTooltip>
            </div>
            <AnimatePresence>
              {!rawCollapsed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                  <div className={styles.reportCardBody}>
                    {renderRawMaterialsTable()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Production Ratio */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.productionRatioHeader}`}
              role="button" aria-expanded={!productionRatioCollapsed} aria-label="Toggle Production Ratio section"
              onClick={() => setProductionRatioCollapsed(!productionRatioCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-bar-chart-steps"></i>
                <span>Production Ratio</span>
              </div>
              <ThemedTooltip content={productionRatioCollapsed ? 'Expand' : 'Collapse'}>
                <motion.i className="bi bi-chevron-down" animate={{ rotate: productionRatioCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
              </ThemedTooltip>
            </div>
            <AnimatePresence>
              {!productionRatioCollapsed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                  <div className={styles.reportCardBody}>
                    {renderProductionRatioTable()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Packing Report */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.packingHeader}`}
              role="button" aria-expanded={!packingCollapsed} aria-label="Toggle Packing section"
              onClick={() => setPackingCollapsed(!packingCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-box"></i>
                <span>Packing Bengal Gram & Packing Fried Gram</span>
              </div>
              <ThemedTooltip content={packingCollapsed ? 'Expand' : 'Collapse'}>
                <motion.i className="bi bi-chevron-down" animate={{ rotate: packingCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
              </ThemedTooltip>
            </div>
            <AnimatePresence>
              {!packingCollapsed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                  <div className={styles.reportCardBody}>
                    {renderPackingTable()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            </motion.div>
          )}


          {/* Chart Section */}
          {activeProductionTab === "charts" && data && (
            <motion.div
              key="prod-tab-charts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
            <div className={styles.reportCard}>
              <div
                className={`${styles.reportCardHeader} ${styles.chartHeader}`}
                role="button" aria-expanded={!chartCollapsed} aria-label="Toggle Charts section"
                onClick={() => setChartCollapsed(!chartCollapsed)}
              >
                <div className={styles.reportCardTitle}>
                  <i className="bi bi-graph-up"></i>
                  <span>Visualization</span>
                </div>
                <ThemedTooltip content={chartCollapsed ? 'Expand' : 'Collapse'}>
                  <motion.i className="bi bi-chevron-down" animate={{ rotate: chartCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-block' }} />
                </ThemedTooltip>
              </div>
              <AnimatePresence>
              {!chartCollapsed && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ overflow: 'hidden' }}>
                <div className={styles.reportCardBody}>
                  <div className={styles.chartFilters}>
                    {/* Category Select */}
                    <div className={styles.chartFilterItem}>
                      <label className={styles.filterLabel}>Stock Type</label>
                      <AppSelect
                        value={selectedCategory}
                        onChange={(value) => {
                          setSelectedCategory(value);
                          setMetricType("opening");
                        }}
                        options={[
                          { value: "finished", label: "Finished Goods" },
                          { value: "others", label: "By Products and Packing Section Material" },
                          { value: "byproducts", label: "Manual Entry By Products" },
                          { value: "raw", label: "Raw Materials" },
                          { value: "packing", label: "Packing" },
                        ]}
                      />
                    </div>

                    {/* Brand Select */}
                    {/* {selectedCategory === "finished" && (
                      <div className={styles.chartFilterItem}>
                        <label className={styles.filterLabel}>Item Category</label>
                        <select
                          className={styles.filterSelect}
                          value={selectedBrand}
                          onChange={e => setSelectedBrand(e.target.value)}
                        >
                          <option value="all">All</option>
                          {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    )}
                     */}
                    {/* Metric Select */}
                    {selectedCategory !== "packing" && (
                      <div className={styles.chartFilterItem}>
                        <label className={styles.filterLabel}>Metric</label>
                        <AppSelect
                          value={metricType}
                          onChange={setMetricType}
                          options={
                            selectedCategory === "raw"
                              ? [
                                  { value: "opening", label: "Opening" },
                                  { value: "arrival", label: "Arrival" },
                                  { value: "total", label: "Total" },
                                  { value: "used", label: "Used" },
                                  { value: "returned", label: "Returned" },
                                  { value: "closing", label: "Closing" },
                                ]
                              : selectedCategory === "byproducts"
                              ? [
                                  { value: "opening",    label: "Opening" },
                                  { value: "production", label: "Production" },
                                  { value: "total",      label: "Total" },
                                  { value: "dispatch",   label: "Dispatch" },
                                  { value: "closing",    label: "Closing" },
                                ]
                              : [
                                  { value: "opening", label: "Opening" },
                                  { value: "produced", label: "Production" },
                                  { value: "total", label: "Total" },
                                  { value: "dispatch", label: "Dispatch" },
                                  { value: "returned", label: "Returned" },
                                  { value: "closing", label: "Closing" },
                                ]
                          }
                        />
                      </div>
                    )}

                    {/* Chart Type Select */}
                    <div className={styles.chartFilterItem}>
                      <label className={styles.filterLabel}>Chart Type</label>
                      <AppSelect
                        value={chartType}
                        onChange={setChartType}
                        options={[
                          { value: "bar", label: "Bar Chart" },
                          { value: "line", label: "Line Chart" },
                          { value: "pie", label: "Pie Chart" },
                          { value: "area", label: "Area Chart" },
                        ]}
                      />
                    </div>
                  </div>

                  {["finished", "others"].includes(selectedCategory) && chartCategoryBrands.length > 0 && (
                    <div className={styles.chartCategoryPicker}>
                      <div className={styles.chartCategoryPickerLabel}>Quick Item Category</div>
                      <div className={styles.chartCategoryChips}>
                        <button
                          type="button"
                          className={`${styles.chartCategoryChip} ${selectedBrand === "all" ? styles.chartCategoryChipActive : ""}`}
                          onClick={() => setSelectedBrand("all")}
                        >
                          All
                        </button>
                        {chartCategoryBrands.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            className={`${styles.chartCategoryChip} ${selectedBrand === brand ? styles.chartCategoryChipActive : ""}`}
                            onClick={() => setSelectedBrand(brand)}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.chartContainer}>
                    {renderChart()}
                  </div>
                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
            </motion.div>
          )}
          </AnimatePresence>
        </>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3 }}
            className={styles.toastContainer}
          >
            <div
              className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}
              onClick={closeToast}
            >
              <div className={styles.toastContent}>
                <i className={`bi bi-${toast.type === "success" ? "check-circle-fill" : toast.type === "error" ? "exclamation-triangle-fill" : toast.type === "warning" ? "exclamation-triangle-fill" : "info-circle-fill"}`}></i>
                <div className={styles.toastText}>
                  <div className={styles.toastTitle}>{toast.title}</div>
                  <div className={styles.toastMessage}>{toast.message}</div>
                </div>
                <button className={styles.toastClose} onClick={closeToast}>×</button>
              </div>
              <div className={`${styles.toastProgress} ${styles[`toastProgress${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loaderCard}>
            <div className={styles.loaderSpinner}></div>
            <div className={styles.loaderText}>Generating Report</div>
            <div className={styles.loaderDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
