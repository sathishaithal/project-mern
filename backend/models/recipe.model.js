const { getDynamicDB } = require("../config/db");

exports.getIngredientsForProducts = async (productCodes,dbase) => {
  if (!productCodes.length) return [];

  const placeholders = productCodes.map(() => "?").join(",");

  const pool = getDynamicDB(dbase);
  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      f.producttype,
      f.ingredient,
      i.description,
      i.cunits,
      i.cat
    FROM product_fformula f
    INNER JOIN ims_itemcodes i ON f.ingredient = i.code
    WHERE i.catgroup = 'RAW MATERIAL'
      AND f.producttype IN (${placeholders})
    ORDER BY i.description
    `,
    productCodes
  );

  return rows;
};
