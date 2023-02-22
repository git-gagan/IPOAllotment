import { makeDbConnection } from "./dbConnection.js";
async function getInvestorTransactions(investor_id) {
    try {
        // Create DB connection
        let db = await makeDbConnection();
        let sql = `select tbl_investor_transactions.id,tbl_ipo_info.ticker,tbl_ipo_info.issuer_name,tbl_ipo_info.lot_size,tbl_investor_transactions.lots_bid,
                    tbl_investor_transactions.bid_amount
                    from tbl_investor_transactions
                    inner join tbl_ipo_info 
                    on tbl_investor_transactions.ipo_id=tbl_ipo_info.ipo_id
                    where investor_id='${investor_id}'`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.all(sql, (err, rows) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log("Query Successful!");
                    console.log(rows)
                    resolve(rows);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get allocation principle from ipo info: ${error}`);
        process.exit(1);
    }
}


export {getInvestorTransactions};