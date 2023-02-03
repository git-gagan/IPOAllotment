import { makeDbConnection } from "./dbConnection.js";

async function getAllocationData(ipo_id, totalSize, lotSize) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        let limit = totalSize/lotSize;
        let sql = `select * from tbl_investor_transactions 
                    INNER JOIN tbl_investor_info
                    ON tbl_investor_info.investor_id=tbl_investor_transactions.investor_id
                    where ipo_id='${ipo_id}'
                    ORDER BY bid_amount DESC, time_of_bid ASC 
                    limit ${limit}`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.all(sql, (err, rows) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log("Query Successful!");
                    resolve(rows);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}

async function getAllocationPrinciple(ipo_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        let sql = `select allotment_principle, fixed_price from tbl_ipo_info
                    where ipo_id='${ipo_id}'`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.get(sql, (err, row) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log("Query Successful!");
                    resolve(row);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get allocation principle from ipo info: ${error}`);
        process.exit(1);
    }
}

export { getAllocationData, getAllocationPrinciple };