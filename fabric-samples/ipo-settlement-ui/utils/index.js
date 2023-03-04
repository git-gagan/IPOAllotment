import db from '../configurations/sqliteConnection.js'

export const getInvestorTypeId = async (role_type) => {
    try {
        // Create DB connection
        // let sql = `select user_id, role_id from tbl_userrole 
        //             where user_id=(
        //                 select user_id from tbl_user where name='${user_name}'
        //             )`;
        let sql = `select * from tbl_investor_type where investor_type='${role_type}'`;
        const dbpromise = new Promise((resolve, reject) => {
            db.get(sql, (err, row) => {
                if (err) {
                    reject(err.message);
                }
                else {
                    resolve(row);
                }
            });
        })
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}

export const getRoleTypeId = async (role_type) => {
    try {
        // let sql = `select user_id, role_id from tbl_userrole 
        //             where user_id=(
        //                 select user_id from tbl_user where name='${user_name}'
        //             )`;
        let sql = `select * from tbl_role_type where role_type_id='${role_type}'`;
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject) => {
            db.get(sql, (err, row) => {
                if (err) {
                    reject(err.message);
                }
                else {
                    resolve(row);
                }
            });
        })
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}
