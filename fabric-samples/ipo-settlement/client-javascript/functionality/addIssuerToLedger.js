/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// Only ISSUER is expected to access this functionality

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../database/getUserId.js';
import { insertOrUpdateIpo, addIpoEligibility, addIpoBuckets } from '../database/ipoToDB.js';

async function main() {
    try {
        console.log(process.argv);
        let userName = process.argv[2]; 

        let user_promise = await getIdFromUsername(process.argv[2]);
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

        // Get allotment principle id from the form
        let allotment_principle = 2;

        // ipo investor eligibility information
        // To be taken from frontend
        let ipo_investor_eligibility_list = [
            // Assuming all type of investors (10) are allowed to bid
            {
                ipo_id: user_id,
                investor_type_id: 1,
                min_lot_qty: 2,
                reserve_lots: 5
            },
            {
                ipo_id: user_id,
                investor_type_id: 2,
                min_lot_qty: 3,
                reserve_lots: 4
            },
            {
                ipo_id: user_id,
                investor_type_id: 3,
                min_lot_qty: 1,
                reserve_lots: 3
            },
            {
                ipo_id: user_id,
                investor_type_id: 4,
                min_lot_qty: 5,
                reserve_lots: 1
            },
            {
                ipo_id: user_id,
                investor_type_id: 5,
                min_lot_qty: 5,
                reserve_lots: 2
            },
            {
                ipo_id: user_id,
                investor_type_id: 6,
                min_lot_qty: 5,
                reserve_lots: 2
            },
            {
                ipo_id: user_id,
                investor_type_id: 7,
                min_lot_qty: 2,
                reserve_lots: 2
            },
            {
                ipo_id: user_id,
                investor_type_id: 8,
                min_lot_qty: 1,
                reserve_lots: 1
            },
            {
                ipo_id: user_id,
                investor_type_id: 9,
                min_lot_qty: 1,
                reserve_lots: 0
            },
            {
                ipo_id: user_id,
                investor_type_id: 10,
                min_lot_qty: 3,
                reserve_lots: 0
            }
        ]

        let ipo_bucket_list = [
            {
                ipo_id: user_id,
                investor_type_id: 3,
                no_of_shares: 50,
                priority: 5,
                investor_id: 'Gol'
            },
            {
                ipo_id: user_id,
                investor_type_id: 4,
                no_of_shares: 100,
                priority: 2,
                investor_id: 'YC'
            },
            {
                ipo_id: user_id,
                investor_type_id: 5,
                no_of_shares: 20,
                priority: 1,
                investor_id: 'JP'
            },
            {
                ipo_id: user_id,
                investor_type_id: 6,
                no_of_shares: 100,
                priority: 6,
                investor_id: 'GS'
            }
        ]

        function createIssuerObject(){
            let ipobucketIds = [];
            for (let i in ipo_bucket_list){
                ipobucketIds.push(ipo_bucket_list[i]['investor_id']);
            }
            console.log(ipobucketIds);
            let today = new Date();
            let startDate = new Date(Date.now() + 100*10); // 1 min
            // Create the issuer object which will be passed to the smart contract to be put on the ledger
            return {
                ID: user_id,
                [user_id]: {
                    ipoInfo: {
                        issuer_name: userName,
                        issuer_fullname: full_name,
                        totalSize: 400,
                        priceRangeLow: 100,
                        priceRangeHigh: 200,
                        total_investors: 0,
                        total_bid: 0,
                        total_allotted: 0,
                        bid_start_date: startDate,
                        ipo_announcement_date: today,
                        total_bid_time: 600, // Seconds
                        is_complete: false,
                        lot_size: 20,
                        has_bidding_started: false,
                        balance: 0,
                        wallet_balance:0,
                        is_allotted: false,
                        ipoParticipants: ipobucketIds, 
                        ipoCreatedTms: today,
                        ipoModifiedTms: null,
                        ipoAllotedTms: null,
                        cusip: null,
                        isin: null,
                        ticker: null
                    },
                    escrowInfo: {
                        agentId:"AG-G",
                        agentName: "grow",
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
                // Insert IPO info to DB
                try{
                    let ipoDb = await insertOrUpdateIpo(issuer_obj, user_id, false, allotment_principle);
                    console.log("Issuer added to DB:- ", ipoDb);
                    let eligibilityDb = await addIpoEligibility(ipo_investor_eligibility_list);
                    console.log(eligibilityDb);
                    let bucketDb = await addIpoBuckets(ipo_bucket_list);
                    console.log(bucketDb);
                    // Evaluate the specified transaction.
                    const result = await contract.submitTransaction('addIssuer', user_id, JSON.stringify(issuer_obj));
                    if (result){
                        console.log(`Issuer has been added to the ledger!`);
                        console.log("\nSUCCESS\n");
                    }
                    else{
                        console.log(`Failed to add Issuer to the ledger!`);
                    }
                }
                catch (error){
                    console.log("Error Encountered while inserting to DB:-", error);
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