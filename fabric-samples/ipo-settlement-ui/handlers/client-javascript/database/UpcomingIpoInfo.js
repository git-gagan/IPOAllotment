import { makeDbConnection } from "./dbConnection.js";

async function UpcomingIpoInfo() {
    try {
        
      
        // Create DB connection
        console.log("===============================");
        let db = await makeDbConnection();
        let sql = `select * from tbl_ipo_info where has_bidding_started='false'`;
        console.log(sql);
       
        const dbpromise = new Promise((resolve, reject)=>{
            db.all(sql, (err, rows) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    // console.log(rows);
                    console.log("Query Successful!");
                   
                    resolve(rows);
                    
                }
            });
        })

        db.close();
        return dbpromise;  
    } 
    catch (error) {
        console.error(`Failed to get investor information: ${error}`);
        process.exit(1);
    }
}


export { UpcomingIpoInfo };