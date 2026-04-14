const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// MAIN DB
const mainDB = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:false,
  connectTimeout: 20000,
  connectionLimit: 10,

  waitForConnections: true,
  queueLimit: 0
  
});

// TEST CONNECTION
// (async () => {
//   try {
//     const conn = await mainDB.getConnection();
//     console.log("✅ MySQL Connected OK");
//     conn.release();
//   } catch (err) {
//     console.error("❌ MySQL Connection Error:", err);
//   }
// })();


const dynamicPools = {};
const getDynamicDB = (dbname) => {
  if (!dynamicPools[dbname]) {
    console.log("🆕 Creating pool for:", dbname);

    dynamicPools[dbname] = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: dbname,
      connectionLimit: 10,
      ssl: false,
      connectTimeout: 20000,
      waitForConnections: true,
      queueLimit: 0
    });
  }

  return dynamicPools[dbname];
};

module.exports = { mainDB, getDynamicDB };
