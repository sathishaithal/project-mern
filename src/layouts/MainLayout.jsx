import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Sidebar from "../components/Sidebar";
import PageTransition from "../components/PageTransition";
import { useColorMode } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import bhagyaLogo from "../assets/bhagya.png";

const expandedWidth = 220;
const collapsedWidth = 70;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { toggleMode } = useColorMode();
  const { user, logout } = useAuth();
  
  const themeMode = localStorage.getItem("themeMode") || "light";
  const isDarkMode = themeMode === "dark";
  
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      "/dashboard": "Dashboard",
      "/reports/production": "Production Report",
      "/reports/sales": "Sales Report",
      "/reports/inventory": "Inventory Report",
      "/management/employees": "Employee Management",
      "/management/vendors": "Vendor Management",
      "/settings/profile": "User Profile",
      "/settings/system": "System Settings",
    };
    return titleMap[path] || "Sri Bhagyalakshmi Dashboard";
  };

  const title = getPageTitle();

  // Override AppBar color for Production page in dark mode
  useEffect(() => {
    const appBar = document.querySelector('.MuiAppBar-root');
    if (!appBar) return;

    if (location.pathname === "/reports/production" && isDarkMode) {
      appBar.style.backgroundColor = '#121212';
      appBar.style.backgroundImage = 'none';
    } else {
      appBar.style.backgroundColor = '';
      appBar.style.backgroundImage = '';
    }

    // Apply font family to entire app
    document.body.style.fontFamily = "'Inter', 'Roboto', 'Segoe UI', sans-serif";
    
    // Load Inter font if not already loaded
    if (!document.querySelector('#inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    return () => {
      if (appBar && location.pathname === "/reports/production") {
        appBar.style.backgroundColor = '';
        appBar.style.backgroundImage = '';
      }
    };
  }, [location.pathname, isDarkMode]);

  const handleProfileClick = (e) => setAnchorEl(e.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);

  return (
    <Box sx={{ 
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Roboto', sans-serif"
    }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <Box
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : collapsed ? `${collapsedWidth}px` : `${expandedWidth}px`,
          transition: "all .3s ease",
          fontFamily: "'Inter', 'Roboto', sans-serif"
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            transition: "all .3s ease",
            width: isMobile
              ? "100%"
              : `calc(100% - ${collapsed ? collapsedWidth : expandedWidth}px)`,
            ml: isMobile ? 0 : `${collapsed ? collapsedWidth : expandedWidth}px`,
            backgroundColor: isDarkMode ? "#121212" : "#0e3978f2",
            backgroundImage: "none",
            boxShadow: theme.shadows[3],
            fontFamily: "'Inter', 'Roboto', sans-serif"
          }}
        >
          <Toolbar sx={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
            {isMobile && (
              <IconButton 
                color="inherit" 
                onClick={() => setMobileOpen(true)}
                sx={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Avatar
              src={bhagyaLogo}
              alt="Company Logo"
              onClick={() => navigate("/dashboard")}
              sx={{
                width: 36,
                height: 36,
                mr: 2,
                cursor: "pointer",
                borderRadius: 1,
                display: { xs: "none", sm: "block" }
              }}
            />

            <Typography 
              variant="h6" 
              sx={{ 
                flexGrow: 1,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="body1"
              sx={{ 
                mr: 1.5, 
                fontWeight: 500, 
                display: { xs: "none", sm: "block" },
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {user?.username || "User"}
            </Typography>

            <IconButton color="inherit" onClick={handleProfileClick}>
              <AccountCircleIcon />
            </IconButton>

            <IconButton color="inherit" onClick={toggleMode}>
              {themeMode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleProfileClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}
            >
              <MenuItem disabled sx={{ opacity: 0.8, fontFamily: "'Inter', sans-serif" }}>
                {user?.username || "Guest"}
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  toggleMode();
                  handleProfileClose();
                }}
                sx={{ fontFamily: "'Inter', sans-serif" }}
              >
                {themeMode === "light" ? (
                  <>
                    <Brightness4Icon sx={{ mr: 1 }} />
                    Switch to Dark Mode
                  </>
                ) : (
                  <>
                    <Brightness7Icon sx={{ mr: 1 }} />
                    Switch to Light Mode
                  </>
                )}
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={logout}
                sx={{ 
                  color: "error.main", 
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ height: "64px" }} />

        <PageTransition>
          <Box sx={{ 
            p: 3,
            fontFamily: "'Inter', 'Roboto', sans-serif"
          }}>
            {children}
          </Box>
        </PageTransition>
      </Box>
    </Box>
  );
};

export default MainLayout;