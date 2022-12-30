/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


// Don't INVOKE!

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../utils/getUserId.js';


async function invokeTransaction(username,lotQuantity,bidperShare) {
    try {
        console.log(process.argv);
        let userName = username;   // Take username from command line

        let user_promise = await getIdFromUsername(userName);
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

        function createInvestorObject(){
            /*
                This function creates an investor object during the buy process
                to be put to the ledger!
            */
            return {
                [user_id]: 
                        {
                        name: userName,
                        transaction: {
                            lots_bid: lotQuantity,
                            bid_amount: bidperShare
                        },
                        wallet: {
                            initial_wallet_balance: 1000, // 1000 for every user
                            wallet_balance_after_bid: null
                        }
                    }
            }
        }

        if(user_id){
            // Get the investor object
            var ipo_id = "M1";
            let investor_obj = createInvestorObject();
            console.log("\n", investor_obj);
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "IN") {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Evaluate the specified transaction.
                const result = await contract.submitTransaction('buyShares', user_id, JSON.stringify(investor_obj), ipo_id);
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
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

export {invokeTransaction}
