/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


// Don't INVOKE!

'use strict';

import { authorizeUser } from '../utils/userAuth.js';
import { retrieveContract } from '../utils/getContract.js';
import { getIdFromUsername } from '../database/getUserId.js';
import { dematToDb } from '../database/addDematToDB.js';


async function addDemat(username,dmat_ac_no,dp_id) {
    try {
        let userName=username;
        // console.log(process.argv);
        // let userName = process.argv[2];   // Take username from command line

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

        // Form data to be collected here for dmat update
        let dmat_obj = {
            "dmat_ac_no": dmat_ac_no,
            "dp_id": dp_id
        }

        if(user_id){
            // Get the investor object
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ")

            if (isAuthUser && role_id == "IN") {
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                let resultDb = await dematToDb(user_id, dmat_obj);
                console.log(resultDb);
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
        // process.exit(1);
    }
}

export{addDemat};