/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { getIdFromUsername } from '../database/getUserId.js';
import { getAllocationData, getAllocationPrinciple } from '../database/getAllocationDatafromDB.js';
import { processAllocationDictU, processAllocationDictO, processAllocationDictOR, getSubscriptionInfo } from '../utils/allocationLogic.js';
import { retrieveContract } from '../utils/getContract.js';


async function main() {
    try {
        console.log(process.argv);
        let userName = process.argv[2];   // Take username from command line

        let user_promise = await getIdFromUsername(process.argv[2]);
        console.log("USER ID:- ", user_promise);

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

        if(user_id){
            var ipo_id = "P1";
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "AG") {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Get ipo information
                let issuer_info = await contract.evaluateTransaction('queryIssuer', ipo_id);
                issuer_info = JSON.parse(issuer_info);
                console.log(issuer_info);
                if (!issuer_info){
                    console.log(`Issuer with ID ${ipo_id} does not exist!`);
                }
                else{
                    if (issuer_info[ipo_id]['escrowInfo']['agentId'] != user_id){
                        console.log("This Agent doesn't deal with this IPO.\nAllocation can't be made!")
                    }
                    else{
                        if (!issuer_info[ipo_id]['ipoInfo']['is_allotted']){
                            // Check for the subscription here for each investor_type
                            console.log("Fetching Subscription INFO: ");
                            let make_allotment = true;
                            let subInfo = await getSubscriptionInfo(issuer_info, ipo_id);
                            console.log(subInfo);
                            let status = subInfo[0];
                            let statusInfo = subInfo[1];
                            let totalSize = issuer_info[ipo_id]['ipoInfo']['totalSize'];
                            let lotSize = issuer_info[ipo_id]['ipoInfo']['lot_size'];
                            console.log(totalSize, lotSize);
                            // Query the current Db, create a processed dictionary to be passed to the smart contract for allocation
                            console.log("Fetching Allocation dictionary...\n");
                            var allocation_dict = await getAllocationData(ipo_id, totalSize, lotSize);
                            console.log(allocation_dict);
                            if (!allocation_dict.length || !status){
                                // No data in DB (status is null or transaction info is empty)
                                console.log(allocation_dict, status);
                                console.log("No data of investors!!!");
                                console.log("Allocation can't be made!");
                            }
                            else{
                                if (status == "U"){
                                    // A case of complete undersubscription
                                    // Investors get all they bid for at their price
                                    // No additional checks needed
                                    console.log("Processing Allocation dictionary...\n");
                                    allocation_dict = await processAllocationDictU(allocation_dict, lotSize, totalSize, ipo_id);
                                }
                                else if (status == "O"){
                                    // A case of complete oversubscription
                                    // Investors get shares on the basis of specified allotment principle
                                    let resultDB = await getAllocationPrinciple(ipo_id);
                                    console.log(resultDB);
                                    let allotment_principle = resultDB['allotment_principle'];
                                    let fixed_price = resultDB['fixed_price'];
                                    console.log("Allotment Princple ID:- ", allotment_principle);
                                    if (allotment_principle == 2 || allotment_principle == 3){
                                        // OverSubscription FIFO
                                        console.log("Processing Allocation dictionary...\n");
                                        allocation_dict = await processAllocationDictO(allocation_dict, lotSize, totalSize, ipo_id, statusInfo, allotment_principle);
                                    }
                                    else if (allotment_principle == 4 || allotment_principle == 5){
                                        // OverSubscription Ratio
                                        allocation_dict = await getAllocationData(ipo_id, totalSize, 1);
                                        console.log("New Allocation Dictionary:- ", allocation_dict);
                                        allocation_dict = await processAllocationDictOR(allocation_dict, lotSize, totalSize, ipo_id, statusInfo, allotment_principle, fixed_price);
                                    }
                                    else{
                                        // Should Never Happen
                                        make_allotment = false;
                                        console.log("Undefined allotment principle :- ", allotment_principle);
                                        console.log("Can't make allotment till oversubscrption principle is specified!!!");
                                    }
                                }
                                else{
                                    // A case of mixed allotment
                                    // Undersubscription and Oversubscription will be made accorindgly
                                }
                                console.log(allocation_dict);
                                if (make_allotment){
                                    // Evaluate the specified transaction.
                                    const result = await contract.submitTransaction('allotSharesNew', ipo_id, JSON.stringify(issuer_info), JSON.stringify(allocation_dict));
                                    console.log(`Transaction has been evaluated, result is: ${result}`);
                                    console.log("\nSUCCESS\n");
                                }
                            }
                        }
                        else{
                            console.log("Allotment Already made for ipo "+ipo_id);
                        }
                    }
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
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
