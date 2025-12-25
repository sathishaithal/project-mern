const jwt = require("jsonwebtoken");
require("dotenv").config();

const blacklistedTokens = require("../utils/tokenBlacklist");

module.exports = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Access denied! Token missing"+" : "+token });

  if (blacklistedTokens.has(token))
    return res.status(401).json({ message: "Token expired. Please login again." });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Invalid token!" });

    req.user = decoded; // userId, email, etc.
    next(); 
  }); 
};
