import { makeDbConnection } from "./dbConnection.js";

async function getBid(txn_id, investor_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `select * from tbl_investor_transactions
                    where investor_id='${investor_id}' and id='${txn_id}'`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Txn Bid info fetched!");
                        resolve(values);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get txn bid info: ${error}`);
        process.exit(1);
    }
}

async function deleteBidFromDb(txn_id, investor_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `delete from tbl_investor_transactions
                    where investor_id='${investor_id}' and id='${txn_id}'`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Txn Bid deleted!");
                        resolve(values);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to delete txn bid info: ${error}`);
        process.exit(1);
    }
}

export { getBid, deleteBidFromDb };