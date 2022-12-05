/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { authorizeUser } from './userAuth.js';
import { retrieveContract } from './getContract.js';


async function main() {
    try {
        console.log(process.argv);
        const userName = "user-" + process.argv[2];   // Take username from command line

        let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
        console.log("\n1, ")

        if (isAuthUser){
            console.log("USER AUTH:- ", isAuthUser)
            var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
            console.log("\n2")
            // Evaluate the specified transaction.
            const result = await contract.evaluateTransaction('queryAllShares');
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            console.log("\nSUCCESS\n");
            await gateway.disconnect();
        }
        else{
            console.log("\n3")
            console.log("Unauthorized User!");
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
