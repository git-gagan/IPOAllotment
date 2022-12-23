/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
var bidStartDate = null;
var bidTime = null; //seconds
var bidStartTime =  null;
var isBidding = false;
var isAlloted = false;

class Ipo extends Contract {

    // Ipo class for shares settlement
    async initLedger(ctx) {
        console.info('============= START : Initialize Shares Ledger ===========');
        const shares = [
            {
                ID : "M1",
                M1:{	
                    ipoInfo: {
                        issuer_name: "Microsoft",
                        totalSize: 500,
                        priceRangeLow: 100,
                        priceRangeHigh: 200,
                        total_investors: 0,
                        total_bid: 0,
                        total_allotted: 0,
                        bid_start_date: "",
                        ipo_announcement_date: "",
                        total_bid_time: 0,
                        is_complete: false,
                        has_bidding_started: false,
                        balance: 0,
                        wallet_ballence:0
                    },
                    escrowInfo:{
                        agentId:"AG-Ze",
                        total_amount:0,
                        last_transaction:"",
                        refund_amount:"",
                        transfer_amount:""
                    },
                    userInfo: {
                        G1: {
                            name: "Gagan",
                            transaction: {
                                lot_size: "",
                                lots_bid: 0,
                                bid_amount: 0
                            },
                            wallet: {
                                initial_wallet_balance: 0,
                                wallet_balance_after_bid: 0
                            }
                        }
                    }
                }
            }
        ]      

        for (const asset of shares) {
            asset.docType = 'IPO-Info';
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
        }
        console.info('============= END : Initialize Shares Ledger ===========');   
    }

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

    async FnBuyShares(ctx, id, lotQuantity, userObj){
        // let id = "share1" // Fixed
        console.log(typeof(userObj), userObj);
        userObj = JSON.parse(userObj);
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldQuantity = asset.sharesQuantity;
        const lotSize = asset.lotSize;
        const newQuantity = oldQuantity-(lotSize*parseInt(lotQuantity));
        asset.sharesQuantity = newQuantity;
        asset.sharesBidded += lotSize*parseInt(lotQuantity)
        userObj["sharesBid"] = lotQuantity*lotSize;
        console.log("==========",typeof(userObj), userObj,"=====");
        userObj["walletBalance"] -= lotQuantity*lotSize*userObj["bidPerShare"];
        const updatedString = JSON.stringify(asset);
        console.log(updatedString);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        console.log(`${userObj['userName']} placed a successfull bid!\nUpdated ledger:- ${updatedString}`);
        return JSON.stringify(userObj);
    }
      
    async Allotment(ctx, id, lotQuantity, userObj){
        console.log("\n\n ----Alloted---- \n\n")
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
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The share ${user_id} does not exist`);
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

    async queryAllShares(ctx) {
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

}

module.exports = Ipo; 
