import { makeDbConnection } from "./dbConnection.js";

async function insertDmatIpo(investor_id, ipo_id, demat_ac_no) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `insert into tbl_investor_ipo_bid(investor_id, ipo_id, demat_ac_no)
                    values (
                        '${investor_id}',
                        '${ipo_id}',
                        '${demat_ac_no}'
                    );`
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Insertion Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to insert dmat-ipo information: ${error}`);
        process.exit(1);
    }
}

export { insertDmatIpo };