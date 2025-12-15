const { mainDB, getDynamicDB } = require("../config/db");

exports.findByEmail = async (username) => {
  try {
    console.log("🔍 Running findByEmail:", username);

    const [rows] = await mainDB.query(
      "SELECT password, username, admin, dbase FROM tbl_users WHERE username = ?",
      [username]
    );

    console.log("📊 Query result:", rows);

    return rows[0] || null;
  } catch (err) {
    console.error("❌ Query Error:", err);
    throw err;
  }
};

exports.findByToken = async (user_token, crm_user) => {
  try {
    console.log("🔍 Running findByToken:", user_token);

    const [rows] = await mainDB.query(
      "SELECT dashboard_token,username FROM tbl_users WHERE crm_user = ? and dashboard_token = ?",
      [crm_user,user_token]
    );

    console.log("📊 Query result:", rows);
    return rows[0] || null;

  } catch (err) {
    console.error("❌ Query Error:", err);
    throw err;
  }
};


exports.insertLog = async (data) => {
    const sql = `
        INSERT INTO dashboardlogin 
        (username, logtime, ip_address, user_agent, main_module, sub_module, sub_sub_module)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.username,
        data.logtime,
        data.ip_address,
        data.user_agent,
        data.main_module,
        data.sub_module,
        data.sub_sub_module
    ];

    const dynamicDB = getDynamicDB(data.dbase);
    const [rows] = await dynamicDB.query(sql, params);
    return rows;
};
