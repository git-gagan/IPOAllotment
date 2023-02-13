import { makeDbConnection } from "./dbConnection.js";

async function getIdFromUsername(user_name) {
    try {
        // Create DB connection
        console.log("===============================");
        let db = await makeDbConnection();
        // let sql = `select user_id, role_id from tbl_userrole 
        //             where user_id=(
        //                 select user_id from tbl_user where name='${user_name}'
        //             )`;
        let sql = `select tbl_user.user_id, tbl_user.full_name, tbl_userrole.role_id
                    from tbl_user inner join tbl_userrole 
                    on tbl_user.user_id=tbl_userrole.user_id
                    where user_name='${user_name}'`;
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

async function authenticateUser(user_name, password) {
    try {
        // Create DB connection
        console.log("===============================");
        // let dbPath = "./client-javascript/ipo.db";  // to be called by index.js
        let dbPath = null;
        let db = await makeDbConnection(dbPath);
        // let sql = 'select * from pragma_database_list';
        let sql = `select *
                    from tbl_user inner join tbl_userrole
                    on tbl_user.user_id = tbl_userrole.user_id
                    where user_name='${user_name}'
                    and user_pwd='${password}' and role_id='R'`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.get(sql, (err, row) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
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

export { getIdFromUsername, authenticateUser };