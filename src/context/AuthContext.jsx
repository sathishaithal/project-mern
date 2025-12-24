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
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");



    if (!username || !token) {
      // console.log("[AUTH] No token found → User logged out");
      return;
    }

    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      // console.log("[AUTH] Invalid token → Logging out");
      logout("Invalid session");
      return;
    }

    const expiresIn = payload.exp * 1000 - Date.now();

    if (expiresIn <= 0) {
      // console.log("[AUTH] Token already expired → Logging out");
      logout("Session expired");
      return;
    }

    // console.log(
    //   `[AUTH] Token valid → Expires in ${Math.floor(expiresIn / 1000)}s`
    // );

    setUser({ username, token });
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload?.exp) return;

    const interval = setInterval(() => {
      const remainingMs = payload.exp * 1000 - Date.now();
      const remainingSec = Math.floor(remainingMs / 1000);

      if (remainingSec <= 0) {
        console.log("[AUTH] Token expired → Logging out");
        clearInterval(interval);
        logout("Token expired");
      } else {
        // console.log(
        //   `[AUTH] Token valid → Remaining ${remainingSec}s`
        // );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (username, token) => {
    console.log("[AUTH] Login success");

    localStorage.setItem("username", username);
    localStorage.setItem("token", token);

      // console.log("[AUTH] Token:", token);

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser({ username, token });
  };

  const logout = (message = "You have been logged out") => {
    console.log(`[AUTH] Logout → ${message}`);

    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("themeMode");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);

    localStorage.setItem("logoutMessage", message);

    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
