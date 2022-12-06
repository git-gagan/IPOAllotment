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

        // Random fixed User object
        let userObj = {
            "userName": userName,
            "stockToBuy": "share1",
            //"lotQuantity": 0,
            "sharesBid": 20,
            "sharesAlloted": 0,
            "amountForBidding": 0,
            "bidPerShare": 100
        }

        let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
        console.log("\n1, ")

        if (isAuthUser){
            console.log("USER AUTH:- ", isAuthUser)
            var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
            console.log("\n2")
            // Evaluate the specified transaction.
            let result = await contract.evaluateTransaction('isBidTimeOver')
            result = result.toString();
            console.log(result);
            if (result != "0"){
                console.log("Allotment cannot be made!");
            }
            else{
                console.log(`User information before the Allotment:- ${JSON.stringify(userObj)}\n`);
                userObj = await contract.submitTransaction('Allotment', userObj["stockToBuy"], 2, JSON.stringify(userObj))
                if(userObj != "false"){
                    console.log('Transaction has been submitted');
                    console.log(`User information after the allotment:- ${userObj}\n`);
                    console.log("\nSUCCESS\n");
                }
                else{
                    console.log("Allotment has been made already!")
                }
            }
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

main()