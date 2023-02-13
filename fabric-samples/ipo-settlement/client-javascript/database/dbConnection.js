import sqlite3 from 'sqlite3';

async function makeDbConnection(path=null){
    try {
        // Create DB connection
        if (!path){
            path = '../ipo.db'
        }
        let db = new sqlite3.Database(path, (err)=>{
            if (err){
                console.log("===========");
                return console.error(err.message);
            }
            else{
                console.log('Connected to the SQlite database.');
            }
        })
        console.log(db);
        return db;
    }
    catch (error) {
        console.error(`Failed to connect to DATABASE: ${error}`);
        process.exit(1);
    }
}

export { makeDbConnection };