import { makeDbConnection } from "./dbConnection.js";

async function getAllocationData(ipo_id, totalSize, lotSize) {
    try {
        // Create DB connection
       
        let db = await makeDbConnection();
        let limit = totalSize/lotSize;
        let sql = `select * from tbl_investor_transactions 
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


export { getAllocationData }