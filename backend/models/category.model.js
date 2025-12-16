// models/category.model.js
const { getDynamicDB } = require("../config/db");

exports.getCategories = async (dbase) => { 
    try {

        if (!dbase || dbase.trim() === "") {
            throw new Error("dbase is empty or undefined");
        }

        const dynamicDB = getDynamicDB(dbase);

        const [rows] = await dynamicDB.query(`
            SELECT DISTINCT
                catgroup,
                cat AS category
            FROM ims_itemcodes
            WHERE catgroup IS NOT NULL
              AND catgroup <> ''
            ORDER BY catgroup ASC
        `);

        return rows;

    } catch (err) {
        console.error("getCategories ERROR:", err);
        throw err; // send to controller
    }
};
