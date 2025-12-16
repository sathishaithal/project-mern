const { getDynamicDB } = require("../config/db");

exports.getStockSummary = async (code, fromdate, todate, warehouse, dbase) => {
  const pool = getDynamicDB(dbase);
  const [rows] = await pool.query(
    `
    SELECT 
      SUM(opening) AS opening,
      SUM(purchase_in) AS purchased_transferin,
      SUM(consumed_out) AS consumed_transferout,
      SUM(sales) AS sales,
      SUM(salesreturn) AS salesreturn
    FROM (
      -- Opening stock
      SELECT 
        SUM(receivedquantity) AS opening,
        0 AS purchase_in,
        0 AS consumed_out,
        0 AS sales,
        0 AS salesreturn
      FROM pp_sobi
      WHERE code = ? AND date < ?

      UNION ALL

      -- Goods receipt opening
      SELECT 
        SUM(receivedquantity), 0,0,0,0
      FROM pp_goodsreceipt
      WHERE code = ? AND date < ?

      UNION ALL

      -- Sales
      SELECT 
        0,0,0, SUM(quantity_in_su), 0
      FROM oc_cobi
      WHERE code = ? AND date >= ? AND date <= ?

      UNION ALL

      -- Sales return
      SELECT 
        0,0,0,0, SUM(quantity_in_su)
      FROM oc_salesreturn
      WHERE code = ? AND date >= ? AND date <= ? AND flag='1' AND type='addtostock'

      UNION ALL

      -- Stock transfer in
      SELECT 
        0, SUM(quantity),0,0,0
      FROM ims_stocktransfer
      WHERE code = ? AND date >= ? AND date <= ?

      UNION ALL

      -- Stock transfer out
      SELECT 
        0,0, SUM(quantity),0,0
      FROM ims_stocktransfer
      WHERE code = ? AND date >= ? AND date <= ?
    ) X
    `,
    [
      code, fromdate,   // sobi opening
      code, fromdate,   // goods receipt opening
      code, fromdate, todate,  // sales
      code, fromdate, todate,  // sales return
      code, fromdate, todate,  // stock transfer in
      code, fromdate, todate   // stock transfer out
    ]
  );

  return rows[0];
};


