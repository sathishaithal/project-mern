import React, { createContext, useMemo, useState, useContext } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const ColorModeContext = createContext();
export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
  const storedMode = localStorage.getItem("themeMode") || "light";
  const [mode, setMode] = useState(storedMode);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1976d2" },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                transition: "all .3s ease",
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                transition: "all .3s ease",
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                transition: "all .3s ease",
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
