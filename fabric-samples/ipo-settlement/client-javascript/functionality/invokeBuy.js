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
import { insertBid } from '../utils/insertBidtoDB.js';


async function main() {
    try {
        console.log(process.argv);
        let userName = process.argv[2];   // Take username from command line

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

        var ipo_id = "F1";
        function createInvestorObject(){
            /*
                This function creates an investor object during the buy process
                to be put to the ledger!
            */
            return {
                [user_id]: 
                        {
                        name: userName,
                        transactions: [
                                {
                                lots_bid: 1,
                                bid_amount: 10
                            }
                        ],
                        shares:{
                            bid: 5,
                            allotted: 0
                        },
                        total_invested: 0,
                        refund_amount: 0
                    }
            }
        }

        if(user_id){
            // Get the investor object
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
                if (result == '0'){
                    console.log("Bidding not allowed!");
                }
                else if (result == '1'){
                    console.log(`Shares bought Successfully by the user: ${userName}`);
                    // If Bid is successful, put the information in tbl_investor_transactions
                    let bidDb = await insertBid(investor_obj, user_id, ipo_id);
                    console.log(bidDb);
                }
                else if (result == '-2'){
                    console.log(`Insufficient Wallet Balance!`);
                }
                else{
                    console.log("Invalid Bid amount!");
                }
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

main();
