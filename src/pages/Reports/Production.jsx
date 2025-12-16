import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Fab,
  Snackbar,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  CalendarToday,
  Refresh,
  Download,
  KeyboardArrowDown,
  KeyboardArrowUp,
  TrendingUp,
  Inventory,
  Factory,
  LocalShipping,
  BarChart as BarChartIcon,
  ShowChart,
  PieChart as PieChartIcon,
  StackedBarChart,
  ScatterPlot,
  Radar,
  ShowChart as AreaChartIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useColorMode } from "../../theme/ThemeContext";
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RadarChartRadar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Production = () => {
  const theme = useTheme();
  const { toggleMode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const isDarkMode = theme.palette.mode === "dark";

  // Enhanced color schemes for charts
  const getColorScheme = () => ({
    primary: isDarkMode ? "#90caf9" : "#0e3978",
    primaryLight: isDarkMode ? "#bbdefb" : "#1a5bb0",
    primaryDark: isDarkMode ? "#64b5f6" : "#0c2e60",
    accent: isDarkMode ? "#80deea" : "#00d4ff",
    gradient: isDarkMode 
      ? "linear-gradient(135deg, #0a0a0a 0%, #121212 50%, #1a1a1a 100%)"
      : "linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 50%, #d9e8ff 100%)",
    background: isDarkMode ? "rgba(18, 18, 18, 0.9)" : "rgba(255, 255, 255, 0.96)",
    textPrimary: isDarkMode ? "#ffffff" : "#0c2e60",
    cardBackground: isDarkMode ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.96)",
  });

  const colors = getColorScheme();

  // Enhanced chart colors for better visibility
  const chartColors = [
    "#4caf50", "#ff9800", "#9c27b0", "#00bcd4", "#8bc34a",
    "#ffc107", "#e91e63", "#3f51b5", "#009688", "#795548",
    "#0e3978", "#1a5bb0", "#00d4ff", "#7b61ff", "#ff6b6b", 
    "#2196f3", "#ff4081", "#8e24aa", "#43a047", "#fb8c00"
  ].map(color => isDarkMode ? 
    `${color}${color === "#ff6b6b" || color === "#00d4ff" || color === "#ff9800" ? "ff" : "cc"}` 
    : color
  );

  // Different color schemes for each table
  const tableThemes = {
    finished: {
      primary: isDarkMode ? "#90caf9" : "#0e3978",
      light: isDarkMode ? "rgba(144, 202, 249, 0.1)" : "#f0f7ff",
      gradient: isDarkMode 
        ? "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)"
        : "linear-gradient(135deg, #0e3978 0%, #1a5bb0 100%)",
    },
    raw: {
      primary: isDarkMode ? "#81c784" : "#2e7d32",
      light: isDarkMode ? "rgba(129, 199, 132, 0.1)" : "#f1f8e9",
      gradient: isDarkMode 
        ? "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)"
        : "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
    },
    packing: {
      primary: isDarkMode ? "#ff8a65" : "#d84315",
      light: isDarkMode ? "rgba(255, 138, 101, 0.1)" : "#fbe9e7",
      gradient: isDarkMode 
        ? "linear-gradient(135deg, #bf360c 0%, #d84315 100%)"
        : "linear-gradient(135deg, #d84315 0%, #ff5722 100%)",
    },
  };

const [fromDate, setFromDate] = useState(new Date());
const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Collapse states
  const [finishedCollapsed, setFinishedCollapsed] = useState(false);
  const [rawCollapsed, setRawCollapsed] = useState(true);
  const [packingCollapsed, setPackingCollapsed] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(false);
  
  // Brand-wise collapse states
  const [brandCollapsed, setBrandCollapsed] = useState({});

  // Chart states
  const [selectedCategory, setSelectedCategory] = useState("finished");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [metricType, setMetricType] = useState("produced");

  // Fetch report function
  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      showSnackbar("Please select valid dates", "error");
      return;
    }

    const payload = {
      fromdate: fromDate.toISOString().slice(0, 10),
      todate: toDate.toISOString().slice(0, 10),
      catgroup: "Fried Gram Mill",
      nstock: 0,
    };

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

      const res = await axios.post(
        "http://localhost:5000/api/reports/production-report",
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (!res.data || Object.keys(res.data).length === 0) {
        showSnackbar("No data found for the selected date range", "warning");
        setData(null);
        return;
      }

      setData(res.data);

      const brands = Object.keys(res.data.finished || {}).filter(
        k => Array.isArray(res.data.finished[k]) && res.data.finished[k].length > 0
      );
      
      if (brands.length > 0) {
        setSelectedBrand(brands[0]);
        // Initialize all brands as collapsed
        const initialCollapsed = {};
        brands.forEach(brand => {
          initialCollapsed[brand] = true;
        });
        setBrandCollapsed(initialCollapsed);
      }

      showSnackbar(`Report loaded successfully`, "success");
    } catch (err) {
      showSnackbar("Failed to load report: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate grand totals
  const calculateGrandTotals = () => {
    if (!data || !data.finished) return {
      opening: 0,
      production: 0,
      total: 0,
      dispatch: 0,
      closing: 0
    };

    let grandOpening = 0;
    let grandProduction = 0;
    let grandTotal = 0;
    let grandDispatch = 0;
    let grandClosing = 0;

    Object.values(data.finished || {}).forEach(brandItems => {
      (brandItems || []).forEach(item => {
        const opening = Number(item.opening || 0);
        const production = Number(item["purchased/transfer in"] || 0);
        const dispatch = Number(item.sold || 0);
        const closing = Number(item.closing || 0);

        grandOpening += opening;
        grandProduction += production;
        grandTotal += (opening + production);
        grandDispatch += dispatch;
        grandClosing += closing;
      });
    });

    return {
      opening: grandOpening,
      production: grandProduction,
      total: grandTotal,
      dispatch: grandDispatch,
      closing: grandClosing
    };
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!data) {
      showSnackbar("No data to export", "warning");
      return;
    }

    try {
      const rows = [];
      
      // Add finished goods data
      Object.entries(data.finished || {}).forEach(([brand, items]) => {
        // Calculate brand totals
        const brandTotal = items.reduce((acc, item) => ({
          opening: acc.opening + (item.opening || 0),
          production: acc.production + (item["purchased/transfer in"] || 0),
          total: acc.total + ((item.opening || 0) + (item["purchased/transfer in"] || 0)),
          dispatch: acc.dispatch + (item.sold || 0),
          closing: acc.closing + (item.closing || 0)
        }), { opening: 0, production: 0, total: 0, dispatch: 0, closing: 0 });

        // Add brand header
        rows.push({
          Brand: `Sub Total - ${brand}`,
          Description: "",
          Opening: brandTotal.opening,
          Production: brandTotal.production,
          Total: brandTotal.total,
          Dispatch: brandTotal.dispatch,
          Closing: brandTotal.closing,
          "Prod %": ""
        });
        
        // Add items for this brand
        (items || []).forEach(item => {
          rows.push({
            Brand: "",
            Description: item.description || "",
            Opening: item.opening || 0,
            Production: item["purchased/transfer in"] || 0,
            Total: (item.opening || 0) + (item["purchased/transfer in"] || 0),
            Dispatch: item.sold || 0,
            Closing: item.closing || 0,
            "Prod %": item.prod_percentage ? `${item.prod_percentage}%` : "0%"
          });
        });
        
        // Add empty row after each brand for spacing
        rows.push({});
      });

      // Calculate grand totals
      const grandTotals = calculateGrandTotals();
      
      // Add grand total
      rows.push({ 
        Brand: "GRAND TOTAL - FINISHED GOODS", 
        Opening: grandTotals.opening,
        Production: grandTotals.production,
        Total: grandTotals.total,
        Dispatch: grandTotals.dispatch,
        Closing: grandTotals.closing
      });

      // Add raw materials if available
      if (data.raw && data.raw["All Raw Materials"]) {
        rows.push({});
        rows.push({ Brand: "RAW MATERIALS USAGE" });
        rows.push({
          Brand: "Raw Material",
          Description: "",
          Opening: "Opening",
          Production: "Arrival",
          Total: "Total",
          Dispatch: "Used",
          Closing: "Closing",
          "Prod %": ""
        });
        
        data.raw["All Raw Materials"].forEach(item => {
          rows.push({
            Brand: "",
            Description: item.description || "",
            Opening: item.opening || 0,
            Production: item["purchased/transfer in"] || 0,
            Total: (item.opening || 0) + (item["purchased/transfer in"] || 0),
            Dispatch: item["consumed/transfer out"] || 0,
            Closing: item.closing || 0,
            "Prod %": ""
          });
        });
      }

      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Production Report");
      
      // Set column widths
      const wscols = [
        { wch: 30 }, // Brand
        { wch: 40 }, // Description
        { wch: 12 }, // Opening
        { wch: 12 }, // Production
        { wch: 12 }, // Total
        { wch: 12 }, // Dispatch
        { wch: 12 }, // Closing
        { wch: 10 }, // Prod %
      ];
      ws['!cols'] = wscols;

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const fileName = `Production_Report_${data.fromdate || 'from'}_to_${data.todate || 'to'}.xlsx`;
      saveAs(new Blob([buf]), fileName);
      showSnackbar("Excel file downloaded successfully!", "success");
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      showSnackbar("Failed to export to Excel", "error");
    }
  };

  const showSnackbar = (msg, sev = "success") => setSnackbar({ open: true, message: msg, severity: sev });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Format numbers with Indian comma style
  const formatIndianNumber = (num) => {
    if (!num && num !== 0) return "0";
    const numStr = Math.abs(Number(num)).toString();
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    if (otherNumbers !== '') {
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }
    return lastThree;
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (!value) return "0%";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Calculate average prod percentage for brand subtotal
  const calculateBrandProdPercentage = (items) => {
    if (!items || items.length === 0) return 0;
    const totalProduction = items.reduce((sum, item) => sum + (item["purchased/transfer in"] || 0), 0);
    const weightedPercentage = items.reduce((sum, item) => {
      const production = item["purchased/transfer in"] || 0;
      const percentage = parseFloat(item.prod_percentage) || 0;
      return sum + (production * percentage);
    }, 0);
    
    return totalProduction > 0 ? (weightedPercentage / totalProduction).toFixed(2) : 0;
  };

  // Get column widths based on screen size
  const getColumnWidths = () => {
    if (isMobile) {
      return {
        arrow: '30px',
        description: '150px',
        number: '60px',
        percentage: '70px'
      };
    } else if (isTablet) {
      return {
        arrow: '40px',
        description: '200px',
        number: '80px',
        percentage: '90px'
      };
    } else {
      return {
        arrow: '50px',
        description: '300px',
        number: '120px',
        percentage: '100px'
      };
    }
  };

  const columnWidths = getColumnWidths();

  // Get table headers based on screen size
  const getTableHeaders = () => {
    const headers = ['Opening', 'Production', 'Total', 'Dispatch', 'Closing', 'Prod %'];
    
    if (isMobile) {
      return headers.map(header => 
        header === 'Production' ? 'Prod' : 
        header === 'Dispatch' ? 'Disp' : 
        header === 'Percentage' ? '%' : 
        header
      );
    }
    return headers;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const getChartData = () => {
    if (!data) return [];

    if (selectedCategory === "finished") {
      if (!data?.finished?.[selectedBrand]) return [];
      return (data.finished[selectedBrand] || []).map((item, index) => ({
        name: isMobile 
          ? (item.description || "").slice(0, 12) + (item.description?.length > 12 ? "..." : "")
          : isTablet
          ? (item.description || "").slice(0, 18) + (item.description?.length > 18 ? "..." : "")
          : (item.description || "").slice(0, 25) + (item.description?.length > 25 ? "..." : ""),
        produced: Number(item["purchased/transfer in"] || 0),
        opening: Number(item.opening || 0),
        total: Number((item.opening || 0) + (item["purchased/transfer in"] || 0)),
        dispatch: Number(item.sold || 0),
        closing: Number(item.closing || 0),
        prod_percentage: Number(item.prod_percentage || 0),
        color: chartColors[index % chartColors.length],
      }));
    } else if (selectedCategory === "raw") {
      if (!data?.raw?.["All Raw Materials"]) return [];
      return (data.raw["All Raw Materials"] || []).map((item, index) => ({
        name: isMobile 
          ? (item.description || "").slice(0, 12) + (item.description?.length > 12 ? "..." : "")
          : isTablet
          ? (item.description || "").slice(0, 18) + (item.description?.length > 18 ? "..." : "")
          : (item.description || "").slice(0, 25) + (item.description?.length > 25 ? "..." : ""),
        opening: Number(item.opening || 0),
        arrival: Number(item["purchased/transfer in"] || 0),
        total: Number((item.opening || 0) + (item["purchased/transfer in"] || 0)),
        used: Number(item["consumed/transfer out"] || 0),
        closing: Number(item.closing || 0),
        color: chartColors[index % chartColors.length],
      }));
    } else if (selectedCategory === "packing") {
      const friedGramItems = data?.finished?.["FRIED GRAM"] || [];
      const bengalGramItems = data?.finished?.["BENGAL GRAM"] || [];
      
      const packingItems = [
        ...friedGramItems.map(item => ({ ...item, category: "FRIED GRAM" })),
        ...bengalGramItems.map(item => ({ ...item, category: "BENGAL GRAM" }))
      ];
      
      return packingItems.map((item, index) => ({
        name: isMobile 
          ? (item.description || "").slice(0, 12) + (item.description?.length > 12 ? "..." : "")
          : isTablet
          ? (item.description || "").slice(0, 18) + (item.description?.length > 18 ? "..." : "")
          : (item.description || "").slice(0, 25) + (item.description?.length > 25 ? "..." : ""),
        production: Number(item["purchased/transfer in"] || 0),
        category: item.category,
        color: chartColors[index % chartColors.length],
      }));
    }
    
    return [];
  };

  const renderChart = () => {
    const chartData = getChartData();
    if (chartData.length === 0) return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Typography variant="h6" color="textSecondary">
          No data available for selected category
        </Typography>
      </motion.div>
    );

    const metricKey = {
      finished: {
        produced: "produced",
        opening: "opening",
        total: "total",
        dispatch: "dispatch",
        closing: "closing",
        prod_percentage: "prod_percentage"
      },
      raw: {
        opening: "opening",
        arrival: "arrival",
        total: "total",
        used: "used",
        closing: "closing"
      },
      packing: {
        production: "production"
      }
    }[selectedCategory][metricType] || metricType;

    const metricLabel = {
      produced: "Produced",
      opening: "Opening",
      total: "Total",
      dispatch: "Dispatch",
      closing: "Closing",
      prod_percentage: "Production %",
      arrival: "Arrival",
      used: "Used",
      production: "Production"
    }[metricType] || metricType;

    // Enhanced chart colors
    const getChartColor = (index) => {
      const colorIndex = index % chartColors.length;
      return chartColors[colorIndex];
    };

    // Common XAxis configuration for straight labels
    const renderXAxis = () => (
      <XAxis 
        dataKey="name" 
        tick={{ 
          fill: colors.textPrimary,
          fontSize: isMobile ? 10 : 12,
          angle: 0, // Changed from -45/-90 to 0 for straight labels
          textAnchor: "middle" // Center align for straight labels
        }}
        interval={isMobile ? "preserveStartEnd" : 0}
        height={isMobile ? 60 : 80} // Increased height for better label spacing
        tickMargin={10} // Add margin between tick and label
        tickFormatter={(value) => {
          // Truncate long labels on mobile
          if (isMobile && value.length > 12) {
            return value.substring(0, 10) + '...';
          }
          if (isTablet && value.length > 20) {
            return value.substring(0, 18) + '...';
          }
          return value;
        }}
      />
    );

    // Common tooltip configuration
    const tooltipStyle = {
      backgroundColor: colors.background,
      borderColor: colors.primary,
      borderRadius: 8,
      color: colors.textPrimary,
      fontSize: isMobile ? 12 : 14
    };

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <PieChart>
            <Pie 
              data={chartData} 
              dataKey={metricKey} 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              outerRadius={isMobile ? 80 : 120} 
              label={(entry) => {
                // Simple label for pie chart
                const label = entry.name.length > 15 ? entry.name.substring(0, 12) + '...' : entry.name;
                return `${label}: ${entry[metricKey]}`;
              }}
              labelLine={{ strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getChartColor(index)}
                  stroke={isDarkMode ? "#333" : "#fff"}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value}`, metricLabel]}
              contentStyle={tooltipStyle}
            />
            <Legend 
              wrapperStyle={{ 
                fontSize: isMobile ? 10 : 12,
                marginTop: isMobile ? 10 : 20,
                padding: 5
              }}
              verticalAlign="bottom"
              height={isMobile ? 50 : 80}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "radar") {
      return (
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <RadarChart data={chartData}>
            <PolarGrid stroke={isDarkMode ? "#444" : "#ddd"} />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ 
                fill: colors.textPrimary, 
                fontSize: isMobile ? 10 : 12 
              }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              stroke={isDarkMode ? "#444" : "#ddd"} 
            />
            <RadarChartRadar
              name={metricLabel}
              dataKey={metricKey}
              stroke={colors.primary}
              fill={colors.primary}
              fillOpacity={0.6}
            />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            <Tooltip 
              contentStyle={tooltipStyle}
            />
          </RadarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#444" : "#ddd"} />
            {renderXAxis()}
            <YAxis 
              tick={{ 
                fill: colors.textPrimary,
                fontSize: isMobile ? 10 : 12 
              }} 
            />
            <Tooltip 
              contentStyle={tooltipStyle}
            />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            <Area 
              type="monotone" 
              dataKey={metricKey} 
              stroke={colors.primary} 
              fill={colors.primary}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    const ChartComp = chartType === "line" ? LineChart : BarChart;
    const DataComp = chartType === "line" ? Line : Bar;

    return (
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
        <ChartComp data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? "#444" : "#ddd"} 
          />
          {renderXAxis()}
          <YAxis 
            tick={{ 
              fill: colors.textPrimary,
              fontSize: isMobile ? 10 : 12 
            }}
          />
          <Tooltip 
            formatter={(value) => [`${value}`, metricLabel]}
            contentStyle={tooltipStyle}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: isMobile ? 10 : 12,
              paddingTop: 10
            }}
            verticalAlign={isMobile ? "bottom" : "top"}
          />
          {chartType === "line" ? (
            <Line 
              type="monotone" 
              dataKey={metricKey} 
              stroke={colors.primary} 
              strokeWidth={3}
              dot={{ r: isMobile ? 3 : 5, fill: colors.primary }}
              activeDot={{ r: isMobile ? 5 : 7, fill: colors.primary }}
            />
          ) : (
            <Bar 
              dataKey={metricKey} 
              fill={colors.primary}
              radius={[4, 4, 0, 0]}
            />
          )}
        </ChartComp>
      </ResponsiveContainer>
    );
  };

  // Get brands from data
  const brands = data ? Object.keys(data.finished || {}).filter(k => 
    !["RAW MATERIALS WAREHOUSE", "By Product"].includes(k) && 
    Array.isArray(data.finished[k]) && 
    data.finished[k].length > 0
  ) : [];

  // Render Finished Goods Table with FIXES
  const renderFinishedGoodsTable = () => {
    if (!data || !brands.length) return null;

    const grandTotals = calculateGrandTotals();

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
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((brand, brandIndex) => {
              const items = data.finished[brand] || [];
              const subtotal = items.reduce((acc, i) => ({
                opening: acc.opening + (i.opening || 0),
                produced: acc.produced + (i["purchased/transfer in"] || 0),
                total: acc.total + ((i.opening || 0) + (i["purchased/transfer in"] || 0)),
                dispatch: acc.dispatch + (i.sold || 0),
                closing: acc.closing + (i.closing || 0),
              }), { opening: 0, produced: 0, total: 0, dispatch: 0, closing: 0 });

              const avgProdPercentage = calculateBrandProdPercentage(items);

              return (
                <React.Fragment key={brand}>
                  {/* Brand Header Row */}
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
                    onClick={() => setBrandCollapsed(prev => ({...prev, [brand]: !prev[brand]}))}
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
                          '& .MuiSvgIcon-root': {
                            fontSize: isMobile ? 16 : 20
                          }
                        }}
                      >
                        {brandCollapsed[brand] ? 
                          <KeyboardArrowDown /> : 
                          <KeyboardArrowUp />
                        }
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: tableThemes.finished.primary,
                      minWidth: columnWidths.description,
                      py: isMobile ? 0.5 : 1,
                      borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                      fontSize: isMobile ? '0.7rem' : '0.875rem'
                    }}>
                      {isMobile ? `Sub - ${brand.slice(0, 15)}...` : `Sub Total - ${brand}`}
                    </TableCell>
                    {[subtotal.opening, subtotal.produced, subtotal.total, subtotal.dispatch, subtotal.closing].map((value, idx) => (
                      <TableCell key={idx} align="right" sx={{ 
                        width: columnWidths.number,
                        py: isMobile ? 0.5 : 1,
                        borderRight: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                        fontWeight: 600,
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
                        label={formatPercentage(avgProdPercentage)}
                        size="small"
                        sx={{ 
                          background: avgProdPercentage > 80 ? "#4caf50" : 
                                    avgProdPercentage > 60 ? "#ff9800" : "#f44336",
                          color: "white",
                          fontWeight: 600,
                          fontSize: isMobile ? '0.6rem' : '0.75rem',
                          height: isMobile ? 18 : 20,
                          minWidth: isMobile ? 40 : 50
                        }}
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Nested Items - FIX: Removed dots */}
                  {items.map((item, i) => (
                    <TableRow 
                      key={i}
                      sx={{ 
                        display: brandCollapsed[brand] ? 'none' : 'table-row',
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
                        {/* Removed the dot element */}
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
            
            {/* Grand Total Row */}
            <TableRow sx={{ 
              background: tableThemes.finished.gradient,
              fontWeight: "bold",
              color: "white"
            }}>
              <TableCell colSpan={2} sx={{ 
                minWidth: columnWidths.description,
                py: isMobile ? 1 : 1.5,
                borderRight: `1px solid rgba(255,255,255,0.2)`
              }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ 
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile ? 'Grand Total' : 'Grand Total - Finished Goods'}
                </Typography>
              </TableCell>
              
              {/* Opening */}
              <TableCell align="right" sx={{ 
                width: columnWidths.number,
                py: isMobile ? 1 : 1.5,
                borderRight: `1px solid rgba(255,255,255,0.2)`,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {formatIndianNumber(grandTotals.opening)}
              </TableCell>
              
              {/* Production */}
              <TableCell align="right" sx={{ 
                width: columnWidths.number,
                py: isMobile ? 1 : 1.5,
                borderRight: `1px solid rgba(255,255,255,0.2)`,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {formatIndianNumber(grandTotals.production)}
              </TableCell>
              
              {/* Total */}
              <TableCell align="right" sx={{ 
                width: columnWidths.number,
                py: isMobile ? 1 : 1.5,
                borderRight: `1px solid rgba(255,255,255,0.2)`,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {formatIndianNumber(grandTotals.total)}
              </TableCell>
              
              {/* Dispatch */}
              <TableCell align="right" sx={{ 
                width: columnWidths.number,
                py: isMobile ? 1 : 1.5,
                borderRight: `1px solid rgba(255,255,255,0.2)`,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {formatIndianNumber(grandTotals.dispatch)}
              </TableCell>
              
              {/* Closing */}
              <TableCell align="right" sx={{ 
                width: columnWidths.number,
                py: isMobile ? 1 : 1.5,
                borderRight: `1px solid rgba(255,255,255,0.2)`,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {formatIndianNumber(grandTotals.closing)}
              </TableCell>
              
              <TableCell align="right" sx={{ 
                width: columnWidths.percentage,
                py: isMobile ? 1 : 1.5
              }}>
                <Chip 
                  label="100%" 
                  size="small"
                  sx={{ 
                    background: "white", 
                    color: tableThemes.finished.primary, 
                    fontWeight: 700,
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    height: isMobile ? 18 : 20,
                    minWidth: isMobile ? 40 : 50
                  }} 
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render Raw Materials Table
  const renderRawMaterialsTable = () => {
    if (!data?.raw?.["All Raw Materials"]) return null;
    
    const rawItems = data.raw["All Raw Materials"] || [];
    const headers = ['Opening', 'Arrival', 'Total', 'Used', 'Closing'];
    const mobileHeaders = ['Open', 'Arr', 'Total', 'Used', 'Close'];

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
                <TableCell sx={{ width: columnWidths.arrow, py: isMobile ? 0.5 : 1 }}></TableCell>
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

  // Render Packing Production Table
  const renderPackingTable = () => {
    const { friedGram, bengalGram } = {
      friedGram: data?.finished?.["FRIED GRAM"] || [],
      bengalGram: data?.finished?.["BENGAL GRAM"] || []
    };
    
    const friedGramTotal = friedGram.reduce((sum, i) => sum + (i["purchased/transfer in"] || 0), 0);
    const bengalGramTotal = bengalGram.reduce((sum, i) => sum + (i["purchased/transfer in"] || 0), 0);

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
                <TableCell sx={{ width: columnWidths.arrow, py: isMobile ? 0.5 : 1 }}></TableCell>
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
                <TableCell sx={{ width: columnWidths.arrow, py: isMobile ? 0.5 : 1 }}></TableCell>
                <TableCell sx={{ 
                  color: tableThemes.packing.primary,
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile ? 'Sub - Fried Gram' : 'Sub Total - FRIED GRAM'}
                </TableCell>
                <TableCell align="right" sx={{ 
                  color: tableThemes.packing.primary,
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
                <TableCell sx={{ width: columnWidths.arrow, py: isMobile ? 0.5 : 1 }}></TableCell>
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
                <TableCell sx={{ width: columnWidths.arrow, py: isMobile ? 0.5 : 1 }}></TableCell>
                <TableCell sx={{ 
                  color: tableThemes.packing.primary,
                  minWidth: columnWidths.description,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile ? 'Sub - Bengal Gram' : 'Sub Total - BENGAL GRAM'}
                </TableCell>
                <TableCell align="right" sx={{ 
                  color: tableThemes.packing.primary,
                  width: columnWidths.number,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {formatIndianNumber(bengalGramTotal)}
                </TableCell>
              </TableRow>
            )}
            
            {/* Grand Total */}
            <TableRow sx={{ 
              background: tableThemes.packing.gradient,
              fontWeight: "bold",
              color: "white"
            }}>
              <TableCell colSpan={2} sx={{ 
                minWidth: columnWidths.description,
                py: isMobile ? 1 : 1.5
              }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ 
                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                }}>
                  {isMobile ? 'Grand Total' : 'Grand Total - Production'}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ 
                width: columnWidths.number,
                py: isMobile ? 1 : 1.5,
                fontSize: isMobile ? '0.7rem' : '0.875rem'
              }}>
                {formatIndianNumber(data.total_prd || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        minHeight: "100vh", 
        background: colors.gradient, 
        py: isMobile ? 2 : 4, 
        px: isMobile ? 1 : { xs: 2, md: 4 }, 
        pb: 16 
      }}>
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
              WebkitTextFillColor: "transparent",
              mb: isMobile ? 1 : 2
            }}>
              {isMobile ? 'Production Report' : 'Fried Gram Production Report'}
            </Typography>
            <Typography variant="h6" color="textSecondary" sx={{ 
              mb: isMobile ? 2 : 4, 
              fontSize: isMobile ? '0.8rem' : '1rem' 
            }}>
              {isMobile ? 'Production overview' : 'Comprehensive overview of production, raw materials, and packing'}
            </Typography>
          </Box>
        </motion.div>

        {/* Date Filter Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card elevation={0} sx={{ 
            borderRadius: isMobile ? "16px" : "24px", 
            mb: isMobile ? 3 : 6, 
            background: colors.cardBackground, 
            boxShadow: isDarkMode 
              ? "0 10px 30px rgba(0, 0, 0, 0.3)"
              : "0 10px 30px rgba(14,57,120,0.1)",
            overflow: "hidden"
          }}>
            <CardHeader
              title="Report Filters"
              avatar={<CalendarToday sx={{ 
                color: colors.primary,
                fontSize: isMobile ? 20 : 24 
              }} />}
              sx={{ 
                background: isDarkMode 
                  ? "linear-gradient(135deg, rgba(13, 71, 161, 0.8) 0%, rgba(21, 101, 192, 0.8) 100%)"
                  : "linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%)",
                borderBottom: `1px solid ${colors.primary}20`,
                color: colors.textPrimary,
                py: isMobile ? 1.5 : 2,
                '& .MuiCardHeader-title': {
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }
              }}
            />
            <CardContent>
              <Grid container spacing={2} alignItems="end">
                <Grid item xs={12} sm={6} md={4}>
                  <DatePicker 
                    label="From Date" 
                    value={fromDate} 
                    onChange={setFromDate} 
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        variant: "outlined",
                        size: isMobile ? "small" : "medium"
                      } 
                    }} 
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DatePicker 
                    label="To Date" 
                    value={toDate} 
                    onChange={setToDate} 
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        variant: "outlined",
                        size: isMobile ? "small" : "medium"
                      } 
                    }} 
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={fetchReport} 
                    disabled={loading} 
                    startIcon={loading ? <CircularProgress size={isMobile ? 18 : 22} /> : <Refresh />}
                    sx={{ 
                      py: isMobile ? 1 : 1.5, 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})`,
                      },
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    Generate Report
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {data && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Summary Cards - Responsive */}
            <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 3 : 5}>
              {[
                // { label: "From Date", value: data.fromdate || "N/A", theme: tableThemes.finished },
                // { label: "To Date", value: data.todate || "N/A", theme: tableThemes.finished },
                { label: "Total Production", value: `${data.total_prd || 0} Tons`, theme: tableThemes.raw },
                { label: "Execution Time", value: data.execution_time || "N/A", theme: tableThemes.packing }
              ].map((item, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                  <motion.div variants={itemVariants}>
                    <Card sx={{ 
                      background: item.theme.gradient,
                      color: "white",
                      borderRadius: "8px",
                      height: "100%"
                    }}>
                      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ 
                          fontSize: isMobile ? '0.6rem' : '0.75rem',
                          opacity: 0.9
                        }}>
                          {item.label}
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          fontWeight: 600
                        }}>
                          {item.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* 1. Finished Goods Report */}
            <motion.div variants={itemVariants}>
              <Card sx={{ 
                mb: isMobile ? 3 : 4, 
                borderRadius: isMobile ? "12px" : "16px", 
                overflow: "hidden",
                border: `1px solid ${tableThemes.finished.primary}20`,
                background: colors.cardBackground,
                // color: colors.textPrimary
              }}>
