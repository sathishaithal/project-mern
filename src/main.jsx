import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";

// ---------------- REPORTS ----------------
import Reports from "./pages/Reports/Reports";
import Production from "./pages/Reports/Production";
import Sales from "./pages/Reports/Sales";
import Inventory from "./pages/Reports/Inventory";

// ---------------- MANAGEMENT ----------------
import Employees from "./pages/Management/Employees";
import Vendors from "./pages/Management/Vendors";

// ---------------- SETTINGS ----------------
import Profile from "./pages/Settings/Profile";
import SystemSettings from "./pages/Settings/SystemSettings";

// ---------------- TOOLS ----------------
// import ExportTool from "./pages/Tools/ExportTool";
// import ImportTool from "./pages/Tools/ImportTool";

import { AuthProvider } from "./context/AuthContext";
import { ColorModeProvider } from "./theme/ThemeContext";

import MainLayout from "./layouts/MainLayout";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ColorModeProvider>
        <BrowserRouter>
          <Routes>

            {/* ---------- LOGIN PAGE ---------- */}
            <Route path="/" element={<SignIn />} />

            {/* ---------- DASHBOARD ---------- */}
            <Route
              path="/dashboard"
              element={
                <MainLayout title="Dashboard">
                  <Dashboard />
                </MainLayout>
              }
            />

            {/* ---------- REPORTS MAIN PAGE ---------- */}
            <Route
              path="/reports"
              element={
                <MainLayout title="Reports">
                  <Reports />
                </MainLayout>
              }
            />

            {/* ---------- REPORTS → PRODUCTION ---------- */}
            <Route
              path="/reports/production"
              element={
                <MainLayout title="Production Report">
                  <Production />
                </MainLayout>
              }
            />

            {/* ---------- REPORTS → SALES ---------- */}
            <Route
              path="/reports/sales"
              element={
                <MainLayout title="Sales Report">
                  <Sales />
                </MainLayout>
              }
            />

            {/* ---------- REPORTS → INVENTORY ---------- */}
            <Route
              path="/reports/inventory"
              element={
                <MainLayout title="Inventory Report">
                  <Inventory />
                </MainLayout>
              }
            />

            {/* ---------- MANAGEMENT → EMPLOYEES ---------- */}
            <Route
              path="/management/employees"
              element={
                <MainLayout title="Employee Management">
                  <Employees />
                </MainLayout>
              }
            />

            {/* ---------- MANAGEMENT → VENDORS ---------- */}
            <Route
              path="/management/vendors"
              element={
                <MainLayout title="Vendor Management">
                  <Vendors />
                </MainLayout>
              }
            />

            {/* ---------- SETTINGS → PROFILE ---------- */}
            <Route
              path="/settings/profile"
              element={
                <MainLayout title="User Profile">
                  <Profile />
                </MainLayout>
              }
            />

            {/* ---------- SETTINGS → SYSTEM SETTINGS ---------- */}
            <Route
              path="/settings/system"
              element={
                <MainLayout title="System Settings">
                  <SystemSettings />
                </MainLayout>
              }
            />

          

          </Routes>
        </BrowserRouter>
      </ColorModeProvider>
    </AuthProvider>
  </React.StrictMode>
);
