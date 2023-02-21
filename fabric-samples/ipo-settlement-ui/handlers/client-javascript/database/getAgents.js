import { makeDbConnection } from "./dbConnection.js";
async function getAgents() {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        let sql = `select * from tbl_user where user_id in (select user_id from tbl_userrole where role_id='AG')`;
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
        console.error(`Failed to get allocation principle from ipo info: ${error}`);
        process.exit(1);
    }
}


export {getAgents};


