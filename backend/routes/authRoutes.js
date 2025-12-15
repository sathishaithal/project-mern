const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middlewares/authMiddleware");

// Public routes
router.post("/login", authController.login);
router.get("/", auth, authController.logActivity);
router.post("/",auth,  authController.logActivity);

// Example of protected route
router.get("/profile", auth, (req, res) => {
  res.json({
    message: "Authorized user",
    user: req.user,
  });
});

module.exports = router;
