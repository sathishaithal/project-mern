import React, { useState, useEffect, useCallback } from "react";
import Tooltip from "../components/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
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
    animationOptions,
    selectedAccent,
    selectedFont,
    selectedAnimation,
    fontScale,
    sidebarMode,
    saveStatus,
    setAccentTheme,
    setFontTheme,
    setFontScale,
    setSidebarMode,
    setAnimation,
  } = useColorMode();
  const { user } = useAuth();

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    setSidebarCollapsed(sidebarMode === "closed");
  }, [sidebarMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && sidebarMobileOpen) {
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
                <Tooltip content="Open menu">
                  <button
                    className={styles.menuBtn}
                    onClick={() => setSidebarMobileOpen(true)}
                  >
                    <i className="bi bi-list"></i>
                  </button>
                </Tooltip>
              )}
              
              <motion.img
                src={bhagyaLogo}
                alt="Sri Bhagyalakshmi Group"
                className={styles.logo}
                onClick={() => navigate("/dashboard")}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
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
                <Tooltip content="Theme Studio">
                  <button
                    className={styles.iconBtn}
                    onClick={() => setThemeStudioOpen((prev) => !prev)}
                  >
                    <i className="bi bi-palette"></i>
                  </button>
                </Tooltip>

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h4 style={{ margin: 0 }}>Theme Studio</h4>
                          {saveStatus === 'saving' && (
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>
                              <i className="bi bi-arrow-repeat" style={{ marginRight: 3, animation: 'spin 1s linear infinite' }} />
                              Saving…
                            </span>
                          )}
                          {saveStatus === 'saved' && (
                            <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 600 }}>
                              <i className="bi bi-check-circle-fill" style={{ marginRight: 3 }} />
                              Saved
                            </span>
                          )}
                          {saveStatus === 'error' && (
                            <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>
                              <i className="bi bi-exclamation-circle-fill" style={{ marginRight: 3 }} />
                              Not saved
                            </span>
                          )}
                        </div>
                      </div>
                      <Tooltip content="Close">
                        <button
                          className={styles.themeStudioClose}
                          onClick={() => setThemeStudioOpen(false)}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </Tooltip>
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
                        {accentThemes.map((theme, index) => (
                          <Tooltip key={theme.id} content={theme.name}>
                            <motion.button
                              type="button"
                              className={`${styles.colorChip} ${selectedAccent.id === theme.id ? styles.colorChipActive : ""}`}
                              onClick={() => setAccentTheme(theme.id)}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.04, duration: 0.18 }}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              style={{
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                              }}
                            >
                              {selectedAccent.id === theme.id && <i className="bi bi-check2"></i>}
                            </motion.button>
                          </Tooltip>
                        ))}
                      </div>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Font Family</span>
                      <div className={styles.fontList}>
                        {fontThemes.map((font, index) => (
                          <motion.button
                            key={font.id}
                            type="button"
                            className={`${styles.fontOption} ${selectedFont.id === font.id ? styles.fontOptionActive : ""}`}
                            onClick={() => setFontTheme(font.id)}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.18 }}
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
                          <Tooltip key={option.id} content={option.description}>
                            <motion.button
                              type="button"
                              className={`${styles.optionButton} ${sidebarMode === option.id ? styles.optionButtonActive : ""}`}
                              onClick={() => setSidebarMode(option.id)}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {option.name}
                            </motion.button>
                          </Tooltip>
                        ))}
                      </div>
                    </div>

                    <div className={styles.themeControlGroup}>
                      <span className={styles.themeControlLabel}>Animation</span>
                      <div className={styles.optionGrid}>
                        {animationOptions.map((option) => (
                          <motion.button
                            key={option.id}
                            type="button"
                            className={`${styles.optionButton} ${selectedAnimation.id === option.id ? styles.optionButtonActive : ""}`}
                            onClick={() => setAnimation(option.id)}
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

              

              <motion.span
                className={styles.username}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.35 }}
              >
                {user?.username || "User"}
              </motion.span>

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
          <AnimatePresence mode="wait">
            <motion.h2
              key={location.pathname}
              style={{ fontFamily: "var(--dashboard-font-display)", margin: 0 }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {title}
            </motion.h2>
          </AnimatePresence>
          <p className={styles.pageSubtitle}>
            {/* Theme: {selectedAccent.name} | Font: {selectedFont.name} | Size: {Math.round(fontScale * 100)}% */}
          </p>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <div className={styles.pageContent}>
              {children}
            </div>
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainLayout;
