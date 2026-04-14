const stockService = require("./stock.service");
const recipeModel = require("../models/recipe.model");
const itemModel = require("../models/item.model");
const { raw } = require("mysql2");

exports.getDataForFriedGramReport = async ({ fromdate, todate, warehouse, nstock, cond1, req }) => { 

  // 1️⃣ Fetch valid categories ONCE
  const categories = await itemModel.getItemsFriedGram(req.user.dbase);

  // Keep only FRIED GRAM & BENGAL GRAM
  const validCats = categories
    .map(c => c.category)
    .filter(cat => cat === 'FRIED GRAM' || cat === 'BENGAL GRAM');

  if (validCats.length === 0) {
    return res.json({ fried_gram_production: [] });
  }

  // 2️⃣ Fetch all producttype codes once (instead of inside loop)
  const validProducts = await itemModel.getValidProducts(validCats, req.user.dbase);

  // 3️⃣ Fetch producttypes that match cond1 (replacement for sqlcheck)
  const condMatchedRows = await itemModel.getcondMatchedRows(cond1, req.user.dbase);

  const condMatchedCodes = new Set(condMatchedRows.map(r => r.producttype));

  let result = [];
  let result2 = [];

  const stockCache = new Map();
  let rawStockCache = new Map();
  const productCodes = [...new Set(validProducts.map(r => r.code))];
  
  // Preload raw stock cache
  rawStockCache = await stockService.getAllCalculatedStock(productCodes, fromdate, todate, warehouse, true, req.user.dbase); 

  // 4️⃣ Loop through products but NO DB QUERY inside loop
  for (const prod of validProducts) { 
    const { code, description, type, cat } = prod;

    // Skip if this code did not match cond1 query
    if (!condMatchedCodes.has(code)) continue;


    // Stock (cached)
    if (!stockCache.has(code)) {
      stockCache.set(code, rawStockCache[code]);
      // 5️⃣ Get calculated stock for this code
      // const details = await getCalculatedStock(
      //   code,
      //   fromdate,
      //   todate,
      //   warehouse,
      //   true
      // );
    }
    

    const details = stockCache.get(code);

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
    else if(((nstock === 0) || (nstock === 1 && details.closing < 0)) && 
    (details.purchased_transferin > 0 || details.consumed_transferout > 0 || details.opening > 0 || details.sales > 0 || details.closing > 0 || details.salesreturn > 0)){
        result2.push({
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
  
  return {'result' : result, 'result2' : result2};
}

exports.getDataForReport = async ({ fromdate, todate, warehouse, nstock, catgroup, req }) => { 
  const finishedData = {};
  finishedData['RAW MATERIALS PCK SECTION'] = [];
  const finishedData2 = {};
  //finishedData2['RAW MATERIALS PCK SECTION'] = [];

  const rawData = {};
  const allRaw = [];
  const rawData2 = {};
  const allRaw2 = [];
  
  let totalProduction = 0;
  let totalClosing = 0;
  let totalDispatch = 0;
  let totalOpening = 0;
  let totalReturn = 0;

  let totalProduction2 = 0;
  let totalClosing2 = 0;
  let totalDispatch2 = 0;
  let totalOpening2 = 0;
  let totalReturn2 = 0;

  const stockCache = new Map();
  let rawStockCache = new Map();
  const ingredientMap = new Map();
  const processedRM = new Set();


  // 1) Fetch all finished products
  const finishedRows = await itemModel.getFinishedItems(catgroup,req.user.dbase); 

  // 2) Load ingredients in one shot
  const productCodes = [
    ...new Set(
      finishedRows
        .map(r => r.code)
    )
  ];

  const ingredients = await recipeModel.getIngredientsForProducts(productCodes,req.user.dbase);
  
  const productCodes1 =[
    ...new Set(
      ingredients
        .map(r => r.ingredient)
    )
  ];

  for (const ing of ingredients) {
    
    if (!ing.producttype) continue; // safety check

    if (!ingredientMap.has(ing.producttype)) {
      ingredientMap.set(ing.producttype, []);
      
    }

    ingredientMap.get(ing.producttype).push(ing); 
  }

  // Preload raw stock cache
  const rawStockCache_temp = await stockService.getAllCalculatedStock(productCodes, fromdate, todate, warehouse, true, req.user.dbase);
  const rawStockCache_dum = await stockService.getAllCalculatedStock(productCodes1, fromdate, todate, warehouse, false, req.user.dbase);


  rawStockCache = {
    ...rawStockCache_temp,
    ...rawStockCache_dum
  };



  // const finishedData12 = {};


  // 3) Loop products
  for (const row of finishedRows) {

    const code = row.code;
    const category = row.category;

    if(category != 'RAW MATERIALS PCK SECTION'){
      if (!finishedData[category]) finishedData[category] = [];
      if (!finishedData2[category]) finishedData2[category] = [];

      // Stock (cached)
      if (!stockCache.has(code) && rawStockCache[code]) {
        stockCache.set(code, rawStockCache[code]);
      }

    
      if(rawStockCache[code]){

        const s = stockCache.get(code);
      




        // matching logic
      
        const include =
          ((nstock === 0) || (nstock === 1 && s.closing < 0)) &&
          s.purchased_transferin > 0;

        const include2 =
          ((nstock === 0) || (nstock === 1 && s.closing < 0 )) &&
          (s.purchased_transferin > 0 || s.consumed_transferout > 0 || s.opening > 0 || s.sales > 0 || s.closing > 0 || s.salesreturn > 0);

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

          // Total production logic
          if (catgroup === "Fried Gram Mill") {
            if (row.catgroup === "FRIED GRAM"){
              totalOpening += s.opening;
              totalClosing += s.closing;
              totalDispatch += s.sales;
              totalReturn += s.salesreturn;
              totalProduction += s.purchased_transferin;
            
            }
          } else {
            totalOpening += s.opening;
            totalClosing += s.closing;
            totalDispatch += s.sales;
            totalReturn += s.salesreturn;
            totalProduction += s.purchased_transferin;
          }

        }
        else if (include2){
          finishedData2[category].push({
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

          // Total production logic
          if (catgroup === "Fried Gram Mill") {
            if (row.catgroup === "FRIED GRAM"){
              totalOpening2 += s.opening;
              totalClosing2 += s.closing;
              totalDispatch2 += s.sales;
              totalReturn2 += s.salesreturn;
              totalProduction2 += s.purchased_transferin;
            
            }
          } else {
            totalOpening2 += s.opening;
            totalClosing2 += s.closing;
            totalDispatch2 += s.sales;
            totalReturn2 += s.salesreturn;
            totalProduction2 += s.purchased_transferin;
          }

        }

      }
    }

    // RAW MATERIALS
    for (const ing of (ingredientMap.get(code) || [])) { 

     


      if (processedRM.has(ing.description)) continue;

      const ingCode = ing.ingredient; 

      // stock cache
      if (!stockCache.has(ingCode)) { 

        const stockData = rawStockCache[ingCode] ?? {
          opening: 0,
          purchased_transferin: 0,
          consumed_transferout: 0,
          sales: 0,
          salesreturn: 0,
          closing: 0
        };
        stockCache.set(ingCode, stockData);
      }

      const rm = stockCache.get(ingCode);
    
      

      if (
          (
            (nstock === 0) || 
            (nstock === 1 && rm.closing < 0)
          )
          && 
          rm.opening >= 0.5
        ){ 
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
        else  if (
          (
            (nstock === 0) || 
            (nstock === 1 && rm.closing < 0)
          )
          && 
          (rm.purchased_transferin >= 0.5 || rm.consumed_transferout >= 0.5 || rm.opening >= 0.5 || rm.sales >= 0.5 || rm.closing >= 0.5 || rm.salesreturn >= 0.5)
        ){
            allRaw2.push({
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

  //return {'finished' : finishedData12};

  // 4) Fill prod_percentage
  if (totalProduction > 0) {
    for (const category in finishedData) {
      for (const item of finishedData[category]) {
        const purchased = item["purchased/transfer in"];

        if (catgroup === "Fried Gram Mill" && item.catgroup !== "FRIED GRAM") {
          item.prod_percentage = 0;
        } else {
          item.prod_percentage = Number(((purchased / totalProduction) * 100));
        }
      }
    }
  }

  rawData["All Raw Materials"] = allRaw;
  rawData2["All Raw Materials"] = allRaw2;

  let finished_grand_total = {};
  let finished_grand_total2 = {};

  finished_grand_total['totalProduction'] = totalProduction;
  finished_grand_total['totalOpening'] = totalOpening;
  finished_grand_total['totalClosing'] = totalClosing;
  finished_grand_total['totalDispatch'] = totalDispatch;
  finished_grand_total['totalReturn'] = totalReturn;

  finished_grand_total2['totalProduction'] = totalProduction2;
  finished_grand_total2['totalOpening'] = totalOpening2;
  finished_grand_total2['totalClosing'] = totalClosing2;
  finished_grand_total2['totalDispatch'] = totalDispatch2;
  finished_grand_total2['totalReturn'] = totalReturn2;

  return { finished: finishedData, raw: rawData, finished2: finishedData2, raw2: rawData2, finished_grand_total: finished_grand_total, finished_grand_total2: finished_grand_total2 };
};
