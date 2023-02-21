/* 
    This file contains helper functions for allocation logic and 
    subsequent processing on the nodejs side of things
*/

import { dematFromDb } from '../database/getDmatFromDB.js';
import { getIpoEligibleObj } from '../database/getIpoeligibility.js';

async function processAllocationDictU(allocation_dict, lotSize, totalSize, ipo_id, statusInfo=null){
    /* 
    The following function processes the allocation dictionary and 
    returns a processed dictionary to be passed to the smart contract 
    for the case of complete undersubscription for every investor category
    
    INPUT:-
        statusInfo:- [
                        'U',
                        {
                            '1': { sharesMaxLimit: 400, sharesBid: 300, subStatus: 'U' },
                            '2': { sharesMaxLimit: 200, sharesBid: 150, subStatus: 'U' }
                        }
                    ]
        
        allocation_dict:- [
                    {
                        id: 55,
                        investor_id: 'G1',
                        ipo_id: 'M1',
                        lots_bid: 3,
                        bid_amount: 100,
                        time_of_bid: '2023-01-31 06:46:30.292Z',
                        investor_type: 1,
                        pan: null,
                        investor_name: null,
                        country_domicile: null,
                        custodian_id: null,
                        bank_account_no: null,
                        ifsc_code: null,
                        lei: null,
                        swift_address: null
                    },
                    { ... }
                ]
    */
    let processed_dict = {
        "investorInfo": {},
        "totalAmount": 0,
        "totalShares": 0
    };
    for(let i in allocation_dict){
        if (processed_dict['totalShares'] >= totalSize){
            console.log("No more shares available!");
            break;
        } 
        console.log(allocation_dict[i]['investor_type'], statusInfo);
        if (!(statusInfo && allocation_dict[i]['investor_type'] in statusInfo)){
            // if this investor_type_category is not in the statusInfo category
            console.log("\n---SKIP---\n");
            continue;
        }
        if (!(allocation_dict[i]['investor_id'] in processed_dict['investorInfo'])){
            let dmat_info = await dematFromDb(allocation_dict[i]['investor_id'], ipo_id);
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']] = {};
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['shares_allotted'] = 0;
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] = 0;
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['demat_account'] = dmat_info[0]['demat_ac_no'];
        }
        let shares_to_be_allotted = 0;
        let amount_invested = 0;
        let shares_demanded = allocation_dict[i]['lots_bid']*lotSize
        let available_shares = totalSize-processed_dict['totalShares'];
        if (available_shares >= shares_demanded){
            // If shares available are more than the investors current demand
            shares_to_be_allotted = shares_demanded;
            amount_invested = shares_demanded*allocation_dict[i]['bid_amount'];
        }
        else{
            // If shares available are less than the demand, allocate whatever is possible
            shares_to_be_allotted = available_shares;
            amount_invested = available_shares*allocation_dict[i]['bid_amount'];
        }
        processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['shares_allotted'] += shares_to_be_allotted;
        processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] += amount_invested;
        processed_dict['totalAmount'] += amount_invested;
        processed_dict['totalShares'] += shares_to_be_allotted;
        statusInfo[allocation_dict[i]['investor_type']]['sharesAllotted'] += shares_to_be_allotted;
    }
    return processed_dict;
}

