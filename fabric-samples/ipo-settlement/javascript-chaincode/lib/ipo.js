/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

var _global_investors_id = "global_user_info_confidential_";


class Ipo extends Contract {
    // Ipo class for shares settlement

    async initLedger(ctx) {
        // Initialize ledger state with the given information
        console.info('============= START : Initialize Shares Ledger ===========');
        const shares = [
            // Expected Initial Ledger State
            // No issuer/ No investor initially
            {
                ID: "global_user_info_confidential_",
                global_user_info_confidential_: {}
            },
        ]      

        for (const asset of shares) {
            if (asset.ID == "_global_user_info_confidential"){
                asset.docType = 'Investor-Info';
            }
            else{
                asset.docType = 'IPO-Info';
            }
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
        }
        console.log("Shares:- ",shares);
        console.info('============= END : Initialize Shares Ledger ===========');   
    }

    // Start and Close bidding functions

    async startBidding(ctx, user_id){
        /*
         The function takes an issuer id as user_id and starts the bidding for that
         particular IPO by changing the required flags 
        */
        let assetJSON = await this.queryIssuer(ctx, user_id); // get the asset from chaincode state
        assetJSON = JSON.parse(assetJSON);
        console.log(assetJSON, typeof(assetJSON));
        let ipo_info = assetJSON[user_id]['ipoInfo'];
        console.log(assetJSON[user_id]);
        console.log(ipo_info);
        if (!ipo_info.has_bidding_started && !ipo_info.is_complete){
            console.log(`--- Bidding Started for ${user_id} ---`);
            assetJSON[user_id]['ipoInfo']['has_bidding_started'] = true;
            await ctx.stub.putState(user_id, JSON.stringify(assetJSON));
            return 1;
        }
        else if (ipo_info.has_bidding_started && !ipo_info.is_complete){
            console.log(`Bidding Already Going on from ${ipo_info.bid_start_date}`);
            return -1;
        }
        else{
            console.log("--- Bidding is already Over! ---");
            return 0;
        }
    }

    async closeBidding(ctx, user_id){
        /*
         The function takes an issuer id as user_id and stops the bidding for that
         particular IPO by changing the required flags 
        */
        let assetJSON = await this.queryIssuer(ctx, user_id); // get the asset from chaincode state
        assetJSON = JSON.parse(assetJSON);
        console.log(assetJSON, typeof(assetJSON));
        let ipo_info = assetJSON[user_id]['ipoInfo'];
        console.log(assetJSON[user_id]);
        console.log(ipo_info);
        if (ipo_info.has_bidding_started && !ipo_info.is_complete){
            console.log(`--- Bidding Closed for ${user_id} ---`);
            assetJSON[user_id]['ipoInfo']['is_complete'] = true;
            await ctx.stub.putState(user_id, JSON.stringify(assetJSON));
            return 1;
        }
        else if (!ipo_info.has_bidding_started){
            console.log(`Bidding hasn't started yet for ${user_id}`);
            return -1;
        }
        else{
            console.log("--- Bidding is already Over! ---");
            return 0;
        }
    }

    // Buy/Allotment/Refund Functionality

