// const express = require("express");
// const app = express();
// const authRoutes = require("./routes/authRoutes");
// require("dotenv").config();

// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);

// app.get("/", (req, res) => {
//   res.send("Node.js + Express + JWT + MySQL API Working!");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
require("dotenv").config({ path: "./backend/.env" });
const express = require("express");
const path = require("path");
const app = express();

// ===== Middlewares =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== CORS =====
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ===== API Routes =====
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/report.routes");

app.use("/api/auth", authRoutes);
app.use("/api/log", authRoutes);
app.use("/Report", reportRoutes);

// ===== Serve React (Vite build) =====
app.use(express.static(path.join(__dirname, "../dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ===== Server Start =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
