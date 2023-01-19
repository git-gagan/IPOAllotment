import { makeDbConnection } from "./dbConnection.js";

async function insertIpo(issuer_obj, ipo_id, allotment_principle) {
    try {
        // Create DB connection
        console.log("-------------------------------------");
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `insert into tbl_ipo_info
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
        console.error(`Failed to insert IPO information: ${error}`);
        process.exit(1);
    }
}

export { insertIpo };