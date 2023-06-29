/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
"use strict";
import { authorizeUser } from "../utils/userAuth.js";
import { retrieveContract } from "../utils/getContract.js";
import { getIdFromUsername } from "../database/getUserId.js";

async function query(username) {
    try {
        let userName = username;
        var queryResult = "";

        // console.log(process.argv);
        // let userName = process.argv[2];   // Take username from command line
        let user_promise = await getIdFromUsername(userName);
        console.log("USER ID:- ", user_promise);
        console.log("USER ID IAMHERE in QUERY");
        let user_id, role_id;
        if (user_promise) {
            user_id = user_promise["user_id"];
            role_id = user_promise["role_id"];
        } else {
            user_id = null;
            // user_id = 1;
            // role_id = 'IS';
        }

        console.log(user_id, role_id);
        if (user_id) {
            userName = role_id + "-" + userName;
            let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
            console.log("\n1, ");
            if (isAuthUser) {
                let function_call = "";
                if (role_id == "IN") {
                    function_call = "queryInvestor";
                } else if (role_id == "IS") {
                    function_call = "queryIssuer";
                } else if (role_id == "AG") {
                    function_call = "queryAgent";
                }
                var [contract, gateway] = await retrieveContract(
                    userName,
                    wallet,
                    ccp
                );
                // console.log(contract);
                console.log("\n2");
                // Evaluate the specified transaction.
                console.log("Function to be called:- ", function_call);
                console.log("Id calling the function:- ", user_id, userName);
                let result = await contract.evaluateTransaction(
                    function_call,
                    user_id
                );
                result = result.toString();
                if (result != "0") {
                    console.log(
                        `Transaction has been evaluated, result is: ${result}`
                    );
                    queryResult = JSON.parse(result);
                    console.log("\nSUCCESS\n");
                    return queryResult;
                } else {
                    console.log(
                        `The IPO with user_id ${user_id} does not exist!`
                    );
                    console.log("\nFAILED!\n");
                }
                await gateway.disconnect();
            } else {
                console.log("\n3");
                console.log("Unauthorized User!");
            }
        } else {
            console.log("This user doesn't exist!");
        }
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        // process.exit(1);
    }
}

export { query };
