import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useColorMode } from "../theme/ThemeContext";
import Tooltip from "./ui/Tooltip";
import styles from "./Sidebar.module.css";

const expandedWidth = 220;
const collapsedWidth = 70;

const Sidebar = ({ mobileOpen, onClose, isMobile, collapsed, setCollapsed }) => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { logout }  = useAuth();
  const { isDarkMode, selectedAccent } = useColorMode();
  const accentColor = selectedAccent?.primary || '#3b82f6';

  const [openMenu, setOpenMenu] = useState({
    reports: false,
    management: false,
    settings: false,
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
    }, 250);
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
    if (window.salesReportBusy) {
      const ok = window.confirm(
        'Sales Report data is still loading.\n\nClick OK to navigate away, or Cancel to wait.'
      );
      if (!ok) return;
    }
    navigate(link);
    if (isMobile && onClose) onClose();
  };

  const menuMap = {
    reports: [
      { text: "Production", icon: <i className="bi bi-gear"></i>, link: "/reports/production" },
      { text: "Sales", icon: <i className="bi bi-graph-up"></i>, link: "/reports/sales" },
    ],
  };

  const drawerContent = (
    <div
      className={`${styles.sidebarContainer} ${isDarkMode ? styles.sidebarDark : ""}`}
      style={{ width: collapsed ? collapsedWidth : expandedWidth, '--sidebar-accent': accentColor }}
    >
      {/* Header */}
      <div className={styles.sidebarHeader} style={{ minHeight: collapsed ? 64 : 90 }}>
        {!collapsed && (
          <motion.div
            className={styles.homeIconWrapper}
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.homeIcon}>
              <i className="bi bi-house-door-fill" style={{ fontSize: "1.5rem", color: "white" }}></i>
            </div>
          </motion.div>
        )}
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <motion.button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            whileHover={{ rotate: collapsed ? 0 : -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`bi ${collapsed ? "bi-list" : "bi-layout-sidebar"}`} style={{ fontSize: "1.2rem" }}></i>
          </motion.button>
        </Tooltip>
      </div>

      <hr className={styles.divider} />

      {/* Navigation */}
      <div className={styles.navList}>
        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className={`${styles.navItem} ${location.pathname === '/dashboard' ? styles.navItemActive : ''}`}
          onClick={() => handleNavigate("/dashboard")}
        >
          <div className={styles.navIcon}>
            <i className="bi bi-speedometer2"></i>
          </div>
          {!collapsed && <span className={styles.navText}>Dashboard</span>}
        </motion.div>

        {/* Menu Items */}
        {["reports"].map((menu) => (
          <motion.div
            key={menu}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className={styles.menuWrapper}
            onMouseEnter={() => handleMouseEnter(menu)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`${styles.navItem} ${location.pathname.startsWith(`/${menu}`) ? styles.navItemActive : ''}`}
              onClick={() => {
                if (menu === "reports") {
                  handleNavigate("/reports");
                }
                if (!collapsed) {
                  toggleMenu(menu);
                }
              }}
            >
              <div className={styles.navIcon}>
                <i className="bi bi-table"></i>
              </div>
              {!collapsed && (
                <>
                  <span className={styles.navText}>
                    {menu.charAt(0).toUpperCase() + menu.slice(1)}
                  </span>
                  {openMenu[menu] ? (
                    <i className="bi bi-chevron-up ms-auto"></i>
                  ) : (
                    <i className="bi bi-chevron-down ms-auto"></i>
                  )}
                </>
              )}
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && openMenu[menu] && (
                <motion.div
                  className={styles.subMenu}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {menuMap[menu].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.18 }}
                      className={`${styles.subMenuItem} ${location.pathname === item.link ? styles.subMenuItemActive : ''}`}
                      onClick={() => handleNavigate(item.link)}
                    >
                      <div className={styles.subMenuIcon}>{item.icon}</div>
                      <span className={styles.subMenuText}>{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

      </div>

      {/* Footer - Logout Button */}
      <div className={styles.sidebarFooter}>
        <hr className={styles.divider} />
        <Tooltip content="Logout">
          <button className={styles.logoutBtn} onClick={logout} aria-label="Logout">
            <i className="bi bi-box-arrow-right"></i>
            {!collapsed && <span>Logout</span>}
          </button>
        </Tooltip>
      </div>
    </div>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        <div className={`${styles.mobileOverlay} ${mobileOpen ? styles.show : ''}`} onClick={onClose}></div>
        <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.open : ''}`}>
          {drawerContent}
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      <div className={`${styles.desktopSidebar} ${collapsed ? styles.collapsed : ''}`}>
        {drawerContent}
      </div>

      {/* Hover Menu for Collapsed State */}
      <AnimatePresence>
        {collapsed && hoverMenu && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={styles.hoverMenu}
            style={{
              top: 120 + Object.keys(menuMap).indexOf(hoverMenu) * 56,
              left: collapsedWidth + 8,
            }}
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
          >
            <div className={styles.hoverMenuPaper}>
              {menuMap[hoverMenu].map((item, idx) => (
                <div
                  key={idx}
                  className={`${styles.hoverMenuItem} ${location.pathname === item.link ? styles.hoverMenuItemActive : ''}`}
                  onClick={() => {
                    handleNavigate(item.link);
                    setHoverMenu(null);
                  }}
                >
                  <div className={styles.hoverMenuIcon}>{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
