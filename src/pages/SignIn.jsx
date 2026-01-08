import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Person, ArrowForward, Security, Speed, Shield, Support, Upcoming, Verified } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import bhagyaLogo from "../assets/bhagya.png";


const SignIn = () => {
  const theme = {
    primary: "#2563eb",
    primaryLight: "#3b82f6",
    primaryLighter: "#60a5fa",
    primaryDark: "#1d4ed8",
    secondary: "#1e40af",
    accent: "#06b6d4",
    accent2: "#10b981",
    gradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #dbeafe 70%, #ede9fe 100%)",
    card: "rgba(255, 255, 255, 0.97)",
    textPrimary: "#1e293b",
    textSecondary: "#475569",
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    // Create bubbles specifically for the left side (Sri Bhagyalakshmi area)
    const bubbleCount = 10; 
    const newBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 50 + 30, 
      x: Math.random() * 40 + 5, 
      y: Math.random() * 70 + 10,
      opacity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6 - more visible
      color: [theme.primary, theme.secondary, theme.accent, theme.accent2, "#8b5cf6", "#0ea5e9"][i % 6],
      duration: Math.random() * 40 + 40,
      delay: Math.random() * 15,
      directionX: Math.random() > 0.5 ? 1 : -1,
      directionY: Math.random() > 0.5 ? 1 : -1,
      maxX: 45,
      minX: 5,
      maxY: 80,
      minY: 10,
    }));
    setBubbles(newBubbles);
  }, []);

