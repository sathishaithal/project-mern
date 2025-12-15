const mysql = require("mysql2/promise");
require("dotenv").config();

// MAIN DB
const mainDB = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// TEST CONNECTION
(async () => {
  try {
    const conn = await mainDB.getConnection();
    console.log("✅ MySQL Connected OK");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection Error:", err);
  }
})();

// DYNAMIC DB (based on user.dbase)
const getDynamicDB = (dbname) => {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: dbname,
    connectionLimit: 10
  });
};

module.exports = { mainDB, getDynamicDB };
