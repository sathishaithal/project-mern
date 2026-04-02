import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import bhagyaLogo from "../assets/bhagya.png";
import styles from "./SignIn.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [clickBursts, setClickBursts] = useState([]);
  const [activeFeature, setActiveFeature] = useState(0);
  const [formFocus, setFormFocus] = useState(null);
  const backgroundRef = useRef(null);
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
    const bubbleCount = 10;
    const newBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 50 + 30,
      x: Math.random() * 40 + 5,
      y: Math.random() * 70 + 10,
      opacity: Math.random() * 0.4 + 0.2,
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
      showAlertWithAnimation(logoutMessage, "success");
      sessionStorage.removeItem("logoutMessage");
    }
  }, []);

  const showAlertWithAnimation = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
    setTimeout(() => {
      setAlertVisible(false);
      setTimeout(() => {
        setAlertMessage("");
      }, 300);
    }, 4000);
  };

  const showAlert = (message, type) => {
    showAlertWithAnimation(message, type);
  };

  const createClickBurst = (e) => {
    const container = backgroundRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const burst = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: [theme.primary, theme.secondary, theme.accent, theme.accent2, "#8b5cf6"][
        Math.floor(Math.random() * 5)
      ],
    };

    setClickBursts((prev) => [...prev, burst]);
    setTimeout(() => {
      setClickBursts((prev) => prev.filter((item) => item.id !== burst.id));
    }, 1200);
  };

  useEffect(() => {
    document.body.style.fontFamily = "'Inter', 'Roboto', sans-serif";

    const style = document.createElement("style");
    style.innerHTML = `
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, ${theme.primary}20, transparent);
        transform: scale(0);
        animation: ripple 1s linear;
        width: 100px;
        height: 100px;
        pointer-events: none;
        z-index: 1;
      }
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      
      @keyframes glow {
        0% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.2); }
        50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.5); }
        100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.2); }
      }
      
      .shake-animation {
        animation: shake 0.5s ease-in-out;
      }
      
      .pulse-animation {
        animation: pulse 0.5s ease-in-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      const usernameField = document.querySelector(`.${styles.inputField}`);
      if (usernameField) {
        usernameField.classList.add("shake-animation");
        setTimeout(() => usernameField.classList.remove("shake-animation"), 500);
      }
      showAlert("Please enter both username and password", "danger");
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
      showAlert(`Welcome back, ${uname}!`, "success");
      createSuccessEffect();
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      const loginCard = document.querySelector(`.${styles.loginCard}`);
      if (loginCard) {
        loginCard.classList.add("shake-animation");
        setTimeout(() => loginCard.classList.remove("shake-animation"), 500);
      }
      showAlert(
        err.response?.data?.message || "Invalid credentials. Please try again.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createSuccessEffect = () => {
    for (let i = 0; i < 80; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.style.position = "fixed";
        confetti.style.width = `${Math.random() * 10 + 6}px`;
        confetti.style.height = `${Math.random() * 10 + 6}px`;
        confetti.style.background =
          [theme.primary, theme.secondary, theme.accent, theme.accent2, "#f59e0b", "#ef4444"][
            Math.floor(Math.random() * 6)
          ];
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0%";
        confetti.style.left = "50%";
        confetti.style.top = "50%";
        confetti.style.transform = "translate(-50%, -50%)";
        confetti.style.pointerEvents = "none";
        confetti.style.zIndex = "9999";

        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 5;
        let vx = Math.cos(angle) * velocity;
        let vy = Math.sin(angle) * velocity - 6;
        const rotation = Math.random() * 360;

        document.body.appendChild(confetti);

        let posX = window.innerWidth / 2;
        let posY = window.innerHeight / 2;
        let rot = rotation;

        const animateConfetti = () => {
          posX += vx * 8;
          posY += vy * 8;
          vy += 0.4;
          rot += 10;

          confetti.style.left = `${posX}px`;
          confetti.style.top = `${posY}px`;
          confetti.style.transform = `rotate(${rot}deg)`;
          confetti.style.opacity = posY < window.innerHeight + 100 ? "1" : "0";

          if (posY < window.innerHeight + 100) {
            requestAnimationFrame(animateConfetti);
          } else {
            confetti.remove();
          }
        };

        animateConfetti();
      }, i * 40);
    }
  };

  const features = [
    {
      icon: <i className="bi bi-shield-lock-fill" style={{ fontSize: "32px", color: "white" }}></i>,
      title: "256-bit Encryption",
      description: "Military-grade security for your data",
      color: theme.primary,
    },
    {
      icon: <i className="bi bi-speedometer2" style={{ fontSize: "32px", color: "white" }}></i>,
      title: "High Performance",
      description: "Lightning fast dashboard experience",
      color: theme.secondary,
    },
    {
      icon: <i className="bi bi-shield-fill-check" style={{ fontSize: "32px", color: "white" }}></i>,
      title: "Enterprise Security",
      description: "Enterprise-level protection",
      color: theme.accent2,
    },
    {
      icon: <i className="bi bi-headset" style={{ fontSize: "32px", color: "white" }}></i>,
      title: "24/7 Support",
      description: "Round-the-clock expert assistance",
      color: "#8b5cf6",
    },
    {
      icon: <i className="bi bi-cloud-check" style={{ fontSize: "32px", color: "white" }}></i>,
      title: "99.9% Uptime",
      description: "Maximum reliability & availability",
      color: "#0ea5e9",
    },
    {
      icon: <i className="bi bi-patch-check-fill" style={{ fontSize: "32px", color: "white" }}></i>,
      title: "A+ Security",
      description: "Top-tier security certification",
      color: "#10b981",
    },
  ];

  const floatingBadges = [
    { icon: "bi bi-lightning-charge-fill", label: "Fast Access", tone: theme.accent },
    { icon: "bi bi-phone-fill", label: "Mobile Ready", tone: theme.primary },
    { icon: "bi bi-stars", label: "Smooth Motion", tone: "#8b5cf6" },
  ];

  const AnimatedDashboard = () => (
    <div className={styles.dashboardText}>
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
          whileHover={{ scale: 1.1, y: -5 }}
          style={{ display: "inline-block", cursor: "default" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );

  return (
    <>
      <div
        ref={backgroundRef}
        className={styles.container}
        id="bg-container"
        onClick={createClickBurst}
      >
        {/* Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.5, 0],
              x: [particle.x + "%", (particle.x + Math.sin(particle.id) * 20) + "%", particle.x + "%"],
              y: [particle.y + "%", (particle.y + Math.cos(particle.id) * 20) + "%", particle.y + "%"],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.delay,
            }}
            className={styles.particle}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, ${theme.primary}40, transparent)`,
            }}
          />
        ))}

        {/* Orbs */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={`orb-${i}`}
            animate={{
              x: [0, Math.sin(i) * 100, 0],
              y: [0, Math.cos(i) * 100, 0],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={styles.orb}
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              background: `radial-gradient(circle, ${i === 1 ? theme.primary : i === 2 ? theme.secondary : theme.accent}20, transparent 70%)`,
              left: `${i * 20}%`,
              top: `${i * 15}%`,
            }}
          />
        ))}

        {/* Floating Bubbles */}
        <div className={styles.bubbleContainer}>
          {bubbles.map((bubble) => (
            <motion.div
              key={`bubble-${bubble.id}`}
              initial={{
                x: `${bubble.x}vw`,
                y: `${bubble.y}vh`,
                opacity: bubble.opacity,
                scale: 0.8,
              }}
              animate={{
                x: [
                  `${bubble.x}vw`,
                  `${bubble.x + (bubble.directionX * (10 + Math.random() * 15))}vw`,
                  `${bubble.x + (bubble.directionX * (20 + Math.random() * 15))}vw`,
                  `${bubble.x}vw`,
                ].map(val => {
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
                  const num = parseFloat(val);
                  if (num > bubble.maxY) return `${bubble.maxY}vh`;
                  if (num < bubble.minY) return `${bubble.minY}vh`;
                  return val;
                }),
                rotate: [0, 180, 360],
                scale: [0.8, 1.2, 0.9, 1],
              }}
              transition={{
                duration: bubble.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: bubble.delay,
              }}
              className={styles.bubble}
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                background: `radial-gradient(circle at 30% 30%, ${bubble.color}60, ${bubble.color}30)`,
                boxShadow: `0 0 40px ${bubble.color}40`,
              }}
            />
          ))}
        </div>

        <div className={styles.clickEffectsLayer}>
          <AnimatePresence>
            {clickBursts.map((burst) => (
              <React.Fragment key={burst.id}>
                <motion.div
                  className={styles.clickRipple}
                  initial={{ opacity: 0.45, scale: 0 }}
                  animate={{ opacity: 0, scale: 4.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{
                    left: burst.x,
                    top: burst.y,
                    background: `radial-gradient(circle, ${burst.color}45 0%, transparent 70%)`,
                  }}
                />
                <motion.div
                  className={styles.clickCore}
                  initial={{ opacity: 0.9, scale: 0 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    left: burst.x,
                    top: burst.y,
                    background: burst.color,
                    boxShadow: `0 0 30px ${burst.color}`,
                  }}
                />
                {Array.from({ length: 8 }).map((_, index) => {
                  const angle = (Math.PI * 2 * index) / 8;
                  const distance = 70 + (index % 2) * 18;
                  return (
                    <motion.span
                      key={`${burst.id}-${index}`}
                      className={styles.spark}
                      initial={{
                        x: burst.x,
                        y: burst.y,
                        opacity: 1,
                        scale: 0.5,
                      }}
                      animate={{
                        x: burst.x + Math.cos(angle) * distance,
                        y: burst.y + Math.sin(angle) * distance,
                        opacity: 0,
                        scale: 1.2,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.85, ease: "easeOut" }}
                      style={{
                        background: burst.color,
                        boxShadow: `0 0 16px ${burst.color}`,
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>

        <div className="container" style={{ maxWidth: "1400px", zIndex: 2 }}>
          <div className={`row align-items-stretch ${styles.mainGrid}`}>
            {/* Left Side - Content */}
            <div className="col-lg-6 d-flex flex-column justify-content-center py-4 py-lg-0">
              <div style={{ position: "relative" }}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1], 
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className={styles.glowEffect}
                  style={{
                    background: `radial-gradient(ellipse at center, ${theme.primary}20, transparent 70%)`,
                  }}
                />

                <div style={{ position: "relative", zIndex: 2, marginBottom: "2rem" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h1 className={styles.title}>
                      Sri Bhagyalakshmi
                    </h1>
                  </motion.div>

                  <AnimatedDashboard />

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "300px" }}
                    transition={{ duration: 1.2, delay: 2.2 }}
                    className={styles.underline}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 2.4 }}
                  whileHover={{ scale: 1.02 }}
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <h3 className={styles.subtitle}>
                    Premium Dashboard Access
                  </h3>
                </motion.div>

                <div className={styles.badgeRow}>
                  {floatingBadges.map((badge, index) => (
                    <motion.div
                      key={badge.label}
                      className={styles.infoBadge}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 2.5 + index * 0.12 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      style={{
                        borderColor: `${badge.tone}35`,
                        boxShadow: `0 14px 40px ${badge.tone}18`,
                      }}
                    >
                      <span
                        className={styles.infoBadgeIcon}
                        style={{ background: `linear-gradient(135deg, ${badge.tone}, ${theme.primaryLight})` }}
                      >
                        <i className={badge.icon}></i>
                      </span>
                      <span>{badge.label}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Feature Carousel */}
                <div className={styles.featureSection}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0, x: -100, rotateY: -90 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      exit={{ opacity: 0, x: 100, rotateY: 90 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className={styles.featureCard}
                        style={{
                          background: `linear-gradient(135deg, ${features[activeFeature].color}15, transparent)`,
                          border: `1px solid ${features[activeFeature].color}30`,
                          cursor: "pointer",
                        }}
                      >
                        <div className={styles.featureCardInner}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            whileHover={{ scale: 1.1, rotate: 0 }}
                          >
                            <div
                              className={styles.featureIcon}
                              style={{
                                background: `linear-gradient(135deg, ${features[activeFeature].color}, ${theme.primaryLight})`,
                                boxShadow: `0 10px 30px ${features[activeFeature].color}60`,
                              }}
                            >
                              {features[activeFeature].icon}
                            </div>
                          </motion.div>
                          <div>
                            <h4 className={styles.featureTitle}>
                              {features[activeFeature].title}
                            </h4>
                            <p className={styles.featureDescription}>
                              {features[activeFeature].description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Feature Dots */}
                  <div className={styles.dotsContainer}>
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        whileHover={{ scale: 1.5 }}
                        animate={{
                          scale: index === activeFeature ? 1.4 : 1,
                          backgroundColor: index === activeFeature ? feature.color : "#94a3b860",
                          boxShadow: index === activeFeature ? `0 0 10px ${feature.color}` : "none",
                        }}
                        transition={{ duration: 0.3 }}
                        className={styles.dot}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="col-lg-6 d-flex flex-column justify-content-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.02 }}
                className={styles.loginWrapper}
              >
                <motion.div
                  animate={{ 
                    boxShadow: isLoading ? `0 0 30px ${theme.primary}80` : "0 40px 100px rgba(37, 99, 235, 0.15)",
                  }}
                  transition={{ duration: 0.3 }}
                  className={styles.loginCard}
                >
                  <div className={styles.gradientBorder} />

                  <form onSubmit={(e) => { e.preventDefault(); if (!isLoading) handleLogin(); }} style={{ position: "relative", zIndex: 2 }}>
                    <div className="text-center mb-5">
                      <motion.div 
                        animate={{ y: [0, -12, 0] }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className={styles.logoWrapper}>
                          <img
                            src={bhagyaLogo}
                            alt="Bhagya Logo"
                            className={styles.logo}
                          />
                        </div>
                      </motion.div>
                      <motion.h2 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className={styles.welcomeTitle}
                      >
                        Welcome Back
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className={styles.welcomeSubtitle}
                      >
                        Sign in to your secure dashboard
                      </motion.p>
                    </div>

                    <motion.div
                      className={styles.formHint}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                    >
                      <span className={styles.formHintPulse}></span>
                      Secure session starts after successful login
                    </motion.div>

                    {/* Username Field */}
                    <div className="mb-4">
                      <motion.div 
                        className={styles.inputLabel}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <i className="bi bi-person" style={{ color: theme.primary, fontSize: "1.2rem" }}></i>
                        <label>Username</label>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                      >
                        <input
                          type="text"
                          className={styles.inputField}
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setFormFocus("username")}
                          onBlur={() => setFormFocus(null)}
                          autoComplete="username"
                          style={{
                            transition: "all 0.3s ease",
                            boxShadow: formFocus === "username" ? `0 0 0 4px ${theme.primary}20` : "none",
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* Password Field */}
                    <div className="mb-5">
                      <motion.div 
                        className={styles.inputLabel}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.2 }}
                      >
                        <i className="bi bi-lock" style={{ color: theme.primary, fontSize: "1.2rem" }}></i>
                        <label>Password</label>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className={styles.passwordWrapper}
                      >
                        <input
                          type={showPassword ? "text" : "password"}
                          className={styles.inputField}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFormFocus("password")}
                          onBlur={() => setFormFocus(null)}
                          autoComplete="current-password"
                          style={{
                            transition: "all 0.3s ease",
                            boxShadow: formFocus === "password" ? `0 0 0 4px ${theme.primary}20` : "none",
                          }}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={styles.passwordToggle}
                          style={{ y: "-50%" }}
                          whileHover={{ scale: 1.1, y: "-50%" }}
                          whileTap={{ scale: 0.95, y: "-50%" }}
                        >
                          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: "1.2rem" }}></i>
                        </motion.button>
                      </motion.div>
                    </div>

                    {/* Sign In Button */}
                    <motion.div className={styles.buttonWrap} whileHover={{ y: -2 }}>
                      <motion.span
                        className={styles.buttonGlow}
                        animate={{
                          x: ["-120%", "140%"],
                        }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <motion.button
                        type="submit"
                        className={styles.signInButton}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                          background: isLoading ? 
                            "linear-gradient(135deg, #4b5563, #374151)" : 
                            `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.span
                            initial={{ x: 0 }}
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                          >
                            SIGN IN
                            <i className="bi bi-arrow-right"></i>
                          </motion.span>
                        )}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {alertVisible && alertMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 22,
            }}
            className={`${styles.alertMessage} alert alert-${alertType}`}
            role="alert"
            onClick={() => {
              setAlertVisible(false);
              setTimeout(() => setAlertMessage(""), 300);
            }}
          >
            <motion.div
              className={styles.alertProgress}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.8, ease: "linear" }}
              style={{
                background: alertType === "success" ? "#10b981" : "#ef4444",
              }}
            />
            <div className={styles.alertContent}>
              {alertType === "success" ? (
                <motion.i
                  className="bi bi-check-circle-fill"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              ) : (
                <motion.i
                  className="bi bi-exclamation-triangle-fill"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <span>{alertMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SignIn;
