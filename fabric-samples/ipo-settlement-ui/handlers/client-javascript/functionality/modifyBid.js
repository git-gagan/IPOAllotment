/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


// Don't INVOKE!

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../database/getUserId.js';
import { getIpoEligibleLots } from '../database/getIpoeligibility.js';
import { getBid,updateBidinDb } from '../database/editBidDb.js';
import {getIpoInfo} from "../database/getIpo.js"

async function modifyBid(username,txnid,lots_bid,bid_amount) {
    try {
        // console.log(process.argv);
        let userName = username;   // Take username from command line
        let txn_id = txnid;   // Get transaction_id from frontend
        let new_lots_bid = lots_bid;   // get new number of lots
        let new_bid_amount = bid_amount;   // get new bid amount

        console.log(txn_id, new_lots_bid, new_bid_amount);

        let user_promise = await getIdFromUsername(username);
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
                let res = await is_txn_valid(txn_id, user_id);
                let is_valid_transaction = res[0];
                let ipo_id = res[1];    // Should not be NULL if txn is valid
                let ipoInfo=await getIpoInfo(ipo_id)
                if(ipoInfo.is_complete=='false'){
                    let lots_bid_valid = await is_lots_bid_valid(user_id, new_lots_bid, ipo_id);
                if(!is_valid_transaction || !lots_bid_valid){
                    console.log("---Failure---");
                    process.exit(1);
                }
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Evaluate the specified transaction.
                const result = await contract.submitTransaction('updateBid', txn_id, user_id, ipo_id, new_lots_bid, new_bid_amount);
                console.log(`Transaction has been evaluated, result is: ${result}`);
                if (result == '0'){
                    console.log("Failure: Asset doesn't exist!");
                }
                else if (result == '1'){
                    console.log(`Bid updated Successfully by the user: ${userName}`);
                    // If Bid update is successful, update the information in tbl_investor_transactions
                    let bidDb = await updateBidinDb(txn_id, user_id, new_lots_bid, new_bid_amount);
                    console.log("=============================================");
                    console.log("\nSUCCESS\n");
                }
                else if (result == '-1'){
                    console.log(`Invalid bid amount`);
                }
                else{
                    console.log("Insufficient funds to place the bid");
                }
                await gateway.disconnect();
                }
                else{
                    console.log("Modify Bid Not Allowed!!")
                }
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

async function is_lots_bid_valid(investor_id, new_lots_bid, ipo_id){
    // To check if the lots which the investor of a particular type wants to bid
    // for this ipo are allowed or not and if the investor is even eligible to bid
    let eligible_lots_data = await getIpoEligibleLots(investor_id, ipo_id);
    let eligible_lots = null;
    try{
        eligible_lots = eligible_lots_data[0]['min_lot_qty'];
        console.log("========",eligible_lots,"========");
    }
    catch(error){
        console.log("No ipo eligibility info available for investor:- ", investor_id);
        return false;
    }   
    if (new_lots_bid < eligible_lots){
        console.log(`Bid not allowed!`);
        console.log("Investor is not allowed to bid with this quantity of lots!!!");
        console.log(`Please place a bid of atleast ${eligible_lots} lots`);
        return false;
    }
    console.log("Bidding allowed with this set of lots");
    return true;
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

export {modifyBid}