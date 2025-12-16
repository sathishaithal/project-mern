const itemModel = require("../models/item.model");
const stockModel = require("../models/stock.model");

exports.getCalculatedStock = async (code, fromdate, todate, warehouse, multiplyWeight, dbase) => {

  const stock = await stockModel.getStockSummary(code, fromdate, todate, warehouse, dbase);

  let weight = 1;

  if (multiplyWeight) {
    const item = await itemModel.getItemWeightAndType(code, dbase);
    if (item.type === "Finished Goods" && item.weight > 0)
      weight = item.weight;
  }

  return {
    opening: Number((stock.opening * weight).toFixed(2)),
    purchased_transferin: Number((stock.purchased_transferin * weight).toFixed(2)),
    consumed_transferout: Number((stock.consumed_transferout * weight).toFixed(2)),
    sales: Number((stock.sales * weight).toFixed(2)),
    salesreturn: Number((stock.salesreturn * weight).toFixed(2)),
    closing: Number(
      (stock.opening * weight +
        stock.purchased_transferin * weight -
        stock.consumed_transferout * weight -
        stock.sales * weight +
        stock.salesreturn * weight).toFixed(2)
    )
  };
};

exports.getAllCalculatedStock = async (codes, fromdate, todate, warehouse, multiplyWeight = true, dbase) => {
  try {
    // Ensure codes is array
    codes = Array.isArray(codes) ? codes : [codes];

    // Fetch all data
    const openingArr = await stockModel.getOpeningForCodes(codes, fromdate, todate, warehouse, dbase);
    const purchaseArr = await stockModel.getPurchaseTransferInForCodes(codes, fromdate, todate, warehouse, dbase);
    const consumedArr = await stockModel.getConsumedTransferOutForCodes(codes, fromdate, todate, warehouse, dbase);
    const salesArr = await stockModel.getSalesAndReturnedForCodes(codes, fromdate, todate, warehouse, dbase);

    // Weight lookup
    let weightMap = {};
    if (multiplyWeight) {
      const weightData = await itemModel.getItemWeightAndTypeForCodes(codes, dbase); //console.log(' weight ');console.log(Object.values(weightData)); 
      Object.values(weightData).forEach(item => {
        weightMap[item.code] = item.weight ?? 1;
      });
    } else {
      codes.forEach(c => (weightMap[c] = 1));
    }

    // Convert arrays to maps for fast access
    const openingMap = Object.fromEntries(Object.entries(openingArr).map(([code, qty]) => [code, qty]));
    const purchaseMap = Object.fromEntries(Object.entries(purchaseArr).map(([code, qty]) => [code, qty]));
    const consumedMap = Object.fromEntries(Object.entries(consumedArr).map(([code, qty]) => [code, qty]));

    const salesMap = {};
    const salesReturnMap = {};

    Object.entries(salesArr).forEach(([code, r]) => {
      salesMap[code] = r.sales ?? 0;
      salesReturnMap[code] = r.salesreturn ?? 0;
    });
    
    // FINAL RESULT
    const result = {};

    codes.forEach(code => {
      const weight = weightMap[code] ?? 1;

      const opening = (openingMap[code] ?? 0) * weight;
      const purchased_transferin = (purchaseMap[code] ?? 0) * weight;
      const consumed_transferout = (consumedMap[code] ?? 0) * weight;
      const sales = (salesMap[code] ?? 0) * weight;
      const salesreturn = (salesReturnMap[code] ?? 0) * weight;

      const closing =
        opening + purchased_transferin - (consumed_transferout + sales) + salesreturn;

      // store per code
      result[code] = {
        opening: Number(opening.toFixed(2)),
        purchased_transferin: Number(purchased_transferin.toFixed(2)),
        consumed_transferout: Number(consumed_transferout.toFixed(2)),
        sales: Number(sales.toFixed(2)),
        salesreturn: Number(salesreturn.toFixed(2)),
        closing: Number(closing.toFixed(2))
      };
    });

    return result;

  } catch (err) {
    console.error("Error in getAllCalculatedStock:", err);
    throw err;
  }
};









