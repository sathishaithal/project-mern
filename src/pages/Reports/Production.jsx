import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Button,
  CircularProgress,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
   Snackbar,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Inventory,
  Factory,
  LocalShipping,
  Refresh,
  CalendarToday,
  TrendingUp,
  ShowChart,
  Assessment,
} from "@mui/icons-material";
import axios from "axios";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { motion } from "framer-motion";
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



/* ================= ANIMATION ================= */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ================= MOBILE ROW ================= */
const MobileRow = ({ label, value, highlight, isDarkMode }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: 1,
      py: 0.4,
      fontSize: "0.75rem",
      width: "100%",
    }}
  >
    <Typography sx={{ 
      color: isDarkMode ? "#b0b0b0" : "text.secondary", 
      fontWeight: highlight ? 700 : 500 
    }}>
      {label}
    </Typography>
    <Typography
      sx={{
        fontWeight: 700,
        color: highlight ? "#0e3978" : (isDarkMode ? "#ffffff" : "text.primary"),
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </Typography>
  </Box>
);

/* ================= MAIN ================= */
const Production = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDarkMode = theme.palette.mode === "dark";

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [finishedCollapsed, setFinishedCollapsed] = useState(false);
  const [rawCollapsed, setRawCollapsed] = useState(false);
  const [packingCollapsed, setPackingCollapsed] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState({});

  // Chart states
  const [selectedCategory, setSelectedCategory] = useState("finished");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [metricType, setMetricType] = useState("produced");
  const [chartType, setChartType] = useState("bar");


  const [notification, setNotification] = useState({
  open: false,
  message: "",
  severity: "info", 
  title: ""
});



 const brands = React.useMemo(() => {
    if (!data) return [];
    return Object.keys(data.finished || {}).filter(
      (b) => Array.isArray(data.finished[b]) && data.finished[b].length
    );
  }, [data]);

  // Now fix calculateGrandTotals to use brands from closure
  const calculateGrandTotals = () => {
    if (!data || !brands || brands.length === 0) return { opening: 0, production: 0, total: 0, dispatch: 0, closing: 0 };
    
    let grand = { opening: 0, production: 0, total: 0, dispatch: 0, closing: 0 };
    
    brands.forEach((cat) => {
      const items = data.finished[cat] || [];
      const subtotal = items.reduce((acc, i) => ({
        opening: acc.opening + (i.opening || 0),
        production: acc.production + (i["purchased/transfer in"] || 0),
        total: acc.total + ((i.opening || 0) + (i["purchased/transfer in"] || 0)),
        dispatch: acc.dispatch + (i.sold || 0),
        closing: acc.closing + (i.closing || 0),
      }), { opening: 0, production: 0, total: 0, dispatch: 0, closing: 0 });
      
      grand.opening += subtotal.opening;
      grand.production += subtotal.production;
      grand.total += subtotal.total;
      grand.dispatch += subtotal.dispatch;
      grand.closing += subtotal.closing;
    });
    
    return grand;
  };

  
  const showNotification = (title, message, severity = "info") => {
  setNotification({
    open: true,
    message,
    severity,
    title
  });
};


const handleCloseNotification = () => {
  setNotification(prev => ({ ...prev, open: false }));
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};


  /* ================= TABLE THEMES & STYLES ================= */
  const tableThemes = {
    finished: {
      primary: isDarkMode ? "#E3F2FD" : "#0D47A1",
      gradient: isDarkMode
        ? "linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)"
        : "linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)",
      light: isDarkMode ? "rgba(66, 165, 245, 0.14)" : "#E3F2FD",
      text: "#ffffff",
      secondaryText: isDarkMode ? "#BBDEFB" : "#5472d3",
    },
    raw: {
      primary: isDarkMode ? "#E8F5E9" : "#1B5E20",
      gradient: isDarkMode
        ? "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)"
        : "linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)",
      light: isDarkMode ? "rgba(76, 175, 80, 0.14)" : "#E8F5E9",
      text: "#ffffff",
      secondaryText: isDarkMode ? "#C8E6C9" : "#43A047",
    },
    packing: {
      primary: isDarkMode ? "#EDE7F6" : "#311B92",
      gradient: isDarkMode
        ? "linear-gradient(135deg, #2C2F4A 0%, #4A148C 100%)"
        : "linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)",
      light: isDarkMode ? "rgba(126, 87, 194, 0.14)" : "#EDE7F6",
      text: "#ffffff",
      secondaryText: isDarkMode ? "#D1C4E9" : "#5E35B1",
    },
  };

  const colors = {
    primary: "#5B86E5",
    cardBackground: isDarkMode ? "#1e1e1e" : "#ffffff",
    textPrimary: isDarkMode ? "#ffffff" : "#000000",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666666",
  };

  const columnWidths = {
    arrow: 60,
    description: 250,
    number: 120,
    percentage: 100,
  };



  /* ================= HELPERS ================= */
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
    return `${num.toFixed(2)}%`;
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

 

  const getTableHeaders = () => ["Opening", "Production", "Total", "Dispatch", "Closing"];

const fetchReport = async () => {
  setLoading(true);
  showNotification("Loading", "Fetching production report...", "info");
  
  try {
    const token =
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken");

    const payload = {
      fromdate: fromDate.toISOString().slice(0, 10),
      todate: toDate.toISOString().slice(0, 10),
      catgroup: "Fried Gram Mill",
    };

    console.log("📤 Request Payload:", payload);

    const res = await axios.post(
      "http://localhost:5000/api/reports/production-report",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Axios Response:", res);
    console.log("Response Data:", res.data);

    if (!res.data || Object.keys(res.data).length === 0) {
      console.warn("No data found for selected date range");
      setData(null);
      showNotification("No Data", "No production data found for selected date range.", "warning");
      return;
    }

    setData(res.data);
    const obj = {};
    Object.keys(res.data.finished || {}).forEach((k) => (obj[k] = true));
    setCollapsedCats(obj);

    // Set default brand for chart
    if (res.data.finished && Object.keys(res.data.finished).length > 0) {
      const availableBrands = Object.keys(res.data.finished).filter(
        (b) => Array.isArray(res.data.finished[b]) && res.data.finished[b].length > 0
      );
      if (availableBrands.length > 0) {
        const firstBrand = availableBrands[0];
        setSelectedBrand(firstBrand);
        console.log("Default brand selected:", firstBrand);
      }
    }

    console.log("Finished Categories:", obj);
    
    showNotification(
      "Success", 
      // `Production report loaded successfully! Found ${brands.length} brands.`,
      `Report loaded successfully!`,
      "success"
    );

  } catch (err) {
    console.error("Production report error:", err);

    let errorTitle = "Error";
    let errorMessage = "Failed to fetch production report";
    
    if (err.response) {
      console.error("Error Response Status:", err.response.status);
      console.error("Error Response Data:", err.response.data);
      
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
      console.error("No response received:", err.request);
      errorTitle = "Connection Error";
      errorMessage = "No response from server. Please check your connection.";
    } else {
      console.error("request setup error:", err.message);
      errorMessage = err.message;
    }

    setData(null);
    showNotification(errorTitle, errorMessage, "error");
    
  } finally {
    setLoading(false);
    console.log("⏹Loading finished");
  }
};


const additionalMetrics = React.useMemo(() => {
  if (!data) return {
    avgProdPercentage: 0,
    totalItems: 0,
    rawMaterialsCount: 0,
    dispatchPercentage: 0
  };
  
  let totalProdPercentage = 0;
  let itemCount = 0;
  
  // Calculate for finished goods
  if (data.finished) {
    Object.values(data.finished).forEach(items => {
      items.forEach(item => {
        totalProdPercentage += Number(item.prod_percentage) || 0;
        itemCount++;
      });
    });
  }
  
  // Raw materials count
  const rawMaterialsCount = data.raw?.["All Raw Materials"]?.length || 0;
  
  // Calculate dispatch percentage
  const grandTotals = calculateGrandTotals();
  const dispatchPercentage = grandTotals.total > 0 
    ? (grandTotals.dispatch / grandTotals.total) * 100 
    : 0;
  
  const avgProdPercentage = itemCount > 0 ? totalProdPercentage / itemCount : 0;
  
  return {
    avgProdPercentage,
    totalItems: itemCount,
    rawMaterialsCount,
    dispatchPercentage
  };
}, [data]);




  /* ================= CHART FUNCTIONS ================= */
  const prepareChartData = () => {
    if (!data) return [];

    if (selectedCategory === "finished") {
      if (!selectedBrand || !data.finished[selectedBrand]) return [];
      const items = data.finished[selectedBrand];
      
      return items.map(item => {
        const baseData = {
          name: item.description || "Unknown",
          Opening: item.opening || 0,
          Production: item["purchased/transfer in"] || 0,
          Total: (item.opening || 0) + (item["purchased/transfer in"] || 0),
          Dispatch: item.sold || 0,
          Closing: item.closing || 0,
          "Production %": item.prod_percentage || 0,
        };
        
        // Return only the selected metric if needed
        if (metricType) {
          return {
            name: item.description || "Unknown",
            [getMetricLabel()]: baseData[getMetricLabel()] || 0,
          };
        }
        return baseData;
      });
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
      
      // Add Fried Gram items
      const friedGram = data.finished?.["FRIED GRAM"] || [];
      friedGram.forEach(item => {
        packingData.push({
          name: `FG: ${item.description || "Unknown"}`,
          Production: item["purchased/transfer in"] || 0,
          category: "Fried Gram"
        });
      });
      
      // Add Bengal Gram items
      const bengalGram = data.finished?.["BENGAL GRAM"] || [];
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
    const metricMap = {
      produced: "Production",
      opening: "Opening",
      total: "Total",
      dispatch: "Dispatch",
      closing: "Closing",
      prod_percentage: "Production %",
    };
    return metricMap[metricType] || "Production";
  };

  const getChartColors = () => {
    const baseColors = [
      "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
      "#00c49f", "#ffbb28", "#ff6b6b", "#36D1DC", "#5B86E5"
    ];
    
    if (selectedCategory === "finished") return baseColors.slice(0, 5);
    if (selectedCategory === "raw") return baseColors.slice(2, 7);
    if (selectedCategory === "packing") return baseColors.slice(5, 10);
    return baseColors;
  };

  const renderChart = () => {
    const chartData = prepareChartData();
    const colors = getChartColors();
    const metricLabel = getMetricLabel();
    
    if (chartData.length === 0) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: isDarkMode ? '#b0b0b0' : '#666666'
        }}>
          <Typography>No data available for the selected filters</Typography>
        </Box>
      );
    }

    // For single metric display
    const isSingleMetric = ["finished", "raw"].includes(selectedCategory) && metricType;
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 70 }
    };

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <Card sx={{ 
            p: 1.5, 
            bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
            boxShadow: 3
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              mb: 1,
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              {label}
            </Typography>
            {payload.map((entry, index) => (
              <Typography key={index} sx={{ 
                fontSize: '0.85rem',
                color: entry.color
              }}>
                {entry.name}: {formatIndianNumber(entry.value)}
              </Typography>
            ))}
          </Card>
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
                tick={{ 
                  fontSize: isMobile ? 10 : 12,
                  fill: isDarkMode ? '#b0b0b0' : '#666666'
                }}
              />
              <YAxis 
                tick={{ 
                  fontSize: isMobile ? 10 : 12,
                  fill: isDarkMode ? '#b0b0b0' : '#666666'
                }}
                tickFormatter={(value) => formatIndianNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {isSingleMetric ? (
                <Bar 
                  dataKey={metricLabel} 
                  fill={colors[0]} 
                  name={metricLabel}
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['name', 'category'].includes(key))
                  .map((key, index) => (
                    <Bar 
                      key={key}
                      dataKey={key} 
                      fill={colors[index % colors.length]}
                      name={key}
                      radius={[4, 4, 0, 0]}
                    />
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
                tick={{ 
                  fontSize: isMobile ? 10 : 12,
                  fill: isDarkMode ? '#b0b0b0' : '#666666'
                }}
              />
              <YAxis 
                tick={{ 
                  fontSize: isMobile ? 10 : 12,
                  fill: isDarkMode ? '#b0b0b0' : '#666666'
                }}
                tickFormatter={(value) => formatIndianNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {isSingleMetric ? (
                <Line 
                  type="monotone" 
                  dataKey={metricLabel} 
                  stroke={colors[0]} 
                  name={metricLabel}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['name', 'category'].includes(key))
                  .map((key, index) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={colors[index % colors.length]}
                      name={key}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={isMobile ? 80 : 100}
                fill="#8884d8"
                dataKey={isSingleMetric ? metricLabel : "Production"}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatIndianNumber(value), "Value"]}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
                  borderColor: isDarkMode ? '#444' : '#e0e0e0'
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
                tick={{ 
                  fontSize: isMobile ? 10 : 12,
                  fill: isDarkMode ? '#b0b0b0' : '#666666'
                }}
              />
              <YAxis 
                tick={{ 
                  fontSize: isMobile ? 10 : 12,
                  fill: isDarkMode ? '#b0b0b0' : '#666666'
                }}
                tickFormatter={(value) => formatIndianNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {isSingleMetric ? (
                <Area 
                  type="monotone" 
                  dataKey={metricLabel} 
                  stroke={colors[0]} 
                  fill={colors[0]}
                  fillOpacity={0.6}
                  name={metricLabel}
                />
              ) : (
                chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['name', 'category'].includes(key))
                  .map((key, index) => (
                    <Area 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.6}
                      name={key}
                    />
                  ))
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: isDarkMode ? '#b0b0b0' : '#666666'
          }}>
            <Typography>Select a chart type</Typography>
          </Box>
        );
    }
  };

  /* ================= RENDER FUNCTIONS ================= */
  // 1. Render Finished Goods Table
  const renderFinishedGoodsTable = () => {
  if (!data || !brands.length) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 4,
        color: isDarkMode ? '#b0b0b0' : '#666666'
      }}>
        <Typography variant="h6">
          No data available
        </Typography>
       
      </Box>
    );
  }
  
  const grandTotals = calculateGrandTotals();
    
    
    /* ========= MOBILE VERSION ========= */
    if (isMobile) {
      let grand = { o: 0, p: 0, d: 0, c: 0 };

      return (
        <Stack spacing={2} sx={{ width: "100%" }}>
          {brands.map((cat) => {
            const items = data.finished[cat];
            const sub = calcTotals(items);
            const pct = calcProdPercentage(items);

            grand.o += sub.o;
            grand.p += sub.p;
            grand.d += sub.d;
            grand.c += sub.c;

            return (
              <Card 
                key={cat} 
                sx={{ 
                  width: "100%", 
                  maxWidth: "100%",
                  bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
                  border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0'
                }}
              >
                <CardHeader
                  title={
                    <Typography sx={{ 
                      fontSize: "0.9rem", 
                      fontWeight: 700,
                      color: isDarkMode ? '#ffffff' : '#000000'
                    }}>
                      Sub Total - {cat}
                    </Typography>
                  }
                  action={
                    <IconButton
                      onClick={() =>
                        setCollapsedCats((p) => ({ ...p, [cat]: !p[cat] }))
                      }
                      sx={{
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}
                    >
                      {collapsedCats[cat] ? (
                        <KeyboardArrowDown />
                      ) : (
                        <KeyboardArrowUp />
                      )}
                    </IconButton>
                  }
                  sx={{
                    bgcolor: isDarkMode ? '#333' : '#f3f9ff',
                    py: 1,
                    px: 2
                  }}
                />

                <Collapse in={!collapsedCats[cat]}>
                  <CardContent>
                    {items.map((i, idx) => (
                      <Card 
                        key={idx} 
                        variant="outlined" 
                        sx={{ 
                          mb: 1, 
                          p: 1,
                          bgcolor: isDarkMode ? '#2a2a2a' : '#ffffff',
                          borderColor: isDarkMode ? '#444' : '#e0e0e0'
                        }}
                      >
                        <Typography fontWeight={600} mb={0.5} sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                          {i.description}
                        </Typography>
                        <MobileRow 
                          label="Opening" 
                          value={fmt(i.opening)} 
                          isDarkMode={isDarkMode} 
                        />
                        <MobileRow
                          label="Production"
                          value={fmt(i["purchased/transfer in"])}
                          isDarkMode={isDarkMode}
                        />
                        <MobileRow
                          label="Total"
                          value={fmt(i.opening + i["purchased/transfer in"])}
                          isDarkMode={isDarkMode}
                        />
                        <MobileRow 
                          label="Dispatch" 
                          value={fmt(i.sold)} 
                          isDarkMode={isDarkMode} 
                        />
                        <MobileRow
                          label="Closing"
                          value={fmt(i.closing)}
                          highlight
                          isDarkMode={isDarkMode}
                        />
                        <MobileRow
                          label="Prod %"
                          value={`${i.prod_percentage || 0}%`}
                          isDarkMode={isDarkMode}
                        />
                      </Card>
                    ))}
                  </CardContent>
                </Collapse>

                <CardContent sx={{ 
                  bgcolor: isDarkMode ? '#333' : "#f3f9ff" 
                }}>
                  <Typography fontWeight={700} mb={0.5} sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Sub Total
                  </Typography>
                  <MobileRow label="Opening" value={fmt(sub.o)} isDarkMode={isDarkMode} />
                  <MobileRow label="Production" value={fmt(sub.p)} isDarkMode={isDarkMode} />
                  <MobileRow label="Total" value={fmt(sub.o + sub.p)} isDarkMode={isDarkMode} />
                  <MobileRow label="Dispatch" value={fmt(sub.d)} isDarkMode={isDarkMode} />
                  <MobileRow label="Closing" value={fmt(sub.c)} highlight isDarkMode={isDarkMode} />
                  <MobileRow label="Prod %" value={`${pct}%`} isDarkMode={isDarkMode} />
                </CardContent>
              </Card>
            );
          })}

          {/* GRAND TOTAL */}
          <Card sx={{ 
            bgcolor: isDarkMode ? '#0c2e60' : "#0e3978", 
            color: "#fff", 
            width: "100%" 
          }}>
            <CardContent>
              <Typography fontWeight={700} mb={1}>
                Grand Total - Fried Gram
              </Typography>
              <MobileRow label="Opening" value={fmt(grand.o)} isDarkMode />
              <MobileRow label="Production" value={fmt(grand.p)} isDarkMode />
              <MobileRow label="Total" value={fmt(grand.o + grand.p)} isDarkMode />
              <MobileRow label="Dispatch" value={fmt(grand.d)} isDarkMode />
              <MobileRow label="Closing" value={fmt(grand.c)} highlight isDarkMode />
              <MobileRow label="Prod %" value="100%" isDarkMode />
            </CardContent>
          </Card>
        </Stack>
      );
    }

    /* ========= DESKTOP VERSION ========= */
    return (
      <TableContainer
        sx={{
          maxHeight: 600,
          overflowX: 'auto',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: isDarkMode ? '#333' : '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDarkMode ? '#555' : '#888',
            borderRadius: 4,
          },
        }}
      >
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                fontWeight: 700,
                color: tableThemes.finished.primary,
                width: columnWidths.arrow,
                py: isMobile ? 0.5 : 1,
                borderBottom: `2px solid ${tableThemes.finished.primary}`,
                background: tableThemes.finished.light,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {/* Arrow column */}
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: tableThemes.finished.primary,
                minWidth: columnWidths.description,
                py: isMobile ? 0.5 : 1,
                borderBottom: `2px solid ${tableThemes.finished.primary}`,
                background: tableThemes.finished.light,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                Fried Gram
              </TableCell>
              {getTableHeaders().map((header, idx) => (
                <TableCell key={idx} align="right" sx={{
                  fontWeight: 700,
                  color: tableThemes.finished.primary,
                  width: header === 'Prod %' ? columnWidths.percentage : columnWidths.number,
                  py: isMobile ? 0.5 : 1,
                  borderBottom: `2px solid ${tableThemes.finished.primary}`,
                  background: tableThemes.finished.light,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {header}
                </TableCell>
              ))}
              <TableCell align="right" sx={{
                fontWeight: 700,
                color: tableThemes.finished.primary,
                width: columnWidths.percentage,
                py: isMobile ? 0.5 : 1,
                borderBottom: `2px solid ${tableThemes.finished.primary}`,
                background: tableThemes.finished.light,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                Prod %
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((cat, brandIndex) => {
              const items = data.finished[cat] || [];
              const subtotal = items.reduce((acc, i) => ({
                opening: acc.opening + (i.opening || 0),
                produced: acc.produced + (i["purchased/transfer in"] || 0),
                total: acc.total + ((i.opening || 0) + (i["purchased/transfer in"] || 0)),
                dispatch: acc.dispatch + (i.sold || 0),
                closing: acc.closing + (i.closing || 0),
              }), { opening: 0, produced: 0, total: 0, dispatch: 0, closing: 0 });
              
              const subtotalPercentage = calcProdPercentage(items);
              
              return (
                <React.Fragment key={cat}>
                  <TableRow
                    sx={{
                      background: brandIndex % 2 === 0
                        ? tableThemes.finished.light
                        : isDarkMode
                          ? 'rgba(255, 255, 255, 0.03)'
                          : '#f8fafc',
                      cursor: "pointer",
                      "&:hover": {
                        background: isDarkMode
                          ? `${tableThemes.finished.primary}25`
                          : `${tableThemes.finished.primary}10`
                      }
                    }}
                    onClick={() =>
                      setCollapsedCats((p) => ({ ...p, [cat]: !p[cat] }))
                    }
                  >
                    <TableCell sx={{
                      width: columnWidths.arrow,
                      py: isMobile ? 0.5 : 1,
                      borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
                    }}>
                      <IconButton
                        size="small"
                        sx={{
                          p: isMobile ? 0.25 : 0.5,
                          color: isDarkMode ? '#ffffff' : '#000000',
                          '& .MuiSvgIcon-root': {
                            fontSize: isMobile ? 16 : 20
                          }
                        }}
                      >
                        {collapsedCats[cat] ?
                          <KeyboardArrowDown /> :
                          <KeyboardArrowUp />
                        }
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{
                      fontWeight: 700,
                      color: isDarkMode ? '#ffffff' : tableThemes.finished.primary,
                      minWidth: columnWidths.description,
                      py: isMobile ? 0.5 : 1,
                      borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                      fontSize: isMobile ? '0.7rem' : '0.875rem'
                    }}>
                      {isMobile ? `Sub - ${cat.slice(0, 15)}...` : `Sub Total - ${cat}`}
                    </TableCell>
                    {[subtotal.opening, subtotal.produced, subtotal.total, subtotal.dispatch, subtotal.closing].map((value, idx) => (
                      <TableCell key={idx} align="right" sx={{
                        width: columnWidths.number,
                        py: isMobile ? 0.5 : 1,
                        borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                        fontWeight: 600,
                        color: isDarkMode ? '#ffffff' : '#000000',
                        fontSize: isMobile ? '0.7rem' : '0.875rem'
                      }}>
                        {formatIndianNumber(value)}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{
                      width: columnWidths.percentage,
                      py: isMobile ? 0.5 : 1,
                      fontSize: isMobile ? '0.7rem' : '0.875rem'
                    }}>
                      <Chip
                        label={formatPercentage(subtotalPercentage)}
                        size="small"
                        sx={{
                          background: subtotalPercentage > 80 ? "#4caf50" :
                                    subtotalPercentage > 60 ? "#ff9800" : "#f44336",
                          color: "white",
                          fontWeight: 600,
                          fontSize: isMobile ? '0.6rem' : '0.75rem',
                          height: isMobile ? 18 : 20,
                          minWidth: isMobile ? 40 : 50
                        }}
                      />
                    </TableCell>
                  </TableRow>
                 
                  {!collapsedCats[cat] && items.map((item, i) => (
                    <TableRow
                      key={i}
                      sx={{
                        display: collapsedCats[cat] ? 'none' : 'table-row',
                        background: i % 2 === 0
                          ? (isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#fafafa')
                          : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'),
                        "&:hover": {
                          background: isDarkMode
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#f5f5f5'
                        }
                      }}
                    >
                      <TableCell sx={{
                        width: columnWidths.arrow,
                        py: isMobile ? 0.5 : 1,
                        borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
                      }}>
                        {/* Empty cell */}
                      </TableCell>
                      <TableCell sx={{
                        pl: 4,
                        color: isDarkMode ? '#cfd8dc' : 'text.secondary',
                        minWidth: columnWidths.description,
                        py: isMobile ? 0.5 : 1,
                        borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                        whiteSpace: isMobile ? 'nowrap' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: isMobile ? '0.7rem' : '0.875rem'
                      }}>
                        {isMobile
                          ? (item.description || 'No Desc').slice(0, 20) + (item.description?.length > 20 ? '...' : '')
                          : (item.description || 'No Description')
                        }
                      </TableCell>
                      {[
                        item.opening || 0,
                        item["purchased/transfer in"] || 0,
                        (item.opening || 0) + (item["purchased/transfer in"] || 0),
                        item.sold || 0,
                        item.closing || 0
                      ].map((value, idx) => (
                        <TableCell key={idx} align="right" sx={{
                          width: columnWidths.number,
                          py: isMobile ? 0.5 : 1,
                          borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                          color: isDarkMode ? '#e0e0e0' : 'text.primary',
                          fontSize: isMobile ? '0.7rem' : '0.875rem'
                        }}>
                          {formatIndianNumber(value)}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{
                        width: columnWidths.percentage,
                        py: isMobile ? 0.5 : 1,
                        fontSize: isMobile ? '0.7rem' : '0.875rem'
                      }}>
                        <Chip
                          label={formatPercentage(item.prod_percentage)}
                          size="small"
                          sx={{
                            background: item.prod_percentage > 80 ? "#4caf50" :
                                      item.prod_percentage > 60 ? "#ff9800" : "#f44336",
                            color: "white",
                            fontWeight: 600,
                            fontSize: isMobile ? '0.6rem' : '0.75rem',
                            height: isMobile ? 18 : 20,
                            minWidth: isMobile ? 40 : 50
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
           
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, #0c2e60 0%, #0e3978 100%)',
                fontWeight: 'bold',
                '& td, & th': {
                  color: '#ffffff',
                  fontWeight: 700,
                },
                borderTop: '3px solid rgba(255,255,255,0.6)',
                borderBottom: '3px solid rgba(255,255,255,0.6)',
              }}
            >
              <TableCell
                colSpan={2}
                sx={{
                  minWidth: columnWidths.description,
                  py: isMobile ? 1 : 1.5,
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontSize: isMobile ? '0.7rem' : '0.875rem',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {isMobile ? 'Grand Total' : 'Grand Total - Fried Gram'}
                </Typography>
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: columnWidths.number,
                  py: isMobile ? 1 : 1.5,
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                  fontSize: isMobile ? '0.7rem' : '0.875rem',
                }}
              >
                {formatIndianNumber(grandTotals.opening)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: columnWidths.number,
                  py: isMobile ? 1 : 1.5,
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                  fontSize: isMobile ? '0.7rem' : '0.875rem',
                }}
              >
                {formatIndianNumber(grandTotals.production)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: columnWidths.number,
                  py: isMobile ? 1 : 1.5,
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                  fontSize: isMobile ? '0.7rem' : '0.875rem',
                }}
              >
                {formatIndianNumber(grandTotals.total)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: columnWidths.number,
                  py: isMobile ? 1 : 1.5,
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                  fontSize: isMobile ? '0.7rem' : '0.875rem',
                }}
              >
                {formatIndianNumber(grandTotals.dispatch)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: columnWidths.number,
                  py: isMobile ? 1 : 1.5,
                  borderRight: '1px solid rgba(255,255,255,0.3)',
                  fontSize: isMobile ? '0.7rem' : '0.875rem',
                }}
              >
                {formatIndianNumber(grandTotals.closing)}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  width: columnWidths.percentage,
                  py: isMobile ? 1 : 1.5,
                }}
              >
                <Chip
                  label="100%"
                  size="small"
                  sx={{
                    background: '#ffffff',
                    color: '#0e3978',
                    fontWeight: 700,
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    height: isMobile ? 18 : 20,
                    minWidth: isMobile ? 40 : 50,
                  }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 2. Render Raw Materials Table
  const renderRawMaterialsTable = () => {
  if (!data?.raw?.["All Raw Materials"] || data.raw["All Raw Materials"].length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 4,
        color: isDarkMode ? '#b0b0b0' : '#666666'
      }}>
        <Typography variant="h6">
          No data available
        </Typography>
        
      </Box>
    );
  }   
    const rawItems = data.raw["All Raw Materials"] || [];
    const headers = ['Opening', 'Arrival', 'Total', 'Used', 'Closing'];
    const mobileHeaders = ['Open', 'Arr', 'Total', 'Used', 'Close'];
    
    /* ========= MOBILE VERSION ========= */
    if (isMobile) {
      return (
        <Stack spacing={2} sx={{ width: "100%" }}>
          {rawItems.map((item, idx) => (
            <Card 
              key={idx} 
              variant="outlined" 
              sx={{ 
                p: 1,
                bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
                borderColor: isDarkMode ? '#444' : '#e0e0e0'
              }}
            >
              <Typography fontWeight={600} mb={0.5} sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                {item.description}
              </Typography>
              <MobileRow label="Opening" value={fmt(item.opening || 0)} isDarkMode={isDarkMode} />
              <MobileRow label="Arrival" value={fmt(item["purchased/transfer in"] || 0)} isDarkMode={isDarkMode} />
              <MobileRow label="Total" value={fmt((item.opening || 0) + (item["purchased/transfer in"] || 0))} isDarkMode={isDarkMode} />
              <MobileRow label="Used" value={fmt(item["consumed/transfer out"] || 0)} isDarkMode={isDarkMode} />
              <MobileRow label="Closing" value={fmt(item.closing || 0)} highlight isDarkMode={isDarkMode} />
            </Card>
          ))}
        </Stack>
      );
    }

    /* ========= DESKTOP VERSION ========= */
    return (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                fontWeight: 700,
                color: tableThemes.raw.primary,
                width: columnWidths.arrow,
                background: tableThemes.raw.light,
                py: isMobile ? 0.5 : 1,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}></TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: tableThemes.raw.primary,
                minWidth: columnWidths.description,
                background: tableThemes.raw.light,
                py: isMobile ? 0.5 : 1,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                Raw Material
              </TableCell>
              {(isMobile ? mobileHeaders : headers).map((header, idx) => (
                <TableCell key={idx} align="right" sx={{
                  fontWeight: 700,
                  color: tableThemes.raw.primary,
                  width: columnWidths.number,
                  background: tableThemes.raw.light,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rawItems.map((item, i) => (
              <TableRow
                key={i}
                sx={{
                  background: i % 2 === 0 ? tableThemes.raw.light : 'inherit',
                  "&:hover": {
                    background: isDarkMode
                      ? `${tableThemes.raw.primary}20`
                      : `${tableThemes.raw.primary}10`
                  }
                }}
              >
                <TableCell sx={{ 
                  width: columnWidths.arrow, 
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}></TableCell>
                <TableCell sx={{
                  pl: 4,
                  color: isDarkMode ? '#cfd8dc' : 'text.secondary',
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile
                    ? (item.description || 'No Desc').slice(0, 20) + (item.description?.length > 20 ? '...' : '')
                    : (item.description || 'No Description')
                  }
                </TableCell>
                {[
                  item.opening || 0,
                  item["purchased/transfer in"] || 0,
                  (item.opening || 0) + (item["purchased/transfer in"] || 0),
                  item["consumed/transfer out"] || 0,
                  item.closing || 0
                ].map((value, idx) => (
                  <TableCell key={idx} align="right" sx={{
                    width: columnWidths.number,
                    py: isMobile ? 0.5 : 1,
                    color: isDarkMode ? '#ffffff' : '#000000',
                    fontSize: isMobile ? '0.7rem' : '0.875rem'
                  }}>
                    {formatIndianNumber(value)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 3. Render Packing Table
  const renderPackingTable = () => {
     const { friedGram, bengalGram } = {
    friedGram: data?.finished?.["FRIED GRAM"] || [],
    bengalGram: data?.finished?.["BENGAL GRAM"] || []
  };
  
  if (friedGram.length === 0 && bengalGram.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 4,
        color: isDarkMode ? '#b0b0b0' : '#666666'
      }}>
        <Typography variant="h6">
          No data available
        </Typography>
        {/* <Typography variant="body2" sx={{ mt: 1 }}>
          Try selecting a different date range
        </Typography> */}
      </Box>
    );
  }
    
    // if (friedGram.length === 0 && bengalGram.length === 0) return null;
    
    const friedGramTotal = friedGram.reduce((sum, i) => sum + (i["purchased/transfer in"] || 0), 0);
    const bengalGramTotal = bengalGram.reduce((sum, i) => sum + (i["purchased/transfer in"] || 0), 0);
    
    /* ========= MOBILE VERSION ========= */
    if (isMobile) {
      return (
        <Stack spacing={2} sx={{ width: "100%" }}>
          {/* Fried Gram Section */}
          {friedGram.length > 0 && (
            <Card sx={{ 
              width: "100%",
              bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
              border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0'
            }}>
              <CardHeader
                title={
                  <Typography sx={{ 
                    fontSize: "0.9rem", 
                    fontWeight: 700,
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}>
                    Fried Gram
                  </Typography>
                }
                sx={{
                  bgcolor: isDarkMode ? '#333' : '#f3f9ff',
                  py: 1,
                  px: 2
                }}
              />
              <CardContent>
                {friedGram.map((item, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      mb: 1, 
                      pb: 1, 
                      borderBottom: isDarkMode ? "1px solid #444" : "1px solid #eee" 
                    }}
                  >
                    <Typography fontWeight={600} fontSize="0.8rem" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                      {item.description}
                    </Typography>
                    <MobileRow 
                      label="Production" 
                      value={fmt(item["purchased/transfer in"] || 0)} 
                      isDarkMode={isDarkMode} 
                    />
                  </Box>
                ))}
                <Box sx={{ 
                  mt: 2, 
                  pt: 1, 
                  borderTop: isDarkMode ? "2px solid #555" : "2px solid #ccc" 
                }}>
                  <Typography fontWeight={700} fontSize="0.9rem" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Sub Total: {fmt(friedGramTotal)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Bengal Gram Section */}
          {bengalGram.length > 0 && (
            <Card sx={{ 
              width: "100%",
              bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
              border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0'
            }}>
              <CardHeader
                title={
                  <Typography sx={{ 
                    fontSize: "0.9rem", 
                    fontWeight: 700,
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}>
                    Bengal Gram
                  </Typography>
                }
                sx={{
                  bgcolor: isDarkMode ? '#333' : '#f3f9ff',
                  py: 1,
                  px: 2
                }}
              />
              <CardContent>
                {bengalGram.map((item, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      mb: 1, 
                      pb: 1, 
                      borderBottom: isDarkMode ? "1px solid #444" : "1px solid #eee" 
                    }}
                  >
                    <Typography fontWeight={600} fontSize="0.8rem" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                      {item.description}
                    </Typography>
                    <MobileRow 
                      label="Production" 
                      value={fmt(item["purchased/transfer in"] || 0)} 
                      isDarkMode={isDarkMode} 
                    />
                  </Box>
                ))}
                <Box sx={{ 
                  mt: 2, 
                  pt: 1, 
                  borderTop: isDarkMode ? "2px solid #555" : "2px solid #ccc" 
                }}>
                  <Typography fontWeight={700} fontSize="0.9rem" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Sub Total: {fmt(bengalGramTotal)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Grand Total */}
          <Card sx={{ 
            bgcolor: isDarkMode ? '#6a1b9a' : tableThemes.packing.primary, 
            color: "#fff" 
          }}>
            <CardContent>
              <Typography fontWeight={700} mb={1}>
                Grand Total - Packing
              </Typography>
              <MobileRow label="Fried Gram" value={fmt(friedGramTotal)} isDarkMode={true} />
              <MobileRow label="Bengal Gram" value={fmt(bengalGramTotal)} isDarkMode={true} />
              <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(255,255,255,0.3)" }}>
                <Typography fontWeight={700}>
                  Total: {fmt((data?.total_prd || 0) + (data?.total_bengal_prd || 0))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      );
    }

    /* ========= DESKTOP VERSION ========= */
    return (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                fontWeight: 700,
                color: tableThemes.packing.primary,
                width: columnWidths.arrow,
                background: tableThemes.packing.light,
                py: isMobile ? 0.5 : 1,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}></TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: tableThemes.packing.primary,
                minWidth: columnWidths.description,
                background: tableThemes.packing.light,
                py: isMobile ? 0.5 : 1,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                Packing Item
              </TableCell>
              <TableCell align="right" sx={{
                fontWeight: 700,
                color: tableThemes.packing.primary,
                width: columnWidths.number,
                background: tableThemes.packing.light,
                py: isMobile ? 0.5 : 1,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {isMobile ? 'Prod' : 'Production'}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* FRIED GRAM Items */}
            {friedGram.map((item, i) => (
              <TableRow
                key={`fried-${i}`}
                sx={{
                  "&:hover": {
                    background: isDarkMode
                      ? `${tableThemes.packing.primary}20`
                      : `${tableThemes.packing.primary}10`
                  }
                }}
              >
                <TableCell sx={{ 
                  width: columnWidths.arrow, 
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}></TableCell>
                <TableCell sx={{
                  pl: 4,
                  color: isDarkMode ? '#cfd8dc' : 'text.secondary',
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile
                    ? (item.description || 'No Desc').slice(0, 20) + (item.description?.length > 20 ? '...' : '')
                    : (item.description || 'No Description')
                  }
                </TableCell>
                <TableCell align="right" sx={{
                  width: columnWidths.number,
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {formatIndianNumber(item["purchased/transfer in"] || 0)}
                </TableCell>
              </TableRow>
            ))}
           
            {/* FRIED GRAM Subtotal */}
            {friedGram.length > 0 && (
              <TableRow sx={{
                background: tableThemes.packing.light,
                fontWeight: 700
              }}>
                <TableCell sx={{ 
                  width: columnWidths.arrow, 
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}></TableCell>
                <TableCell sx={{
                  color: isDarkMode ? '#ffffff' : tableThemes.packing.primary,
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile ? 'Sub - Fried Gram' : 'Sub Total - FRIED GRAM'}
                </TableCell>
                <TableCell align="right" sx={{
                  color: isDarkMode ? '#ffffff' : tableThemes.packing.primary,
                  width: columnWidths.number,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {formatIndianNumber(friedGramTotal)}
                </TableCell>
              </TableRow>
            )}
           
            {/* BENGAL GRAM Items */}
            {bengalGram.map((item, i) => (
              <TableRow
                key={`bengal-${i}`}
                sx={{
                  "&:hover": {
                    background: isDarkMode
                      ? `${tableThemes.packing.primary}20`
                      : `${tableThemes.packing.primary}10`
                  }
                }}
              >
                <TableCell sx={{ 
                  width: columnWidths.arrow, 
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}></TableCell>
                <TableCell sx={{
                  pl: 4,
                  color: isDarkMode ? '#cfd8dc' : 'text.secondary',
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile
                    ? (item.description || 'No Desc').slice(0, 20) + (item.description?.length > 20 ? '...' : '')
                    : (item.description || 'No Description')
                  }
                </TableCell>
                <TableCell align="right" sx={{
                  width: columnWidths.number,
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000',
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {formatIndianNumber(item["purchased/transfer in"] || 0)}
                </TableCell>
              </TableRow>
            ))}
           
            {/* BENGAL GRAM Subtotal */}
            {bengalGram.length > 0 && (
              <TableRow sx={{
                background: tableThemes.packing.light,
                fontWeight: 700
              }}>
                <TableCell sx={{ 
                  width: columnWidths.arrow, 
                  py: isMobile ? 0.5 : 1,
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}></TableCell>
                <TableCell sx={{
                  color: isDarkMode ? '#ffffff' : tableThemes.packing.primary,
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile ? 'Sub - Bengal Gram' : 'Sub Total - BENGAL GRAM'}
                </TableCell>
                <TableCell align="right" sx={{
                  color: isDarkMode ? '#ffffff' : tableThemes.packing.primary,
                  width: columnWidths.number,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {formatIndianNumber(bengalGramTotal)}
                </TableCell>
              </TableRow>
            )}
           
            {/* Grand Total */}
            <TableRow
              sx={{
                background: tableThemes.packing.gradient,
                '& td, & th': {
                  color: '#ffffff',
                  fontWeight: 700,
                },
              }}
            >
              <TableCell colSpan={2} sx={{ minWidth: columnWidths.description }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  {isMobile ? 'Grand Total' : 'Grand Total - Packing'}
                </Typography>
              </TableCell>

              <TableCell align="right">
                {formatIndianNumber((data?.total_prd || 0) + (data?.total_bengal_prd || 0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  /* ================= UI ================= */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* <Box
        sx={{
          px: { xs: 1, sm: 2 },
          py: 2,
          width: "100%",
          maxWidth: "100vw",
          overflowX: "hidden",
          bgcolor: isDarkMode ? '#121212' : '#f5f5f5',
          minHeight: '100vh'
        }}
      > */}
     

      <motion.div
               initial={{ opacity: 0, y: -40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
             >
               <Box textAlign="center" mb={isMobile ? 3 : 6}>
                 <Typography variant="h1" sx={{
                   fontSize: isMobile ? "1.5rem" : isTablet ? "2rem" : "2.5rem",
                   fontWeight: 900,
                   background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                   WebkitBackgroundClip: "text",
                   WebkitTextFillColor:  '#038effff',
                   mb: isMobile ? 1 : 2
                 }}>
                  
                   {isMobile ? 'Production Report' : 'Fried Gram Production Report'}
                 </Typography>
                 <Typography variant="h6" color="textSecondary" sx={{
                   mb: isMobile ? 2 : 4,
                   fontSize: isMobile ? '0.8rem' : '1rem'
                 }}>
                   {isMobile ? 'Production overview' : 'Comprehensive overview of Production, Finished Goods, Raw Materials, and Packing'}
                 </Typography>
                 
               </Box>
             </motion.div>



<motion.div
  initial={{ opacity: 0, y: -40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  <Card
    sx={{ 
      mb: 3, 
      width: "100%", 
      maxWidth: "100%",
      bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
      border: isDarkMode ? '1px solid #333' : 'none',
      boxShadow: isDarkMode
        ? '0 4px 20px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.08)',
    }}
  >
    <CardHeader
      
      
      titleTypographyProps={{ 
        color: isDarkMode ? '#ffffff' : '#000000',
        fontWeight: 700 
      }}
    />

    <CardContent>
      <Grid container spacing={2}>
        {/* From Date */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="From Date"
            value={fromDate}
            format="dd/MM/yyyy"
            maxDate={toDate}
            onChange={(newValue) => {
              setFromDate(newValue);
              if (toDate && newValue > toDate) {
                setToDate(newValue);
              }
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  height: 56,
                  '& .MuiInputBase-root': {
                    height: 56,
                    color: isDarkMode ? '#ffffff' : '#000000',
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#b0b0b0' : 'rgba(0, 0, 0, 0.6)',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
                  },
                },
              },
            }}
          />
        </Grid>

        {/* To Date */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="To Date"
            value={toDate}
            format="dd/MM/yyyy"
            minDate={fromDate}
            onChange={(newValue) => {
              setToDate(newValue);
              if (fromDate && newValue < fromDate) {
                setFromDate(newValue);
              }
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  height: 56,
                  '& .MuiInputBase-root': {
                    height: 56,
                    color: isDarkMode ? '#ffffff' : '#000000',
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#b0b0b0' : 'rgba(0, 0, 0, 0.6)',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
                  },
                },
              },
            }}
          />
        </Grid>

        {/* Generate + Notification */}
        <Grid item xs={12} sm={4}>
          <Grid container spacing={isMobile ? 1 : 2} alignItems="stretch">
            {/* Generate Button */}
            <Grid item xs={12} md={notification.open ? 6 : 12}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchReport}
                startIcon={
                  loading ? (
                    <CircularProgress size={18} sx={{ color: '#ffffff' }} />
                  ) : (
                    <Refresh />
                  )
                }
                disabled={loading}
                sx={{
                  height: 56,
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: '#5B86E5',
                  '&:hover': { bgcolor: '#4570d0' },
                }}
              >
                Generate
              </Button>
            </Grid>

            {/* Notification */}
            {notification.open && (
              <Grid item xs={12} md={6}>
                <Collapse
                  in={notification.open}
                  orientation={isMobile ? 'vertical' : 'horizontal'}
                >
                  <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{
                      width: '100%',
                      minHeight: 56,
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: isDarkMode ? 3 : 2,
                      '& .MuiAlert-icon': { fontSize: 20 },
                      px: 1.25,
                    }}
                  >
                    <Box display="flex" flexDirection="column">
                      <Typography fontSize="0.8rem" fontWeight={600}>
                        {notification.title}
                      </Typography>
                      <Typography fontSize="0.75rem" opacity={0.9}>
                        {notification.message}
                      </Typography>
                    </Box>
                  </Alert>
                </Collapse>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
</motion.div>


        {/* Show reports only when data exists */}
       {/* ================= METRICS SUMMARY ================= */}
      {data && (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
  >
    <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 3 : 5}>
      {/* Finished Goods Total */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: tableThemes.finished.gradient,
            color: "white",
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Typography variant="subtitle2" gutterBottom sx={{
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                opacity: 0.9,
                fontWeight: 500,
                lineHeight: 1.2
              }}>
                Finished Goods Total
              </Typography>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {formatIndianNumber(data.total_prd || 0)} 
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Execution Time */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: tableThemes.raw.gradient,
            color: "white",
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Typography variant="subtitle2" gutterBottom sx={{
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                opacity: 0.9,
                fontWeight: 500,
                lineHeight: 1.2
              }}>
                Execution Time
              </Typography>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {data.execution_time || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Average Production Percentage */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                <TrendingUp sx={{ fontSize: isMobile ? 14 : 16 }} />
                <Typography variant="subtitle2" sx={{
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  opacity: 0.9,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}>
                  Avg Prod %
                </Typography>
              </Box>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {formatPercentage(additionalMetrics.avgProdPercentage)}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Total Items */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                <Inventory sx={{ fontSize: isMobile ? 14 : 16 }} />
                <Typography variant="subtitle2" sx={{
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  opacity: 0.9,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}>
                  Total Items
                </Typography>
              </Box>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {formatIndianNumber(additionalMetrics.totalItems)}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Date Range Card */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                <CalendarToday sx={{ fontSize: isMobile ? 14 : 16 }} />
                <Typography variant="subtitle2" sx={{
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  opacity: 0.9,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}>
                  Date Range
                </Typography>
              </Box>
              <Typography variant="h6" sx={{
                fontSize: isMobile ? '0.7rem' : '0.85rem',
                fontWeight: 600,
                lineHeight: 1.2
              }}>
                {data.fromdate} to {data.todate}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Raw Materials Count */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            color: "white",
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                <Factory sx={{ fontSize: isMobile ? 14 : 16 }} />
                <Typography variant="subtitle2" sx={{
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  opacity: 0.9,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}>
                  Raw Materials
                </Typography>
              </Box>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {formatIndianNumber(additionalMetrics.rawMaterialsCount)}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Dispatch Percentage */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            color: colors.textPrimary,
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                <LocalShipping sx={{ fontSize: isMobile ? 14 : 16 }} />
                <Typography variant="subtitle2" sx={{
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  fontWeight: 500,
                  lineHeight: 1.2
                }}>
                  Dispatch Rate
                </Typography>
              </Box>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {formatPercentage(additionalMetrics.dispatchPercentage)}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Total Brands */}
      <Grid item xs={6} sm={4} md={3} lg={2.4}>
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
            color: colors.textPrimary,
            borderRadius: "12px",
            height: "100%",
            minHeight: isMobile ? "90px" : "110px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <CardContent sx={{ 
              p: isMobile ? 1 : 1.5,
              textAlign: "center",
              '&:last-child': { pb: isMobile ? 1 : 1.5 }
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={0.5}>
                <Assessment sx={{ fontSize: isMobile ? 14 : 16 }} />
                <Typography variant="subtitle2" sx={{
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                  fontWeight: 500,
                  lineHeight: 1.2
                }}>
                  Total Categories
                </Typography>
              </Box>
              <Typography variant="h5" sx={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                {formatIndianNumber(brands.length)}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  </motion.div>
)}

      {/* ================= REPORT TABLES ================= */}
      {data && (
        
          <>
                {/* 1. Finished Goods Report */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card sx={{ 
          mb: 3, 
          width: "100%", 
          maxWidth: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${tableThemes.finished.primary}20`,
          background: isDarkMode ? '#1e1e1e' : '#ffffff',
          boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Inventory sx={{
                    color: "white",
                    fontSize: isMobile ? 20 : 26
                  }} />
                  <Typography 
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    sx={{
                      fontSize: isMobile ? '0.95rem' : '1.15rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {isMobile ? 'Fried Gram Report' : 'Finished Goods - Fried Gram'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setFinishedCollapsed(!finishedCollapsed)}
                  size="small"
                  sx={{
                    color: "white",
                    p: 0.5,
                    '&:hover': { backgroundColor: "rgba(255,255,255,0.2)" }
                  }}
                >
                  {finishedCollapsed ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
                </IconButton>
              </Box>
            }
            sx={{
              background: tableThemes.finished.gradient,
              py: isMobile ? 1.8 : 2.5,
              px: isMobile ? 2 : 3,
            }}
          />
          <Collapse in={!finishedCollapsed}>
            <CardContent sx={{ p: isMobile ? 1 : 2 }}>
              {renderFinishedGoodsTable()}
            </CardContent>
          </Collapse>
        </Card>
      </motion.div>

      {/* 2. Raw Materials Usage */}
      <motion.div variants={itemVariants}>
        <Card sx={{
          mb: 3,
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${tableThemes.raw.primary}20`,
          background: isDarkMode ? '#1e1e1e' : '#ffffff',
          boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Factory sx={{
                    color: "white",
                    fontSize: isMobile ? 20 : 26
                  }} />
                  <Typography 
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    sx={{
                      fontSize: isMobile ? '0.95rem' : '1.15rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {isMobile ? 'Raw Materials' : 'Raw Materials Usage'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setRawCollapsed(!rawCollapsed)}
                  size="small"
                  sx={{
                    color: "white",
                    p: 0.5,
                    '&:hover': { backgroundColor: "rgba(255,255,255,0.2)" }
                  }}
                >
                  {rawCollapsed ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
                </IconButton>
              </Box>
            }
            sx={{
              background: tableThemes.raw.gradient,
              py: isMobile ? 1.8 : 2.5,
              px: isMobile ? 2 : 3,
            }}
          />
          <Collapse in={!rawCollapsed}>
            <CardContent sx={{ p: isMobile ? 1 : 2 }}>
              {renderRawMaterialsTable()}
            </CardContent>
          </Collapse>
        </Card>
      </motion.div>

      {/* 3. Packing Bengal Gram & Packing Fried Gram */}
      <motion.div variants={itemVariants}>
        <Card sx={{
          mb: 3,
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${tableThemes.packing.primary}20`,
          background: isDarkMode ? '#1e1e1e' : '#ffffff',
          boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1.5}>
                  <LocalShipping sx={{
                    color: "white",
                    fontSize: isMobile ? 20 : 26
                  }} />
                  <Typography 
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    sx={{
                      fontSize: isMobile ? '0.95rem' : '1.15rem',
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {isMobile ? 'Packing Report' : 'Packing Bengal Gram & Packing Fried Gram'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setPackingCollapsed(!packingCollapsed)}
                  size="small"
                  sx={{
                    color: "white",
                    p: 0.5,
                    '&:hover': { backgroundColor: "rgba(255,255,255,0.2)" }
                  }}
                >
                  {packingCollapsed ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
                </IconButton>
              </Box>
            }
            sx={{
              background: tableThemes.packing.gradient,
              py: isMobile ? 1.8 : 2.5,
              px: isMobile ? 2 : 3,
            }}
          />
          <Collapse in={!packingCollapsed}>
            <CardContent sx={{ p: isMobile ? 1 : 2 }}>
              {renderPackingTable()}
            </CardContent>
          </Collapse>
        </Card>
      </motion.div>

            {/* Enhanced Chart Section */}
            {brands.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card sx={{
                  p: isMobile ? 1.5 : { xs: 2, md: 4 },
                  borderRadius: isMobile ? "12px" : "16px",
                  background: colors.cardBackground,
                  border: `1px solid ${colors.primary}20`,
                  boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
                }}>
                  <CardHeader
                    title={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUp sx={{
                            color: colors.primary,
                            fontSize: isMobile ? 18 : 24
                          }} />
                          <Typography variant="h5" color={colors.textPrimary} sx={{
                            fontSize: isMobile ? '0.9rem' : isTablet ? '1.1rem' : '1.25rem',
                            fontWeight: 600
                          }}>
                            {isMobile ? 'Charts' : 'Visualization'}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => setChartCollapsed(!chartCollapsed)}
                          size="small"
                          sx={{
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '& .MuiSvgIcon-root': {
                              fontSize: isMobile ? 18 : 24
                            }
                          }}
                        >
                          {chartCollapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                        </IconButton>
                      </Box>
                    }
                    sx={{ px: 0, pt: 0 }}
                  />
                  <Collapse in={!chartCollapsed}>
                    <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 2 : 4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                          <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}>Category</InputLabel>
                          <Select
                            value={selectedCategory}
                            onChange={e => {
                              setSelectedCategory(e.target.value);
                              if (e.target.value === "packing") {
                                setMetricType("production");
                              } else if (e.target.value === "raw") {
                                setMetricType("opening");
                              } else {
                                setMetricType("produced");
                              }
                            }}
                            label="Category"
                            sx={{
                              color: isDarkMode ? '#ffffff' : '#000000',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
                              },
                            }}
                          >
                            <MenuItem value="finished">
                              <Box display="flex" alignItems="center" gap={1}>
                                <Inventory fontSize="small" />
                                {isMobile ? 'Finished' : 'Finished Goods'}
                              </Box>
                            </MenuItem>
                            <MenuItem value="raw">
                              <Box display="flex" alignItems="center" gap={1}>
                                <Factory fontSize="small" />
                                {isMobile ? 'Raw' : 'Raw Materials'}
                              </Box>
                            </MenuItem>
                            <MenuItem value="packing">
                              <Box display="flex" alignItems="center" gap={1}>
                                <LocalShipping fontSize="small" />
                                {isMobile ? 'Packing Bengal/Fried Gram' : 'Packing Bengal Gram & Fried Gram'}
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                     
                      {selectedCategory === "finished" && (
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}>Brand</InputLabel>
                            <Select
                              value={selectedBrand}
                              onChange={e => setSelectedBrand(e.target.value)}
                              label="Brand"
                              sx={{
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
                                },
                              }}
                            >
                              {brands.map(b => (
                                <MenuItem key={b} value={b}>
                                  {isMobile ? b.slice(0, 15) + (b.length > 15 ? '...' : '') : b}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                     
                      {selectedCategory !== "packing" && (
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}>Metric</InputLabel>
                            <Select
                              value={metricType}
                              onChange={e => setMetricType(e.target.value)}
                              label="Metric"
                              sx={{
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
                                },
                              }}
                            >
                              {[
                                { value: "produced", label: "Produced" },
                                { value: "opening", label: "Opening" },
                                { value: "total", label: "Total" },
                                { value: "dispatch", label: "Dispatch" },
                                { value: "closing", label: "Closing" },
                                { value: "prod_percentage", label: "Production %" },
                              ].filter(metric =>
                                selectedCategory === "finished" ||
                                (selectedCategory === "raw" && ["opening", "total", "dispatch", "closing"].includes(metric.value))
                              ).map(metric => (
                                <MenuItem key={metric.value} value={metric.value}>
                                  {isMobile ? metric.label.slice(0, 8) : metric.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                     
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                          <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : 'inherit' }}>Chart Type</InputLabel>
                          <Select
                            value={chartType}
                            onChange={e => setChartType(e.target.value)}
                            label="Chart Type"
                            sx={{
                              color: isDarkMode ? '#ffffff' : '#000000',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
                              },
                            }}
                          >
                            {[
                              { value: "bar", label: "Bar", icon: <ShowChart fontSize="small" /> },
                              { value: "line", label: "Line", icon: <ShowChart fontSize="small" /> },
                              { value: "pie", label: "Pie", icon: <ShowChart fontSize="small" /> },
                              { value: "area", label: "Area", icon: <ShowChart fontSize="small" /> },
                            ].map(chart => (
                              <MenuItem key={chart.value} value={chart.value}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {chart.icon}
                                  {isMobile ? chart.label : `${chart.label} Chart`}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                   
                    <Box sx={{
                      height: isMobile ? 250 : isTablet ? 300 : 400,
                      width: '100%'
                    }}>
                      {renderChart()}
                    </Box>
                  </Collapse>
                </Card>
              </motion.div>
            )}
          </>
        )}




      {/* </Box> */}
    </LocalizationProvider>
  );
};

export default Production;