    async buyShares(ctx, user_id, investor_obj, ipo_id){
        /*
            This buy shares functionality allows the investors to buy the ipo
            for the first time or maybe again by doing all the relevant checks
            and updating the ledger state by putting the modified asset
        */
        console.log("---Inside Buy Shares---");
        let asset = await this.queryIssuer(ctx, ipo_id);
        if (!asset){
            console.log("NOT ASSET:-", asset);
            return 0;
        }
        let assetJSON = JSON.parse(asset);
        let has_bidding_started = assetJSON[ipo_id]['ipoInfo']['has_bidding_started'];
        let is_complete = assetJSON[ipo_id]['ipoInfo']['is_complete'];
        if (has_bidding_started && !is_complete){
            console.log("\n---Bidding Allowed---\n")
            investor_obj = JSON.parse(investor_obj);
            console.log(investor_obj);
            let bid_amount = investor_obj[user_id]['transaction']['bid_amount'];
            let lots_bid = investor_obj[user_id]['transaction']['lots_bid'];
            let lot_size = assetJSON[ipo_id]['ipoInfo']['lot_size'];
            let total_size = assetJSON[ipo_id]['ipoInfo']['totalSize'];
            if (bid_amount < assetJSON[ipo_id]['ipoInfo']['priceRangeLow'] || bid_amount > assetJSON[ipo_id]['ipoInfo']['priceRangeHigh']){
                console.log("Your bidding amount is not in the expected range!");
                return -1;
            }
            let users_info = assetJSON[ipo_id]['userInfo'];
            console.log("Info of all the users:\n", users_info);
            if (user_id in users_info){
                console.log("Update needed!");
                investor_obj[user_id]['wallet']['wallet_balance_after_bid'] = assetJSON[ipo_id]['userInfo'][user_id][(assetJSON[ipo_id]['userInfo'][user_id]).length-1]['wallet']['wallet_balance_after_bid']-bid_amount*lots_bid*assetJSON[ipo_id]['ipoInfo']['lot_size'];
                if (investor_obj[user_id]['wallet']['wallet_balance_after_bid'] < 0){
                    console.log("Not enough balance in the wallet!");
                    return -1
                }  
                investor_obj[user_id]['shares']['bid'] = lots_bid + assetJSON[ipo_id]['userInfo'][user_id][(assetJSON[ipo_id]['userInfo'][user_id]).length-1]['shares']['bid'];
                assetJSON[ipo_id]['userInfo'][user_id].push(investor_obj[user_id]);
                console.log("Update set up!");
            }
            else{
                console.log("Insertion needed!");
                investor_obj[user_id]['wallet']['wallet_balance_after_bid'] = bid_amount*lots_bid*assetJSON[ipo_id]['ipoInfo']['lot_size'];
                investor_obj[user_id]['shares']['bid'] = lots_bid;
                assetJSON[ipo_id]['userInfo'][user_id] = [investor_obj[user_id]];
                assetJSON[ipo_id]['ipoInfo']['total_investors'] += 1;
                console.log("Insert set up!");
            }
            // Change in asset's ipoInfo
            console.log("----------------------")
            assetJSON[ipo_id]['ipoInfo']['total_bid'] += (lots_bid*lot_size);
            assetJSON[ipo_id]['ipoInfo']['balance'] = total_size-(assetJSON[ipo_id]['ipoInfo']['total_bid']);
            // Change in assets' escrow info
            console.log("=======================")
            assetJSON[ipo_id]['escrowInfo']['total_amount'] += bid_amount*lots_bid*assetJSON[ipo_id]['ipoInfo']['lot_size'];
            assetJSON[ipo_id]['escrowInfo']['last_transaction'] = `${bid_amount*lots_bid*assetJSON[ipo_id]['ipoInfo']['lot_size']} for IPO ${ipo_id} by user ${user_id}`;
            console.log("Ready to be put to ledger:- \n", assetJSON);
            await ctx.stub.putState(ipo_id, Buffer.from(JSON.stringify(assetJSON)));
            console.log("\nShares bought Successfully by the user\n");
            return 1;
        }
        return 0;
    }
      
    async allotShares(ctx, agent_id, ipo_id){
        /*
            The allotment functionality allots the shares to the investors &
            update the ledger depending upon the case of oversubscription or
            undersubscription.
        */
        console.log("--- Inside Allotment ---");
        let asset = await this.queryIssuer(ctx, ipo_id);
        let assetJSON = JSON.parse(asset);
        let has_bidding_started = assetJSON[ipo_id]['ipoInfo']['has_bidding_started'];
        let is_complete = assetJSON[ipo_id]['ipoInfo']['is_complete'];
        if (has_bidding_started && is_complete){
            let total_bid = assetJSON[ipo_id]['ipoInfo']['total_bid'];
            let total_size = assetJSON[ipo_id]['ipoInfo']['totalSize'];
            if (total_bid > total_size){
                console.log("\n--- OVERSUBSCRIPTION ---\n");
            }
            else{
                console.log("\n--- UNDERSUBSCRIPTION ---\n");
                assetJSON = this.allotUndersubscription(ipo_id, assetJSON);
            }
            console.log(assetJSON);
            await ctx.stub.putState(ipo_id, Buffer.from(JSON.stringify(assetJSON)));
            console.log("\n\n ----Alloted---- \n\n");
        }
        return 0;
    }

