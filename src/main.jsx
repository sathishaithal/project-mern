import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Import Bootstrap CSS and Icons
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import SignIn from "./pages/SignIn/SignIn";
import Dashboard from "./pages/Dashboard";

// ---------------- REPORTS ----------------
import Reports from "./pages/Reports/Reports";
import Production from "./pages/Reports/Production/Production";
import Sales from "./pages/Reports/Sales/Sales";

import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

// ---------------- TOOLS ----------------
// import ExportTool from "./pages/Tools/ExportTool";
// import ImportTool from "./pages/Tools/ImportTool";

import { AuthProvider } from "./context/AuthContext";
import { ColorModeProvider } from "./theme/ThemeContext";
import { SummaryCardsProvider } from "./context/SummaryCardsContext";

import MainLayout from "./layouts/MainLayout";
import "./styles/global.css";
import "./index.css";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { authReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ColorModeProvider>
        <SummaryCardsProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ---------- LOGIN PAGE ---------- */}
              <Route path="/" element={<SignIn />} />

              {/* ---------- DASHBOARD ---------- */}
              <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                    <MainLayout title="Dashboard">
                      <ErrorBoundary label="Dashboard"><Dashboard /></ErrorBoundary>
                    </MainLayout>
                     </ProtectedRoute>
                }
              />

              {/* ---------- REPORTS MAIN PAGE ---------- */}
              <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                    <MainLayout title="Reports">
                      <ErrorBoundary label="Reports"><Reports /></ErrorBoundary>
                    </MainLayout>
                     </ProtectedRoute>
                }
              />

              {/* ---------- REPORTS → PRODUCTION ---------- */}
              <Route
                path="/reports/production"
                element={
                    <ProtectedRoute>
                    <MainLayout>
                      <ErrorBoundary label="Production Report"><Production /></ErrorBoundary>
                    </MainLayout>
                     </ProtectedRoute>
                }
              />

              {/* ---------- REPORTS → SALES ---------- */}
              <Route
                path="/reports/sales"
                element={
                    <ProtectedRoute>
                    <MainLayout title="Sales Report">
                      <ErrorBoundary label="Sales Report"><Sales /></ErrorBoundary>
                    </MainLayout>
                     </ProtectedRoute>
                }
              />

              {/* ---------- 404 CATCH-ALL ---------- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SummaryCardsProvider>
      </ColorModeProvider>
    </AuthProvider>
  </React.StrictMode>
);
