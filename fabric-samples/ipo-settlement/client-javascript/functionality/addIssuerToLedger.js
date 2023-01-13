/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// Only ISSUER is expected to access this functionality

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../utils/getUserId.js';

async function main() {
    try {
        console.log(process.argv);
        let userName = process.argv[2]; 

        let user_promise = await getIdFromUsername(process.argv[2]);
        console.log("USER promise:- ", user_promise);

        let user_id, role_id;
        if (user_promise){
            user_id = user_promise['user_id'];
            role_id = user_promise['role_id'];
        }
        else{
            user_id = null;
        }
        
        console.log(user_id, role_id)

        function createIssuerObject(){
            let today = new Date();
            let startDate = new Date(Date.now() + 100*10); // 1 min
            // Create the issuer object which will be passed to the smart contract to be put on the ledger
            return {
                ID: user_id,
                [user_id]: {
                    ipoInfo: {
                        issuer_name: userName,
                        totalSize: 1000,
                        priceRangeLow: 100,
                        priceRangeHigh: 200,
                        total_investors: 0,
                        total_bid: 0,
                        total_allotted: 0,
                        bid_start_date: startDate,
                        ipo_announcement_date: today,
                        total_bid_time: 60, // Seconds
                        is_complete: false,
                        lot_size: 100,
                        has_bidding_started: false,
                        balance: 0,
                        wallet_balance:0,
                        is_allotted: false
                    },
                    escrowInfo: {
                        agentId:"AG-G",
                        total_amount:0,
                        last_transaction:"",
                        refund_amount:"",
                        transfer_amount:""
                    },
                    userInfo: {}
                }
            }
        }

        if(user_id){
            // Get the issuer object
            let issuer_obj = createIssuerObject();
            console.log("\n", issuer_obj);
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "IS") {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Evaluate the specified transaction.
                const result = await contract.submitTransaction('addIssuer', user_id, JSON.stringify(issuer_obj));
                if (result){
                    console.log(`Issuer has been added to the ledger!`);
                    console.log("\nSUCCESS\n");
                }
                else{
                    console.log(`Failed to add Issuer to the ledger!`);
                }
                // console.log(issuer_obj[user_id]['ipoInfo']['bid_start_date'] - issuer_obj[user_id]['ipoInfo']['ipo_announcement_date'],"\n\n")
                let start_bidding = await startBid(contract, user_id, issuer_obj);
                console.log("================")
                // console.log(issuer_obj[user_id]['ipoInfo']['total_bid_time']*1000);
                let bid_time_over = await biddingOver(contract, user_id, issuer_obj);
                console.log("OVER")
                await gateway.disconnect();
                process.exit(1);
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
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();

// ----------- Low level Fix for timer ------------ //

async function biddingOver(contract, user_id, issuer_obj){
    var resPromise = new Promise(
        (resolve, reject) => {
            let result;
            setTimeout(
                async function(){
                    console.log("Setting is_complete to TRUE\n")
                    result = await contract.submitTransaction('closeBidding', user_id);
                    result = result.toString();
                    console.log(result);
                    if (result == "1"){
                        resolve("Bidding Closed!");
                    }
                    else if (result == "0"){
                        resolve("Bidding is already Over!");
                    }
                    else{
                        resolve("Bidding hasn't started yet!");
                    }
                },
                issuer_obj[user_id]['ipoInfo']['total_bid_time']*1000
            )
        }
    )
    return resPromise;
}

async function startBid(contract, user_id, issuer_obj){
    var resPromise = new Promise(
        (resolve, reject) =>{
            let result;
            setTimeout(
                async function(){
                    console.log("Setting has_bidding_started to TRUE\n")
                    result = await contract.submitTransaction('startBidding', user_id);
                    result = result.toString();
                    console.log(result);
                    if (result == "1"){
                        resolve("Bidding Started!");
                    }
                    else if (result == "0"){
                        resolve("Bidding Over!");
                    }
                    else{
                        resolve("Bidding Already Going on!");
                    }
                }
                , (issuer_obj[user_id]['ipoInfo']['bid_start_date'] - issuer_obj[user_id]['ipoInfo']['ipo_announcement_date'])
            )
        }
    )
    return resPromise;
}