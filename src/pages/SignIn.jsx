import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Person, ArrowForward, Security, Speed, Shield } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import bhagyaLogo from "../assets/bhagya.png";

const SignIn = () => {
  const blueTheme = {
    primary: "#0e3978",
    primaryLight: "#1a5bb0",
    primaryLighter: "#4dabf7",
    primaryDark: "#0c2e60",
    accent: "#00d4ff",
    accent2: "#7b61ff",
    gradient: "linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 50%, #d9e8ff 100%)",
    card: "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.98) 100%)",
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const logoutMsg = sessionStorage.getItem("logoutMessage");
    if (logoutMsg) {
      try {
        let messageString = logoutMsg;
        if (logoutMsg.startsWith("{") || logoutMsg.startsWith("[")) {
          try {
            const parsed = JSON.parse(logoutMsg);
            messageString = parsed.message || parsed.toString();
          } catch (e) {
            messageString = logoutMsg;
          }
        }
        
        setSnackbarMessage(messageString);
        setSnackbarOpen(true);
        localStorage.removeItem("logoutMessage");
      } catch (error) {
        console.error("Error processing logout message:", error);
        localStorage.removeItem("logoutMessage");
      }
    }

    // Apply font family
    document.body.style.fontFamily = "'Inter', 'Roboto', 'Segoe UI', sans-serif";
    
    // Load Inter font if not already loaded
    if (!document.querySelector('#inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setSnackbarMessage("Please enter both username and password");
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      const { token, username: uname } = res.data;

      keepLoggedIn
        ? localStorage.setItem("authToken", token)
        : sessionStorage.setItem("authToken", token);

      login(uname, token);
      setSnackbarMessage(`Welcome back, ${uname}!`);
      setSnackbarOpen(true);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      setSnackbarMessage(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: blueTheme.gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 3 },
        fontFamily: "'Inter', 'Roboto', sans-serif",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "500px",
          background: "linear-gradient(180deg, rgba(14, 57, 120, 0.1) 0%, transparent 100%)",
          zIndex: 1,
        },
      }}
    >
      {/* Animated Background Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "400px",
          height: "400px",
          background: `conic-gradient(from 0deg, transparent, ${blueTheme.primaryLighter}, transparent)`,
          opacity: 0.1,
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />

      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(i) * 50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          style={{
            position: "absolute",
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            background: blueTheme.primaryLight,
            borderRadius: "50%",
            left: `${10 + i * 15}%`,
            top: `${20 + i * 10}%`,
            opacity: 0.4,
            filter: "blur(1px)",
          }}
        />
      ))}

      <Box
        sx={{
          width: "100%",
          maxWidth: "1400px",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 6, lg: 10 },
          zIndex: 2,
          position: "relative",
          fontFamily: "'Inter', 'Roboto', sans-serif"
        }}
      >
        {/* Left Hero Section */}
        <Box
          sx={{
            flex: 1,
            textAlign: { xs: "center", lg: "left" },
            maxWidth: { lg: "600px" },
            fontFamily: "'Inter', 'Roboto', sans-serif"
          }}
          component={motion.div}
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              display: "inline-block",
              position: "relative",
              marginBottom: "40px",
            }}
          >
            <Box
              sx={{
                padding: "25px",
                borderRadius: "30px",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(14, 57, 120, 0.1)",
                boxShadow: `0 25px 60px rgba(14, 57, 120, 0.15),
                           inset 0 1px 0 rgba(255,255,255,0.8)`,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.accent})`,
                  zIndex: 1,
                },
              }}
            >
              <img
                src={bhagyaLogo}
                alt="Sri Bhagyalakshmi"
                style={{
                  width: "220px",
                  height: "auto",
                  display: "block",
                }}
              />
            </Box>

            <motion.div
              animate={{
                rotate: [0, 10, 0, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: "-15px",
                right: "-15px",
                background: `linear-gradient(45deg, ${blueTheme.primary}, ${blueTheme.accent})`,
                borderRadius: "50%",
                padding: "12px",
                boxShadow: `0 10px 30px rgba(14, 57, 120, 0.4)`,
              }}
            >
              <Security sx={{ fontSize: "28px", color: "white" }} />
            </motion.div>
          </motion.div>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "3rem", md: "4rem", lg: "4.5rem" },
              fontWeight: 900,
              lineHeight: 1.1,
              mb: 3,
              background: `linear-gradient(135deg, ${blueTheme.primary} 0%, ${blueTheme.primaryLight} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Secure Admin Portal
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", md: "2rem" },
              fontWeight: 600,
              mb: 4,
              color: "rgba(14, 57, 120, 0.9)",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Premium Dashboard Access
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 3,
              mt: 5,
              justifyContent: { xs: "center", lg: "flex-start" },
            }}
          >
            {[
              { icon: <Lock />, text: "256-bit Encryption" },
              { icon: <Speed />, text: "High Performance" },
              { icon: <Shield />, text: "Enterprise Security" },
            ].map((feature, index) => (
              <Box
                key={index}
                component={motion.div}
                whileHover={{ scale: 1.05, y: -5 }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  background: "rgba(14, 57, 120, 0.05)",
                  padding: "12px 20px",
                  borderRadius: "50px",
                  border: "1px solid rgba(14, 57, 120, 0.1)",
                }}
              >
                <Box
                  sx={{
                    color: blueTheme.primary,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: blueTheme.primaryDark,
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  {feature.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right - Login Card */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          <motion.div
            animate={{
              opacity: isHovered ? [0.3, 0.5, 0.3] : 0.2,
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              top: "-20px",
              left: "-20px",
              right: "-20px",
              bottom: "-20px",
              background: `radial-gradient(circle at center, ${blueTheme.primaryLight} 0%, transparent 70%)`,
              filter: "blur(40px)",
              zIndex: -1,
            }}
          />

          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: "30px",
              background: blueTheme.card,
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: `0 40px 80px rgba(14, 57, 120, 0.15),
                         inset 0 1px 0 rgba(255,255,255,0.8),
                         0 0 0 1px rgba(14, 57, 120, 0.05)`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.accent}, ${blueTheme.accent2})`,
                zIndex: 1,
              },
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                top: "-100px",
                right: "-100px",
                width: "200px",
                height: "200px",
                background: `conic-gradient(from 0deg, transparent, ${blueTheme.accent}20, transparent)`,
                borderRadius: "50%",
              }}
            />

            <Box sx={{ position: "relative", zIndex: 2 }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  style={{
                    display: "inline-block",
                    marginBottom: "20px",
                  }}
                >
                  <Box
                    sx={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${blueTheme.primary} 0%, ${blueTheme.primaryLight} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 15px 40px rgba(14, 57, 120, 0.3)`,
                      border: "2px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <Lock sx={{ fontSize: "40px", color: "white" }} />
                  </Box>
                </motion.div>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "2.2rem", sm: "2.8rem" },
                    mb: 1,
                    background: `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.primaryLight})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(14, 57, 120, 0.7)",
                    fontSize: "1.1rem",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  Sign in to your secure dashboard
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    mb: 2,
                    color: "white",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    background: `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.primaryLight})`,
                    padding: "10px 15px",
                    borderRadius: "10px",
                    width: "fit-content",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <Person sx={{ fontSize: "20px" }} />
                  Username
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "15px",
                      background: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      fontFamily: "'Inter', sans-serif",
                      "&:hover fieldset": {
                        borderColor: `${blueTheme.primaryLight} !important`,
                        borderWidth: "2px",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: `${blueTheme.primary} !important`,
                        borderWidth: "2px",
                        boxShadow: `0 0 0 3px ${blueTheme.primary}20`,
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    mb: 2,
                    color: "white",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    background: `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.primaryLight})`,
                    padding: "10px 15px",
                    borderRadius: "10px",
                    width: "fit-content",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  <Lock sx={{ fontSize: "20px" }} />
                  Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "15px",
                      background: "rgba(255, 255, 255, 0.9)",
                      fontFamily: "'Inter', sans-serif",
                      "&:hover fieldset": {
                        borderColor: `${blueTheme.primaryLight} !important`,
                        borderWidth: "2px",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: `${blueTheme.primary} !important`,
                        borderWidth: "2px",
                        boxShadow: `0 0 0 3px ${blueTheme.primary}20`,
                      },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{
                            color: blueTheme.primary,
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 4,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      sx={{
                        color: blueTheme.primary,
                        "&.Mui-checked": {
                          color: blueTheme.primary,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        color: blueTheme.primaryDark,
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif"
                      }}
                    >
                      Keep me logged in
                    </Typography>
                  }
                />
                <Typography
                  sx={{
                    color: blueTheme.primary,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot Password?
                </Typography>
              </Box>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  size="large"
                  onClick={handleLogin}
                  disabled={isLoading}
                  sx={{
                    py: 2.5,
                    borderRadius: "15px",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${blueTheme.primary} 0%, ${blueTheme.primaryLight} 100%)`,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "'Inter', sans-serif",
                    "&:hover": {
                      background: `linear-gradient(135deg, ${blueTheme.primaryDark} 0%, ${blueTheme.primary} 100%)`,
                      transform: "translateY(-2px)",
                      boxShadow: `0 20px 40px rgba(14, 57, 120, 0.3)`,
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      transition: "left 0.6s",
                    },
                    "&:hover::before": {
                      left: "100%",
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={28} color="inherit" />
                  ) : (
                    <>
                      SIGN IN
                      <ArrowForward sx={{ ml: 2 }} />
                    </>
                  )}
                </Button>
              </motion.div>

              <Divider sx={{ my: 4, opacity: 0.3 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  textAlign: "center",
                }}
              >
                {[
                  { value: "24/7", label: "Support" },
                  { value: "99.9%", label: "Uptime" },
                  { value: "A+", label: "Security" },
                ].map((stat, index) => (
                  <Box key={index}>
                    <Typography
                      sx={{
                        fontSize: "1.8rem",
                        fontWeight: 800,
                        background: `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.primaryLight})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontFamily: "'Inter', sans-serif"
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(14, 57, 120, 0.6)",
                        fontSize: "0.9rem",
                        fontFamily: "'Inter', sans-serif"
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 90, sm: 40 } }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessage.includes("Welcome") || snackbarMessage.includes("successfully") ? "success" : "error"}
          variant="filled"
          sx={{
            fontSize: "1rem",
            fontWeight: 600,
            borderRadius: "15px",
            fontFamily: "'Inter', sans-serif",
            background: snackbarMessage.includes("Welcome") || snackbarMessage.includes("successfully")
              ? `linear-gradient(90deg, ${blueTheme.primary}, ${blueTheme.primaryLight})`
              : undefined,
            boxShadow: `0 10px 30px rgba(14, 57, 120, 0.2)`,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignIn;