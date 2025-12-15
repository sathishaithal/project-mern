import React, { useState, useRef } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Button,
  ListItemIcon,
  Collapse,
  Typography,
  IconButton,
  Paper,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableChartIcon from "@mui/icons-material/TableChart";
import EngineeringIcon from "@mui/icons-material/Engineering";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import SettingsIcon from "@mui/icons-material/Settings";
import BuildIcon from "@mui/icons-material/Build";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const expandedWidth = 220;
const collapsedWidth = 70;

const Sidebar = ({ mobileOpen, onClose, isMobile, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [openMenu, setOpenMenu] = useState({
    reports: false,
    management: false,
    settings: false,
    tools: false,
  });

  const [hoverMenu, setHoverMenu] = useState(null);
  const hoverTimeout = useRef(null);

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleMouseEnter = (menu) => {
    if (!collapsed) return;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoverMenu(menu);
  };

  const handleMouseLeave = () => {
    if (!collapsed) return;
    hoverTimeout.current = setTimeout(() => {
      setHoverMenu(null);
    }, 250); // Delay so user can move to submenu
  };

  const handlePanelMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };

  const handlePanelMouseLeave = () => {
    if (!collapsed) return;
    hoverTimeout.current = setTimeout(() => {
      setHoverMenu(null);
    }, 250);
  };

  const handleNavigate = (link) => {
    navigate(link);
    if (isMobile && onClose) onClose();
  };

  const menuMap = {
    reports: [
      { text: "Production", icon: <EngineeringIcon />, link: "/reports/production" },
      { text: "Sales", icon: <TableChartIcon />, link: "/reports/sales" },
      { text: "Inventory", icon: <InventoryIcon />, link: "/reports/inventory" },
    ],
    management: [
      { text: "Employees", icon: <PeopleIcon />, link: "/management/employees" },
      { text: "Vendors", icon: <BusinessIcon />, link: "/management/vendors" },
    ],
    settings: [
      { text: "Profile", icon: <AccountCircleIcon />, link: "/settings/profile" },
      { text: "System Settings", icon: <SettingsIcon />, link: "/settings/system" },
    ],

  };

  const drawerStyles = {
    width: collapsed ? collapsedWidth : expandedWidth,
    transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
    overflowX: "hidden",
    backgroundColor: "#0e3978f2",
    color: "white",
    "& .MuiListItemIcon-root": { color: "white" }
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Sri Bhagyalakshmi
          </Typography>
        )}
        <IconButton 
          onClick={() => setCollapsed(!collapsed)}
          sx={{ color: "white" }}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Toolbar>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        <ListItemButton onClick={() => handleNavigate("/dashboard")}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Dashboard" />}
        </ListItemButton>

        {["reports", "management", "settings"].map((menu) => (
          <Box
            key={menu}
            onMouseEnter={() => handleMouseEnter(menu)}
            onMouseLeave={handleMouseLeave}
          >
            <ListItemButton onClick={() => !collapsed && toggleMenu(menu)}>
              <ListItemIcon>
                {menu === "reports" && <TableChartIcon />}
                {menu === "management" && <PeopleIcon />}
                {menu === "settings" && <SettingsIcon />}
                {/* {menu === "tools" && <BuildIcon />} */}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={menu.charAt(0).toUpperCase() + menu.slice(1)}
                />
              )}
              {!collapsed && (openMenu[menu] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>

            {!collapsed && (
              <Collapse in={openMenu[menu]} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {menuMap[menu].map((item, idx) => (
                    <ListItemButton
                      key={idx}
                      sx={{ pl: 6 }}
                      onClick={() => handleNavigate(item.link)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>

      <Box sx={{ p: 2, mt: "auto" }}>
        <Divider sx={{ mb: 2 }} />
        <Button
          variant="contained"
          fullWidth={!collapsed}
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{
            background: "linear-gradient(45deg, #d32f2f 0%, #c62828 100%)",
            color: "white",
            fontWeight: 600,
            py: 1.5,
            borderRadius: 2,
            boxShadow: "0 4px 15px rgba(211, 47, 47, 0.3)",
            "&:hover": {
              background: "linear-gradient(45deg, #b71c1c 0%, #d32f2f 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(211, 47, 47, 0.4)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {!collapsed && "Logout"}
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={mobileOpen || !isMobile}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": drawerStyles,
        }}
      >
        {drawerContent}
      </Drawer>

      <AnimatePresence>
        {collapsed && hoverMenu && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: 120 + Object.keys(menuMap).indexOf(hoverMenu) * 56,
              left: collapsedWidth + 8,
              zIndex: 2000,
            }}
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
          >
            <Paper elevation={8} sx={{ minWidth: 210, py: 1 }}>
              {menuMap[hoverMenu].map((item, idx) => (
                <ListItemButton
                  key={idx}
                  onClick={() => {
                    handleNavigate(item.link);
                    setHoverMenu(null);
                  }}
                  sx={{ py: 1.2 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;