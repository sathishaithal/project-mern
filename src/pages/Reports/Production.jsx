import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
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
import { useColorMode } from "../../theme/ThemeContext";
import { AppDatePicker, AppSelect } from "../../components/FormControls";
import styles from "./Production.module.css";

const toNumber = (value) => Number(value) || 0;

const hasRoundedDisplayValue = (...values) =>
  values.some((value) => Math.round(toNumber(value)) !== 0);

const hasFinishedDisplayValue = (item = {}) =>
  hasRoundedDisplayValue(
    item.opening,
    item["purchased/transfer in"],
    item.sold,
    item.returned ?? item.return ?? item["sales return"],
    item.closing,
    item.prod_percentage
  );

const hasRawDisplayValue = (item = {}) =>
  hasRoundedDisplayValue(
    item.opening,
    item["purchased/transfer in"],
    item["consumed/transfer out"],
    item.returned ?? item.return,
    item.closing
  );

const filterGroupedData = (grouped = {}, predicate) =>
  Object.entries(grouped || {}).reduce((acc, [key, items]) => {
    const filteredItems = (items || []).filter(predicate);
    if (filteredItems.length > 0) {
      acc[key] = filteredItems;
    }
    return acc;
  }, {});

const Production = () => {
  const { isDarkMode, selectedAccent, selectedFont } = useColorMode();
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(window.innerWidth >= 768);
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

  // Chart states
  const [selectedCategory, setSelectedCategory] = useState("finished");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [metricType, setMetricType] = useState("opening");
  const [chartType, setChartType] = useState("bar");
  const [dataView, setDataView] = useState("produced");

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
    if (!n && n !== 0) return "0";
    const x = Math.round(n).toString();
    const last3 = x.slice(-3);
    const rest = x.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest ? `${rest},${last3}` : last3;
  };


  // Correct negative number formatting for Indian style
  // const formatIndianNumber = (num) => {
  //   if (num == null || isNaN(num)) return '';
  //   const abs = Math.abs(Math.round(num));
  //   const numStr = abs.toString();
  //   const lastThree = numStr.slice(-3);
  //   const otherNumbers = numStr.slice(0, -3);
  //   let formatted = otherNumbers !== ''
  //     ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
  //     : lastThree;
  //   if (num < 0) formatted = '-' + formatted;
  //   return formatted;
  // };

  const formatIndianNumber = (num) => {
  if (num == null || isNaN(num)) return '';
  const rounded = Math.round(num);
  if (rounded === 0) return '0';
  const abs = Math.abs(rounded);
  const numStr = abs.toString();
  const lastThree = numStr.slice(-3);
  const otherNumbers = numStr.slice(0, -3);
  let formatted = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;
  if (rounded < 0) formatted = '-' + formatted;
  return formatted;
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
    showToast("Loading", "Fetching production report...", "info");

    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      const payload = {
        fromdate: formatPayloadDate(fromDate),
        todate: formatPayloadDate(toDate),
        catgroup: "Fried Gram Mill",
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/Report/production-report`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", res.data);

      if (!res.data || Object.keys(res.data).length === 0) {
        setData(null);
        setIsReportFullscreen(false);
        showToast("No Data", "No production data found for selected date range.", "warning");
        return;
      }

      setData(res.data);
      const obj = {};
      [...Object.keys(res.data.finished || {}), ...Object.keys(res.data.finished2 || {})].forEach((k) => (obj[k] = true));
      [...Object.keys(res.data.finishedOthers || {}), ...Object.keys(res.data.finishedOthers2 || {})].forEach((k) => (obj[`others:${k}`] = true));
      setCollapsedCats(obj);

      if (res.data.finished && Object.keys(res.data.finished).length > 0) {
        const availableBrands = Object.keys(res.data.finished).filter(
          (b) => Array.isArray(res.data.finished[b]) && res.data.finished[b].length > 0
        );
        if (availableBrands.length > 0) {
          setSelectedBrand("all");
        }
      }

      showToast("Success", "Report loaded successfully!", "success");

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
      selectedAccent.primary,
      selectedAccent.secondary,
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

    const isSingleMetric = ["finished", "others", "raw"].includes(selectedCategory) && metricType;
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
              <Tooltip content={<CustomTooltip />} />
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
              <Tooltip content={<CustomTooltip />} />
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


case "pie":
  if (pieChartData.length === 0) {
    return (
      <div className={styles.noDataMessage}>
        <i className="bi bi-pie-chart"></i>
        <p>No positive values available for pie chart</p>
      </div>
    );
  }

  return (
    <>
      {/* Warning */}
      {negativeItems.length > 0 && (
        <div
          style={{
            fontSize: "12px",
            color: isDarkMode ? "#fbbf24" : "#b45309",
            marginBottom: "6px",
          }}
        >
          ⚠ Negative / zero values are excluded from pie chart
        </div>
      )}

      {/* ✅ MAIN WRAPPER FIX */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chart */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return percent > 0.03 ? (
                    <text
                      x={x}
                      y={y}
                      fill="#fff"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight="600"
                    >
                      {(percent * 100).toFixed(0)}%
                    </text>
                  ) : null;
                }}
                outerRadius={isMobile ? 60 : 130}
                innerRadius={0}
                dataKey={pieMetricKey}
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [formatIndianNumber(value), "Value"]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
                  borderColor: isDarkMode ? "#444" : "#e0e0e0",
                  color: isDarkMode ? "#f1f5f9" : "#0f172a",
                }}
                itemStyle={{
                  color: isDarkMode ? "#f1f5f9" : "#0f172a",
                }}
                labelStyle={{
                  color: isDarkMode ? "#f1f5f9" : "#0f172a",
                }}
              />

              <Legend
                wrapperStyle={{
                  paddingTop: "10px",
                }}
                formatter={(value, entry) => {
                  const item = pieChartData.find(
                    (d) => d.name === entry.payload?.name
                  );

                  if (!item) return value;

                  const val = Number(item[pieMetricKey] || 0);
                  const percent =
                    totalValue > 0 ? (val / totalValue) * 100 : 0;

                  return percent < 1 ? `${value} (<1%)` : value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ✅ EXCLUDED ITEMS (VISIBLE NOW) */}
        {negativeItems.length > 0 && (
          <div
            style={{
              paddingTop: "8px",
              textAlign: "center",
              fontSize: "12px",
              color: isDarkMode ? "#9ca3af" : "#555",
              flexShrink: 0,
            }}
          >
            <strong>Excluded Items:</strong>

            <div
              style={{
                marginTop: "4px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                maxHeight: "60px",
                overflowY: "auto",
              }}
            >
              {negativeItems.map((item, index) => (
                <span
                  key={index}
                  style={{
                    margin: "4px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  • {item.name} (
                  {formatIndianNumber(item[pieMetricKey])})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

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
              <Tooltip content={<CustomTooltip />} />
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
                  <i className={`bi ${collapsedCats[cat] ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
                </div>

                {!collapsedCats[cat] && (
                  <div className={styles.mobileCardBody}>
                    {items.map((i, idx) => (
                      <div key={idx} className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}>
                        <div className={styles.mobileItemTitle}>{i.description}</div>
                        <MobileRow label="Opening" value={fmt(getFinishedItemMetrics(i).opening)} />
                        <MobileRow label="Production" value={fmt(getFinishedItemMetrics(i).production)} />
                        <MobileRow label="Total" value={fmt(getFinishedItemMetrics(i).total)} />
                        <MobileRow label="Dispatch" value={fmt(getFinishedItemMetrics(i).dispatch)} />
                        <MobileRow label="Returned" value={fmt(getFinishedItemMetrics(i).returned)} />
                        <MobileRow label="Closing" value={fmt(getFinishedItemMetrics(i).closing)} />
                        <MobileRow label="Prod %" value={formatPercentage(i.prod_percentage)} />
                      </div>
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
                      <i className={`bi ${collapsedCats[cat] ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
                    </td>
                    <td className={`${styles.tableCellDescription} ${styles.tableCellBold}`}>
                      Sub Total - {cat}
                    </td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.opening)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.produced)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.total)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.dispatch)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.returned)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.closing)}</td>
                    <td className={styles.tableCellPercentage}>{formatPercentage(subtotalPercentage)}</td>
                  </tr>

                  {!collapsedCats[cat] && items.map((item, i) => (
                    <tr
                      key={i}
                      className={`${styles.tableSubRow} ${i % 2 === 0 ? styles.tableSubRowEven : styles.tableSubRowOdd}`}
                    >
                      <td className={styles.tableCellArrow}></td>
                      <td className={`${styles.tableCellDescription} ${styles.tableCellIndented}`}>
                        {item.description || 'No Description'}
                      </td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).opening)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).production)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).total)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).dispatch)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).returned)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).closing)}</td>
                      <td className={styles.tableCellPercentage}>{formatPercentage(item.prod_percentage)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            <tr className={styles.tableGrandTotal}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Finished Goods</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.production)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.total)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.dispatch)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.returned)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.closing)}</td>
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
                  <i className={`bi ${collapsedCats[collapseKey] ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
                </div>

                {!collapsedCats[collapseKey] && (
                  <div className={styles.mobileCardBody}>
                    {items.map((i, idx) => (
                      <div key={idx} className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}>
                        <div className={styles.mobileItemTitle}>{i.description}</div>
                        <MobileRow label="Opening" value={formatIndianNumber(getFinishedItemMetrics(i).opening)} />
                        <MobileRow label="Production" value={formatIndianNumber(getFinishedItemMetrics(i).production)} />
                        <MobileRow label="Total" value={formatIndianNumber(getFinishedItemMetrics(i).total)} />
                        <MobileRow label="Dispatch" value={formatIndianNumber(getFinishedItemMetrics(i).dispatch)} />
                        <MobileRow label="Returned" value={formatIndianNumber(getFinishedItemMetrics(i).returned)} />
                        <MobileRow label="Closing" value={formatIndianNumber(getFinishedItemMetrics(i).closing)} />
                        <MobileRow label="Prod %" value={formatPercentage(i.prod_percentage)} />
                      </div>
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
                      <i className={`bi ${collapsedCats[collapseKey] ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
                    </td>
                    <td className={`${styles.tableCellDescription} ${styles.tableCellBold}`}>
                      Sub Total - {cat}
                    </td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.opening)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.produced)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.total)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.dispatch)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.returned)}</td>
                    <td className={styles.tableCellNumber}>{formatIndianNumber(subtotal.closing)}</td>
                    <td className={styles.tableCellPercentage}>{formatPercentage(subtotalPercentage)}</td>
                  </tr>

                  {!collapsedCats[collapseKey] && items.map((item, i) => (
                    <tr
                      key={i}
                      className={`${styles.tableSubRow} ${i % 2 === 0 ? styles.tableSubRowEven : styles.tableSubRowOdd}`}
                    >
                      <td className={styles.tableCellArrow}></td>
                      <td className={`${styles.tableCellDescription} ${styles.tableCellIndented}`}>
                        {item.description || 'No Description'}
                      </td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).opening)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).production)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).total)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).dispatch)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).returned)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(getFinishedItemMetrics(item).closing)}</td>
                      <td className={styles.tableCellPercentage}>{formatPercentage(item.prod_percentage)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            <tr className={styles.tableGrandTotalOthers}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - By Products and Packing Section Material</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.production)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.total)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.dispatch)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.returned)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.closing)}</td>
              <td className={styles.tableCellPercentage}>{formatPercentage(calcRoundedProdPercentage(othersBrands.flatMap(cat => finishedOthersData[cat] || [])))}</td>
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
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.tableCellArrow}></th>
              <th className={styles.tableCellDescription}>Raw Material</th>
              <th className={styles.tableCellNumber}>Opening</th>
              <th className={styles.tableCellNumber}>Arrival</th>
              <th className={styles.tableCellNumber}>Total</th>
              <th className={styles.tableCellNumber}>Used</th>
              <th className={styles.tableCellNumber}>Returned</th>
              <th className={styles.tableCellNumber}>Closing</th>
            </tr>
          </thead>
          <tbody>
            {rawItems.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? styles.tableRowEven : ''}>
                <td className={styles.tableCellArrow}></td>
                <td className={styles.tableCellDescription}>{item.description || 'No Description'}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(getRawItemMetrics(item).opening)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(toNumber(item["purchased/transfer in"]))}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(getRawItemMetrics(item).total)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(getRawItemMetrics(item).used)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(getRawItemMetrics(item).returned)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(getRawItemMetrics(item).closing)}</td>
              </tr>
            ))}
            <tr className={styles.tableGrandTotalRaw}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Raw Materials</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.arrival)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.total)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.used)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.returned)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.closing)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderProductionRatioTable = () => {
    const rawItems = rawData?.["All Raw Materials"] || [];
    const gram100KGItem = rawItems.find(
      (item) => item.description?.toUpperCase().trim() === "GRAM 100 KG"
    );
    const gram100KGUsed = gram100KGItem ? getRawItemMetrics(gram100KGItem).used : 0;

    const gramBrokenItem = othersBrands
      .flatMap((cat) => finishedOthersData[cat] || [])
      .find((item) => item.description?.toUpperCase().includes("GRAM BROKEN"));
    const gramBrokenQty = gramBrokenItem ? getFinishedItemMetrics(gramBrokenItem).production : null;

    const calcPct = (qty) =>
      gram100KGUsed > 0 ? ((qty / gram100KGUsed) * 100).toFixed(2) + "%" : "-";

    const makeTooltip = (label, qty) =>
      gram100KGUsed > 0
        ? `${label} (${formatIndianNumber(qty)}) / GRAM 100 KG Raw Materials Usage (${formatIndianNumber(gram100KGUsed)}) × 100 = ${calcPct(qty)}`
        : "GRAM 100 KG usage not available";

    const rows = [
      {
        name: "Finished Goods",
        qty: fgProduction,
        hasData: true,
        qtyLabel: "Finished Goods Total Production",
        pctTooltip: makeTooltip("Finished Goods Qty in KG", fgProduction),
      },
      {
        name: "Gram Husk Packing 18KG",
        qty: null,
        hasData: false,
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
        qtyLabel: "Fried Gram Broken Total Production",
        pctTooltip: gramBrokenQty !== null
          ? makeTooltip("Fried Gram Broken Qty in KG", gramBrokenQty)
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
              <th className={styles.tableCellNumber}>Qty in KG</th>
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
                <td
                  className={styles.tableCellNumber}
                  title={row.hasData ? row.qtyLabel : ""}
                >
                  {row.hasData ? formatIndianNumber(row.qty) : "-"}
                </td>
                <td
                  className={styles.tableCellNumber}
                  title={row.hasData ? row.pctTooltip : ""}
                >
                  {row.hasData ? calcPct(row.qty) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.tableGrandTotal}>
              <td className={styles.tableCellDescription}>Total</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(totalQty)}</td>
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
                <td className={styles.tableCellNumber}>{formatIndianNumber(toNumber(item["purchased/transfer in"]))}</td>
              </tr>
            ))}
            {friedGram.length > 0 && (
              <tr className={styles.tableSubTotal}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>Sub Total - FRIED GRAM</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(friedGramTotal)}</td>
              </tr>
            )}
            {bengalGram.map((item, i) => (
              <tr key={`bengal-${i}`}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>{item.description || 'No Description'}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(toNumber(item["purchased/transfer in"]))}</td>
              </tr>
            ))}
            {bengalGram.length > 0 && (
              <tr className={styles.tableSubTotal}>
                <td className={styles.tableCellArrow}>  </td>
                <td className={styles.tableCellDescription}>Sub Total - BENGAL GRAM</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(bengalGramTotal)}</td>
              </tr>
            )}
            <tr className={styles.tableGrandTotalPacking}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Packing</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(friedGramTotal + bengalGramTotal)}</td>
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

        {data && (
          <button
            type="button"
            className={styles.reportViewToggle}
            onClick={toggleReportFullscreen}
          >
            <i className={`bi ${isReportFullscreen ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"}`}></i>
            {isReportFullscreen ? "Close Full Screen" : "Full Screen"}
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
          {/* From Date */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            whileHover={{ y: -2 }}
          >
            <label className={styles.filterLabel}>
              <i className="bi bi-calendar3"></i> From Date
            </label>
            <AppDatePicker
              value={fromDate}
              onChange={setFromDate}
              max={toDate}
            />
          </motion.div>

          {/* To Date */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            whileHover={{ y: -2 }}
          >
            <label className={styles.filterLabel}>
              <i className="bi bi-calendar3"></i> To Date
            </label>
            <AppDatePicker
              value={toDate}
              onChange={setToDate}
              min={fromDate}
            />
          </motion.div>

          {/* Generate Button */}
          <motion.div
            className={styles.filterItem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <motion.button
              className={styles.generateBtn}
              onClick={fetchReport}
              disabled={loading}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.985 }}
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

      {/* Report Content */}
      {data && (
        <>
          {/* 1. Finished Goods Report */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.finishedHeader}`}
              onClick={() => setFinishedCollapsed(!finishedCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-box-seam"></i>
                <span>Finished Goods</span>
              </div>
              <i className={`bi ${finishedCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
            </div>
            {!finishedCollapsed && (
              <div className={styles.reportCardBody}>
                {renderFinishedGoodsTable()}
              </div>
            )}
          </div>

          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.othersHeader}`}
              onClick={() => setOthersCollapsed(!othersCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-boxes"></i>
                <span>By Products and Packing Section Material</span>
              </div>
              <i className={`bi ${othersCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
            </div>
            {!othersCollapsed && (
              <div className={styles.reportCardBody}>
                {renderOthersTable()}
              </div>
            )}
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
                    <div className={styles.totalCardItemValue}>{formatIndianNumber(item.value)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          {/* 2. Raw Materials Usage */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.rawHeader}`}
              onClick={() => setRawCollapsed(!rawCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-cpu"></i>
                <span>Raw Materials Usage</span>
              </div>
              <i className={`bi ${rawCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
            </div>
            {!rawCollapsed && (
              <div className={styles.reportCardBody}>
                {renderRawMaterialsTable()}
              </div>
            )}
          </div>

          {/* 3. Production Ratio */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.productionRatioHeader}`}
              onClick={() => setProductionRatioCollapsed(!productionRatioCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-bar-chart-steps"></i>
                <span>Production Ratio</span>
              </div>
              <i className={`bi ${productionRatioCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
            </div>
            {!productionRatioCollapsed && (
              <div className={styles.reportCardBody}>
                {renderProductionRatioTable()}
              </div>
            )}
          </div>

          {/* 4. Packing Report */}
          <div className={styles.reportCard}>
            <div
              className={`${styles.reportCardHeader} ${styles.packingHeader}`}
              onClick={() => setPackingCollapsed(!packingCollapsed)}
            >
              <div className={styles.reportCardTitle}>
                <i className="bi bi-box"></i>
                <span>Packing Bengal Gram & Packing Fried Gram</span>
              </div>
              <i className={`bi ${packingCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
            </div>
            {!packingCollapsed && (
              <div className={styles.reportCardBody}>
                {renderPackingTable()}
              </div>
            )}
          </div>



          {/* Chart Section */}
          {data && (brands.length > 0 || othersBrands.length > 0) && (
            <div className={styles.reportCard}>
              <div
                className={`${styles.reportCardHeader} ${styles.chartHeader}`}
                onClick={() => setChartCollapsed(!chartCollapsed)}
              >
                <div className={styles.reportCardTitle}>
                  <i className="bi bi-graph-up"></i>
                  <span>Visualization</span>
                </div>
                <i className={`bi ${chartCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
              </div>
              {!chartCollapsed && (
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
                            selectedCategory !== "raw"
                              ? [
                                  { value: "opening", label: "Opening" },
                                  { value: "produced", label: "Production" },
                                  { value: "total", label: "Total" },
                                  { value: "dispatch", label: "Dispatch" },
                                  { value: "returned", label: "Returned" },
                                  { value: "closing", label: "Closing" },
                                ]
                              : [
                                  { value: "opening", label: "Opening" },
                                  { value: "arrival", label: "Arrival" },
                                  { value: "total", label: "Total" },
                                  { value: "used", label: "Used" },
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
              )}
            </div>
          )}
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
