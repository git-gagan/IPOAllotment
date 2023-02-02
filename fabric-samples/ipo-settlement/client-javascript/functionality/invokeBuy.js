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
import { insertBid } from '../database/insertBidtoDB.js';
import { dematFromDb, dematFromInvestorDB } from '../database/getDmatFromDB.js';
import { insertDmatIpo } from '../database/insertDmatIpo.js';
import { getIpoEligibleLots } from '../database/getIpoeligibility.js';
import { getInvestorInfo } from '../database/investorInfo.js';


async function main() {
    try {
        console.log(process.argv);
        let userName = process.argv[2];   // Take username from command line

        let user_promise = await getIdFromUsername(process.argv[2]);
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

        // Form inputs
        var ipo_id = "M1";
        var demat_ac_no = "NikDmat"; // NikDmat, GagDm, sd, ad :-> testing for 4 users
        let investor_info_db = await getInvestorInfo(user_id);
        function createInvestorObject(){
            /*
                This function creates an investor object during the buy process
                to be put to the ledger!
            */
            return {
                [user_id]: 
                        {
                        name: userName,
                        full_name: full_name,
                        investor_type_id: investor_info_db['investor_type'],
                        transactions: [
                                {
                                lots_bid: 3,
                                bid_amount: 100
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
                let lots_bid_valid = await is_lots_bid_valid(user_id, investor_obj, ipo_id);
                if (!lots_bid_valid){
                    console.log("---Failure---");
                    process.exit(1);
                }
                var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
                console.log("\n2")
                // Check if the investor is allowed to buy from the given demat
                let is_valid = await is_demat_valid_for_ipo(user_id,  ipo_id, demat_ac_no); 
                if (is_valid){
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
                        console.log("=============================================");
                        if (is_valid == -1){
                            console.log("Inserting investor-ipo-bid-dmat info");
                            let dmatDb = await insertDmatIpo(user_id, ipo_id, demat_ac_no);
                            console.log("=============================================");
                        }
                        console.log("\nSUCCESS\n");
                    }
                    else if (result == '-2'){
                        console.log(`Insufficient Wallet Balance!`);
                    }
                    else{
                        console.log("Invalid Bid amount!");
                    }
                }
                else{
                    console.log("Bidding not allowed with this DEMAT account no!");
                    console.log("FAILED!");
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

async function is_demat_valid_for_ipo(investor_id, ipo_id, demat_ac_no){
    // This function checks if there's a dmat already associated with this ipo
    // for this investor and if the demat is valid!
    let result = await dematFromInvestorDB(investor_id, demat_ac_no);
    console.log(result, "-------------------------");
    if (!result[0]){
        console.log(`Demat Account number ${demat_ac_no} does not exist!`);
        console.log("Please add this demat to your account before proceeding!")
        return 0;
    }
    let resultDB = await dematFromDb(investor_id, ipo_id);
    console.log(resultDB);
    if (!resultDB.length){
        console.log(`This is the first bid for ipo ${ipo_id} by investor ${investor_id}`);
        console.log("BUY allowed through the demat account:- "+demat_ac_no);
        return -1;
    }
    else{
        if (resultDB[0]['demat_ac_no'] != demat_ac_no){
            console.log("You are not allowed to bid on the same ipo with a different Dmat!!!");
            console.log(`Last used demat Account for this IPO is:- ${resultDB[0]['demat_ac_no']}`);
            return 0;
        }
    }
    return 1;
}

async function is_lots_bid_valid(investor_id, investor_obj, ipo_id){
    // To check if the lots which the investor of a particular type wants to bid
    // for this ipo are allowed or not and if the investor is even eligible to bid
    let eligible_lots_data = await getIpoEligibleLots(investor_id, ipo_id);
    let eligible_lots = null;
    try{
        eligible_lots = eligible_lots_data[0]['min_lot_qty'];
        console.log("========",eligible_lots,"========");
    }
    catch(error){
        console.log("No ipo eligibility info available for investor:- ", investor_id);
        return false;
    }   
    if (investor_obj[investor_id]['transactions'][0]['lots_bid'] < eligible_lots){
        console.log(`Bid not allowed!`);
        console.log("Investor is not allowed to bid with this quantity of lots!!!");
        console.log(`Please place a bid of atleast ${eligible_lots} lots`);
        return false;
    }
    console.log("Bidding allowed with this set of lots");
    return true;
}


main();