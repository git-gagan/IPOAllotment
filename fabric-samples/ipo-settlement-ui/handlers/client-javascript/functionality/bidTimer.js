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
import { updateTimers } from '../database/timerDB.js';

async function bidTimer(userName, start=null, close=null) {
    try {
        console.log(userName); 
        let user_promise = await getIdFromUsername(userName);
        console.log("USER promise:- ", user_promise);
        
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
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "IS") {
                let result = null;
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                try{
                    // Evaluate the specified transaction.
                    if (start){
                        console.log("Setting has_bidding_started to TRUE\n");
                        // result = 1;
                        result = await contract.submitTransaction('startBidding', user_id);
                        result = result.toString();
                        console.log(result);
                        if (result == "1"){
                            console.log("Bidding Started!");
                            let resDB = await updateTimers(user_id, true);
                            console.log("SUCCESS!");
                        }
                        else if (result == "0"){
                            console.log("Bidding Over!");
                        }
                        else{
                            console.log("Bidding Already Going on!");
                        }
                    }
                    else if (close){
                        console.log("Setting is_complete to TRUE\n");
                        result = await contract.submitTransaction('closeBidding', user_id);
                        result = result.toString();
                        console.log(result);
                        if (result == "1"){
                            console.log("Bidding Closed!");
                            let resDB = await updateTimers(user_id);
                            console.log("SUCCESS!");
                        }
                        else if (result == "0"){
                            console.log("Bidding is already Over!");
                        }
                        else{
                            console.log("Bidding hasn't started yet!");
                        }
                    }
                    else{
                        console.log("---NO CHANGE---\n")
                    }
                }
                catch (error){
                    console.log("Error Encountered while trying to start/close the bid:- ", error);
                }
                await gateway.disconnect();
                return true;
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
        return false;
    }
}

export { bidTimer };