    allotUndersubscription(ipo_id, assetJSON){
        /*
            In this case, all the investors get all the shares they bid for and 
            the respective value transfer happen on all the accounts (no refund)
        */
        console.log("\nInside UNDERSUBSCRIPTION\n");
        assetJSON[ipo_id]['escrowInfo']['transfer_amount'] = assetJSON[ipo_id]['escrowInfo']['total_amount'];
        assetJSON[ipo_id]['escrowInfo']['total_amount'] = 0;
        assetJSON[ipo_id]['escrowInfo']['refund_amount'] = 0;
        assetJSON[ipo_id]['ipoInfo']['wallet_balance'] += assetJSON[ipo_id]['escrowInfo']['transfer_amount'];
        assetJSON[ipo_id]['ipoInfo']['total_allotted'] = assetJSON[ipo_id]['ipoInfo']['total_bid'];
        users_info = assetJSON[ipo_id]['userInfo'];
        return assetJSON;
    }

    // Adding Users here...

    async addIssuer(ctx, user_id, issuer_obj){
        /*
        This function receives an issuer object along with its user_id from the backend
        and put it onto the ledger
        */
        issuer_obj = JSON.parse(issuer_obj);
        console.log(issuer_obj, typeof(issuer_obj));
        issuer_obj.docType = 'IPO-Info';
        try{
            await ctx.stub.putState(user_id, Buffer.from(JSON.stringify(issuer_obj)));
            console.log("\n--- Issuer Updated Successfully ---\n");
            return true;
        }
        catch(err){
            console.log(err);
            console.log("\n--- Addition Failed ---\n");
            return false;
        }  
    }

    // Query Functions here...

    async queryIssuer(ctx, user_id) {
        /*
        An issuer can see all the data related to its ipo so we pass the user_id
        of the issuer and fetch the complete record for this unique issuer_id
        */
        const assetJSON = await ctx.stub.getState(user_id); // get the asset from chaincode state
        try{
            if (!assetJSON || assetJSON.length === 0) {
                throw new Error(`The share ${user_id} does not exist`);
            }
        }
        catch(err){
            console.log(err);
            console.log("---------------");
            return 0;
        }
        return assetJSON.toString();
    }

    async queryInvestor(ctx, user_id){
        /*
        An investor can only see his/her info so we iterate over all the ipo's to fetch
        investor specific information from each one of them
        */
        const startKey = '';
        const endKey = '';
        const investorResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            if (key == _global_investors_id){
                continue;
            }
            const strValue = Buffer.from(value).toString('utf8');
            console.log(key);
            let record;
            try {
                record = JSON.parse(strValue);
                console.log(record[key], record[`${key}`]);
                let investor_dictionary = record[key]['userInfo'];
                console.log(investor_dictionary);
                if (user_id in investor_dictionary){
                    var investor_info = investor_dictionary[user_id];
                    investor_info["personal"] = await this.getGlobalInvestorInfo(ctx, user_id);
                    console.log(investor_info);
                }
                else{
                    continue;
                }
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            investorResults.push({ Key: user_id, Record: investor_info });
        }
        console.info(investorResults);
        return JSON.stringify(investorResults);
    }

    async queryAgent(ctx, user_id){
        /*
        An agent can see complete information of all the issuers he is dealing with.
        So here, we loop and fetch the records where escrow_info_id is same as user_id
        */
        const startKey = '';
        const endKey = '';
        const agentResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            if (key == _global_investors_id){
                continue;
            }
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                let escrow_id = record[key]['escrowInfo']['agentId'];
                console.log("\n\n", escrow_id, "\n\n");
                if (escrow_id != user_id){
                    continue;
                }
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            agentResults.push({ Key: key, Record: record });
        }
        console.info(agentResults);
        return JSON.stringify(agentResults);
    }

    async queryAll(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    // Global investor information function (confidential)
    async getGlobalInvestorInfo(ctx, investor_id){
        /*
            This function gets the global investor confidential information like
            wallet from the ledger
        */
        const asset = await ctx.stub.getState(_global_investors_id);
        let assetJSON = JSON.parse(asset);
        console.log(assetJSON);
        if (investor_id in assetJSON[_global_investors_id]){
            let investor_info = assetJSON[_global_investors_id][investor_id];
            console.log(investor_info);
            return investor_info;
        }
        else{
            console.log(`${investor_id} does not exist in global investor info`);
            return 0;
        }
    }

}

module.exports = Ipo; 