useEffect(() => {
  const interval = setInterval(() => {
    setActiveFeature((prev) => (prev + 1) % 6);
  }, 4000);
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const logoutMessage = sessionStorage.getItem("logoutMessage");
  
  if (logoutMessage) {
    setSnackbarMessage(logoutMessage);
    setSnackbarOpen(true);
    
    sessionStorage.removeItem("logoutMessage");
  }
}, []);

  const createRipple = (e) => {
    const ripple = document.createElement("div");
    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.background = `radial-gradient(circle, ${theme.primary}20, transparent)`;
    ripple.style.transform = "scale(0)";
    ripple.style.animation = "ripple 1s linear";
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    ripple.style.width = "100px";
    ripple.style.height = "100px";
    ripple.style.pointerEvents = "none";
    ripple.style.zIndex = "1";

    document.getElementById("bg-container")?.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
  };

  useEffect(() => {
    document.body.style.fontFamily = "'Inter', 'Roboto', sans-serif";

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    const bg = document.getElementById("bg-container");
    if (bg) bg.addEventListener("click", createRipple);

    return () => {
      if (bg) bg.removeEventListener("click", createRipple);
      document.head.removeChild(style);
    };
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setSnackbarMessage("Please enter both username and password");
      setSnackbarOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        { username, password }
      );
      const { token, username: uname } = res.data;
      localStorage.setItem("authToken", token);
      sessionStorage.setItem("authToken", token);
      login(uname, token);
      setSnackbarMessage(`Welcome back, ${uname}!`);
      setSnackbarOpen(true);
      createSuccessEffect();
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

  const createSuccessEffect = () => {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.style.position = "fixed";
        confetti.style.width = "12px";
        confetti.style.height = "12px";
        confetti.style.background =
          [theme.primary, theme.secondary, theme.accent, theme.accent2][
            Math.floor(Math.random() * 4)
          ];
        confetti.style.borderRadius = "50%";
        confetti.style.left = "50%";
        confetti.style.top = "50%";
        confetti.style.transform = "translate(-50%, -50%)";
        confetti.style.pointerEvents = "none";
        confetti.style.zIndex = "9999";

        const angle = Math.random() * Math.PI * 2;
        const velocity = 4 + Math.random() * 4;
        let vx = Math.cos(angle) * velocity;
        let vy = Math.sin(angle) * velocity - 5;

        document.body.appendChild(confetti);

        let posX = window.innerWidth / 2;
        let posY = window.innerHeight / 2;

        const animateConfetti = () => {
          posX += vx * 8;
          posY += vy * 8;
          vy += 0.4;

          confetti.style.left = `${posX}px`;
          confetti.style.top = `${posY}px`;
          confetti.style.opacity = posY < window.innerHeight + 100 ? "1" : "0";

          if (posY < window.innerHeight + 100) {
            requestAnimationFrame(animateConfetti);
          } else {
            confetti.remove();
          }
        };

        animateConfetti();
      }, i * 60);
    }
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 32, color: "white" }} />,
      title: "256-bit Encryption",
      description: "Military-grade security for your data",
      color: theme.primary,
    },
    {
      icon: <Speed sx={{ fontSize: 32, color: "white" }} />,
      title: "High Performance",
      description: "Lightning fast dashboard experience",
      color: theme.secondary,
    },
    {
      icon: <Shield sx={{ fontSize: 32, color: "white" }} />,
      title: "Enterprise Security",
      description: "Enterprise-level protection",
      color: theme.accent2,
    },
    {
      icon: <Support sx={{ fontSize: 32, color: "white" }} />,
      title: "24/7 Support",
      description: "Round-the-clock expert assistance",
      color: "#8b5cf6",
    },
    {
      icon: <Upcoming sx={{ fontSize: 32, color: "white" }} />,
      title: "99.9% Uptime",
      description: "Maximum reliability & availability",
      color: "#0ea5e9",
    },
    {
      icon: <Verified sx={{ fontSize: 32, color: "white" }} />,
      title: "A+ Security",
      description: "Top-tier security certification",
      color: "#10b981",
    },
  ];

  const AnimatedDashboard = () => (
    <Typography
      sx={{
        fontSize: { xs: "2.5rem", sm: "3rem", md: "3.8rem", lg: "4.2rem" },
        fontWeight: 800,
        lineHeight: 1.1,
        background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.secondary} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textAlign: { xs: "center", lg: "left" },
        mt: 2,
      }}
    >
      {"Groups".split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: 0.4 + i * 0.06,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </Typography>
  );

  return (
    <Box
      id="bg-container"
      sx={{
        minHeight: "100vh",
        background: theme.gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        py: { xs: 2, md: 4 },
        px: { xs: 2, sm: 3 },
        cursor: "pointer",
      }}
    >
      {/* Particles & Orbs - These are still global */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            x: [particle.x + "%", (particle.x + Math.sin(particle.id) * 20) + "%", particle.x + "%"],
            y: [particle.y + "%", (particle.y + Math.cos(particle.id) * 20) + "%", particle.y + "%"],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: particle.delay,
          }}
          style={{
            position: "absolute",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, ${theme.primary}30, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
            zIndex: 1,
          }}
        />
      ))}

      {[1, 2, 3].map((i) => (
        <motion.div
          key={`orb-${i}`}
          animate={{
            x: [0, Math.sin(i) * 100, 0],
            y: [0, Math.cos(i) * 100, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
            background: `radial-gradient(circle, ${i === 1 ? theme.primary : i === 2 ? theme.secondary : theme.accent}15, transparent 70%)`,
            borderRadius: "50%",
            filter: "blur(50px)",
            left: `${i * 20}%`,
            top: `${i * 15}%`,
            zIndex: 1,
          }}
        />
      ))}

      {/* Floating Bubbles - ONLY on left side near Sri Bhagyalakshmi text */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "50%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {bubbles.map((bubble) => (
          <motion.div
            key={`bubble-${bubble.id}`}
            initial={{
              x: `${bubble.x}vw`,
              y: `${bubble.y}vh`,
              opacity: bubble.opacity,
            }}
            animate={{
              x: [
                `${bubble.x}vw`,
                `${bubble.x + (bubble.directionX * (10 + Math.random() * 15))}vw`,
                `${bubble.x + (bubble.directionX * (20 + Math.random() * 15))}vw`,
                `${bubble.x}vw`,
              ].map(val => {
                // Ensure bubble stays within left side boundaries
                const num = parseFloat(val);
                if (num > bubble.maxX) return `${bubble.maxX}vw`;
                if (num < bubble.minX) return `${bubble.minX}vw`;
                return val;
              }),
              y: [
                `${bubble.y}vh`,
                `${bubble.y + (bubble.directionY * (5 + Math.random() * 10))}vh`,
                `${bubble.y + (bubble.directionY * (10 + Math.random() * 10))}vh`,
                `${bubble.y}vh`,
              ].map(val => {
                // Ensure bubble stays within vertical boundaries
                const num = parseFloat(val);
                if (num > bubble.maxY) return `${bubble.maxY}vh`;
                if (num < bubble.minY) return `${bubble.minY}vh`;
                return val;
              }),
              rotate: [0, 180, 360],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: bubble.delay,
            }}
            style={{
              position: "absolute",
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: `radial-gradient(circle at 30% 30%, ${bubble.color}50, ${bubble.color}20)`,
              borderRadius: "50%",
              filter: "blur(6px)",
              zIndex: 1,
              pointerEvents: "none",
              boxShadow: `0 0 40px ${bubble.color}30`,
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: "1400px",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: { xs: 6, lg: 10 },
          zIndex: 2,
        }}
      >
        {/* Left Side - Content (where bubbles will appear) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            py: { xs: 4, lg: 0 },
            width: "100%",
            position: "relative",
          }}
        >
          {/* Background glow effect */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              position: "absolute",
              width: "120%",
              height: "120%",
              background: `radial-gradient(ellipse at center, ${theme.primary}15, transparent 70%)`,
              filter: "blur(60px)",
              zIndex: 0,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Main Title */}
          <Box sx={{ 
              position: "relative", 
              zIndex: 2, 
              mb: 4, 
              width: "100%", 
            }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "3rem", sm: "4rem", md: "5rem", lg: "5.5rem" },
                  fontWeight: 900,
                  lineHeight: 1,
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.accent} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 10px 30px rgba(37, 99, 235, 0.2)",
                }}
              >
                Sri Bhagyalakshmi
              </Typography>
            </motion.div>

            {/* Dashboard - animated letter by letter */}
            <AnimatedDashboard />

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "300px" }}
              transition={{ duration: 1.2, delay: 2.2 }}
              style={{
                height: "6px",
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                borderRadius: "3px",
                margin: "40px 0",
              }}
            />
          </Box>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.4 }}
            style={{ position: "relative", zIndex: 2 }}
          >
            <Typography
              sx={{
                fontSize: { xs: "1.3rem", md: "1.6rem" },
                fontWeight: 600,
                color: theme.textSecondary,
                mb: 6,
                textAlign: "center",
                maxWidth: "600px",
                width: "100%",
                mx: "auto",
                display: "block",
              }}
            >
              Premium Dashboard Access
            </Typography>
          </motion.div>

          {/* Feature Carousel */}
          <Box sx={{ 
            width: "100%", 
            mb: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.5 }}
                style={{ width: "100%" }}
              >
                <Box
                  sx={{
                    p: 4,
                    borderRadius: "24px",
                    background: `linear-gradient(135deg, ${features[activeFeature].color}10, transparent)`,
                    border: `1px solid ${features[activeFeature].color}20`,
                    backdropFilter: "blur(10px)",
                    maxWidth: "520px",
                    mx: "auto",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    >
                      <Box
                        sx={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "18px",
                          background: `linear-gradient(135deg, ${features[activeFeature].color}, ${theme.primaryLight})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 10px 30px ${features[activeFeature].color}50`,
                        }}
                      >
                        {features[activeFeature].icon}
                      </Box>
                    </motion.div>
                    <Box>
                      <Typography sx={{ fontSize: "1.7rem", fontWeight: 700, color: theme.textPrimary }}>
                        {features[activeFeature].title}
                      </Typography>
                      <Typography sx={{ color: theme.textSecondary, fontSize: "1.1rem", mt: 1 }}>
                        {features[activeFeature].description}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </AnimatePresence>

            {/* Feature Dots */}
            <Box sx={{ 
              display: "flex", 
              gap: 2, 
              justifyContent: "center",
              mt: 4,
              width: "100%",
            }}>
              {features.map((_, index) => (
                <motion.div
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ scale: 1.4 }}
                  animate={{
                    scale: index === activeFeature ? 1.4 : 1,
                    backgroundColor: index === activeFeature ? features[index].color : "#94a3b840",
                  }}
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right Side - Login Form (NO bubbles here) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: { xs: "100%", sm: "520px" },
            width: "100%",
            position: "relative",
            zIndex: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            style={{ position: "relative", zIndex: 2, width: "100%" }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 5, md: 6 },
                borderRadius: "32px",
                background: theme.card,
                backdropFilter: "blur(20px)",
                boxShadow: `0 40px 100px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255,255,255,0.9)`,
                border: "1px solid rgba(255,255,255,0.8)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "32px",
                  padding: "3px",
                  background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary}, ${theme.accent}, ${theme.primary})`,
                  backgroundSize: "300% 300%",
                  mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  pointerEvents: "none",
                }}
              />

                  <Box
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!isLoading) handleLogin();
                    }}
                    sx={{ position: "relative", zIndex: 2 }}
                  >
                <Box sx={{ textAlign: "center", mb: 6 }}>
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <Box
                      sx={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "24px",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 4,
                        boxShadow: `0 20px 50px ${theme.primary}50`,
                        p: 1, 
                        overflow: "hidden", 
                      }}
                    >
                      <Box
                        component="img"
                        src={bhagyaLogo}
                        alt="Bhagya Logo"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain", 
                          borderRadius: "16px", 
                        }}
                      />
                    </Box>
                  </motion.div>
                  <Typography sx={{ fontSize: { xs: "2.2rem", sm: "2.8rem" }, fontWeight: 800, color: theme.textPrimary, mb: 2 }}>
                    Welcome Back
                  </Typography>
                  <Typography sx={{ color: theme.textSecondary, fontSize: "1.2rem" }}>
                    Sign in to your secure dashboard
                  </Typography>
                </Box>

                {/* Username Field */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Person sx={{ color: theme.primary }} />
                    <Typography sx={{ fontWeight: 600, color: theme.textPrimary }}>Username</Typography>
                  </Box>
                 <TextField 
                      fullWidth 
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"

                    sx={{ 
                      "& .MuiOutlinedInput-root": { 
                        borderRadius: "16px", 
                        background: "rgba(255,255,255,0.9)", 
                        "&:hover fieldset": { borderColor: theme.primary }, 
                        "&.Mui-focused fieldset": { 
                          borderColor: theme.primary, 
                          boxShadow: `0 0 0 4px ${theme.primary}20` 
                        } 
                      } 
                    }}
                  />
                </Box>

                {/* Password Field */}
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Lock sx={{ color: theme.primary }} />
                    <Typography sx={{ fontWeight: 600, color: theme.textPrimary }}>Password</Typography>
                  </Box>
                 <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"

                                        sx={{ 
                      "& .MuiOutlinedInput-root": { 
                        borderRadius: "16px", 
                        background: "rgba(255,255,255,0.9)", 
                        "&:hover fieldset": { borderColor: theme.primary }, 
                        "&.Mui-focused fieldset": { 
                          borderColor: theme.primary, 
                          boxShadow: `0 0 0 4px ${theme.primary}20` 
                        } 
                      } 
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Sign In Button */}
                <Button
                type="submit"
                fullWidth
                size="large"
                disabled={isLoading}

                  sx={{
                    py: 2.2,
                    borderRadius: "16px",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: "white",
                    boxShadow: `0 15px 40px ${theme.primary}40`,
                    "&:hover": { 
                      transform: "translateY(-4px)", 
                      boxShadow: `0 25px 50px ${theme.primary}60` 
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {isLoading ? <CircularProgress size={28} color="inherit" /> : "SIGN IN"}
                  {!isLoading && <ArrowForward sx={{ ml: 2 }} />}
                </Button>
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)} 
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes("Welcome") ? "success" : "error"} 
          variant="filled"
          sx={{ 
            borderRadius: "14px", 
            fontWeight: 600, 
            background: snackbarMessage.includes("Welcome") ? 
              `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : 
              undefined 
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignIn;