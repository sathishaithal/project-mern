import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useColorMode } from "../theme/ThemeContext";
import styles from "./Sidebar.module.css";

const expandedWidth = 220;
const collapsedWidth = 70;

const Sidebar = ({ mobileOpen, onClose, isMobile, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDarkMode } = useColorMode();

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
    navigate(link);
    if (isMobile && onClose) onClose();
  };

  const menuMap = {
    reports: [
      { text: "Production", icon: <i className="bi bi-gear"></i>, link: "/reports/production" },
      { text: "Sales", icon: <i className="bi bi-graph-up"></i>, link: "/reports/sales" },
      { text: "Inventory", icon: <i className="bi bi-box-seam"></i>, link: "/reports/inventory" },
    ],
    management: [
      { text: "Employees", icon: <i className="bi bi-people"></i>, link: "/management/employees" },
      { text: "Vendors", icon: <i className="bi bi-building"></i>, link: "/management/vendors" },
    ],
    settings: [
      { text: "Profile", icon: <i className="bi bi-person-circle"></i>, link: "/settings/profile" },
      { text: "System Settings", icon: <i className="bi bi-gear-wide-connected"></i>, link: "/settings/system" },
    ],
  };

  const drawerContent = (
    <div
      className={`${styles.sidebarContainer} ${isDarkMode ? styles.sidebarDark : ""}`}
      style={{ width: collapsed ? collapsedWidth : expandedWidth }}
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
        <motion.button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ rotate: collapsed ? 0 : -10, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className={`bi ${collapsed ? "bi-list" : "bi-layout-sidebar"}`} style={{ fontSize: "1.2rem" }}></i>
        </motion.button>
      </div>

      <hr className={styles.divider} />

      {/* Navigation */}
      <div className={styles.navList}>
        {/* Dashboard */}
        <div className={styles.navItem} onClick={() => handleNavigate("/dashboard")}>
          <div className={styles.navIcon}>
            <i className="bi bi-speedometer2"></i>
          </div>
          {!collapsed && <span className={styles.navText}>Dashboard</span>}
        </div>

        {/* Menu Items */}
        {["reports", "management", "settings"].map((menu) => (
          <div
            key={menu}
            className={styles.menuWrapper}
            onMouseEnter={() => handleMouseEnter(menu)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={styles.navItem}
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
                {menu === "reports" && <i className="bi bi-table"></i>}
                {menu === "management" && <i className="bi bi-people"></i>}
                {menu === "settings" && <i className="bi bi-gear"></i>}
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

            {!collapsed && openMenu[menu] && (
              <div className={styles.subMenu}>
                {menuMap[menu].map((item, idx) => (
                  <div
                    key={idx}
                    className={styles.subMenuItem}
                    onClick={() => handleNavigate(item.link)}
                  >
                    <div className={styles.subMenuIcon}>{item.icon}</div>
                    <span className={styles.subMenuText}>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

      </div>

      {/* Footer - Logout Button */}
      <div className={styles.sidebarFooter}>
        <hr className={styles.divider} />
        <button className={styles.logoutBtn} onClick={logout}>
          <i className="bi bi-box-arrow-right"></i>
          {!collapsed && <span>Logout</span>}
        </button>
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
                  className={styles.hoverMenuItem}
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
