import { makeDbConnection } from "./dbConnection.js";
import { getIdFromUsername } from "./getUserId.js";
async function getIpoInfo(ipo_id) {
    try {
        // Create DB connection
        console.log("===============================");
        let db = await makeDbConnection();
        let sql = `select * from tbl_ipo_info where ipo_id='${ipo_id}'`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.get(sql, (err, row) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log(row);
                    console.log("Query Successful!");
                    resolve(row);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get ipo information: ${error}`);
        process.exit(1);
    }
}


export { getIpoInfo };