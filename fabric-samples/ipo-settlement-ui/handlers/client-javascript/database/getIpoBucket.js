import db from "../../../configurations/sqliteConnection.js";

async function getIpoBucket(ipo_id) {
    try {
        let sql = `select tbl_investor_type.investor_type, tbl_ipo_bucket.no_of_shares,
        tbl_ipo_bucket.priority
         from tbl_ipo_bucket
        inner join tbl_investor_type 
        on tbl_ipo_bucket.investor_type_id=tbl_investor_type.investor_type_id
         where ipo_id='${ipo_id}'`;
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) {
                    reject(err.message);
                }
                else {
                    resolve(rows);
                }
            });
        })
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to get ipo information: ${error}`);
        process.exit(1);
    }
}


export { getIpoBucket };