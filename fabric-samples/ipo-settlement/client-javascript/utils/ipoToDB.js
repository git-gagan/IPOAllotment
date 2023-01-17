import sqlite3 from 'sqlite3';

async function insertIpo(issuer_obj, ipo_id) {
    try {
        // Create DB connection
        let db = new sqlite3.Database('../ipo.db', (err)=>{
            if (err){
                return console.error(err.message);
            }
            else{
                console.log('Connected to the SQlite database.');
            }
        })
        console.log(db, "------------------");
        let sql = `insert into tbl_ipo_info
        (ipo_id, issuer_name, bid_time, is_complete, has_bidding_started, ipo_announcement_date, bid_start_date)
        values(
            '${ipo_id}', 
            '${issuer_obj[ipo_id]['ipoInfo']['issuer_name']}', 
            '${issuer_obj[ipo_id]['ipoInfo']['total_bid_time']}',
            '${issuer_obj[ipo_id]['ipoInfo']['is_complete']}',
            '${issuer_obj[ipo_id]['ipoInfo']['has_bidding_started']}',
            '${issuer_obj[ipo_id]['ipoInfo']['ipo_announcement_date'].toISOString().split('T').join(" ")}',
            '${issuer_obj[ipo_id]['ipoInfo']['bid_start_date'].toISOString().split('T').join(" ")}'
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
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}

export { insertIpo };