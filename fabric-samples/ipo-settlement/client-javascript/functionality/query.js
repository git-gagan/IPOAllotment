/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../utils/getUserId.js';


async function main() {
    try {
        console.log(process.argv);
        let userName = process.argv[2];   // Take username from command line

        let user_promise = await getIdFromUsername(process.argv[2]);
        console.log("USER ID:- ", user_promise);

        let user_id = user_promise['user_id'];
        let role_id = user_promise['role_id'];
        console.log(user_id, role_id)

        if(user_id){
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser) {
                let function_call = "";
                if (role_id == "IN"){
                    function_call = "queryInvestor";
                }
                else if (role_id == "IS"){
                    function_call = "queryIssuer";
                }
                else if (role_id == "AG"){
                    function_call = "queryAgent"
                }
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Evaluate the specified transaction.
                const result = await contract.evaluateTransaction(function_call, user_id);
                console.log(`Transaction has been evaluated, result is: ${result}`);
                console.log("\nSUCCESS\n");
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

// const isBidTimeOver = await contract.evaluateTransaction('isBidTimeOver');
// console.log(`Remaining time for bidding: ${isBidTimeOver}`);
// const start = await contract.evaluateTransaction('startBidding');
// console.log(start.toString());
// const start1 = await contract.evaluateTransaction('startBidding');
// console.log(start1.toString());
// const isBidTimeOver1 = await contract.evaluateTransaction('isBidTimeOver');
// console.log(`Remaining time for bidding: ${isBidTimeOver1}`);
// Disconnect from the gateway.

main();
