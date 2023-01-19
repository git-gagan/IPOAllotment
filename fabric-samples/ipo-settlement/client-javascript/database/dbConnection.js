import sqlite3 from 'sqlite3';

async function makeDbConnection(){
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
        console.log(db);
        return db;
    }
    catch (error) {
        console.error(`Failed to connect to DATABASE: ${error}`);
        process.exit(1);
    }
}

export { makeDbConnection };