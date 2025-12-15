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


require("dotenv").config();
const express = require("express");
const app = express();

// ===== Existing Middlewares =====
app.use(express.json());

// ===== Optional (if you use form-data) =====
app.use(express.urlencoded({ extended: true }));

// ===== CORS (Merged – does NOT break anything) =====
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ===== Existing Auth Routes (KEEP AS IS) =====
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/log", authRoutes);

// ===== Health Check Route =====
app.get("/", (req, res) => {
  res.send("Node.js + Express API Working!");
});

// ===== Server Start =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
