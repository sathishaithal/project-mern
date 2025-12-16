require("dotenv").config();
const express = require("express");
const app = express();

// ===== Middlewares =====
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data if needed

// ===== CORS Middleware (Manual - Safe & Working) =====
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ===== Routes =====
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/report.routes.js");

// Fix 1: Use lowercase and consistent path
app.use("/api/auth", authRoutes);
app.use("/api/log", authRoutes);
app.use("/api/reports", reportRoutes); // ← Changed from "/Report" to "/api/reports"

// ===== Health Check =====
app.get("/", (req, res) => {
  res.send("Node.js + Express API Working!");
});

// ===== 404 Handler (Optional but recommended) =====
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// ===== Global Error Handler (Last) =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});