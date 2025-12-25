const Category = require("../models/category.model");

exports.getCategories = async (req) => {
  const dbase = req.user?.dbase;
  return await Category.getCategories(dbase);
};

exports.getAllCategories = async (req) => {
  const dbase = req.user?.dbase;
  const cats =  await Category.getAllCategories(dbase);
  const details = {};

  cats.forEach(row => {
    const { catgroup, type } = row;

    if (!details[catgroup]) {
      details[catgroup] = [];
    }

    details[catgroup].push(type);
  });

  return details;
  
};