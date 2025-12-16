const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Access denied! Token missing"+" : "+token });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Invalid token!" });

    req.user = decoded; // userId, email, etc.
    next();
  });
};
