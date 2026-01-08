const User = require("../models/userModel");
const { getDynamicDB } = require("../config/db");
const { generateToken } = require("../utils/jwt");
const axios = require("axios");
const blacklistedTokens = require("../utils/tokenBlacklist");

exports.login = async (req, res) => {
  
  try {
    let { username, password, user_token, isUserTokenLogin, crm_user } = req.body;

    // 1. Login from MAIN DB
    let user = null;
    if(isUserTokenLogin){
      let users = await User.findByToken(user_token,crm_user);

      if (!users) return res.status(404).json({ message: "Username not found or Invalid credentials" });

      user = await User.findByEmail(users.username);
      username = user.username;
    }
    else{
      user = await User.findByEmail(username);
      const protocol = req.protocol;              // http or https
      const host = req.get("host");               // domain + port
      const baseUrl = `${protocol}://${host}`;
      
    }

    if (!user) return res.status(404).json({ message: "Username not found" });

    // 2. Verify password (same as PHP)

    const bcrypt = require('bcrypt');

    const plainPassword = password;
    let dbHash = user.password; 


    function normalizeBcryptHash(hash) {
      return hash.startsWith('$2y$')
        ? hash.replace('$2y$', '$2b$')
        : hash;
    }

    async function checkPassword(plainPassword, dbHash) {
      const normalizedHash = normalizeBcryptHash(dbHash);
      return await bcrypt.compare(plainPassword, normalizedHash);
    }

    let hash = user.password;
    if (!await checkPassword(password, hash)) {
      return res.status(404).json({ message: "Password is incorrect" });
    }

    //3. JWT Token
    const token = generateToken({
      username: user.username,
      admin: user.admin,
      dbase: user.dbase,
    });

    // 4. Connect Dynamic DB
    const dynamicDB = getDynamicDB(user.dbase);

    // 5. Get Employee Info
    const [empRows] = await dynamicDB.query(
      "SELECT employeename, employeeid FROM common_useraccess WHERE username = ?",
      [username]
    );

    const emp = empRows[0];
    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Output arrays
    let asm = [];
    let areaname = [];
    let distributors = [];
    let soff = [];

    // ================================
    //   1. ASM TEAM QUERY
    // ================================

    const [asmTeamRows] = await dynamicDB.query(
      `SELECT asm, areaname 
       FROM oc_asmteam 
       WHERE areaname IN (
         SELECT areaname FROM oc_asmteam 
         WHERE asm = ? AND areaname!=''
       ) AND asm = ?
       GROUP BY areaname 
       ORDER BY todate DESC`,
      [emp.employeename, emp.employeename]
    );

    const asmAreaList = asmTeamRows.map(r => r.areaname);

    // Salesman + Distributor for ASM areas
    let asmDsMap = {};

    if (asmAreaList.length > 0) {
      const [dsRows] = await dynamicDB.query(
        `SELECT areaname, salesman, distributor
         FROM distributor_salesman
         WHERE areaname IN (?)
         GROUP BY areaname
         ORDER BY id DESC`,
        [asmAreaList]
      );

      dsRows.forEach(r => {
        asmDsMap[r.areaname] = {
          salesman: r.salesman,
          distributor: r.distributor
        };
      });
    }

    // Fill output arrays
    for (const row of asmTeamRows) {
      asm.push(row.asm);
      areaname.push(row.areaname);
      if (asmDsMap[row.areaname]) {
        soff.push(asmDsMap[row.areaname].salesman);
        distributors.push(asmDsMap[row.areaname].distributor);
      }
    }

    // ================================
    //   2. SE & DSM QUERY
    // ================================

    const [seRows] = await dynamicDB.query(
      `SELECT salesexecutive, salesman
       FROM oc_seandsmmapping
       WHERE salesman IN (
         SELECT salesman FROM oc_seandsmmapping 
         WHERE salesexecutive=? AND salesman!=''
       ) AND salesexecutive=?
       GROUP BY salesman
       ORDER BY date DESC`,
      [emp.employeename, emp.employeename]
    );

    const salesmanList = seRows.map(r => r.salesman);

    if (salesmanList.length > 0) {

      const [seDsRows] = await dynamicDB.query(
        `SELECT salesman, distributor, areaname
         FROM distributor_salesman
         WHERE salesman IN (?)
         AND distributor!=''
         GROUP BY salesman, distributor
         ORDER BY todate DESC`,
        [salesmanList]
      );

      // Create map: salesman → distributors list
      const seDsMap = {};
      seDsRows.forEach(r => {
        if (!seDsMap[r.salesman]) seDsMap[r.salesman] = [];
        seDsMap[r.salesman].push({
          distributor: r.distributor,
          areaname: r.areaname
        });
      });

      // Collect all unique areas
      const seAreaList = [...new Set(seDsRows.map(r => r.areaname))];

      // Get ASM for the areas
      let seAsmMap = {};
      if (seAreaList.length > 0) {
        const [seAsmRows] = await dynamicDB.query(
          `SELECT asm, areaname
           FROM oc_asmteam
           WHERE areaname IN (?)
           GROUP BY areaname
           ORDER BY id DESC`,
          [seAreaList]
        );

        seAsmRows.forEach(r => (seAsmMap[r.areaname] = r.asm));
      }

      // Fill arrays
      for (const se of seRows) {
        const sm = se.salesman;
        if (seDsMap[sm]) {
          for (const d of seDsMap[sm]) {
            soff.push(sm);
            distributors.push(d.distributor);
            if (seAsmMap[d.areaname]) {
              asm.push(seAsmMap[d.areaname]);
              areaname.push(d.areaname);
            }
          }
        }
      }
    }

    // ================================
    //   3. DIRECT DSM QUERY
    // ================================

    const [directRows] = await dynamicDB.query(
      `SELECT salesman, distributor, areaname
       FROM distributor_salesman
       WHERE distributor IN (
         SELECT distributor FROM distributor_salesman 
         WHERE salesman=? AND distributor!=''
       )
       AND salesman=?
       GROUP BY distributor
       ORDER BY todate DESC`,
      [emp.employeename, emp.employeename]
    );

    if (directRows.length > 0) {
      const directAreaList = [...new Set(directRows.map(r => r.areaname))];

      let directAsmMap = {};
      if (directAreaList.length > 0) {
        const [directAsmRows] = await dynamicDB.query(
          `SELECT asm, areaname
           FROM oc_asmteam
           WHERE areaname IN (?)
           GROUP BY areaname
           ORDER BY id DESC`,
          [directAreaList]
        );

        directAsmRows.forEach(r => (directAsmMap[r.areaname] = r.asm));
      }

      for (const ds of directRows) {
        soff.push(ds.salesman);
        distributors.push(ds.distributor);
        if (directAsmMap[ds.areaname]) {
          asm.push(directAsmMap[ds.areaname]);
          areaname.push(ds.areaname);
        }
      }
    }

    // ================================
    //   4. IF EMPLOYEE IS DISTRIBUTOR
    // ================================

    const [distRows] = await dynamicDB.query(
      `SELECT salesman, distributor, areaname
       FROM distributor_salesman
       WHERE distributor=?
       GROUP BY distributor
       ORDER BY todate DESC`,
      [emp.employeename]
    );

    if (distRows.length > 0) {
      const distAreaList = [...new Set(distRows.map(r => r.areaname))];

      let distAsmMap = {};
      const [distAsmRows] = await dynamicDB.query(
        `SELECT asm, areaname
         FROM oc_asmteam
         WHERE areaname IN (?)
         GROUP_BY areaname
         ORDER BY id DESC`,
        [distAreaList]
      );

      distAsmRows.forEach(r => (distAsmMap[r.areaname] = r.asm));

      for (const ds of distRows) {
        soff.push(ds.salesman);
        distributors.push(ds.distributor);

        if (distAsmMap[ds.areaname]) {
          asm.push(distAsmMap[ds.areaname]);
          areaname.push(ds.areaname);
        }
      }
    }

    // ================================
    //   FINAL RESPONSE
    // ================================

    res.json({
      username: user.username,
      admin: user.admin,
      token,
      asm: [...new Set(asm)],
      areaname: [...new Set(areaname)],
      distributors: [...new Set(distributors)],
      soff: [...new Set(soff)],
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.logActivity = async (req, res) => {
  try {
      let username = "Unknown";
      let main_module = "";
      let sub_module = "";
      let sub_sub_module = "";
      let logtime = new Date();

      // ---------- GET Request ----------
      if (req.method === "GET") {
          username = req.query.username || username;
          logtime = req.query.current_time || logtime;
      }

      // ---------- POST Request ----------
      else if (req.method === "POST") {
          const raw = req.body.raw || ""; // You will send { raw: "Username:..., Main Module:..." }

          const parts = raw.split(", ");
          for (let part of parts) {
              if (part.startsWith("Username: ")) username = part.replace("Username: ", "").trim();
              if (part.startsWith("Main Module: ")) main_module = part.replace("Main Module: ", "").trim();
              if (part.startsWith("Sub Module: ")) sub_module = part.replace("Sub Module: ", "").trim();
              if (part.startsWith("Sub Sub Module: ")) sub_sub_module = part.replace("Sub Sub Module: ", "").trim();
              if (part.startsWith("Timestamp: ")) logtime = new Date(part.replace("Timestamp: ", "").trim());
          }
      }

      // ---------- Extra Data ----------
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const user_agent = req.headers["user-agent"] || "";

      // ---------- Insert into DB ----------
      await User.insertLog({
          username,
          logtime,
          ip_address: ip,
          user_agent,
          main_module,
          sub_module,
          sub_sub_module,
          dbase : 'bhagyalakshmi_dashboard'
      });

      return res.json({ status: "success" });
  } catch (err) {
      return res.json({
          status: "error",
          message: err.message
      });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token) {
      blacklistedTokens.add(token);
      return res.json({ status: "success" });
    }
    else{
      return res.status(400).json({ message: "Missing Token" });
    }
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};
