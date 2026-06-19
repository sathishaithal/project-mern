import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { MotionConfig } from "framer-motion";
import { useAuth } from '../context/AuthContext';
import { getTheme, saveTheme } from '../services/themeApi';

const ColorModeContext = createContext();

const accentThemes = {
  ocean: {
    id: "ocean",
    name: "Ocean Blue",
    primary: "#2563eb",
    secondary: "#0f3ea3",
    soft: "#dbeafe",
    glow: "rgba(37, 99, 235, 0.28)",
    sidebarLightStart: "#0f3a7a",
    sidebarLightEnd: "#102a5c",
    sidebarDarkStart: "#0b1222",
    sidebarDarkEnd: "#111c32",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Mint",
    primary: "#10b981",
    secondary: "#047857",
    soft: "#d1fae5",
    glow: "rgba(16, 185, 129, 0.28)",
    sidebarLightStart: "#0b5f4b",
    sidebarLightEnd: "#083c35",
    sidebarDarkStart: "#081712",
    sidebarDarkEnd: "#0d221c",
  },
  sunset: {
    id: "sunset",
    name: "Sunset Coral",
    primary: "#f97316",
    secondary: "#dc2626",
    soft: "#ffedd5",
    glow: "rgba(249, 115, 22, 0.28)",
    sidebarLightStart: "#8a3412",
    sidebarLightEnd: "#7f1d1d",
    sidebarDarkStart: "#22110b",
    sidebarDarkEnd: "#2f1515",
  },
  violet: {
    id: "violet",
    name: "Royal Violet",
    primary: "#7c3aed",
    secondary: "#5b21b6",
    soft: "#ede9fe",
    glow: "rgba(124, 58, 237, 0.28)",
    sidebarLightStart: "#5b21b6",
    sidebarLightEnd: "#4c1d95",
    sidebarDarkStart: "#161024",
    sidebarDarkEnd: "#211637",
  },
  ruby: {
    id: "ruby",
    name: "Ruby Rose",
    primary: "#e11d48",
    secondary: "#be123c",
    soft: "#ffe4e6",
    glow: "rgba(225, 29, 72, 0.28)",
    sidebarLightStart: "#9f1239",
    sidebarLightEnd: "#881337",
    sidebarDarkStart: "#241018",
    sidebarDarkEnd: "#321420",
  },
  amber: {
    id: "amber",
    name: "Amber Gold",
    primary: "#f59e0b",
    secondary: "#d97706",
    soft: "#fef3c7",
    glow: "rgba(245, 158, 11, 0.28)",
    sidebarLightStart: "#a16207",
    sidebarLightEnd: "#854d0e",
    sidebarDarkStart: "#241a09",
    sidebarDarkEnd: "#33240f",
  },
};

const fontThemes = {
  inter: {
    id: "inter",
    name: "Manrope",
    body: "'Manrope', 'Segoe UI', sans-serif",
    display: "'Manrope', 'Segoe UI', sans-serif",
    import: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
  },
  poppins: {
    id: "poppins",
    name: "Poppins",
    body: "'Poppins', 'Segoe UI', sans-serif",
    display: "'Poppins', 'Segoe UI', sans-serif",
    import: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
  },
  nunito: {
    id: "nunito",
    name: "DM Sans",
    body: "'DM Sans', 'Segoe UI', sans-serif",
    display: "'DM Sans', 'Segoe UI', sans-serif",
    import: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap",
  },
  playfair: {
    id: "playfair",
    name: "Playfair",
    body: "'Inter', 'Segoe UI', sans-serif",
    display: "'Playfair Display', Georgia, serif",
    import: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap",
  },
};

const sidebarModes = {
  fixed:  { id: "fixed",  name: "Fixed Open", description: "Keep the sidebar expanded on desktop." },
  closed: { id: "closed", name: "Closed",     description: "Start with the sidebar collapsed on desktop." },
};

const densityOptions = {
  compact:     { id: "compact",     name: "Compact", spacing: "0.88" },
  comfortable: { id: "comfortable", name: "Default", spacing: "1"    },
  spacious:    { id: "spacious",    name: "Spacious", spacing: "1.12" },
};

const animationOptions = {
  on:  { id: "on",  name: "On",  motionReduce: "never"  },
  off: { id: "off", name: "Off", motionReduce: "always" },
};

const getStoredValue = (key, fallback) => localStorage.getItem(key) || fallback;

// Summary-cards storage keys (mirrors SummaryCardsSystem constants)
const SC_STORAGE_KEY = 'summaryCards_global';
const SC_HIDDEN_KEY  = 'summaryCardsHidden_global';
const SC_DEFAULT     = ['current_month_dist', 'short_supply', 'fg_closing_stock', 'raw_total_used'];

