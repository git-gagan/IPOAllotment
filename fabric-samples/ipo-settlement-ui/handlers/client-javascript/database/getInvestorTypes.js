import db from "../../../configurations/sqliteConnection.js";

async function getInvestorTypes() {
    try {
        // Create DB connection
        let sql = `select * from tbl_investor_type`;
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) {
                    reject(err.message);
                }
                else {
                    resolve(rows);
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


export { getInvestorTypes };




