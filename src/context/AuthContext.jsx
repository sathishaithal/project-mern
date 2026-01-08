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

  useEffect(() => {
    const username = sessionStorage.getItem("username");
    const token = sessionStorage.getItem("token");

    if (!username || !token) return;

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

    setUser({ username, token });
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser({ username, token });
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
  } catch (err) {}

  const safeMessage =
    typeof message === "string"
      ? message
      : message?.message ||
        message?.error ||
        "You have been logged out";

  sessionStorage.removeItem("username");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("themeMode");
  localStorage.removeItem("themeMode");
  delete axios.defaults.headers.common["Authorization"];

  setUser(null);
  sessionStorage.setItem("logoutMessage", safeMessage);

  window.location.href = "/";
};


  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
