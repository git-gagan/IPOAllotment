import { makeDbConnection } from "./dbConnection.js";

async function insertBid(investor_obj, investor_id, ipo_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        console.log(db, "------------------");
        let sql = `insert into tbl_investor_transactions
        (investor_id, ipo_id, lots_bid, bid_amount, is_allotted, time_of_bid) 
        values(
            '${investor_id}', 
            '${ipo_id}', 
            '${investor_obj[investor_id]['transactions'][0]['lots_bid']}',
            '${investor_obj[investor_id]['transactions'][0]['bid_amount']}',
            '0',
            '${(new Date().toISOString().split('T')).join(" ")}'
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
        console.error(`Failed to insert bid information: ${error}`);
        process.exit(1);
    }
}

export { insertBid };