exports.getOpeningForCodes = async (codes, fromdate, todate, warehouse, dbase) => {

  const pool = getDynamicDB(dbase);
  const runQuery = async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows;
  };

  // Normalize codes
  codes = (codes || []).map(c => c.trim()).filter(Boolean);
  if (!codes.length) return {};

  // Prepare stats holder per code
  const stats = {};
  codes.forEach(code => {
    stats[code] = {
      firstopening: 0,
      purchasedop: 0,
      salesop: 0,
      consumedop: 0,
      grop: 0,
      staadd: 0,
      staded: 0,
      irecop: 0,
      iiscop: 0,
      salesreturnop: 0,
      stockto: 0,
      stockfrom: 0,
      prod: 0,
      preturn: 0
    };
  });

  const inPlaceholders = codes.map(() => "?").join(",");

  const whWarehouse = warehouse ? " AND warehouse = ?" : "";
  const whUnit = warehouse ? " AND unit = ?" : "";
  const whToWarehouse = warehouse ? " AND towarehouse = ?" : "";
  const whFromWarehouse = warehouse ? " AND fromwarehouse = ?" : "";
  const whLocation = warehouse ? " AND location = ?" : "";

  // ---------------------------------------------------------------------------
  // 1) PURCHASEDOP FROM pp_sobi
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(receivedquantity) AS quantity
      FROM pp_sobi
      WHERE code IN (${inPlaceholders})
        AND date < ?
        AND dflag = 0
        AND auth_flag1 = 1
        AND auth_flag2 = 1
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchasedop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 2) GOODS RECEIPT grop FROM pp_goodsreceipt
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(receivedquantity) AS quantity
      FROM pp_goodsreceipt
      WHERE code IN (${inPlaceholders})
        AND date < ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].grop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 3) SALESOP FROM oc_cobi
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity_in_su) AS quantity
      FROM oc_cobi
      WHERE code IN (${inPlaceholders})
        AND date < ?
        AND dflag = 0
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].salesop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4) SALESOP (Loading Slip) FROM oc_loadingslip
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity_in_su) AS quantity
      FROM oc_loadingslip
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND date < ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].salesop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5) SALES RETURN salesreturnop FROM oc_salesreturn
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity_in_su) AS quantity
      FROM oc_salesreturn
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND type = 'addtostock'
        AND eflag = 0
        AND date < ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].salesreturnop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6) INTERMEDIATE RECEIPT irecop (riflag='R') FROM ims_intermediatereceipt
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_intermediatereceipt
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND riflag = 'R'
        AND date < ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].irecop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 7) STOCK ADJUSTMENT staadd (Add) FROM ims_stockadjustment
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stockadjustment
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND type = 'Add'
        AND date < ?
        ${whUnit}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].staadd += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 8) STOCK ADJUSTMENT staded (Deduct) FROM ims_stockadjustment
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stockadjustment
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND type = 'Deduct'
        AND date < ?
        ${whUnit}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].staded += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 9) INTERMEDIATE ISSUE iiscop (riflag='I') FROM ims_intermediatereceipt
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_intermediatereceipt
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND riflag = 'I'
        AND date < ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].iiscop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 10) STOCK TRANSFER TO stockto (towarehouse) FROM ims_stocktransfer
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stocktransfer
      WHERE code IN (${inPlaceholders})
        AND date < ?
        ${whToWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].stockto += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 11) STOCK TRANSFER FROM stockfrom (fromwarehouse) FROM ims_stocktransfer
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stocktransfer
      WHERE code IN (${inPlaceholders})
        AND date < ?
        ${whFromWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].stockfrom += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 12) PURCHASE RETURN preturn FROM pp_purchasereturn
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(returnquantity) AS quantity
      FROM pp_purchasereturn
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND date < ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].preturn += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 13) CONSUMPTION consumedop (Main Production) FROM product_itemwise
  //     ingredient IN (codes)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT ingredient AS code, SUM(squantity) AS quantity
      FROM product_itemwise
      WHERE ingredient IN (${inPlaceholders})
        AND date < ?
        AND flag = 0
        AND product_cat != 'By Product'
        ${whWarehouse}
        AND pid IN (
          SELECT DISTINCT(id)
          FROM product_productionunit
          WHERE date < ?
          ${whWarehouse}
        )
      GROUP BY ingredient
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse, fromdate, warehouse]
      : [...codes, fromdate, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].consumedop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 14) CONSUMPTION consumedop (Byproduct packets) FROM production_byproductpackets
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(packets) AS quantity
      FROM production_byproductpackets
      WHERE code IN (${inPlaceholders})
        AND date < ?
        ${whLocation}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].consumedop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 15) PRODUCTION purchasedop FROM product_productionunit (producttype IN codes)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT producttype AS code, SUM(production) AS quantity
      FROM product_productionunit
      WHERE producttype IN (${inPlaceholders})
        AND date < ?
        ${whWarehouse}
      GROUP BY producttype
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchasedop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 16) PRODUCTION purchasedop (Byproduct packets) FROM production_byproductpackets
  //     opcode IN (codes)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT opcode AS code, SUM(oppackets) AS quantity
      FROM production_byproductpackets
      WHERE opcode IN (${inPlaceholders})
        AND date < ?
        ${whLocation}
      GROUP BY opcode
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse]
      : [...codes, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchasedop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 17) PURCHASEDOP (By Product) FROM product_itemwise product_cat = 'By Product'
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT ingredient AS code, SUM(squantity) AS quantity
      FROM product_itemwise
      WHERE ingredient IN (${inPlaceholders})
        AND date < ?
        AND flag = 0
        AND product_cat = 'By Product'
        ${whWarehouse}
        AND pid IN (
          SELECT DISTINCT(id)
          FROM product_productionunit
          WHERE date < ?
          ${whWarehouse}
        )
      GROUP BY ingredient
    `;
    const params = warehouse
      ? [...codes, fromdate, warehouse, fromdate, warehouse]
      : [...codes, fromdate, fromdate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchasedop += Number(r.quantity || 0);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 18) PROD (bags) FROM pp_sobi bagtype LIKE '%code%'
  //     This is trickier because bagtype is CSV. We'll fetch rows and split in JS.
  // ---------------------------------------------------------------------------
  {
    // Build OR conditions: (bagtype LIKE '%code1%' OR bagtype LIKE '%code2%'...)
    const likeConditions = codes.map(() => "bagtype LIKE ?").join(" OR ");
    const likeParams = codes.map(c => `%${c}%`);

    const sql = `
      SELECT bagtype AS ebagtype, bags AS enoofbags
      FROM pp_sobi
      WHERE (${likeConditions})
        AND date < ?
        ${whWarehouse}
    `;
    const params = warehouse
      ? [...likeParams, fromdate, warehouse]
      : [...likeParams, fromdate];

    const rows = await runQuery(sql, params);

    rows.forEach(r => {
      const types = (r.ebagtype || "").split(",");
      const bags = (r.enoofbags || "").split(",");
      for (let i = 0; i < types.length; i++) {
        const c = types[i].trim();
        const qty = Number(bags[i] || 0);
        if (stats[c]) {
          stats[c].prod += qty;
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // FINAL: compute opening per code
  // ---------------------------------------------------------------------------
  const openings = {};
  codes.forEach(code => {
    const s = stats[code];

    const opening =
      round2(s.firstopening) +
      round2(s.purchasedop) +
      round2(s.irecop) +
      round2(s.staadd) +
      round2(s.grop) +
      round2(s.stockto) -
      (
        round2(s.consumedop) +
        round2(s.salesop) +
        round2(s.iiscop) +
        round2(s.staded) +
        round2(s.stockfrom) +
        round2(s.preturn)
      ) +
      round2(s.salesreturnop) +
      round2(s.prod);

    openings[code] = round2(opening);

  });



  return openings;
};

exports.getPurchaseTransferInForCodes = async (
  codes,
  fromdate,
  todate,
  warehouse,
  dbase
) => {
  codes = (codes || []).map(c => c.trim()).filter(Boolean);
  if (!codes.length) return {};

  const pool = getDynamicDB(dbase);
  const runQuery = async (sql, params = []) => {
    const [rowss] = await pool.query(sql, params);
    return rowss;
  };

  const stats = {};
  codes.forEach(code => {
    stats[code] = { purchased: 0 };
  });

  const inPlaceholders = codes.map(() => "?").join(",");

  const whWarehouse = warehouse ? " AND warehouse = ?" : "";
  const whUnit = warehouse ? " AND unit = ?" : "";
  const whToWarehouse = warehouse ? " AND towarehouse = ?" : "";
  const whLocation = warehouse ? " AND location = ?" : "";

  // 1) PURCHASE FROM pp_sobi
  {
    const sql = `
      SELECT code, SUM(receivedquantity) AS quantity
      FROM pp_sobi
      WHERE code IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        AND dflag = 0
        AND auth_flag1 = 1
        AND auth_flag2 = 1
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 2) STOCK ADJUSTMENT (Add) FROM ims_stockadjustment
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stockadjustment
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND type = 'Add'
        AND date >= ?
        AND date <= ?
        ${whUnit}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 3) INTERMEDIATE RECEIPT (riflag='R') FROM ims_intermediatereceipt
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_intermediatereceipt
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND riflag = 'R'
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 4) GOODS RECEIPT FROM pp_goodsreceipt
  {
    const sql = `
      SELECT code, SUM(receivedquantity) AS quantity
      FROM pp_goodsreceipt
      WHERE code IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 5) STOCK TRANSFER IN (towarehouse) FROM ims_stocktransfer
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stocktransfer
      WHERE code IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        ${whToWarehouse}
      GROUP BY code
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 6) PRODUCTION FROM product_productionunit (producttype IN codes)
  {
    const sql = `
      SELECT producttype AS code, SUM(production) AS quantity
      FROM product_productionunit
      WHERE producttype IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY producttype
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 7) BY PRODUCT PRODUCTION FROM product_itemwise (ingredient IN codes)
  {
    const sql = `
      SELECT ingredient AS code, SUM(squantity) AS quantity
      FROM product_itemwise
      WHERE ingredient IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        AND flag = 0
        AND product_cat = 'By Product'
        ${whWarehouse}
        AND pid IN (
          SELECT DISTINCT(id)
          FROM product_productionunit
          WHERE date >= ?
            AND date <= ?
            ${whWarehouse}
        )
      GROUP BY ingredient
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse, fromdate, todate, warehouse]
      : [...codes, fromdate, todate, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // 8) BYPRODUCT PACKETS FROM production_byproductpackets (opcode IN codes)
  {
    const sql = `
      SELECT opcode AS code, SUM(oppackets) AS quantity
      FROM production_byproductpackets
      WHERE opcode IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        ${whLocation}
      GROUP BY opcode
    `;
    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      if (stats[r.code]) {
        stats[r.code].purchased += Number(r.quantity || 0);
      }
    });
  }

  // Final result per code
  const result = {};
  codes.forEach(code => {
    const val = Number(stats[code]?.purchased || 0);
    result[code] = Math.round(val * 100) / 100; // 2 decimals like PHP round
  });

  return result;
};

exports.getConsumedTransferOutForCodes = async (codes, fromdate, todate, warehouse, dbase) => {
  codes = (codes || []).map(c => c.trim()).filter(Boolean);
  if (!codes.length) return {};

  const stats = {};
  codes.forEach(code => {
    stats[code] = { consumed: 0 };
  });

  const pool = getDynamicDB(dbase);
  const runQuery = async (sql, params = []) => {
    const [rowss] = await pool.query(sql, params);
    return rowss;
  };

  const inPlaceholders = codes.map(() => "?").join(",");

  const whUnit = warehouse ? " AND unit = ?" : "";
  const whWarehouse = warehouse ? " AND warehouse = ?" : "";
  const whFromWarehouse = warehouse ? " AND fromwarehouse = ?" : "";
  const whLocation = warehouse ? " AND location = ?" : "";

  // ---------------------------------------------------------------------------
  // 1) STOCK ADJUSTMENT (Deduct) ims_stockadjustment
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stockadjustment
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND type = 'Deduct'
        AND date >= ?
        AND date <= ?
        ${whUnit}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      stats[r.code].consumed += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 2) INTERMEDIATE ISSUE (riflag='I') ims_intermediatereceipt
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_intermediatereceipt
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND riflag = 'I'
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      stats[r.code].consumed += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 3) STOCK TRANSFER OUT ims_stocktransfer (fromwarehouse)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity) AS quantity
      FROM ims_stocktransfer
      WHERE code IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        ${whFromWarehouse}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      stats[r.code].consumed += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 4) PURCHASE RETURN pp_purchasereturn (Consumed OUT)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(returnquantity) AS quantity
      FROM pp_purchasereturn
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      stats[r.code].consumed += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 5) CONSUMPTION VIA PRODUCTION product_itemwise (Main Products)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT ingredient AS code, SUM(squantity) AS quantity
      FROM product_itemwise
      WHERE ingredient IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        AND flag = 0
        AND product_cat != 'By Product'
        ${whWarehouse}
        AND pid IN (
            SELECT DISTINCT(id)
            FROM product_productionunit
            WHERE date >= ? AND date <= ?
            ${whWarehouse}
        )
      GROUP BY ingredient
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse, fromdate, todate, warehouse]
      : [...codes, fromdate, todate, fromdate, todate];

    const rows = await runQuery(sql, params);
    rows.forEach(r => {
      stats[r.code].consumed += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 6) BYPRODUCT PACKETS (Consuming raw materials) production_byproductpackets
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(packets) AS quantity
      FROM production_byproductpackets
      WHERE code IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        ${whLocation}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);

    rows.forEach(r => {
      stats[r.code].consumed += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // Final Return
  // ---------------------------------------------------------------------------
  const result = {};
  codes.forEach(code => {
    result[code] = Math.round(stats[code].consumed * 100) / 100; // round 2 decimals
  });

  return result;
};

exports.getSalesAndReturnedForCodes = async (codes, fromdate, todate, warehouse, dbase) => {
  codes = (codes || []).map(c => c.trim()).filter(Boolean);
  if (!codes.length) return {};

  // Result structure
  const stats = {};
  codes.forEach(code => {
    stats[code] = {
      sales: 0,
      salesreturn: 0
    };
  });

  const pool = getDynamicDB(dbase);
  const runQuery = async (sql, params = []) => {
    const [rowss] = await pool.query(sql, params);
    return rowss;
  };

  const inPlaceholders = codes.map(() => "?").join(",");

  const whWarehouse = warehouse ? " AND warehouse = ?" : "";

  // ---------------------------------------------------------------------------
  // 1) SALES FROM oc_cobi
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity_in_su) AS quantity
      FROM oc_cobi
      WHERE code IN (${inPlaceholders})
        AND date >= ?
        AND date <= ?
        AND dflag = 0
        ${whWarehouse}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);

    rows.forEach(r => {
      stats[r.code].sales += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 2) SALES VIA LOADING SLIP oc_loadingslip
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity_in_su) AS quantity
      FROM oc_loadingslip
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);

    rows.forEach(r => {
      stats[r.code].sales += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 3) SALES RETURN FROM oc_salesreturn (type = addtostock)
  // ---------------------------------------------------------------------------
  {
    const sql = `
      SELECT code, SUM(quantity_in_su) AS quantity
      FROM oc_salesreturn
      WHERE code IN (${inPlaceholders})
        AND flag = 1
        AND type = 'addtostock'
        AND eflag = 0
        AND date >= ?
        AND date <= ?
        ${whWarehouse}
      GROUP BY code
    `;

    const params = warehouse
      ? [...codes, fromdate, todate, warehouse]
      : [...codes, fromdate, todate];

    const rows = await runQuery(sql, params);

    rows.forEach(r => {
      stats[r.code].salesreturn += Number(r.quantity || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // Final Output Formatting
  // ---------------------------------------------------------------------------
  const result = {};
  codes.forEach(code => {
    result[code] = {
      sales: Number(stats[code].sales.toFixed(2)),
      salesreturn: Number(stats[code].salesreturn.toFixed(2))
    };
  });

  return result;
};

// Helper for rounding like PHP round(..., 2)
function round2(v) {
  v = Number(v || 0);
  return Math.round(v * 100) / 100;
}

