import { makeDbConnection } from "./dbConnection.js";
async function getOverSubAllotmentPrinciple() {
    try {
        var principles = [];
        // Create DB connection
        let db = await makeDbConnection();
        let sql = `select * from tbl_allotment_principle`;
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) {
                    reject(err.message);
                }
                else {
                    rows.forEach(function (row) {
                        if (row.id !== 1) {
                            principles.push({
                                id: row.id,
                                name: row.name
                            })
                        }
                    })
                    resolve(principles);
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


export { getOverSubAllotmentPrinciple };



