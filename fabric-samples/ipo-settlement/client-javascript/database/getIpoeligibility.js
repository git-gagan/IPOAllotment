import { makeDbConnection } from "./dbConnection.js";

async function getIpoEligibleLots(investor_id, ipo_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `select * from tbl_investor_ipo_eligibility
                    where investor_type_id=(
                        select investor_type from tbl_investor_info 
                        where investor_id='${investor_id}'
                    ) and ipo_id='${ipo_id}'`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, value) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("eligible lots to allow bid fetched!");
                        resolve(value);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get eligible lots info: ${error}`);
        process.exit(1);
    }
}

async function getIpoEligibleObj(ipo_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `select * from tbl_investor_ipo_eligibility
                    where ipo_id='${ipo_id}'`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, value) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Eligibility Obj fetched!");
                        resolve(value);
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get eligibility info: ${error}`);
        process.exit(1);
    }
}

export { getIpoEligibleLots, getIpoEligibleObj };