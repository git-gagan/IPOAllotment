import db from "../../../configurations/sqliteConnection.js";

async function getInvestorInfo(investor_id) {
    try {
        // Create DB connection
        let sql = `select * from tbl_investor_info where investor_id='${investor_id}'`;
        console.log(sql);
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
        console.error(`Failed to get investor information: ${error}`);
        process.exit(1);
    }
}


async function getAllInvestorInfo() {
    try {
        // Create DB connection
        let sql = `select * from tbl_investor_info`;
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
        console.error(`Failed to get investor information: ${error}`);
        process.exit(1);
    }
}


export { getInvestorInfo, getAllInvestorInfo };