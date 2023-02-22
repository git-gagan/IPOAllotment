/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// Don't INVOKE!

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { getBid, deleteBidFromDb } from '../database/editBidDb.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../database/getUserId.js';

async function deleteBid(username,txnid) {
    try {
        // console.log(process.argv);
        // let userName = process.argv[2];   // Take username from command line
        let userName=username
        let txn_id = txnid;   // Get transaction_id from frontend

        let user_promise = await getIdFromUsername(userName);
        console.log("USER promise:- ", user_promise);

        let user_id, role_id, full_name;
        if (user_promise){
            user_id = user_promise['user_id'];
            role_id = user_promise['role_id'];
            full_name = user_promise['full_name'];
        }
        else{
            user_id = null;
        } 
        console.log(user_id, role_id, full_name)

        if(user_id){
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")
            if (isAuthUser && role_id == "IN") {
                // Check if txn_id even exists
                let res = await is_txn_valid(txn_id, user_id);
                let is_valid = res[0];
                let ipo_id = res[1];    // Should not be NULL if txn is valid
                if(!is_valid){
                    console.log("---Failure---");
                    process.exit(1);
                }
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                console.log(ipo_id);
                // Evaluate the specified transaction.
                const result = await contract.submitTransaction('deleteBid', txn_id, user_id, ipo_id);
                console.log(`Transaction has been evaluated, result is: ${result}`);
                if (result == "0"){
                    console.log("Not allowed as asset doesn't exist!")
                }
                else{
                    console.log("Bid Deleted Successfully");
                    await deleteBidFromDb(txn_id, user_id);
                }
                await gateway.disconnect();
            }
            else {
                console.log("\n3")
                console.log("Unauthorized User!");
            }
        }
        else{
            console.log("This user doesn't exist!");
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

async function is_txn_valid(txn_id, investor_id, ipo_id){
    // Check if the txn id exists for this investor or not
    let bid = await getBid(txn_id, investor_id);
    console.log("Bid:- ", bid);
    if (!bid.length){
        // If bid exists
        console.log("Bid with id", txn_id, "doesn't exist!");
        return [false, null]
    }
    return [true, bid[0]['ipo_id']];
}

export {deleteBid}