import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");
    if (username && token) setUser({ username, token });
  }, []);

  const login = (username, token = "demo-token") => {
    localStorage.setItem("username", username);
    localStorage.setItem("token", token);
    setUser({ username, token });
  };

  const logout = (message = "You have been successfully logged out") => {
    let logoutMessageString;
    
    if (typeof message === 'string') {
      logoutMessageString = message;
    } else if (message && typeof message === 'object') {
      if (message.message && typeof message.message === 'string') {
        logoutMessageString = message.message;
      } else if (message.error && typeof message.error === 'string') {
        logoutMessageString = message.error;
      } else if (message.toString && typeof message.toString === 'function') {
        try {
          logoutMessageString = message.toString();
          if (logoutMessageString === '[object Object]') {
            logoutMessageString = "You have been logged out";
          }
        } catch (e) {
          logoutMessageString = "You have been logged out";
        }
      } else {
        logoutMessageString = "You have been successfully logged out";
      }
    } else {
      logoutMessageString = String(message);
    }

    // Clear localStorage
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    
    sessionStorage.clear();
    
    sessionStorage.setItem("logoutMessage", logoutMessageString);

    setUser(null);
    
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};