<CardHeader
  title={
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box display="flex" alignItems="center" gap={1}>
        <Inventory sx={{ 
          color: tableThemes.finished.primary,
          fontSize: isMobile ? 18 : 24 
        }} />
        <Typography variant="h5" fontWeight={700} color={colors.textPrimary} sx={{ 
          fontSize: isMobile ? '0.9rem' : isTablet ? '1.1rem' : '1.25rem'
        }}>
          {isMobile ? 'Finished Goods' : 'Finished Goods Report'}
        </Typography>
      </Box>
      <IconButton 
        onClick={() => setFinishedCollapsed(!finishedCollapsed)} 
        size="small"
        sx={{ 
          '& .MuiSvgIcon-root': {
            fontSize: isMobile ? 18 : 24
          }
        }}
      >
        {finishedCollapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
      </IconButton>
    </Box>
  }
  sx={{ 
    background: "linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)", // Blue gradient
    color: "white",
    py: isMobile ? 1 : 2
  }}
/>
                <Collapse in={!finishedCollapsed}>
                  {renderFinishedGoodsTable()}
                </Collapse>
              </Card>
            </motion.div>

            {/* 2. Raw Materials Usage */}
            <motion.div variants={itemVariants}>
              <Card sx={{ 
                mb: isMobile ? 3 : 4, 
                borderRadius: isMobile ? "12px" : "16px", 
                overflow: "hidden",
                border: `1px solid ${tableThemes.raw.primary}20`,
                background: colors.cardBackground
              }}>
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Factory sx={{ 
                          color: tableThemes.raw.primary,
                          fontSize: isMobile ? 18 : 24 
                        }} />
                        <Typography variant="h5" fontWeight={700} color={colors.textPrimary} sx={{ 
                          fontSize: isMobile ? '0.9rem' : isTablet ? '1.1rem' : '1.25rem'
                        }}>
                          {isMobile ? 'Raw Materials' : 'Raw Materials Usage'}
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={() => setRawCollapsed(!rawCollapsed)} 
                        size="small"
                        sx={{ 
                          '& .MuiSvgIcon-root': {
                            fontSize: isMobile ? 18 : 24
                          }
                        }}
                      >
                        {rawCollapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                      </IconButton>
                    </Box>
                  }
                  sx={{ 
                    background: tableThemes.raw.gradient,
                    color: "white",
                    py: isMobile ? 1 : 2
                  }}
                />
                <Collapse in={!rawCollapsed}>
                  {renderRawMaterialsTable()}
                </Collapse>
              </Card>
            </motion.div>

            {/* 3. Packing Production */}
            <motion.div variants={itemVariants}>
              <Card sx={{ 
                mb: isMobile ? 4 : 8, 
                borderRadius: isMobile ? "12px" : "16px", 
                overflow: "hidden",
                border: `1px solid ${tableThemes.packing.primary}20`,
                background: colors.cardBackground
              }}>
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalShipping sx={{ 
                          color: tableThemes.packing.primary,
                          fontSize: isMobile ? 18 : 24 
                        }} />
                        <Typography variant="h5" fontWeight={700} color={colors.textPrimary} sx={{ 
                          fontSize: isMobile ? '0.9rem' : isTablet ? '1.1rem' : '1.25rem'
                        }}>
                          {isMobile ? 'Packing' : 'Packing Production'}
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={() => setPackingCollapsed(!packingCollapsed)} 
                        size="small"
                        sx={{ 
                          '& .MuiSvgIcon-root': {
                            fontSize: isMobile ? 18 : 24
                          }
                        }}
                      >
                        {packingCollapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                      </IconButton>
                    </Box>
                  }
                  sx={{ 
                    background: tableThemes.packing.gradient,
                    color: "white",
                    py: isMobile ? 1 : 2
                  }}
                />
                <Collapse in={!packingCollapsed}>
                  {renderPackingTable()}
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
                  border: `1px solid ${colors.primary}20`
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
                            {isMobile ? 'Charts' : 'Production Visualization'}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => setChartCollapsed(!chartCollapsed)} 
                          size="small"
                          sx={{ 
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
                          <InputLabel>Category</InputLabel>
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
                                {isMobile ? 'Packing' : 'Packing Production'}
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {selectedCategory === "finished" && (
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                            <InputLabel>Brand</InputLabel>
                            <Select 
                              value={selectedBrand} 
                              onChange={e => setSelectedBrand(e.target.value)}
                              label="Brand"
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
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                          <InputLabel>Metric</InputLabel>
                          <Select 
                            value={metricType} 
                            onChange={e => setMetricType(e.target.value)}
                            label="Metric"
                          >
                            {[
                              { value: "produced", label: "Production" },
                              { value: "opening", label: "Opening" },
                              { value: "total", label: "Total" },
                              { value: "dispatch", label: "Dispatch" },
                              { value: "closing", label: "Closing" },
                              { value: "prod_percentage", label: "Production %" }
                            ].filter(metric => 
                              selectedCategory === "finished" || 
                              (selectedCategory === "raw" && ["opening", "arrival", "total", "used", "closing"].includes(metric.value)) ||
                              (selectedCategory === "packing" && metric.value === "production")
                            ).map(metric => (
                              <MenuItem key={metric.value} value={metric.value}>
                                {isMobile ? metric.label.slice(0, 8) : metric.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                          <InputLabel>Chart Type</InputLabel>
                          <Select 
                            value={chartType} 
                            onChange={e => setChartType(e.target.value)}
                            label="Chart Type"
                          >
                            {[
                              { value: "bar", label: "Bar", icon: <BarChartIcon fontSize="small" /> },
                              { value: "line", label: "Line", icon: <ShowChart fontSize="small" /> },
                              { value: "pie", label: "Pie", icon: <PieChartIcon fontSize="small" /> },
                              { value: "area", label: "Area", icon: <AreaChartIcon fontSize="small" /> },
                              { value: "radar", label: "Radar", icon: <Radar fontSize="small" /> }
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
          </motion.div>
        )}

        {/* Excel Download Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Fab 
            onClick={exportToExcel} 
            sx={{ 
              position: "fixed", 
              bottom: isMobile ? 16 : 40, 
              right: isMobile ? 16 : 40, 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.primary})`,
              },
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56
            }}
          >
            <Download sx={{ 
              fontSize: isMobile ? 20 : 24, 
              color: "white" 
            }} />
          </Fab>
        </motion.div>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity} 
              variant="filled"
              sx={{ 
                borderRadius: 2,
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }}
            >
              {snackbar.message}
            </Alert>
          </motion.div>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Production;