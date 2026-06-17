import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

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
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({ username, token });
        setAuthReady(true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  useEffect(() => {
    const token =
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("authToken");

    if (!token) {
      setAuthReady(true);
      return;
    }

    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      logout("Invalid session");
      return;
    }

    const expiresIn = payload.exp * 1000 - Date.now();
    if (expiresIn <= 0) {
      logout("Session expired");
      return;
    }

    // username: sessionStorage (current tab) → localStorage (cross-tab fallback) → JWT payload
    const username =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      payload.username || payload.sub || payload.name || payload.employeename;

    if (!username) {
      setAuthReady(true);
      return;
    }

    // Restore sessionStorage for this tab so the expiry watcher works
    if (!sessionStorage.getItem("username")) {
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("authToken", token);
    }

    setUser({ username, token });
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setAuthReady(true);
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

  const login = (username, token) => {
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("authToken", token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("username", username);

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser({ username, token });
    setAuthReady(true);
  };

const logout = async (message = "You have been logged out") => {
  const token = sessionStorage.getItem("token");

  try {
    if (token) {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (err) { /* logout API call failed — proceed with local cleanup */ }

  const safeMessage = typeof message === "string"
    ? message
    : String(message?.message || message?.error || "You have been logged out");

  sessionStorage.removeItem("username");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("themeMode");
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  delete axios.defaults.headers.common["Authorization"];

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
