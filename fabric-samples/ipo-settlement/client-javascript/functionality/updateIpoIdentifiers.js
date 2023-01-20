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
import { insertOrUpdateIpo } from '../database/ipoToDB.js';

async function main() {
    try {
        // get ISIN, CUSIP and TICKER from the issuer
        let issuer_obj = {
            "isin": "XYZ",
            "cusip": "QWERTY",
            "ticker": "MSFT"
        }

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

        if(user_id){
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "IS") {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // See if the info is already on the ledger or not
                let issuer_info = await contract.evaluateTransaction('queryIssuer', user_id);
                issuer_info = JSON.parse(issuer_info);
                console.log(issuer_info, typeof(issuer_info));
                if (issuer_info){
                    let cusip = issuer_info[user_id]['ipoInfo']['cusip'];
                    let isin = issuer_info[user_id]['ipoInfo']['isin'];
                    let ticker = issuer_info[user_id]['ipoInfo']['ticker'];
                    if (!(cusip && isin && ticker)){
                        console.log("You are allowed to update ONCE!");
                        // Update IPO info
                        try{
                            let ipoDb = await insertOrUpdateIpo(issuer_obj, user_id, true);
                            console.log("Issuer updated:- ", ipoDb);
                            console.log(ipoDb);
                            issuer_info[user_id]['ipoInfo']['cusip'] = issuer_obj.cusip;
                            issuer_info[user_id]['ipoInfo']['isin'] = issuer_obj.isin;
                            issuer_info[user_id]['ipoInfo']['ticker'] = issuer_obj.ticker;
                            issuer_info[user_id]['ipoInfo']['ipoModifiedTms'] = new Date();
                            // Evaluate the specified transaction.
                            const result = await contract.submitTransaction('addIssuer', user_id, JSON.stringify(issuer_info));
                            if (result){
                                console.log(`Issuer has been updated in the ledger!`);
                                console.log("\nSUCCESS\n");
                            }
                            else{
                                console.log(`Failed to add Issuer to the ledger!`);
                            }
                        }
                        catch (error){
                            console.log("Error Encountered while updating the IPO:-", error);
                        }
                    }
                    else{
                        console.log(`The cusip, isin and ticker for IPO: ${user_id} already EXISTS!!!`);
                        console.log("No further updates allowed!")
                    }
                }
                else{
                    console.log("Issuer doesn't exist!");
                    console.log("Please log your information to the ledger by launching the IPO");
                }
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
    } 
    catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();
