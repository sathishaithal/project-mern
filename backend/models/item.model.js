const { getDynamicDB } = require("../config/db");

exports.getItemsFriedGram = async (dbase) => {
  const pool = getDynamicDB(dbase);
  const [categories] = await pool.query(`
      SELECT DISTINCT b.cat AS category
      FROM product_productionunit a
      JOIN ims_itemcodes b ON a.producttype = b.code
      WHERE a.date >= '2017-01-01'
      AND a.mill = 'Packing Section'
    `);
    return categories;
};

exports.getValidProducts = async (validCats, dbase) => {
  const pool = getDynamicDB(dbase);
  const [validProducts] = await pool.query(`
      SELECT DISTINCT a.code, a.description, a.sunits, a.type, a.cat
      FROM ims_itemcodes a
      JOIN product_productionunit b ON a.code = b.producttype
      WHERE a.cat IN (?)
      AND b.mill = 'Packing Section'
      AND b.date >= '2017-01-01'
      ORDER BY a.code ASC
    `, [validCats]);

    return validProducts;
};

exports.getcondMatchedRows = async (cond1, dbase) => {
  const pool = getDynamicDB(dbase);
  const [categories] = await pool.query(`
      SELECT DISTINCT a.producttype
      FROM product_productionunit a
      JOIN ims_itemcodes b ON a.producttype = b.code
      WHERE a.date >= '2017-01-01'
      AND ${cond1}
    `);
    return categories;
};

exports.getFinishedItems = async (catgroup, dbase) => {
  const millFilter =
    !catgroup || catgroup === "--All--" ? "" : " AND b.mill = ?";

  const params =
    !catgroup || catgroup === "--All--" ? [] : [catgroup];

  const pool = getDynamicDB(dbase);  // ✔ works now!
  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      a.code, a.description, a.type, a.sunits,
      a.cat AS category, a.catgroup
    FROM product_productionunit b
    INNER JOIN ims_itemcodes a ON a.code = b.producttype
    WHERE b.date >= '2017-01-01'
      AND a.cat NOT IN ('RAW MATERIALS PCK SECTION')
      ${millFilter}
    ORDER BY a.cat DESC, a.code ASC
    `,
    params
  );
 
  return rows;
};


exports.getItemWeightAndType = async (code, dbase) => {
  const pool = getDynamicDB(dbase);
  const [rows] = await pool.query(
    `
    SELECT weight, type 
    FROM ims_itemcodes
    WHERE code in (${code})
    LIMIT 1
    `,
    [code]
  );

  if (rows.length === 0) {
    return { weight: 1, type: null };  // default fallback
  }

  return {
    weight: rows[0].weight || 1,
    type: rows[0].type || null
  };
};

exports.getItemWeightAndTypeForCodes = async (codes, dbase) => {
  const pool = getDynamicDB(dbase);

  // Normalize input: remove spaces, remove empty values
  codes = (Array.isArray(codes) ? codes : String(codes).split(","))
    .map(c => c.trim())
    .filter(Boolean);

  if (codes.length === 0) return {};

  // Prepare SQL IN (?,?,?)
  const inPlaceholders = codes.map(() => "?").join(",");

  const [rows] = await pool.query(
    `
    SELECT code, weight, type 
    FROM ims_itemcodes
    WHERE code IN (${inPlaceholders})
    `,
    codes
  );

  // Convert result into key-value structure
  const result = {};

  // Fill defaults first
  codes.forEach(code => {
    result[code] = { weight: 1, type: null, code: null };
  });

  // Update actual values from DB
  rows.forEach(r => {
    result[r.code] = {
      weight: r.weight || 1,
      type: r.type || null,
      code: r.code
    };
  });

  return result;
};



