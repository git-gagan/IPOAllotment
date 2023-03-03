import sqlite3 from "sqlite3";

let db = new sqlite3.Database('ipo.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    else {
        console.log('Connected to the SQlite database.');
    }
})

export default db