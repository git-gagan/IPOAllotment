import { makeDbConnection } from "./dbConnection.js";

async function insertOrUpdateIpo(issuer_obj, ipo_id, update, allotment_principle=null) {
    try {
        // Create DB connection
        console.log("-------------------------------------");
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = "";
        if (!update){
            console.log("Insert Needed---");
            sql = `insert into tbl_ipo_info
            (ipo_id, isin, cusip, ticker, issuer_name, bid_time, is_complete, has_bidding_started, ipo_announcement_date, bid_start_date, allotment_principle)
            values(
                '${ipo_id}', 
                '${issuer_obj[ipo_id]['isin']}',
                '${issuer_obj[ipo_id]['cusip']}',
                '${issuer_obj[ipo_id]['ticker']}',
                '${issuer_obj[ipo_id]['ipoInfo']['issuer_name']}', 
                '${issuer_obj[ipo_id]['ipoInfo']['total_bid_time']}',
                '${issuer_obj[ipo_id]['ipoInfo']['is_complete']}',
                '${issuer_obj[ipo_id]['ipoInfo']['has_bidding_started']}',
                '${issuer_obj[ipo_id]['ipoInfo']['ipo_announcement_date'].toISOString().split('T').join(" ")}',
                '${issuer_obj[ipo_id]['ipoInfo']['bid_start_date'].toISOString().split('T').join(" ")}',
                '${allotment_principle}'
            )`
        }
        else{
            console.log("Update Needed---");
            sql = `update tbl_ipo_info 
                set isin='${issuer_obj['isin']}',
                cusip='${issuer_obj['cusip']}',
                ticker='${issuer_obj['ticker']}'
                where ipo_id='${ipo_id}'`;
        }
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Execution Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to insert IPO information: ${error}`);
        process.exit(1);
    }
}

async function addIpoEligibility(eligibility_obj) {
    try {
        // Create DB connection
        console.log("-------------------------------------");
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let values = ''
        for(let i in eligibility_obj){
            values += `('${eligibility_obj[i]['ipo_id']}', 
                        ${eligibility_obj[i]['investor_type_id']},
                        ${eligibility_obj[i]['min_lot_qty']},
                        ${eligibility_obj[i]['reserve_shares_percentage']}
                    )`
            if (i < eligibility_obj.length-1){
                values += ','
            }
        }
        let sql = `insert into tbl_investor_ipo_eligibility(
                ipo_id,
                investor_type_id,
                min_lot_qty,
                reserve_shares_percentage
            )
            Values ${values}`;
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
                        console.log("Execution Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to insert IPO information: ${error}`);
        process.exit(1);
    }
}

export { insertOrUpdateIpo, addIpoEligibility };