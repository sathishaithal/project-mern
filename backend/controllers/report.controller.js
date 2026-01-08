const reportService = require("../services/report.service");
const categoryService = require("../services/category.service");
const { report } = require("../routes/authRoutes");

exports.getFriedGramReport = async (req, res) => {
  const start = Date.now();

  try{
    let jsonData = {};

    if (req.query.jsonData) {
      jsonData = JSON.parse(req.query.jsonData);
    } else if (Object.keys(req.body).length) {
      jsonData = req.body;
    }

    

    const today = new Date();
    const format = (d) => d.toISOString().slice(0, 10);

    const safeDate = (value) => {
      const d = new Date(value);
      return isNaN(d.getTime()) ? today : d;
    };

    const fromdate = jsonData.fromdate ? format(safeDate(jsonData.fromdate)) : format(today);
    const todate   = jsonData.todate   ? format(safeDate(jsonData.todate))   : format(today);


    const catgroup = jsonData.catgroup || "Fried Gram Mill";
    const cond1 = (catgroup === "" || catgroup === "--All--")
    ? "1"
    : `mill = '${catgroup}'`;

    const nstock   = Number(jsonData.nstock || 0);

    const reportData = await reportService.getDataForFriedGramReport({
      fromdate,
      todate,
      warehouse: "",
      nstock,
      cond1,
      req
    }); 

    const category_list = await categoryService.getAllCategories(req); 


    return res.json({
      fried_gram_production: reportData,
      categories : category_list,
      selected_catgroup : catgroup,
      fromdate,
      todate,
      nstock
    });

  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }

};

exports.getProductionReport = async (req, res) => {
  const start = Date.now();
  
  try {
    let jsonData = {};

    if (req.query.jsonData) {
      jsonData = JSON.parse(req.query.jsonData);
    } else if (Object.keys(req.body).length) {
      jsonData = req.body;
    }

    const today = new Date();
    const format = (d) => d.toISOString().slice(0, 10);

    const safeDate = (value) => {
      const d = new Date(value);
      return isNaN(d.getTime()) ? today : d;
    };

    const fromdate = jsonData.fromdate ? format(safeDate(jsonData.fromdate)) : format(today);
    const todate   = jsonData.todate   ? format(safeDate(jsonData.todate))   : format(today);


    const catgroup = jsonData.catgroup || "Fried Gram Mill";
    const nstock   = Number(jsonData.nstock || 0);
    const dbase    = jsonData.dbase || "default";

    const reportData = await reportService.getDataForReport({
        fromdate,
        todate,
        warehouse: "",
        nstock,
        catgroup,
        req
      }); 

      

    const cond1 = (catgroup === "" || catgroup === "--All--")
    ? "1"
    : `mill = '${catgroup}'`;

    const fried_gram_reportData = await reportService.getDataForFriedGramReport({
      fromdate,
      todate,
      warehouse: "",
      nstock,
      cond1,
      req
    }); 

      

    const categories = await categoryService.getAllCategories(req);


    const execution_time = ((Date.now() - start) / 1000).toFixed(2) + " seconds";

    return res.json({
      finished: reportData.finished,
      raw: reportData.raw,
      fried_gram_production: fried_gram_reportData,
      categories,
      selected_catgroup: catgroup,
      fromdate,
      todate,
      nstock,
      total_prd: reportData.total_prd,
      execution_time
    });


  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


