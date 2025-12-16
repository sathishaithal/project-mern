const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");

const reportController = require("../controllers/report.controller");

router.post("/production-report", auth, (req, res) => {
    reportController.getProductionReport(req, res);
});

router.post("/fried-gram-report", auth, (req, res) => {
    reportController.getFriedGramReport(req, res);
});

module.exports = router;