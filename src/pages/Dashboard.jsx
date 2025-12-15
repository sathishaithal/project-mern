import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import bhagyaLogo from "../assets/bhagya.png";

// Icons
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
// FIX APPLIED HERE: Removed extra colon from the import path
import PeopleAltIcon from "@mui/icons-material/PeopleAlt"; 
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { LoginRounded, ScaleSharp, SupportOutlined } from "@mui/icons-material";

// --- ANIMATION VARIANTS ---
const fadeSlide = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
};

const cardAnim = {
  initial: { opacity: 0, y: 30 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1 + 0.3,
      duration: 0.6,
      type: "spring",
      stiffness: 100,
    },
  }),
};
const quickStats = [
  {
    title: "Total Loggins",
    value: "20",
    trend: "from last month",
    icon: <LoginRounded sx={{ fontSize: 30, color: "success.main" }} />,
    mainColor: "success",
    bgColor: "success.light",
  },
  {
    title: "Current Month Sales",
    value: "200",
    trend: "Total Tonnage",
    icon: <ScaleSharp sx={{ fontSize: 30, color: "info.main" }} />,
    mainColor: "info",
    bgColor: "info.light",
  },
  {
    title: "Short Supplys",
    value: "12115.721",
    trend: "Short Supply Tonnage",
    icon: <SupportOutlined sx={{ fontSize: 30, color: "warning.main" }} />,
    mainColor: "warning",
    bgColor: "warning.light",
  },
  {
    title: "New Users",
    value: "540",
    icon: <PeopleAltIcon sx={{ fontSize: 30, color: "primary.main" }} />,
    trend: "+4.2% from last week",
    mainColor: "primary",
    bgColor: "primary.light",
  },
  {
    title: "Avg. Session Time",
    value: "4m 32s",
    trend: "-1.1% from last day",
    icon: <AccessTimeIcon sx={{ fontSize: 30, color: "secondary.main" }} />,
    mainColor: "secondary",
    bgColor: "secondary.light",
  },
  {
    title: "Reports Generated",
    value: "87",
    trend: "2 New Reports today",
    icon: <TrendingUpIcon sx={{ fontSize: 30, color: "error.main" }} />,
    mainColor: "error",
    bgColor: "error.light",
  },
];

const recentActivity = [
    { type: 'Sales', details: 'Order #3456 completed.', time: '2 mins ago', icon: <CheckCircleOutlineIcon color="success" /> },
    { type: 'Support', details: 'New ticket opened by John Doe.', time: '1 hour ago', icon: <EventNoteIcon color="primary" /> },
    { type: 'Finance', details: 'Expense report pending approval.', time: '4 hours ago', icon: <ArrowDownwardIcon color="error" /> },
    { type: 'Inventory', details: 'Stock alert: Product A low.', time: '1 day ago', icon: <StorefrontIcon color="warning" /> },
];

const mockProducts = [
    { name: 'Product A', sales: 90, color: 'primary.main' },
    { name: 'Product B', sales: 75, color: 'success.main' },
    { name: 'Product C', sales: 50, color: 'info.main' },
    { name: 'Product D', sales: 30, color: 'warning.main' },
];


