import { makeDbConnection } from "./dbConnection.js";

async function dematToDb(investor_id, dmat_obj) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `insert into tbl_investor_dmat
        (investor_id, demat_ac_no, dp_id) 
        values(
            '${investor_id}', 
            '${dmat_obj['dmat_ac_no']}',
            '${dmat_obj['dp_id']}' 
        )`
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("New Dmat Account Added!");
                        resolve("Success!");
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to add DMAT info: ${error}`);
        process.exit(1);
    }
}

export { dematToDb };