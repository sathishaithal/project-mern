import React from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";

import { motion } from "framer-motion";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import TimelineIcon from "@mui/icons-material/Timeline";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const Sales = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = React.useState(null);

  const monthlySales = [
    { month: "Jan", sales: 42000 },
    { month: "Feb", sales: 38000 },
    { month: "Mar", sales: 51000 },
    { month: "Apr", sales: 47000 },
    { month: "May", sales: 59000 },
    { month: "Jun", sales: 64000 },
  ];

  const categoryData = [
    { name: "Wheat Flour", value: 35 },
    { name: "Rice", value: 28 },
    { name: "Maida", value: 20 },
    { name: "Rava & Others", value: 17 },
  ];

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  const recentSales = [
    { id: "S001", date: "2025-06-10", customer: "Ramesh Stores", total: "₹48,500", status: "Completed" },
    { id: "S002", date: "2025-06-10", customer: "Shree Traders", total: "₹32,000", status: "Pending" },
    { id: "S003", date: "2025-06-09", customer: "Anand Bakery", total: "₹62,000", status: "Completed" },
    { id: "S004", date: "2025-06-09", customer: "Vishal Mart", total: "₹81,200", status: "Shipped" },
    { id: "S005", date: "2025-06-08", customer: "New Super Market", total: "₹41,000", status: "Completed" },
  ];

  const stats = [
    { title: "Total Sales", value: "₹3.84L", change: "+18.2%", color: "success", icon: <AttachMoneyIcon /> },
    { title: "Orders", value: "342", change: "+9", color: "primary", icon: <ShoppingCartIcon /> },
    { title: "Customers", value: "89", change: "+12", color: "info", icon: <PeopleIcon /> },
    { title: "Avg Order Value", value: "₹11,230", change: "+5.4%", color: "warning", icon: <TrendingUpIcon /> },
  ];

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
          transition: "background-color .3s ease",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Sales Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track revenue, orders, and performance in real-time
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size={isMobile ? "small" : "medium"}>
              Filter Period
            </Button>
            <Button variant="contained" size={isMobile ? "small" : "medium"}>
              Export Report
            </Button>
            <IconButton onClick={handleMenuOpen} sx={{ display: { xs: "none", sm: "block" } }}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* STATS CARDS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ color: `${stat.color}.main` }}>{stat.icon}</Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>

                  <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                    {stat.value}
                  </Typography>

                  <Chip label={stat.change} size="small" color={stat.color} sx={{ fontWeight: 600 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>



        {/* RECENT ORDERS TABLE */}
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              Recent Orders
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 380 }}>
            <Table stickyHeader size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentSales.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    {!isMobile && <TableCell>{row.date}</TableCell>}
                    <TableCell>{row.customer}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                      {row.total}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        size="small"
                        color={
                          row.status === "Completed"
                            ? "success"
                            : row.status === "Pending"
                            ? "warning"
                            : row.status === "Shipped"
                            ? "info"
                            : "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* BOTTOM SECTION */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Top Products
                </Typography>
                <ul>
                  <li>Wheat Flour → ₹1.34L</li>
                  <li>Rice Basmati → ₹98K</li>
                  <li>Maida → ₹76K</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Best Customers
                </Typography>
                <ul>
                  <li>Ramesh Stores → 42 orders</li>
                  <li>Anand Bakery → 38 orders</li>
                  <li>Shree Traders → 31 orders</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  Quick Actions
                </Typography>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Create Invoice
                </Button>
                <Button variant="outlined" fullWidth sx={{ mt: 1 }}>
                  Send Payment Reminder
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuClose}>Export PDF</MenuItem>
          <MenuItem onClick={handleMenuClose}>Export Excel</MenuItem>
          <MenuItem onClick={handleMenuClose}>Print</MenuItem>
          <MenuItem onClick={handleMenuClose}>Share</MenuItem>
        </Menu>
      </Box>
    </motion.div>
  );
};

export default Sales;
