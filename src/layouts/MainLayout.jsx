import React, { useState } from "react";
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
  Avatar
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import Sidebar from "../components/Sidebar";
import PageTransition from "../components/PageTransition";
import { useColorMode } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


import bhagyaLogo from "../assets/bhagya.png";

const expandedWidth = 220;
const collapsedWidth = 70;

const MainLayout = ({ title, children }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { toggleMode } = useColorMode();
  const { user, logout } = useAuth();

  const themeMode = localStorage.getItem("themeMode") || "light";

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleProfileClick = (e) => setAnchorEl(e.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);

  return (
    <Box sx={{ display: "flex" }}>
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
          transition: "all .3s ease"
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
            // Custom color applied here
            backgroundColor: "#0e3978f2 !important",  // your color with transparency
            backgroundImage: "none",                  // removes default gradient/shadow if any
            boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
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

            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>

            <Typography
              variant="body1"
              sx={{ mr: 1.5, fontWeight: 500, display: { xs: "none", sm: "block" } }}
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
            >
              <MenuItem disabled sx={{ opacity: 0.8 }}>
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
                sx={{ color: "error.main", fontWeight: 600 }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ height: "64px" }} />

        <PageTransition>
          <Box sx={{ p: 3 }}>{children}</Box>
        </PageTransition>
      </Box>
    </Box>
  );
};

export default MainLayout;