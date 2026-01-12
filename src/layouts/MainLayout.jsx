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
import { motion } from "framer-motion";

const expandedWidth = 220;
const collapsedWidth = 70;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { toggleMode } = useColorMode();
  const { user, logout } = useAuth();

  const themeMode = localStorage.getItem("themeMode") || "light";
  const isDarkMode = themeMode === "dark";
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    document.body.style.fontFamily =
      "'Inter', 'Roboto', 'Segoe UI', sans-serif";

    if (!document.querySelector("#inter-font")) {
      const link = document.createElement("link");
      link.id = "inter-font";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  const handleProfileClick = (e) => setAnchorEl(e.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : collapsed ? `${collapsedWidth}px` : `${expandedWidth}px`,
          transition: "all .3s ease",
        }}
      >
        {/* HEADER */}
       <AppBar
        position="fixed"
        elevation={0}  
        sx={{
          width: isMobile
            ? "100%"
            : `calc(100% - ${collapsed ? collapsedWidth : expandedWidth}px)`,
          ml: isMobile ? 0 : `${collapsed ? collapsedWidth : expandedWidth}px`,

          backgroundColor: "#0e3978f2",
          backgroundImage: "none",   
          color: "#fff",

          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
      >

          <Toolbar>
            {isMobile && (
              <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}

            <Avatar
                         src={bhagyaLogo}
                         alt="Sri Bhagyalakshmi Group"
                         onClick={() => navigate("/dashboard")}
                         sx={{
                           width: 54,        
                           height: 44,
                           cursor: "pointer",
                           borderRadius: 1,
                           transition: "all 0.3s ease",
                         }}
                       />

            {/* COMPANY NAME + CONTEXT */}
        <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
                minWidth: 0,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                Sri Bhagyalakshmi Group
              </Typography>

              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: [0, 1, 1, 0], x: [-6, 0, 0, -6] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.65rem",
                    letterSpacing: "1px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  TESTED. TASTED. TRUSTED.
                </Typography>
              </motion.div>
            </Box>


            {/* USER */}
            <Typography
              sx={{
                mr: 1.5,
                fontWeight: 500,
                display: { xs: "none", sm: "block" },
              }}
            >
              {user?.username || "User"}
            </Typography>

            <IconButton color="inherit" onClick={handleProfileClick}>
              <AccountCircleIcon />
            </IconButton>

            <IconButton color="inherit" onClick={toggleMode}>
              {themeMode === "light" ? (
                <Brightness4Icon />
              ) : (
                <Brightness7Icon />
              )}
            </IconButton>

            {/* PROFILE MENU */}
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleProfileClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem disabled>
                {user?.username || "Guest"}
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  toggleMode();
                  handleProfileClose();
                }}
              >
                {themeMode === "light" ? (
                  <>
                    <Brightness4Icon sx={{ mr: 1 }} />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Brightness7Icon sx={{ mr: 1 }} />
                    Light Mode
                  </>
                )}
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={logout}
                sx={{ color: "error.main", fontWeight: 600 }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* OFFSET FOR APPBAR */}
        <Box sx={{ height: 64 }} />

        {/* PAGE CONTENT */}
        <PageTransition>
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </PageTransition>
      </Box>
    </Box>
  );
};

export default MainLayout;