// --- Mock Chart Components (Unchanged) ---
const MockLineChart = ({ theme }) => {
    const svgPath = "M 20 180 L 80 120 L 140 140 L 200 80 L 260 100 L 320 60 L 380 40 L 440 20";
    
    return (
        <Box sx={{ p: 2, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                <svg viewBox="0 0 460 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {[50, 150, 250, 350].map(x => (
                        <line key={x} x1={x} y1="0" x2={x} y2="200" stroke={theme.palette.divider} strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                     {[50, 100, 150].map(y => (
                        <line key={y} x1="0" y1={y} x2="460" y2={y} stroke={theme.palette.divider} strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    <path
                        d={svgPath}
                        fill="none"
                        stroke={theme.palette.primary.main}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {[[20, 180], [80, 120], [140, 140], [200, 80], [260, 100], [320, 60], [380, 40], [440, 20]].map(([x, y], index) => (
                        <circle key={index} cx={x} cy={y} r="5" fill={theme.palette.primary.main} />
                    ))}
                </svg>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, px: 2, opacity: 0.7 }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(month => (
                    <Typography key={month} variant="caption" color="textSecondary">
                        {month}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

const MockBarChart = ({ data, theme }) => {
    const maxSales = Math.max(...data.map(d => d.sales));
    const containerHeight = 180;

    return (
        <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column', pt: 1, pb: 1, px: 2 }}>
            <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: `1px solid ${theme.palette.divider}` }}>
                {data.map((item, index) => {
                    const barHeight = (item.sales / maxSales) * containerHeight;
                    return (
                        <Box key={index} sx={{ textAlign: 'center', width: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${barHeight}px` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 1, type: "spring", stiffness: 50 }}
                            >
                                <Box
                                    sx={{
                                        width: 30,
                                        borderRadius: 1,
                                        backgroundColor: theme.palette[item.color.split('.')[0]].main,
                                        height: `${barHeight}px`,
                                        mb: 0.5,
                                    }}
                                />
                            </motion.div>
                        </Box>
                    );
                })}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', pt: 1, px: 1, opacity: 0.7 }}>
                {data.map((item, index) => (
                    <Typography key={index} variant="caption" color="textSecondary" sx={{ width: '20%', textAlign: 'center' }}>
                        {item.name}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};


// --- Unified component for Quick Stats Card (Unchanged) ---
const QuickStatsCard = ({ title, value, trend, icon, mainColor, bgColor, index, theme }) => (
    <motion.div variants={cardAnim} initial="initial" animate="animate" custom={index}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
          borderLeft: `5px solid ${theme.palette[mainColor].main}`, 
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="textPrimary" sx={{ opacity: 0.7 }}>
            {trend}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "50%",
            backgroundColor: bgColor, 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
      </Paper>
    </motion.div>
  );


// --- MAIN COMPONENT ---
const Dashboard = () => {
  const { user } = useAuth();
  const username = user?.username || "Analytics User";
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const welcomePaperBgColor = theme.palette.mode === 'dark' 
    ? theme.palette.background.paper 
    : theme.palette.grey[50];


  return (
    <motion.div
      variants={fadeSlide}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: isSmallScreen ? 2 : 3, width: '100%' }}> 
       {/* <Paper
          sx={{
            p: isSmallScreen ? 3 : 4,
            mb: 4,
            borderRadius: 4,
            display: "flex",
            flexDirection: isSmallScreen ? "column" : "row",
            gap: 3,
            alignItems: isSmallScreen ? "flex-start" : "center",
            boxShadow: "0 4px 25px rgba(0,0,0,0.1)",
            backgroundColor: welcomePaperBgColor,
          }}
        >
          <Avatar
            src={bhagyaLogo}
            sx={{ width: isSmallScreen ? 70 : 90, height: isSmallScreen ? 70 : 90, borderRadius: 2 }}
          />

          <Box>
            <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={700}>
              Business Intelligence Hub
            </Typography>

            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
            This is your comprehensive analytics dashboard. Monitor performance, view detailed reports, and generate insights across all departments.
            </Typography>
          </Box>
        </Paper> */}

        {/* ============================
            QUICK STATS SECTION
        ============================ */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid 
              key={stat.title}
              sx={{ 
                gridColumn: { 
                    xs: 'span 12',
                    sm: 'span 6',
                    lg: 'span 3',
                },
              }}
            > 
              <QuickStatsCard {...stat} index={index} theme={theme} />
            </Grid>
          ))}
        </Grid>

        {/* ============================
            MAIN ANALYTICS
        ============================ */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            
          {/* 1. Revenue Performance Chart (6/12) */}
          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    md: 'span 6',
                },
            }}
          > 
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={4}>
              <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                <Typography variant="h6" gutterBottom>
                  Revenue Performance Trend
                </Typography>
                <Box sx={{ height: 320 }}>
                    <MockLineChart theme={theme} />
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          {/* 2. Conversion Rate (3/12) */}
          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    md: 'span 3',
                },
            }}
          >
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={5}>
              <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                <Typography variant="h6" gutterBottom>
                  Conversion Rate
                </Typography>
                <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="h2" color="primary.main">4.5%</Typography>
                  <Typography variant="body1" mt={1}>Target is 5.0%</Typography>
                  <Typography variant="caption" color="textSecondary" mt={2}>
                    (Placeholder for Gauge/Donut Chart)
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
            
          {/* 3. Recent Activity Feed (3/12) */}
          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    md: 'span 3',
                },
            }}
          >
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={6}>
              <Paper sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", overflowY: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity Feed
                </Typography>
                <List dense>
                    {recentActivity.map((activity, index) => (
                        <React.Fragment key={index}>
                            <ListItem disablePadding>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {activity.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={<Typography variant="body2" fontWeight={600}>{activity.type}</Typography>}
                                    secondary={<Typography variant="caption" color="textSecondary">{activity.details}</Typography>}
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>{activity.time}</Typography>
                            </ListItem>
                            {index < recentActivity.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                    <ListItem disablePadding>
                        <ListItemText sx={{ textAlign: 'center', pt: 1 }}>
                            <Typography variant="caption" color="primary">View All</Typography>
                        </ListItemText>
                    </ListItem>
                </List>
              </Paper>
            </motion.div>
          </Grid>
            
          {/* 4. Top Products/Sales Chart (Full Width Below) */}
          <Grid 
            sx={{ 
                gridColumn: 'span 12', 
            }}
          > 
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={7}>
              <Paper sx={{ p: 3, height: 300, borderRadius: 3, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                <Typography variant="h6" gutterBottom>
                  Top 4 Products by Sales (Units)
                </Typography>
                <Box sx={{ height: 220 }}>
                    <MockBarChart data={mockProducts} theme={theme} />
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* ============================
            QUICK REPORT CARDS
        ============================ */}
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 4, mb: 2 }}>
          Quick Report Access
        </Typography>

        <Grid container spacing={3}>
          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    sm: 'span 6', 
                    md: 'span 3'
                },
            }}
          >
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={8}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transform: "translateY(-5px)" },
                }}
              >
                <FacebookIcon sx={{ fontSize: 40, color: "#1877F2" }} />
                <Typography variant="h6" mt={2}>Facebook Insights</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  View engagement, reach & ad report.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    sm: 'span 6', 
                    md: 'span 3'
                },
            }}
          >
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={9}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transform: "translateY(-5px)" },
                }}
              >
                <TwitterIcon sx={{ fontSize: 40, color: "#1DA1F2" }} />
                <Typography variant="h6" mt={2}>Twitter Reports</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Track impressions & activity metrics.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    sm: 'span 6', 
                    md: 'span 3'
                },
            }}
          >
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={10}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transform: "translateY(-5px)" },
                }}
              >
                <InstagramIcon sx={{ fontSize: 40, color: "#E4405F" }} />
                <Typography variant="h6" mt={2}>Instagram Analytics</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Analyze posts, stories & followers.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          <Grid 
            sx={{ 
                gridColumn: { 
                    xs: 'span 12', 
                    sm: 'span 6', 
                    md: 'span 3'
                },
            }}
          >
            <motion.div variants={cardAnim} initial="initial" animate="animate" custom={11}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transform: "translateY(-5px)" },
                }}
              >
                <BarChartIcon sx={{ fontSize: 40, color: "#673ab7" }} />
                <Typography variant="h6" mt={2}>Business Reports</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Sales, Production, Inventory & more.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

      </Box>
    </motion.div>
  );
};

export default Dashboard; 