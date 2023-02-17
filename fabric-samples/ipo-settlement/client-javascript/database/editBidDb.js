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

async function updateBidinDb(txn_id, investor_id, lots_bid, bid_amount) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `update tbl_investor_transactions
                    Set lots_bid=${lots_bid}, bid_amount=${bid_amount}
                    where investor_id='${investor_id}' and id='${txn_id}'`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err, value) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Txn Bid updated!");
                        resolve(value);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to update txn bid info: ${error}`);
        process.exit(1);
    }
}

export { getBid, deleteBidFromDb, updateBidinDb };