import sqlite3 from 'sqlite3';

async function performDBquery(sql) {
    try {
        // Create DB connection
        let db = new sqlite3.Database('ipo.db', (err)=>{
            if (err){
                return console.error(err.message);
            }
            else{
                console.log('Connected to the SQlite database.');
            }
        })
        db.run(
            `CREATE TABLE IF NOT EXISTS ipo_users 
                (   
                    id integer PRIMARY KEY,
                    user_name TEXT, 
                    stock_name TEXT, 
                    shares_bid INTEGER,
                    shares_alloted INTEGER,
                    amount_for_bidding INTEGER,
                    bid_per_share INTEGER
                )`
        );
        console.log(db, "------------------");
        db.run(sql, (err) => {
            if (err){
                return console.error(err.message);
            }
            else{
                console.log("Insertion Successful!");
            }
        });
        db.close();
    } 
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}

export { performDBquery }