import { makeDbConnection } from "./dbConnection.js";

async function updateTimers(ipo_id, start=false) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = '';
        if (start){
            sql = `update tbl_ipo_info
                set has_bidding_started='true'
                where ipo_id='${ipo_id}'`;
        }
        else{
            sql = `update tbl_ipo_info
                set is_complete='true'
                where ipo_id='${ipo_id}'`;
        }
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Timer Info Updated!");
                        resolve("Success!");
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to update Timer info: ${error}`);
        process.exit(1);
    }
}

export { updateTimers };