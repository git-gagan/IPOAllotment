import sqlite3 from 'sqlite3';

async function getIdFromUsername(user_name) {
    try {
        // Create DB connection
        let db = new sqlite3.Database('../ipo.db', (err)=>{
            if (err){
                console.log("===========");
                return console.error(err.message);
            }
            else{
                console.log('Connected to the SQlite database.');
            }
        })
        let sql = `select user_id, role_id from tbl_userrole 
                    where user_id=(
                        select user_id from tbl_user where user_name='${user_name}'
                    )`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.get(sql, (err, row) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log(row);
                    console.log("Query Successful!");
                    resolve(row);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}


export { getIdFromUsername }