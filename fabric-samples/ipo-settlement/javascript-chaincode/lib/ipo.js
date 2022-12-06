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
            // only one company is going for an IPO
            {
                ID:'share1',
                sharesQuantity: 500,
                company: 'Microsoft',
                lotSize: 10,
                priceRangeLow : 100,
                priceRangeHigh : 200, 
                sharesBidded : 0,
                sharesSold : 0
            },
        ];

        for (const asset of shares) {
            asset.docType = 'share';
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
        }
        console.info('============= END : Initialize Shares Ledger ===========');   
    }

    async startBidding(ctx){
        console.log("\n\n\n\n\n\n", isBidding)
        if(!isBidding){
            bidStartDate = new Date();
            bidTime = 100; //Seconds
            bidStartTime = bidStartDate.toUTCString();
            let information = `Bidding started from ${bidStartDate}`;
            isBidding = true;
            isAlloted = false;
            return JSON.stringify(information);
        }
        let information = `Bidding already going on from ${bidStartDate}`;
        return JSON.stringify(information);
    }
   

    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The share ${id} does not exist`);
        }
        return assetJSON.toString();
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
        userObj["amountForBidding"] -= lotQuantity*lotSize*userObj["bidPerShare"];
        const updatedString = JSON.stringify(asset);
        console.log(updatedString);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        console.log(`${userObj['userName']} placed a successfull bid!\nUpdated ledger:- ${updatedString}`);
        return JSON.stringify(userObj);
    }

    async isBidTimeOver(ctx) {
        if (bidStartDate){
            const date = new Date();
            const currentDate = date.toUTCString();
            let timeDifference = Math.abs(date - bidStartDate)/1000 - bidTime;
            console.log(bidStartDate,"=-=-=-=-=-=-=-=-", date)
            if (timeDifference > 0){ 
                console.log("\n--------------------------");
                console.log("Bidding OVER!");
                // this.Allotment(ctx);
                isBidding = false;
                console.log("--------------------------\n");
                return JSON.stringify(0)
            }
            console.log("\n---Bidding GOING ON---\n");
            timeDifference = Math.abs(timeDifference)
            console.log("Time remaining", timeDifference);
            return JSON.stringify(timeDifference);
        }
        isBidding = false;
        return JSON.stringify(-1);
    }
      
    async Allotment(ctx, id, lotQuantity, userObj){
        if (!isAlloted){
            console.log(typeof(userObj), userObj);
            userObj = JSON.parse(userObj);
            const assetString = await this.ReadAsset(ctx, id);
            const asset = JSON.parse(assetString);
            asset.sharesSold += asset.sharesBidded/2;
            await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
            userObj["sharesAlloted"] += userObj["sharesBid"]/2;
            userObj["amountForBidding"] += (userObj["sharesBid"] - userObj["sharesAlloted"])*userObj["bidPerShare"];
            console.info("Shares Alloted");
            isAlloted = true;
            return JSON.stringify(userObj);
        }
        return false
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

module.exports = Ipo; //WARNING
