import db from "../../../configurations/sqliteConnection.js";

async function insertOrUpdateIpo(issuer_obj, ipo_id, update, allotment_principle = null, fixed_price) {
    try {
        // Create DB connection

        let sql = "";
        if (!update) {
            sql = `insert into tbl_ipo_info
            (ipo_id, isin, cusip, ticker, total_size, issuer_name, bid_time, is_complete, has_bidding_started, ipo_announcement_date, bid_start_date, allotment_principle, fixed_price,
                lot_size, priceRangeLow, priceRangeHigh)
            values(
                '${ipo_id}', 
                '${issuer_obj[ipo_id]['ipoInfo']['isin']}',
                '${issuer_obj[ipo_id]['ipoInfo']['cusip']}',
                '${issuer_obj[ipo_id]['ipoInfo']['ticker']}',
                '${issuer_obj[ipo_id]['ipoInfo']['totalSize']}',
                '${issuer_obj[ipo_id]['ipoInfo']['issuer_name']}', 
                '${issuer_obj[ipo_id]['ipoInfo']['total_bid_time']}',
                '${issuer_obj[ipo_id]['ipoInfo']['is_complete']}',
                '${issuer_obj[ipo_id]['ipoInfo']['has_bidding_started']}',
                '${issuer_obj[ipo_id]['ipoInfo']['ipo_announcement_date'].toISOString().split('T').join(" ")}',
                '${issuer_obj[ipo_id]['ipoInfo']['bid_start_date'].toISOString().split('T').join(" ")}',
                '${allotment_principle}',
                '${fixed_price}',
                '${issuer_obj[ipo_id]['ipoInfo']['lot_size']}',
                '${issuer_obj[ipo_id]['ipoInfo']['priceRangeLow']}',
                '${issuer_obj[ipo_id]['ipoInfo']['priceRangeHigh']}'
            )`
        }
        else {
            sql = `update tbl_ipo_info 
                set isin='${issuer_obj['isin']}',
                cusip='${issuer_obj['cusip']}',
                ticker='${issuer_obj['ticker']}'
                where ipo_id='${ipo_id}'`;
        }
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err.message);
                    }
                    else {
                        console.log("Execution Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to insert IPO information: ${error}`);
        process.exit(1);
    }
}

async function addIpoEligibility(eligibility_obj) {
    try {
        let values = ''
        for (let i in eligibility_obj) {
            values += `('${eligibility_obj[i]['ipo_id']}', 
                        ${eligibility_obj[i]['investor_type_id']},
                        ${eligibility_obj[i]['min_lot_qty']},
                        ${eligibility_obj[i]['reserve_lots']}
                    )`
            if (i < eligibility_obj.length - 1) {
                values += ','
            }
        }
        let sql = `insert into tbl_investor_ipo_eligibility(
                ipo_id,
                investor_type_id,
                min_lot_qty,
                reserve_lots
            )
            Values ${values}`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err) {
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else {
                        console.log("Execution Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to insert IPO information: ${error}`);
        process.exit(1);
    }
}

async function addIpoBuckets(bucket_obj) {
    try {

        let values = ''
        for (let i in bucket_obj) {
            values += `('${bucket_obj[i]['ipo_id']}', 
                        '${bucket_obj[i]['investor_id']}',
                        ${bucket_obj[i]['investor_type_id']},
                        ${bucket_obj[i]['no_of_shares']},
                        ${bucket_obj[i]['priority']}
                    )`
            if (i < bucket_obj.length - 1) {
                values += ','
            }
        }
        let sql = `insert into tbl_ipo_bucket(
                ipo_id,
                investor_id,
                investor_type_id,
                no_of_shares,
                priority
            )
            Values ${values}`;
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err) {
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else {
                        console.log("Execution Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        return dbpromise;
    }
    catch (error) {
        console.error(`Failed to insert IPO-Bucket information: ${error}`);
        process.exit(1);
    }
}

async function updateIpoBuckets(allotted_shares, ipo_id, investor_id) {
    try {
        let sql = `update tbl_ipo_bucket
                    SET allotted_shares=${allotted_shares}
                    where ipo_id='${ipo_id}' and investor_id='${investor_id}'`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.run(sql, (err) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("Execution Successful!");
                        resolve("Success!");
                    }
                });
            }
        )
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to update IPO-Bucket information: ${error}`);
    }
}

async function getIpoBuckets(ipo_id) {
    try {
        let sql = `select * from tbl_ipo_bucket
                    where ipo_id='${ipo_id}'
                    order by priority asc`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("ipo bucket info fetched!");
                        resolve(values);
                    }
                });
            }
        )
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get IPO-Bucket information: ${error}`);
    }
}

async function insert_investor_type_allocation(allocation_status, ipo_id) {
    try {
        let values = '';
        let keys = Object.keys(allocation_status)
        for(let i in keys){
            values += `('${ipo_id}', 
                        ${i},
                        ${allocation_status[keys[i]]['sharesAllotted']}
                    )`
            if (i < Object.keys(allocation_status).length-1){
                console.log("inserting , in values");
                values += ','
            }
        }
        let sql = `insert into tbl_investor_type_allotment_info(
                ipo_id,
                investor_type_id,
                allotted_shares
            )
            Values ${values}`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("ipo investor_type allocation info inserted!");
                        resolve(values);
                    }
                });
            }
        )
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to insert IPO-allocation information: ${error}`);
    }
}

async function getInvestorTypeAllocation(ipo_id) {
    try {
        let sql = `select * from tbl_investor_type_allotment_info
                    where ipo_id='${ipo_id}'`;
        console.log(sql);
        const dbpromise = new Promise(
            (resolve, reject) => {
                db.all(sql, (err, values) => {
                    if (err){
                        console.log("```````````````````````");
                        console.error(err.message);
                        reject(err.message);
                    }
                    else{
                        console.log("ipo investor_type allocation info fetched!");
                        resolve(values);
                    }
                });
            }
        )
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get po investor_type allocation info: ${error}`);
    }
}

export { insertOrUpdateIpo, addIpoEligibility, addIpoBuckets, updateIpoBuckets, getIpoBuckets, insert_investor_type_allocation, getInvestorTypeAllocation };