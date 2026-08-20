import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Auth now lives in an httpOnly cookie (set by the backend) instead of a
// JS-readable token — the browser must be told to send it on every request.
axios.defaults.withCredentials = true;

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Cross-tab auth sync: login on one tab → redirect others; logout on one tab → log out others
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== 'authToken') return;

      if (e.newValue === null) {
        // Another tab logged out
        setUser(null);
        setAuthReady(true);
        sessionStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
        window.location.replace('/');
      } else if (e.newValue && !user) {
        // Another tab logged in — restore session in this tab
        const token = e.newValue;
        const payload = decodeToken(token);
        if (!payload?.exp || payload.exp * 1000 <= Date.now()) return;
        const username =
          localStorage.getItem('username') ||
          payload.username || payload.sub || payload.name || payload.employeename;
        if (!username) return;
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('empname', localStorage.getItem('empname') || username);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({ username, empname: localStorage.getItem('empname') || username, token });
        setAuthReady(true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  // On mount: either exchange the central Hub's SSO token (?user_token=&crm_user=
  // in the URL) for a real session, or — if there's no such link — ask the
  // backend whether the httpOnly cookie from a previous visit is still valid.
  // The JWT itself is never readable here, so this replaces the old
  // decode-the-token-from-storage restore logic.
  useEffect(() => {
    const restoreSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const ssoToken = params.get("user_token");
      const ssoCrmUser = params.get("crm_user");

      if (ssoToken && ssoCrmUser) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/auth/login`,
            { isUserTokenLogin: true, user_token: ssoToken, crm_user: ssoCrmUser }
          );
          window.history.replaceState(null, "", window.location.pathname);
          login(res.data.username, res.data.empname);
        } catch {
          window.history.replaceState(null, "", window.location.pathname);
          setAuthReady(true);
        }
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`);
        login(res.data.username, res.data.empname);
      } catch {
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("empname");
        localStorage.removeItem("username");
        localStorage.removeItem("empname");
        setUser(null);
        setAuthReady(true);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload?.exp) return;

    const interval = setInterval(() => {
      const remainingMs = payload.exp * 1000 - Date.now();
      if (remainingMs <= 0) {
        clearInterval(interval);
        logout("Token expired");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (username, empname) => {
    const resolvedEmpname = empname || username;
    // Only username/empname are stored client-side (needed by activityLog.js
    // and cross-tab display) — the JWT itself lives solely in the httpOnly
    // cookie the backend set on the response, never in JS-readable storage.
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("empname", resolvedEmpname);
    localStorage.setItem("username", username);
    localStorage.setItem("empname", resolvedEmpname);

    setUser({ username, empname: resolvedEmpname });
    setAuthReady(true);
  };

const logout = async (message = "You have been logged out") => {
  try {
    // Cookie is sent automatically (withCredentials); the backend reads it,
    // blacklists the token, and clears the cookie.
    await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {});
  } catch (err) { /* logout API call failed — proceed with local cleanup */ }

  const safeMessage = typeof message === "string"
    ? message
    : String(message?.message || message?.error || "You have been logged out");

  sessionStorage.removeItem("username");
  sessionStorage.removeItem("empname");
  sessionStorage.removeItem("themeMode");
  localStorage.removeItem("username");
  localStorage.removeItem("empname");

  setUser(null);
  setAuthReady(true);
  sessionStorage.setItem("logoutMessage", safeMessage);

  window.location.href = "/";
};


  return (
    <AuthContext.Provider value={{ user, login, logout, authReady, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};
