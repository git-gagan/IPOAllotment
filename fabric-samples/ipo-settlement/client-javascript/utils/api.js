import { authorizeUser } from "./userAuth.js";
import { authenticateUser } from "../database/getUserId.js";
import { getAllDemats } from "../database/getDmatFromDB.js";
import { getAllocationData } from "../database/getAllocationDatafromDB.js";
import { getIpoInfo } from "../database/getIpoeligibility.js";
import process from "process";
import { retrieveContract } from "./getContract.js";

async function ipoApiInfo(req){
    // This function fetches IPO investor data and sends it as a response
    console.log("Before:- ", process.cwd());
    process.chdir('./client-javascript/utils');    // Change CWD
    console.log("After:- ", process.cwd());
    let status = null;
    let response = null;
    let data = await authenticate(req);
    if (data[0] != 401){
        console.log("--Regulator Validated--");
        // check if isin is provided or not!
        console.log(req.query);
        let isin = req.query.isin;
        if (isin){
            console.log("ISIN passed as:- ",isin);
            let ledgerInfo = null;
            // fetch data from DB
            let result = await getIpoInfo(isin);
            console.log(result);
            if (result.length){
                let ipo_id = result[0]['ipo_id'];
                let issuer_name = 'IS-'+result[0]['issuer_name'];
                // get ipo info from ledger
                ledgerInfo = await getIpoFromLedger(ipo_id, issuer_name);
                if (ledgerInfo != "0"){
                    // If IPO info is there in ledger
                    ledgerInfo = JSON.parse(ledgerInfo);
                    console.log(ledgerInfo);
                    let investorInfo = ledgerInfo[ipo_id]['userInfo'];
                    console.log(investorInfo);
                    if (investorInfo.toString() != "{}"){
                        response = await accumulateInfo(investorInfo, ipo_id, ledgerInfo, isin);
                        status = 200 // OK
                    }
                    else{
                        console.log("No investor Info Available!");
                        status = 404;
                    }
                }
                else{
                    console.log(`${ipo_id} is not in ledger.`);
                    status = 404;
                }
            }
            else{
                status = 404; // Not Found
            }
        }
        else{
            status = 400; // Bad request, missing parameter
        }
    }
    else{
        status = 401;
    }
    console.log(status, response);
    process.chdir('../../'); 
    return [status, response];
}

async function authenticate(req){
    // Function for regulator Authentication
    let userData = null
    console.log("Authenticating---");
    console.log(req['headers']);
    if (!req.headers.authorization){
        console.log("NO auth!")
        return [401, userData]; // Unauthorized
    }
    else{
        // If the authorization exists, decode and validate
        let credentials = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
        console.log(credentials, typeof(credentials));
        credentials = credentials.split(":");
        let userName = credentials[0];
        let password = credentials[1];
        console.log("-=-=-=-==-=-=-=-=");
        // check against Database to validate
        userData = await authenticateUser(userName, password);
        console.log(userData);
        if (!userData){
            return [401, userData]; // Unauthorized
        }
        return [200, userData]; // OK
    }
}

async function getIpoFromLedger(ipo_id, issuer_name){
    // Fetch the info of all the investors of the given ipo from ledger
    console.log("Getting Info from Ledger---");
    let [isAuthUser, wallet, ccp] = await authorizeUser(issuer_name);
    var [contract, gateway] = await retrieveContract(issuer_name, wallet, ccp);
    let result = await contract.evaluateTransaction('queryIssuer', ipo_id);
    result = result.toString();
    return result;
}

async function accumulateInfo(investorInfo, ipo_id, ledgerInfo, isin){
    // The final function which processes the complete info 
    // and returns the data to be sent to the client
    let jsonResponse = {
        "isin": isin,
        "investorInfo": []
    };
    let investorDbData = await getAllocationData(ipo_id, ledgerInfo[ipo_id]['ipoInfo']['total_bid']/ledgerInfo[ipo_id]['ipoInfo']['lot_size'], 1);
    console.log(investorDbData);
    let processed_investors_db_info = {};
    for (let i in investorDbData){
        // Iterate in investorDbData and process for optimization
        if (!(investorDbData[i]['investor_id'] in processed_investors_db_info)){
            processed_investors_db_info[investorDbData[i]['investor_id']] = {};
        }
        processed_investors_db_info[investorDbData[i]['investor_id']]['investor_type'] = investorDbData[i]['investor_type_name'];
        processed_investors_db_info[investorDbData[i]['investor_id']]['custodian_id'] = investorDbData[i]['custodian_id'];
        processed_investors_db_info[investorDbData[i]['investor_id']]['ifsc_code'] = investorDbData[i]['ifsc_code'];
        processed_investors_db_info[investorDbData[i]['investor_id']]['bank_account_no'] = investorDbData[i]['bank_account_no'];
    }
    console.log(processed_investors_db_info);
    let demats = await getAllDemats(ipo_id);
    // console.log(demats);
    let processed_demats_info = {};
    for (let i in demats){
        // Iterate in Demats and process for optimization
        if (!(demats[i]['investor_id'] in processed_demats_info)){
            processed_demats_info[demats[i]['investor_id']] = {};
        }
        processed_demats_info[demats[i]['investor_id']]['demat_ac_no'] = demats[i]['demat_ac_no'];
        processed_demats_info[demats[i]['investor_id']]['dp_id'] = demats[i]['dp_id'];
    }
    console.log(processed_demats_info);
    // Finally iterate in investorInfo of ledger to create JsonResponse
    for (let key in investorInfo){
        jsonResponse['investorInfo'].push(
            {
                'investor_name' : investorInfo[key]['full_name'],
                'investor_type' : processed_investors_db_info[key]['investor_type'],
                'shares_applied' : investorInfo[key]['shares']['bid'],
                'shares_allotted' : investorInfo[key]['shares']['allotted'],
                'dp_id' : processed_demats_info[key]['dp_id'],
                'demat_ac_no' : processed_demats_info[key]['demat_ac_no'],
                'custodian_id' : processed_investors_db_info[key]['custodian_id'],
                'bank_account_no' : processed_investors_db_info[key]['bank_account_no'],
                'ifsc_code' : processed_investors_db_info[key]['ifsc_code'],
                'cash_refund' : investorInfo[key]['refund_amount']
            }
        )
    }
    return jsonResponse;
}

export { ipoApiInfo };