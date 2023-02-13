import { makeDbConnection } from "./dbConnection.js";

async function dematFromDb(investor_id, ipo_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `select * from tbl_investor_ipo_bid
                    where investor_id='${investor_id}' and ipo_id='${ipo_id}'`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Dmat info fetched!");
                        resolve(values);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get DMAT info: ${error}`);
        process.exit(1);
    }
}

async function dematFromInvestorDB(investor_id, demat_ac_no) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `select demat_ac_no from tbl_investor_dmat
                    where investor_id='${investor_id}' and demat_ac_no='${demat_ac_no}'`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Dmat info fetched!");
                        resolve(values);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get DMAT info: ${error}`);
        process.exit(1);
    }
}

async function getAllDemats(ipo_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `select * from tbl_investor_dmat 
                    INNER JOIN tbl_investor_ipo_bid on
                    tbl_investor_dmat.demat_ac_no=tbl_investor_ipo_bid.demat_ac_no
                    where ipo_id='${ipo_id}'`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Dmats info fetched!");
                        resolve(values);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get DMATs info: ${error}`);
        process.exit(1);
    }
}

export { dematFromDb, dematFromInvestorDB, getAllDemats };