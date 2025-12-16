const stockService = require("./stock.service");
const recipeModel = require("../models/recipe.model");
const itemModel = require("../models/item.model");

exports.getDataForFriedGramReport = async ({ fromdate, todate, warehouse, nstock, cond1, req }) => {

  // 1️⃣ Fetch valid categories ONCE
  const [categories] = await itemModel.getItemsFriedGram(req.user.dbase);

  // Keep only FRIED GRAM & BENGAL GRAM
  const validCats = categories
    .map(c => c.category)
    .filter(cat => cat === 'FRIED GRAM' || cat === 'BENGAL GRAM');

  if (validCats.length === 0) {
    return res.json({ fried_gram_production: [] });
  }

  // 2️⃣ Fetch all producttype codes once (instead of inside loop)
  const [validProducts] = await itemModel.getValidProducts(validCats, req.user.dbase);

  // 3️⃣ Fetch producttypes that match cond1 (replacement for sqlcheck)
  const [condMatchedRows] = await itemModel.getcondMatchedRows(cond1, req.user.dbase);

  const condMatchedCodes = new Set(condMatchedRows.map(r => r.producttype));

  let result = [];

  // 4️⃣ Loop through products but NO DB QUERY inside loop
  for (const prod of validProducts) {
    const { code, description, type, cat } = prod;

    // Skip if this code did not match cond1 query
    if (!condMatchedCodes.has(code)) continue;

    // 5️⃣ Get calculated stock for this code
    const details = await getCalculatedStock(
      code,
      fromdate,
      todate,
      warehouse,
      true
    );

    // Apply PHP filters
    if (((nstock === 0) || (nstock === 1 && details.closing < 0)) &&
      details.purchased_transferin > 0) {

      result.push({
        category: cat,
        type,
        description,
        opening: details.opening,
        "purchased/transfer in": details.purchased_transferin,
        "consumed/transfer out": details.consumed_transferout,
        sold: details.sales,
        returned: details.salesreturn,
        closing: details.closing
      });
    }

  }
  
  return result;
}

exports.getDataForReport = async ({ fromdate, todate, warehouse, nstock, catgroup, req }) => {   
  const finishedData = {};
  const rawData = {};
  const allRaw = [];
  
  let totalProduction = 0;

  const stockCache = new Map();
  let rawStockCache = new Map();
  const ingredientMap = new Map();
  const processedRM = new Set();

  // 1) Fetch all finished products
  const finishedRows = await itemModel.getFinishedItems(catgroup,req.user.dbase);

  // 2) Load ingredients in one shot
  const productCodes = [...new Set(finishedRows.map(r => r.code))];
  const ingredients = await recipeModel.getIngredientsForProducts(productCodes,req.user.dbase);

  // Build ingredient map
  for (const ing of ingredients) {
    if (!ingredientMap.has(ing.producttype))
      ingredientMap.set(ing.producttype, []); 
    ingredientMap.get(ing.producttype).push(ing);
  }

  

  // Preload raw stock cache
  rawStockCache = await stockService.getAllCalculatedStock(productCodes, fromdate, todate, warehouse, true, req.user.dbase);
// return { finished: rawStockCache, raw: 'd', total_prd: 'd' };
  // 3) Loop products
  for (const row of finishedRows) {

    const code = row.code;
    const category = row.category;

    if (!finishedData[category]) finishedData[category] = [];

    // Stock (cached)
    if (!stockCache.has(code)) {
      stockCache.set(code, rawStockCache[code]);
      //stockCache.set(code, await stockService.getCalculatedStock(code, fromdate, todate, warehouse, true, req.user.dbase));
    }

    const s = stockCache.get(code);

    // Total production logic
    if (catgroup === "Fried Gram Mill") {
      if (row.catgroup === "FRIED GRAM") totalProduction += s.purchased_transferin;
    } else {
      totalProduction += s.purchased_transferin;
    }

    // matching logic
    const include =
      ((nstock === 0) || (nstock === 1 && s.closing < 0)) &&
      s.purchased_transferin > 0;

    if (include) {
      finishedData[category].push({
        category,
        catgroup: row.catgroup,
        type: row.type,
        description: row.description,
        opening: s.opening,
        "purchased/transfer in": s.purchased_transferin,
        "consumed/transfer out": s.consumed_transferout,
        sold: s.sales,
        returned: s.salesreturn,
        closing: s.closing,
        prod_percentage: 0
      });
    }

    // RAW MATERIALS
    for (const ing of (ingredientMap.get(code) || [])) {
      if (processedRM.has(ing.description)) continue;

      const ingCode = ing.ingredient;

      // stock cache
      if (!stockCache.has(ingCode)) {
        stockCache.set(
          ingCode,
          //await stockService.getCalculatedStock(ingCode, fromdate, todate, warehouse, false, req.user.dbase)
          stockCache.set(ingCode, rawStockCache[ingCode])
        );
      }
      const rm = stockCache.get(ingCode);

      if (((nstock === 0) || (nstock === 1 && rm.closing < 0)) && rm.opening >= 0.5) {
        allRaw.push({
          category: "All Raw Materials",
          type: "RAW MATERIAL",
          description: ing.description,
          opening: rm.opening,
          "purchased/transfer in": rm.purchased_transferin,
          "consumed/transfer out": rm.consumed_transferout,
          sold: rm.sales,
          returned: rm.salesreturn,
          closing: rm.closing,
          prod_percentage: 0
        });
        processedRM.add(ing.description);
      }
    }
  }

  // 4) Fill prod_percentage
  if (totalProduction > 0) {
    for (const category in finishedData) {
      for (const item of finishedData[category]) {
        const purchased = item["purchased/transfer in"];

        if (catgroup === "Fried Gram Mill" && item.catgroup !== "FRIED GRAM") {
          item.prod_percentage = 0;
        } else {
          item.prod_percentage = Number(((purchased / totalProduction) * 100).toFixed(2));
        }
      }
    }
  }

  rawData["All Raw Materials"] = allRaw;

  return { finished: finishedData, raw: rawData, total_prd: totalProduction };
};
