/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../utils/getUserId.js';
import { getAllocationData } from '../utils/getAllocationDatafromDB.js';



async function SharesAllotment(username,ipo_id) {
    try {
        var queryResult="";
        // console.log(process.argv);
        // let userName = process.argv[2];   // Take username from command line
        let userName=username
        let user_promise = await getIdFromUsername(username);
        console.log("USER ID:- ", user_promise);

        let user_id, role_id;
        if (user_promise){
            user_id = user_promise['user_id'];
            role_id = user_promise['role_id'];
        }
        else{
            user_id = null;
        }
        
        console.log(user_id, role_id)

        if(user_id){
            var ipo_id = ipo_id;
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "AG") {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Get ipo information
                let issuer_info = await contract.evaluateTransaction('queryIssuer', ipo_id);
                issuer_info = JSON.parse(issuer_info);
                console.log(issuer_info);
                let totalSize = issuer_info[ipo_id]['ipoInfo']['totalSize'];
                let lotSize = issuer_info[ipo_id]['ipoInfo']['lot_size'];
                console.log(totalSize, lotSize);
                // console.log(result[ipo_id]['ipoInfo']['is_allotted'], result[ipo_id]['ipoInfo']['total_bid'])
                if (!issuer_info[ipo_id]['ipoInfo']['is_allotted']){
                    // Query the current Db, create a processed dictionary to be passed to the smart contract for allocation
                    var allocation_dict = await getAllocationData(ipo_id, totalSize, lotSize);
                    console.log(allocation_dict);
                    allocation_dict = processAllocationDict(allocation_dict, lotSize);
                    console.log(allocation_dict);
                    if (issuer_info[ipo_id]['ipoInfo']['total_bid'] <= totalSize){
                        console.log("It is the case of Undersubscription");
                        queryResult="It is the case of Undersubscription"
                    }
                    else{
                        console.log("It is the case of Oversubscription!");
                        queryResult="It is the case of Oversubscription!"
                    }
                    // Evaluate the specified transaction.
                    const result = await contract.submitTransaction('allotShares', ipo_id, JSON.stringify(issuer_info), JSON.stringify(allocation_dict));
                    console.log(`Transaction has been evaluated, result is: ${result}`);
                    console.log("\nSUCCESS\n");
                }
                else{
                    console.log("Allotment Already made for ipo"+ipo_id);
                    queryResult="Allotment Already made!!"
                     
                }
                await gateway.disconnect();
            }
            else {
                console.log("\n3")
                console.log("Unauthorized User!");
                queryResult="Unauthorized User!"
            }
        }
        else{
            console.log("This user doesn't exist!");
            queryResult="This user doesn't exist!"

        }
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }

    return queryResult;
}

function processAllocationDict(allocation_dict, lotSize){
    /* 
    The following function processes the allocation dictionary and 
    returns a processed dictionary to be passed to the smart contract
    */
    let processed_dict = {
        "investorInfo": {},
        "totalAmount": 0,
        "totalShares": 0
    };
    for(let i in allocation_dict){
        if (!(allocation_dict[i]['investor_id'] in processed_dict['investorInfo'])){
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']] = {};
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['shares_allotted'] = 0;
            processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] = 0;
        }
        processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['shares_allotted'] += allocation_dict[i]['lots_bid']*lotSize;
        processed_dict['investorInfo'][allocation_dict[i]['investor_id']]['amount_invested'] += allocation_dict[i]['lots_bid']*lotSize*allocation_dict[i]['bid_amount'];
        processed_dict['totalAmount'] += allocation_dict[i]['lots_bid']*lotSize*allocation_dict[i]['bid_amount'];
        processed_dict['totalShares'] += allocation_dict[i]['lots_bid']*lotSize;
    }
    return processed_dict;
}

export {SharesAllotment}