import db from "../../../configurations/sqliteConnection.js";

async function getAllotmentPrinciple(allocation_id) {
    try {
        // Create DB connection
        let sql = `select * from tbl_allotment_principle
                    where id='${allocation_id}'`;
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject) => {
            db.get(sql, (err, row) => {
                if (err) {
                    reject(err.message);
                }
                else {
                    resolve(row);
                }
            });
        })
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to get allocation principle from ipo info: ${error}`);
        process.exit(1);
    }
}


export { getAllotmentPrinciple };