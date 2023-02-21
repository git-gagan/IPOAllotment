import { makeDbConnection } from "./dbConnection.js";
async function getAllotmentPrinciple(allocation_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        let sql = `select * from tbl_allotment_principle
                    where id='${allocation_id}'`;
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


export {getAllotmentPrinciple};