// Canonical snapshot — same key order used for both saving and comparing
const toSnapshot = (mode, accentId, fontId, fontScale, sidebarMode, densityId, animId, selectedCards, isCardsHidden) =>
  JSON.stringify({ themeMode: mode, accentId, fontId, fontScale, sidebarMode, densityId, animId, selectedCards, isCardsHidden });

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [mode,        setMode]        = useState(getStoredValue("themeMode",            "light"));
  const [accentId,    setAccentId]    = useState(getStoredValue("dashboardAccent",      "ocean"));
  const [fontId,      setFontId]      = useState(getStoredValue("dashboardFont",        "inter"));
  const [fontScale,   setFontScale]   = useState(Number(getStoredValue("dashboardFontScale", "1")));
  const [sidebarMode, setSidebarMode] = useState(getStoredValue("dashboardSidebarMode", "fixed"));
  const [densityId,   setDensityId]   = useState(getStoredValue("dashboardDensity",     "comfortable"));
  const [animId,      setAnimId]      = useState(getStoredValue("dashboardAnimation",   "on"));

  // Summary cards — persisted alongside theme
  const [selectedCards,  setSelectedCards]  = useState(() => {
    try {
      const raw = localStorage.getItem(SC_STORAGE_KEY);
      if (!raw) return SC_DEFAULT;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SC_DEFAULT;
    } catch { return SC_DEFAULT; }
  });
  const [isCardsHidden, setIsCardsHidden] = useState(() => localStorage.getItem(SC_HIDDEN_KEY) === 'true');

  // Save-status shown in Theme Studio: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');

  const debounceRef   = useRef(null);
  const isReadyRef    = useRef(false);   // true once API load attempt completes
  const lastSavedRef  = useRef(null);    // JSON of last successfully saved state

  // Load user's theme from DB after login
  useEffect(() => {
    if (!isAuthenticated) { isReadyRef.current = false; return; }
    getTheme().then(data => {
      if (data) {
        if (data.themeMode)         setMode(data.themeMode);
        if (data.accentId)          setAccentId(data.accentId);
        if (data.fontId)            setFontId(data.fontId);
        if (data.fontScale != null) setFontScale(Number(data.fontScale));
        if (data.sidebarMode)       setSidebarMode(data.sidebarMode);
        if (data.densityId)         setDensityId(data.densityId);
        if (data.animId)            setAnimId(data.animId);
        if (Array.isArray(data.selectedCards))  setSelectedCards(data.selectedCards);
        if (data.isCardsHidden != null)         setIsCardsHidden(Boolean(data.isCardsHidden));
        // Mark what we just loaded — so debounce skips an immediate re-save
        lastSavedRef.current = toSnapshot(
          data.themeMode      ?? mode,
          data.accentId       ?? accentId,
          data.fontId         ?? fontId,
          data.fontScale      ?? fontScale,
          data.sidebarMode    ?? sidebarMode,
          data.densityId      ?? densityId,
          data.animId         ?? animId,
          data.selectedCards  ?? selectedCards,
          data.isCardsHidden  ?? isCardsHidden,
        );
      }
      isReadyRef.current = true;
    });
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-save: fires 1.5s after the last setting change
  useEffect(() => {
    if (!isReadyRef.current) return;
    const snapshot = toSnapshot(mode, accentId, fontId, fontScale, sidebarMode, densityId, animId, selectedCards, isCardsHidden);
    if (snapshot === lastSavedRef.current) return; // nothing changed since last save
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await saveTheme({ themeMode: mode, accentId, fontId, fontScale, sidebarMode, densityId, animId, selectedCards, isCardsHidden });
      if (result) {
        lastSavedRef.current = snapshot;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 1500);
    return () => clearTimeout(debounceRef.current);
  }, [mode, accentId, fontId, fontScale, sidebarMode, densityId, animId, selectedCards, isCardsHidden]); // eslint-disable-line react-hooks/exhaustive-deps

  const accent  = accentThemes[accentId]     || accentThemes.ocean;
  const font    = fontThemes[fontId]         || fontThemes.inter;
  const density = densityOptions[densityId]  || densityOptions.comfortable;
  const anim    = animationOptions[animId]   || animationOptions.on;

  const toggleMode = () => setMode((prev) => (prev === "light" ? "dark" : "light"));

  useEffect(() => { localStorage.setItem("themeMode",           mode);          document.documentElement.setAttribute("data-theme", mode); }, [mode]);
  useEffect(() => { localStorage.setItem("dashboardAccent",     accentId);    }, [accentId]);
  useEffect(() => { localStorage.setItem("dashboardFont",       fontId);      }, [fontId]);
  useEffect(() => { localStorage.setItem("dashboardFontScale",  String(fontScale)); }, [fontScale]);
  useEffect(() => { localStorage.setItem("dashboardSidebarMode",sidebarMode); }, [sidebarMode]);
  useEffect(() => { localStorage.setItem("dashboardDensity",    densityId);   }, [densityId]);
  useEffect(() => { localStorage.setItem("dashboardAnimation",  animId);      }, [animId]);
  useEffect(() => { localStorage.setItem(SC_STORAGE_KEY, JSON.stringify(selectedCards)); }, [selectedCards]);
  useEffect(() => { localStorage.setItem(SC_HIDDEN_KEY,  String(isCardsHidden));         }, [isCardsHidden]);

  /* Lazy-load Google Font */
  useEffect(() => {
    const fontLinkId = `dashboard-font-${font.id}`;
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement("link");
      link.id   = fontLinkId;
      link.rel  = "stylesheet";
      link.href = font.import;
      document.head.appendChild(link);
    }
  }, [font]);

  /* data-motion drives CSS transition override in index.css */
  useEffect(() => {
    document.documentElement.setAttribute("data-motion", anim.id);
  }, [anim]);

  /* All CSS custom properties */
  useEffect(() => {
    const root   = document.documentElement;
    const isDark = mode === "dark";

    root.style.setProperty("--dashboard-accent",        accent.primary);
    root.style.setProperty("--dashboard-accent-strong", accent.secondary);
    root.style.setProperty("--dashboard-accent-soft",   accent.soft);
    root.style.setProperty("--dashboard-accent-glow",   accent.glow);
    root.style.setProperty("--dashboard-sidebar-start", isDark ? accent.sidebarDarkStart : accent.sidebarLightStart);
    root.style.setProperty("--dashboard-sidebar-end",   isDark ? accent.sidebarDarkEnd   : accent.sidebarLightEnd);
    root.style.setProperty("--dashboard-font-body",     font.body);
    root.style.setProperty("--dashboard-font-display",  font.display);
    root.style.setProperty("--dashboard-font-scale",    String(fontScale));
    root.style.setProperty("--dashboard-font-size-base",`${fontScale}rem`);
    root.style.setProperty("--dashboard-density-scale", density.spacing);
    root.style.fontSize = `${fontScale * 16}px`;
    root.style.setProperty("--dashboard-shell-bg",
      isDark
        ? "linear-gradient(180deg, #020617 0%, #0f172a 40%, #111827 100%)"
        : "linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #f9fbff 100%)"
    );
    root.style.setProperty("--dashboard-panel",       isDark ? "rgba(15, 23, 42, 0.88)" : "rgba(255, 255, 255, 0.86)");
    root.style.setProperty("--dashboard-panel-solid", isDark ? "#0f172a"                : "#ffffff");
    root.style.setProperty("--dashboard-border",      isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.16)");
    root.style.setProperty("--dashboard-text",        isDark ? "#e5eefb" : "#10213d");
    root.style.setProperty("--dashboard-text-muted",  isDark ? "#94a3b8" : "#5f6f89");
  }, [accent, density.spacing, font, fontScale, mode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary:   { main: accent.primary   },
          secondary: { main: accent.secondary },
          background: {
            default: mode === "dark" ? "#020617" : "#f8fbff",
            paper:   mode === "dark" ? "#0f172a" : "#ffffff",
          },
        },
        typography: {
          fontFamily: font.body,
          h1: { fontFamily: font.display },
          h2: { fontFamily: font.display },
          h3: { fontFamily: font.display },
          h4: { fontFamily: font.display },
          h5: { fontFamily: font.display },
          h6: { fontFamily: font.display },
        },
        shape: { borderRadius: 18 },
      }),
    [accent.primary, accent.secondary, font.body, font.display, mode]
  );

  const value = {
    mode,
    isDarkMode: mode === "dark",
    accentThemes:     Object.values(accentThemes),
    fontThemes:       Object.values(fontThemes),
    sidebarModes:     Object.values(sidebarModes),
    densityOptions:   Object.values(densityOptions),
    animationOptions: Object.values(animationOptions),
    selectedAccent:   accent,
    selectedFont:     font,
    selectedAnimation: anim,
    fontScale,
    sidebarMode,
    density,
    saveStatus,
    selectedCards,
    setSelectedCards,
    isCardsHidden,
    setIsCardsHidden,
    toggleMode,
    setMode,
    setAccentTheme: setAccentId,
    setFontTheme:   setFontId,
    setFontScale,
    setSidebarMode,
    setDensity:     setDensityId,
    setAnimation:   setAnimId,
  };

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <MotionConfig reducedMotion={anim.motionReduce}>
          <CssBaseline />
          {children}
        </MotionConfig>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
