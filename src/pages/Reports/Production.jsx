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
import styles from "./Production.module.css";

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
  const [rawCollapsed, setRawCollapsed] = useState(false);
  const [packingCollapsed, setPackingCollapsed] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState({});

  // Chart states
  const [selectedCategory, setSelectedCategory] = useState("finished");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [metricType, setMetricType] = useState("opening");
  const [chartType, setChartType] = useState("bar");

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

  const handleDateChange = (value, setter) => {
    if (!value) {
      return;
    }

    const nextDate = new Date(value);
    if (Number.isNaN(nextDate.getTime())) {
      return;
    }

    setter(nextDate);
  };

  const toggleReportFullscreen = () => {
    const nextValue = !isReportFullscreen;
    setIsReportFullscreen(nextValue);
    setMobileFiltersOpen(nextValue ? false : !isMobileScreen);
  };

  const brands = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.finished || {}).filter(
      (b) => Array.isArray(data.finished[b]) && data.finished[b].length
    );
  }, [data]);

  const calculateGrandTotals = () => {
    if (!data || !brands || brands.length === 0) return { opening: 0, production: 0, total: 0, dispatch: 0, closing: 0 };
    
    let grand = { opening: 0, production: 0, total: 0, dispatch: 0, closing: 0 };
    
    brands.forEach((cat) => {
      const items = data.finished[cat] || [];
      items.forEach(i => {
        grand.opening += i.opening || 0;
        grand.production += i["purchased/transfer in"] || 0;
        grand.total += (i.opening || 0) + (i["purchased/transfer in"] || 0);
        grand.dispatch += i.sold || 0;
        grand.closing += i.closing || 0;
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

  const formatIndianNumber = (num) => {
    if (!num && num !== 0) return "0";
    const numStr = Math.round(num).toString();
    const lastThree = numStr.slice(-3);
    const otherNumbers = numStr.slice(0, -3);
    if (otherNumbers !== "") {
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }
    return lastThree;
  };

  const formatPercentage = (value) => {
    const num = Number(value) || 0;
    return `${Math.round(num)}%`;
  };

  const calcTotals = (items) =>
    items.reduce(
      (a, i) => ({
        o: a.o + (i.opening || 0),
        p: a.p + (i["purchased/transfer in"] || 0),
        d: a.d + (i.sold || 0),
        c: a.c + (i.closing || 0),
      }),
      { o: 0, p: 0, d: 0, c: 0 }
    );

  const calcProdPercentage = (items) => {
    if (!items || items.length === 0) return 0;
    let totalPercentage = 0;
    items.forEach(item => {
      totalPercentage += Number(item.prod_percentage) || 0;
    });
    return totalPercentage;
  };

  const calcRoundedProdPercentage = (items) => {
    if (!items || items.length === 0) return 0;
    let totalPercentage = 0;
    items.forEach((item) => {
      totalPercentage += Math.round(Number(item.prod_percentage) || 0);
    });
    return totalPercentage;
  };

  const fetchReport = async () => {
    setLoading(true);
    showToast("Loading", "Fetching production report...", "info");
    
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      const payload = {
        fromdate: fromDate.toISOString().slice(0, 10),
        todate: toDate.toISOString().slice(0, 10),
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
      Object.keys(res.data.finished || {}).forEach((k) => (obj[k] = true));
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

    if (selectedCategory === "finished") {
      if (selectedBrand === "all") {
        return brands.map((brand) => {
          const items = data.finished[brand] || [];

          return items.reduce(
            (acc, item) => ({
              name: brand,
              Opening: acc.Opening + (item.opening || 0),
              Production: acc.Production + (item["purchased/transfer in"] || 0),
              Total:
                acc.Total +
                ((item.opening || 0) + (item["purchased/transfer in"] || 0)),
              Dispatch: acc.Dispatch + (item.sold || 0),
              Closing: acc.Closing + (item.closing || 0),
            }),
            {
              name: brand,
              Opening: 0,
              Production: 0,
              Total: 0,
              Dispatch: 0,
              Closing: 0,
            }
          );
        });
      }

      if (!selectedBrand || !data.finished[selectedBrand]) return [];
      const items = data.finished[selectedBrand];
      
      return items.map(item => ({
        name: item.description || "Unknown",
        Opening: item.opening || 0,
        Production: item["purchased/transfer in"] || 0,
        Total: (item.opening || 0) + (item["purchased/transfer in"] || 0),
        Dispatch: item.sold || 0,
        Closing: item.closing || 0,
      }));
    } 
    else if (selectedCategory === "raw") {
      const rawItems = data.raw?.["All Raw Materials"] || [];
      
      return rawItems.map(item => ({
        name: item.description || "Unknown",
        Opening: item.opening || 0,
        Arrival: item["purchased/transfer in"] || 0,
        Total: (item.opening || 0) + (item["purchased/transfer in"] || 0),
        Used: item["consumed/transfer out"] || 0,
        Closing: item.closing || 0,
      }));
    }
    else if (selectedCategory === "packing") {
      const packingData = [];

       const source = data?.fried_gram_production || [];

      
      // const friedGram = data.finished?.["FRIED GRAM"] || [];
       const friedGram = source.filter(item => item.category === "FRIED GRAM");
      friedGram.forEach(item => {
        packingData.push({
          name: `FG: ${item.description || "Unknown"}`,
          Production: item["purchased/transfer in"] || 0,
          category: "Fried Gram"
        });
      });
      
      // const bengalGram = data.finished?.["BENGAL GRAM"] || [];
        const bengalGram = source.filter(item => item.category === "BENGAL GRAM");

      bengalGram.forEach(item => {
        packingData.push({
          name: `BG: ${item.description || "Unknown"}`,
          Production: item["purchased/transfer in"] || 0,
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

    const isSingleMetric = ["finished", "raw"].includes(selectedCategory) && metricType;
    const pieMetricKey = isSingleMetric ? metricLabel : "Production";
    const pieChartData = chartData.filter((item) => Number(item[pieMetricKey]) > 0);
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: isMobile ? 40 : 60, bottom: 70 }
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
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
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
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
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
                outerRadius={isMobile ? 80 : 130}
                innerRadius={0} 
                dataKey={pieMetricKey}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatIndianNumber(value), "Value"]}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
                  borderColor: isDarkMode ? '#444' : '#e0e0e0',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
                itemStyle={{
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
                labelStyle={{
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#e0e0e0'} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDarkMode ? '#b0b0b0' : '#666' }}
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
      let grand = { o: 0, p: 0, d: 0, c: 0 };
      
      return (
        <div className={styles.mobileTableContainer}>
          {brands.map((cat) => {
            const items = data.finished[cat];
            const sub = calcTotals(items);
            const pct = calcRoundedProdPercentage(items);
            
            grand.o += sub.o;
            grand.p += sub.p;
            grand.d += sub.d;
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
                        <MobileRow label="Opening" value={fmt(i.opening)} />
                        <MobileRow label="Production" value={fmt(i["purchased/transfer in"])} />
                        <MobileRow label="Total" value={fmt(i.opening + i["purchased/transfer in"])} />
                        <MobileRow label="Dispatch" value={fmt(i.sold)} />
                        <MobileRow label="Closing" value={fmt(i.closing)} highlight />
                        <MobileRow label="Prod %" value={`${i.prod_percentage || 0}%`} />
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
                  <MobileRow label="Closing" value={fmt(sub.c)} highlight />
                  <MobileRow label="Prod %" value={`${pct}%`} />
                </div>
              </div>
            );
          })}
          
          <div className={`${styles.mobileCard} ${styles.grandTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - Fried Gram</div>
              <MobileRow label="Opening" value={fmt(grand.o)} />
              <MobileRow label="Production" value={fmt(grand.p)} />
              <MobileRow label="Total" value={fmt(grand.o + grand.p)} />
              <MobileRow label="Dispatch" value={fmt(grand.d)} />
              <MobileRow label="Closing" value={fmt(grand.c)} highlight />
              <MobileRow label="Prod %" value="100%" />
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
              <th className={styles.tableCellNumber}>Closing</th>
              <th className={styles.tableCellPercentage}>Prod %</th>
              </tr>
            </thead>
          <tbody>
            {brands.map((cat, brandIndex) => {
              const items = data.finished[cat] || [];
              const subtotal = items.reduce((acc, i) => ({
                opening: acc.opening + (i.opening || 0),
                produced: acc.produced + (i["purchased/transfer in"] || 0),
                total: acc.total + ((i.opening || 0) + (i["purchased/transfer in"] || 0)),
                dispatch: acc.dispatch + (i.sold || 0),
                closing: acc.closing + (i.closing || 0),
              }), { opening: 0, produced: 0, total: 0, dispatch: 0, closing: 0 });
              
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
                      <td className={styles.tableCellNumber}>{formatIndianNumber(item.opening || 0)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(item["purchased/transfer in"] || 0)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber((item.opening || 0) + (item["purchased/transfer in"] || 0))}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(item.sold || 0)}</td>
                      <td className={styles.tableCellNumber}>{formatIndianNumber(item.closing || 0)}</td>
                      <td className={styles.tableCellPercentage}>{formatPercentage(item.prod_percentage)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            
            <tr className={styles.tableGrandTotal}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Fried Gram</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.production)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.total)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.dispatch)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(grandTotals.closing)}</td>
              <td className={styles.tableCellPercentage}>{formatPercentage(calcRoundedProdPercentage(brands.flatMap(cat => data.finished[cat] || [])))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Raw Materials Table (keep your existing working version)
  const renderRawMaterialsTable = () => {
    const isMobile = window.innerWidth < 768;
    
    if (!data?.raw?.["All Raw Materials"] || data.raw["All Raw Materials"].length === 0) {
      return (
        <div className={styles.noDataMessage}>
          <i className="bi bi-database"></i>
          <p>No data available</p>
        </div>
      );
    }
    
    const rawItems = data.raw["All Raw Materials"] || [];
    const rawTotals = rawItems.reduce((acc, item) => ({
      opening: acc.opening + (item.opening || 0),
      arrival: acc.arrival + (item["purchased/transfer in"] || 0),
      used: acc.used + (item["consumed/transfer out"] || 0),
      closing: acc.closing + (item.closing || 0),
    }), { opening: 0, arrival: 0, used: 0, closing: 0 });
    rawTotals.total = rawTotals.opening + rawTotals.arrival;
    
    if (isMobile) {
      return (
        <div className={styles.mobileTableContainer}>
          {rawItems.map((item, idx) => (
            <div key={idx} className={`${styles.mobileItem} ${isDarkMode ? styles.mobileItemDark : ''}`}>
              <div className={styles.mobileItemTitle}>{item.description}</div>
              <MobileRow label="Opening" value={fmt(item.opening || 0)} />
              <MobileRow label="Arrival" value={fmt(item["purchased/transfer in"] || 0)} />
              <MobileRow label="Total" value={fmt((item.opening || 0) + (item["purchased/transfer in"] || 0))} />
              <MobileRow label="Used" value={fmt(item["consumed/transfer out"] || 0)} />
              <MobileRow label="Closing" value={fmt(item.closing || 0)} highlight />
            </div>
          ))}
          
          <div className={`${styles.mobileCard} ${styles.rawTotalCard}`}>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardFooterTitle}>Grand Total - Raw Materials</div>
              <MobileRow label="Opening" value={fmt(rawTotals.opening)} />
              <MobileRow label="Arrival" value={fmt(rawTotals.arrival)} />
              <MobileRow label="Total" value={fmt(rawTotals.total)} />
              <MobileRow label="Used" value={fmt(rawTotals.used)} />
              <MobileRow label="Closing" value={fmt(rawTotals.closing)} />
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
              <th className={styles.tableCellNumber}>Closing</th>
            </tr>
          </thead>
          <tbody>
            {rawItems.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? styles.tableRowEven : ''}>
                <td className={styles.tableCellArrow}></td>
                <td className={styles.tableCellDescription}>{item.description || 'No Description'}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(item.opening || 0)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(item["purchased/transfer in"] || 0)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber((item.opening || 0) + (item["purchased/transfer in"] || 0))}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(item["consumed/transfer out"] || 0)}</td>
                <td className={styles.tableCellNumber}>{formatIndianNumber(item.closing || 0)}</td>
              </tr>
            ))}
            <tr className={styles.tableGrandTotalRaw}>
              <td colSpan="2" className={styles.tableCellDescription}>Grand Total - Raw Materials</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.opening)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.arrival)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.total)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.used)}</td>
              <td className={styles.tableCellNumber}>{formatIndianNumber(rawTotals.closing)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Packing Table (keep your existing working version)
  const renderPackingTable = () => {
    const isMobile = window.innerWidth < 768;

    const packingData = data?.fried_gram_production || [];

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
                    <MobileRow label="Production" value={fmt(item["purchased/transfer in"] || 0)} />
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
                    <MobileRow label="Production" value={fmt(item["purchased/transfer in"] || 0)} />
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
                <td className={styles.tableCellNumber}>{formatIndianNumber(item["purchased/transfer in"] || 0)}</td>
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
                <td className={styles.tableCellNumber}>{formatIndianNumber(item["purchased/transfer in"] || 0)}</td>
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
        "--production-raw-start": `color-mix(in srgb, ${selectedAccent.primary} 68%, #10b981)`,
        "--production-raw-end": `color-mix(in srgb, ${selectedAccent.secondary} 62%, #059669)`,
        "--production-packing-start": `color-mix(in srgb, ${selectedAccent.primary} 60%, #8b5cf6)`,
        "--production-packing-end": `color-mix(in srgb, ${selectedAccent.secondary} 58%, #7c3aed)`,
        "--production-chart-start": `color-mix(in srgb, ${selectedAccent.primary} 52%, #f59e0b)`,
        "--production-chart-end": `color-mix(in srgb, ${selectedAccent.secondary} 50%, #d97706)`,
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
            <div className={styles.selectWrapper}>
              <select 
                className={styles.filterSelect}
                value={catGroup}
                onChange={(e) => setCatGroup(e.target.value)}
              >
                <option value="Fried Gram Mill">Fried Gram Mill</option>
              </select>
              <i className={`bi bi-chevron-down ${styles.selectIcon}`}></i>
            </div>
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
            <div className={styles.dateWrapper}>
              <input 
                type="date"
                className={styles.filterInput}
                value={fromDate.toISOString().slice(0, 10)}
                onChange={(e) => handleDateChange(e.target.value, setFromDate)}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                max={toDate.toISOString().slice(0, 10)}
                inputMode="none"
              />
            </div>
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
            <div className={styles.dateWrapper}>
              <input 
                type="date"
                className={styles.filterInput}
                value={toDate.toISOString().slice(0, 10)}
                onChange={(e) => handleDateChange(e.target.value, setToDate)}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                min={fromDate.toISOString().slice(0, 10)}
                inputMode="none"
              />
            </div>
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
                <span>Finished Goods - Fried Gram</span>
              </div>
              <i className={`bi ${finishedCollapsed ? "bi-chevron-down" : "bi-chevron-up"}`}></i>
            </div>
            {!finishedCollapsed && (
              <div className={styles.reportCardBody}>
                {renderFinishedGoodsTable()}
              </div>
            )}
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

          {/* 3. Packing Report */}
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

          <div className={styles.totalCardWrapper}>
            <div className={styles.totalCard}>
              <div className={styles.totalCardContent}>
                <div className={styles.totalCardLabel}>
                  <i className="bi bi-box-seam"></i>
                  <span>Finished Goods Total</span>
                </div>
                <div className={styles.totalCardValue}>{formatIndianNumber(data?.total_prd || 0)}</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          {data && data.finished && brands.length > 0 && (
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
                      <select 
                        className={styles.filterSelect}
                        value={selectedCategory}
                        onChange={e => {
                          setSelectedCategory(e.target.value);
                          if (e.target.value === "packing") {
                            setMetricType("opening");
                          } else {
                            setMetricType("opening");
                          }
                        }}
                      >
                        <option value="finished">Finished Goods</option>
                        <option value="raw">Raw Materials</option>
                        <option value="packing">Packing</option>
                      </select>
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
                        <select 
                          className={styles.filterSelect}
                          value={metricType}
                          onChange={e => setMetricType(e.target.value)}
                        >
                          {selectedCategory === "finished" ? (
                            <>
                              <option value="opening">Opening</option>
                              <option value="produced">Production</option>
                              <option value="total">Total</option>
                              <option value="dispatch">Dispatch</option>
                              <option value="closing">Closing</option>
                            </>
                          ) : (
                            <>
                              <option value="opening">Opening</option>
                              <option value="arrival">Arrival</option>
                              <option value="total">Total</option>
                              <option value="used">Used</option>
                              <option value="closing">Closing</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                    
                    {/* Chart Type Select */}
                    <div className={styles.chartFilterItem}>
                      <label className={styles.filterLabel}>Chart Type</label>
                      <select 
                        className={styles.filterSelect}
                        value={chartType}
                        onChange={e => setChartType(e.target.value)}
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="area">Area Chart</option>
                      </select>
                    </div>
                  </div>

                  {selectedCategory === "finished" && brands.length > 0 && (
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
                        {brands.map((brand) => (
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
