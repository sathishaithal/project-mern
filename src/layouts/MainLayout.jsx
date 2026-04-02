import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useColorMode } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import PageTransition from "../components/PageTransition";
import bhagyaLogo from "../assets/bhagya.png";
import styles from "./MainLayout.module.css";

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [themeStudioOpen, setThemeStudioOpen] = useState(false);
  const {
    toggleMode,
    isDarkMode,
    accentThemes,
    fontThemes,
    sidebarModes,
    densityOptions,
    selectedAccent,
    selectedFont,
    fontScale,
    sidebarMode,
    density,
    setAccentTheme,
    setFontTheme,
    setFontScale,
    setSidebarMode,
    setDensity,
  } = useColorMode();
  const { user } = useAuth();

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    setSidebarCollapsed(sidebarMode === "closed");
  }, [sidebarMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarMobileOpen) {
        setSidebarMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarMobileOpen]);

  useEffect(() => {
    if (location.pathname !== "/reports/production") {
      document.body.classList.remove("production-report-fullscreen");
    }
  }, [location.pathname]);

  const handleSidebarStateChange = (nextCollapsed) => {
    setSidebarCollapsed(nextCollapsed);
    setSidebarMode(nextCollapsed ? "closed" : "fixed");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      "/dashboard": "Dashboard",
      "/reports": "Reports",
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

  return (
    <div
      className={`${styles.layoutContainer} ${isDarkMode ? styles.layoutDark : ""}`}
      style={{
        fontFamily: "var(--dashboard-font-body)",
        color: "var(--dashboard-text)",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        mobileOpen={sidebarMobileOpen}
        onClose={() => setSidebarMobileOpen(false)}
        isMobile={isMobile}
        collapsed={sidebarCollapsed}
        setCollapsed={handleSidebarStateChange}
      />

      {/* Main Content */}
      <div 
        className={`${styles.mainContent} ${!isMobile && (sidebarCollapsed ? styles.contentCollapsed : styles.contentExpanded)}`}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <div className={styles.headerLeft}>
              {isMobile && (
                <button 
                  className={styles.menuBtn}
                  onClick={() => setSidebarMobileOpen(true)}
                >
                  <i className="bi bi-list"></i>
                </button>
              )}
              
              <img
                src={bhagyaLogo}
                alt="Sri Bhagyalakshmi Group"
                className={styles.logo}
                onClick={() => navigate("/dashboard")}
              />

              <div className={styles.companyInfo}>
                <h1
                  className={styles.companyName}
                  style={{ fontFamily: "var(--dashboard-font-display)" }}
                >
                  Sri Bhagyalakshmi Group
                </h1>
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: [0, 1, 1, 0], x: [-6, 0, 0, -6] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className={styles.tagline}>
                    TESTED. TASTED. TRUSTED.
                  </span>
                </motion.div>
              </div>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.themeStudioWrap}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setThemeStudioOpen((prev) => !prev)}
                  title="Theme Studio"
                >
                  <i className="bi bi-palette"></i>
                </button>

                {themeStudioOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                    className={styles.themeStudioPanel}
                  >
                    <div className={styles.themeStudioTop}>
                      <div>
                        <span className={styles.themeStudioEyebrow}>Appearance</span>
                        <h4>Theme Studio</h4>
                      </div>
                      <button
                        className={styles.themeStudioClose}
                        onClick={() => setThemeStudioOpen(false)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Mode</span>
                      <motion.button
                        className={styles.modeToggle}
                        onClick={toggleMode}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.span
                          className={styles.modeToggleThumb}
                          animate={{ x: isDarkMode ? 26 : 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                        />
                        <span className={styles.modeToggleText}>
                          {isDarkMode ? "Dark" : "Light"}
                        </span>
                      </motion.button>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Colors</span>
                      <div className={styles.colorGrid}>
                        {accentThemes.map((theme) => (
                          <motion.button
                            key={theme.id}
                            type="button"
                            className={`${styles.colorChip} ${selectedAccent.id === theme.id ? styles.colorChipActive : ""}`}
                            onClick={() => setAccentTheme(theme.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            title={theme.name}
                            style={{
                              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            }}
                          >
                            {selectedAccent.id === theme.id && <i className="bi bi-check2"></i>}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Font Family</span>
                      <div className={styles.fontList}>
                        {fontThemes.map((font) => (
                          <motion.button
                            key={font.id}
                            type="button"
                            className={`${styles.fontOption} ${selectedFont.id === font.id ? styles.fontOptionActive : ""}`}
                            onClick={() => setFontTheme(font.id)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span style={{ fontFamily: font.display }}>{font.name}</span>
                            {selectedFont.id === font.id && <i className="bi bi-stars"></i>}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Sidebar</span>
                      <div className={styles.optionGrid}>
                        {sidebarModes.map((option) => (
                          <motion.button
                            key={option.id}
                            type="button"
                            className={`${styles.optionButton} ${sidebarMode === option.id ? styles.optionButtonActive : ""}`}
                            onClick={() => setSidebarMode(option.id)}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            title={option.description}
                          >
                            {option.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Density</span>
                      <div className={styles.optionGrid}>
                        {densityOptions.map((option) => (
                          <motion.button
                            key={option.id}
                            type="button"
                            className={`${styles.optionButton} ${density.id === option.id ? styles.optionButtonActive : ""}`}
                            onClick={() => setDensity(option.id)}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {option.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <div className={styles.fontSizeHeader}>
                        <span className={styles.themeControlLabel}>Font Size</span>
                        <strong>{Math.round(fontScale * 100)}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0.9"
                        max="1.2"
                        step="0.05"
                        value={fontScale}
                        onChange={(e) => setFontScale(Number(e.target.value))}
                        className={styles.fontSizeSlider}
                      />
                      <div className={styles.fontSizeTicks}>
                        <span>Small</span>
                        <span>Default</span>
                        <span>Large</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              

              <span className={styles.username}>
                {user?.username || "User"}
              </span>

              {/* <div className={styles.dropdown}>
                <button 
                  className={styles.iconBtn}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <i className="bi bi-person-circle"></i>
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownItemDisabled}>
                      {user?.username || "Guest"}
                    </div>
                    <hr className={styles.dropdownDivider} />
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        toggleMode();
                        setDropdownOpen(false);
                      }}
                    >
                      <i className={`bi ${mode === "light" ? "bi-moon-stars" : "bi-brightness-high"} me-2`}></i>
                      {mode === "light" ? "Dark Mode" : "Light Mode"}
                    </button>
                    <hr className={styles.dropdownDivider} />
                    <button 
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                      onClick={logout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className={styles.pageTitle}>
          <h2 style={{ fontFamily: "var(--dashboard-font-display)" }}>{title}</h2>
          <p className={styles.pageSubtitle}>
            {/* Theme: {selectedAccent.name} | Font: {selectedFont.name} | Size: {Math.round(fontScale * 100)}% */}
          </p>
        </div>

        {/* Page Content */}
        <PageTransition>
          <div className={styles.pageContent}>
            {children}
          </div>
        </PageTransition>
      </div>
    </div>
  );
};

export default MainLayout;
