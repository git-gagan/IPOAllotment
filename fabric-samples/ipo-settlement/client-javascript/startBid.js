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
            let result = await contract.evaluateTransaction('isBidTimeOver')
            result = result.toString();
            console.log(result);
            const info = await contract.evaluateTransaction('startBidding');
            console.log(`${info.toString()}`);
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