async function processAllocationDictO(allocation_dict, lotSize, totalSize, ipo_id, statusInfo, allotment_principle, issuer_info){
    /* 
    The following function processes the allocation dictionary and 
    returns a processed dictionary to be passed to the smart contract
    for the case of complete oversubscription for every investor category
    */
    let processed_dict = {
        "investorInfo": {},
        "totalAmount": 0,
        "totalShares": 0
    };
    for(let i in allocation_dict){
        if (processed_dict['totalShares'] >= totalSize){
            console.log("No more shares available!");
            break;
        }
        if (!(statusInfo && allocation_dict[i]['investor_type'] in statusInfo)){
            // if this investor_type_category is not in the statusInfo category
            console.log("\n---SKIP---\n");
            continue;
        }
        let bid_price = null;
        let shares_to_be_allotted = 0;
        let amount_invested = 0;
        let shares_demanded = allocation_dict[i]['lots_bid']*lotSize;
        let available_shares = statusInfo[allocation_dict[i]['investor_type']]['sharesMaxLimit']-statusInfo[allocation_dict[i]['investor_type']]['sharesAllotted'];
        if (available_shares <= 0){
            console.log("No more shares available for investor type:- ", allocation_dict[i]['investor_type']);
            continue;
        }
        if (allotment_principle == 2){
            console.log("Oversubscription FIFO Max Price");
            bid_price = allocation_dict[i]['bid_amount'];
        }
        else{
            console.log("Oversubscription FIFO Avg Price");
            bid_price = statusInfo[allocation_dict[i]['investor_type']]['totalInvestment']/statusInfo[allocation_dict[i]['investor_type']]['sharesBid'];
        }
        if (!(allocation_dict[i]['investor_id'] in processed_dict['investorInfo'])){
            let dmat_info = await dematFromDb(allocation_dict[i]['investor_id'], ipo_id);
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']] = {};
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['shares_allotted'] = 0;
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] = 0;
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['demat_account'] = dmat_info[0]['demat_ac_no'];
        }
        let expected_investment_amount = processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] + shares_demanded*bid_price;
        if (expected_investment_amount >= issuer_info[ipo_id]['userInfo'][allocation_dict[i]['investor_id']]['total_invested']){
            // If actual amount invested is less than what is getting allotted to the investor
            console.log("Investor has't invested this much!!! Allot less OR None\n")
            let money_balance = issuer_info[ipo_id]['userInfo'][allocation_dict[i]['investor_id']]['total_invested'] - processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'];
            // To get shares to be assigned now, divide balance by price of one lot
            shares_demanded = Math.floor(money_balance/(lotSize*bid_price))*lotSize;
        }
        if (available_shares >= shares_demanded){
            // If shares available are more than the investors current demand
            shares_to_be_allotted = shares_demanded;
            amount_invested = shares_demanded*bid_price;
        }
        else{
            // If shares available are less than the demand, allocate whatever is possible
            shares_to_be_allotted = available_shares;
            amount_invested = available_shares*bid_price;
        }
        console.log("---\nBid Price = ", bid_price);
        console.log("---\nShares Demanded = ", shares_demanded);
        console.log("---\nShares Allotted = ", shares_to_be_allotted, "\n---");
        processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['shares_allotted'] += shares_to_be_allotted;
        processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] += amount_invested;
        processed_dict['totalAmount'] += amount_invested;
        processed_dict['totalShares'] += shares_to_be_allotted;
        statusInfo[allocation_dict[i]['investor_type']]['sharesAllotted'] += shares_to_be_allotted;
    }
    return processed_dict;
}

