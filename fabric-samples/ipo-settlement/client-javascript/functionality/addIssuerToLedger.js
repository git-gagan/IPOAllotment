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
        console.log("USER ID:- ", user_promise);

        let user_id = user_promise['user_id'];
        let role_id = user_promise['role_id'];
        console.log(user_id, role_id)

        function createIssuerObject(){
            // Create the issuer objet which will be passed to the smart contract to be put on the ledger
            return {
                ID: user_id,
                [user_id]: {
                    ipoInfo: {
                        issuer_name: userName,
                        totalSize: 500,
                        priceRangeLow: 100,
                        priceRangeHigh: 200,
                        total_investors: 0,
                        total_bid: 0,
                        total_allotted: 0,
                        bid_start_date: "",
                        ipo_announcement_date: "",
                        total_bid_time: 0,
                        is_complete: false,
                        balance: 0
                    },
                    escrowInfo: {},
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
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();