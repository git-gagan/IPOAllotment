import db from "../../../configurations/sqliteConnection.js";

async function getInvestorClassification(ipo_id) {
    try {
        // Create DB connection
        let sql = `select tbl_investor_type.investor_type,tbl_investor_ipo_eligibility.reserve_lots,
        tbl_investor_ipo_eligibility.min_lot_qty
         from tbl_investor_ipo_eligibility
        inner join tbl_investor_type 
        on tbl_investor_ipo_eligibility.investor_type_id=tbl_investor_type.investor_type_id
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


export { getInvestorClassification };