async function processAllocationDictOR(allocation_dict, lotSize, totalSize, ipo_id, statusInfo, allotment_principle, fixed_price, issuer_info){
    /* 
    The following function processes the allocation dictionary and 
    returns a processed dictionary to be passed to the smart contract
    for the case of complete oversubscription for every investor category
    */
    let processed_dict = {
        "investorInfo": {},
        "totalAmount": 0,
        "totalShares": 0
    };
    // Temporary dictionary for investor info
    let temp_investor_dict = {}
    for(let i in allocation_dict){
        // Make a comprehensive list of bids investor wise
        if (!(allocation_dict[i]['investor_id'] in temp_investor_dict)){
            temp_investor_dict[allocation_dict[i]['investor_id']] = {};
            temp_investor_dict[allocation_dict[i]['investor_id']]['total_bid'] = allocation_dict[i]['lots_bid']*lotSize;
            temp_investor_dict[allocation_dict[i]['investor_id']]['investor_type'] = allocation_dict[i]['investor_type'];
            continue;
        }
        temp_investor_dict[allocation_dict[i]['investor_id']]['total_bid'] += allocation_dict[i]['lots_bid']*lotSize;
    }
    console.log(temp_investor_dict);
    for (let key in temp_investor_dict){
        if (processed_dict['totalShares'] >= totalSize){
            console.log("No more shares available!");
            break;
        }
        if (!(statusInfo && temp_investor_dict[key]['investor_type'] in statusInfo)){
            // if this investor_type_category is not in the statusInfo category
            console.log("\n---SKIP---\n");
            continue;
        }
        let allocation_ratio = statusInfo[temp_investor_dict[key]['investor_type']]['sharesMaxLimit']/statusInfo[temp_investor_dict[key]['investor_type']]['sharesBid']; // Needed if principle = 4 or 5
        let bid_price = null;
        let shares_to_be_allotted = 0;
        let amount_invested = 0;
        let shares_demanded = temp_investor_dict[key]['total_bid']*allocation_ratio; // Shares demanded after applying allocation ratio
        let available_shares = statusInfo[temp_investor_dict[key]['investor_type']]['sharesMaxLimit']-statusInfo[temp_investor_dict[key]['investor_type']]['sharesAllotted'];
        if (available_shares <= 0){
            console.log("No more shares available for investor type:- ",allocation_dict[i]['investor_type']);
            continue;
        }
        if (allotment_principle == 4){
            console.log("Oversubscription Allotment Ratio Avg Price");
            bid_price = statusInfo[temp_investor_dict[key]['investor_type']]['totalInvestment']/statusInfo[temp_investor_dict[key]['investor_type']]['sharesBid'];
        }
        else {
            bid_price = fixed_price;    // Bid price to be equal to price fixed by issuer for principle 5
            console.log("Oversubscription Allotment Ratio Fixed Price");
        }
        let diff_shares = shares_demanded%lotSize;
        if (diff_shares != 0){
            // if shares demanded after applying allocation ratio is not a multiple of lotSize
            console.log("---\nRounding Off Shares\n---");
            if (diff_shares >= lotSize/2){
                // Round off to higher side
                shares_demanded = (Math.floor((shares_demanded+lotSize)/lotSize))*lotSize;
            }
            else{
                // Round off to lower side
                shares_demanded = (Math.floor(shares_demanded/lotSize))*lotSize;
            }
        }
        if (!(key in processed_dict['investorInfo'])){
            let dmat_info = await dematFromDb(key, ipo_id);
            processed_dict['investorInfo'][key] = {};
            processed_dict['investorInfo'][key]['shares_allotted'] = 0;
            processed_dict['investorInfo'][key]['amount_invested'] = 0;
            processed_dict['investorInfo'][key]['demat_account'] = dmat_info[0]['demat_ac_no'];
        }
        let expected_investment_amount = processed_dict['investorInfo'][key]['amount_invested'] + shares_demanded*bid_price;
        if (expected_investment_amount >= issuer_info[ipo_id]['userInfo'][key]['total_invested']){
            // If actual amount invested is less than what is getting allotted to the investor
            console.log("Investor has't invested this much!!! Allot less OR None\n")
            let money_balance = issuer_info[ipo_id]['userInfo'][key]['total_invested'] - processed_dict['investorInfo'][key]['amount_invested'];
            // To get shares to be assigned now, divide balance by price of one lot
            shares_demanded = Math.floor(money_balance/(lotSize*bid_price))*lotSize;
        }
        if (available_shares >= shares_demanded){
            // If shares available are more than the investors current demand
            shares_to_be_allotted = shares_demanded;
            amount_invested = shares_to_be_allotted*bid_price;
        }
        else{
            // If shares available are less than the demand, allocate whatever is possible
            shares_to_be_allotted = available_shares;
            amount_invested = available_shares*bid_price;
        }
        console.log(`---\nAllotment Ratio: ${allocation_ratio}`);
        console.log("\nBid Price = ", bid_price);
        console.log("\nShares demanded = ", shares_demanded);
        console.log("\nShares to be allotted = ", shares_to_be_allotted, "\n---");
        processed_dict['investorInfo'][key]['shares_allotted'] += shares_to_be_allotted;
        processed_dict['investorInfo'][key]['amount_invested'] += amount_invested;
        processed_dict['totalAmount'] += amount_invested;
        processed_dict['totalShares'] += shares_to_be_allotted;
        statusInfo[temp_investor_dict[key]['investor_type']]['sharesAllotted'] += shares_to_be_allotted;
    }
    return processed_dict;
}

