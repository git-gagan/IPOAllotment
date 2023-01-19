/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// Only backend Admin is expected to access this functionality

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../database/getUserId.js';

async function main() {
    /*
        This file will give the complete information of the whole ledger
        WARNING:- To be used only for testing as no one has the privilege
        to access the whole ledger
        This function can be called from any of the identities present in
        the wallet by passing the userName from command line
    */
    try {
        console.log(process.argv);
        let userName = process.argv[2]; 

        let user_promise = await getIdFromUsername(process.argv[2]);

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
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);

            if (isAuthUser) {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Evaluate the specified transaction.
                let result = await contract.evaluateTransaction('queryAll');
                if (result){
                    result = result.toString();
                    console.log(result);
                    console.log("\nSUCCESS\n");
                }
                else{
                    console.log(`Failed to get the results!`);
                }
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