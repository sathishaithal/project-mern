const Category = require("../models/category.model");

exports.getCategories = async (req) => {
  const dbase = req.user?.dbase;
  return await Category.getCategories(dbase);
};