async function getSubscriptionInfo(issuer_info, ipo_id){
    // For each investor who bid in the ipo, We have to see if their cumulative
    // sum causes oversub or undersub for a particular investor_type_id
    let eligibilityObj = await getIpoEligibleObj(ipo_id);
    console.log(eligibilityObj);
    // For optimization, create a dictionary of the eligibility obj
    let eligibilityObjDict = {};
    for(let i in eligibilityObj){
        if (!(eligibilityObj[i]['investor_type_id'] in eligibilityObjDict)){
            eligibilityObjDict[eligibilityObj[i]['investor_type_id']] = {
                "reserve_shares" : (eligibilityObj[i]['reserve_lots']*issuer_info[ipo_id]['ipoInfo']['lot_size'])
            }
        }
        else{
            // Should never happen
            console.log(`${eligibilityObj[i]['investor_type_id']} exists already!`);
        }
    }
    console.log("----------------------");
    console.log(eligibilityObjDict);
    let isEligible = true   // Tells if eligibility info is available or not!
    console.log(JSON.stringify(eligibilityObjDict) == '{}');
    if (JSON.stringify(eligibilityObjDict) == '{}'){
        // Eligibility Dictionary is EMPTY
        isEligible = false;
        console.log("No eligibility Information available");
    }
    let usersInfo = issuer_info[ipo_id]['userInfo'];
    console.log(usersInfo);
    // Create a statusInfo dictionary holding the info of undersub and oversub for each IN
    let statusInfo = {};
    for (let key in usersInfo){
        console.log(key);
        let reserve_shares = null
        if (!(usersInfo[key]['investor_type_id'] in statusInfo)){
            console.log("-");
            statusInfo[usersInfo[key]['investor_type_id']] = {};
            statusInfo[usersInfo[key]['investor_type_id']]['sharesAllotted'] = 0;
            if (isEligible){
                reserve_shares = eligibilityObjDict[usersInfo[key]['investor_type_id']]['reserve_shares'];
            }
            else{
                reserve_shares = 0;
            }
            statusInfo[usersInfo[key]['investor_type_id']]['sharesMaxLimit'] = reserve_shares;
            statusInfo[usersInfo[key]['investor_type_id']]['sharesBid'] = 0;
            statusInfo[usersInfo[key]['investor_type_id']]['totalInvestors'] = 0;
            statusInfo[usersInfo[key]['investor_type_id']]['totalInvestment'] = 0;
            statusInfo[usersInfo[key]['investor_type_id']]['subStatus'] = "U"; // Default undersubscription
        }
        statusInfo[usersInfo[key]['investor_type_id']]['totalInvestors'] += 1;
        statusInfo[usersInfo[key]['investor_type_id']]['totalInvestment'] += getInvestorInvestment(usersInfo[key]['transactions'], issuer_info[ipo_id]['ipoInfo']['lot_size']);
        statusInfo[usersInfo[key]['investor_type_id']]['sharesBid'] += usersInfo[key]['shares']['bid'];
        if (statusInfo[usersInfo[key]['investor_type_id']]['sharesBid'] > reserve_shares){
            // Shares bid exceeded to what was expected by the issuer, so mark oversubscription
            statusInfo[usersInfo[key]['investor_type_id']]['subStatus'] = "O";
        }
    }
    console.log(`\nStatus Info Dictionary:- `, statusInfo);

    let status = null;
    let isU = null
    let isO = null;
    for (let key in statusInfo){
        // Iterate in statusInfo to get overall status of subscription
        if (statusInfo[key]['subStatus'] == "U"){
            isU = true;
        }
        else{
            isO = true;
        }
    }
    if (isO && isU){
        // Mixed case
        status = "M";
    }
    else if (isO && !isU){
        // Oversubscribed
        status = "O";
    }
    else if (isU && !isO){
        // Undersubscribed
        status = "U";
    }
    else{
        status = null;
    }
    return [status, statusInfo];
}

// Helper Functions
function getInvestorInvestment(transactions, lot_size){
    // This function calculates the total investment made by a particular
    // investor and takes as parameter transactions of that investor
    let totalInvestment = 0;
    for (let i in transactions){
        totalInvestment += transactions[i]['lots_bid']*transactions[i]['bid_amount']*lot_size;
    }
    return totalInvestment;
}

function segregateStatusDictionary(statusInfo){
    // Iterate over the main statusInfo dictionary and divide it 
    // on the basis of subscription status into 2
    let od = {};    // Oversubscription Dictionary
    let ud = {};    // Undersubscription Dictionary
    for (let key in statusInfo){
        if (statusInfo[key]['subStatus'] == 'U'){
            ud[key] = statusInfo[key];
        }
        else{
            od[key] = statusInfo[key];
        }
    }
    return [ud, od];
}

function mergeAllocationResultDictionaries(d1, d2){
    // This function takes 2 allocation dictionaries consisting of
    // different sub status and merge them into one final result for transaction
    let processed_dict = {
        "investorInfo": {},
        "totalAmount": 0,
        "totalShares": 0
    };
    for (let key in d1['investorInfo']){
        console.log("-=-=-=-=-=-=-=-=-=--=-=-=");
        processed_dict['investorInfo'][key] = d1['investorInfo'][key];
    }
    for (let key in d2['investorInfo']){
        console.log("-=-=-=-=-=-=-=-=-=--=-=-=");
        processed_dict['investorInfo'][key] = d2['investorInfo'][key];
    }
    console.log(processed_dict)
    processed_dict['totalAmount'] = d1['totalAmount'] + d2['totalAmount'];
    processed_dict['totalShares'] = d1['totalShares'] + d2['totalShares'];
    return processed_dict;
}


export {processAllocationDictU, processAllocationDictO, processAllocationDictOR, getSubscriptionInfo, segregateStatusDictionary, mergeAllocationResultDictionaries};