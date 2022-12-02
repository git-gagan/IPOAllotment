/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Ipo extends Contract {

    // Ipo class for shares settlement

    async initLedger(ctx) {
        console.info('============= START : Initialize Shares Ledger ===========');
        const shares = [
            // only one company is going for an IPO
            {
                ID:'share1',
                quantity: 500,
                company: 'Microsoft',
                lotSize: 10,
                priceRangeLow : 100,
                priceRangeHigh : 200,
                bidTime: 600 //seconds 
            },
        ];

      
        
        for (const asset of shares) {
            asset.docType = 'share';
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
        }
        console.info('============= END : Initialize Shares Ledger ===========');   
    }
   

    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The share ${id} does not exist`);
        }
        return assetJSON.toString();
    }


    async FnBuyShares(ctx,id,lotQuantity){
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldQuantity = asset.quantity;
        const lotSize=asset.lotSize;
        const newQuantity=oldQuantity-(lotSize*parseInt(lotQuantity));
        asset.quantity=newQuantity
        const updatedString = JSON.stringify(asset);
        console.log(updatedString);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
        
    }

    async counter(ctx,id,bidTime) {
        var i = parseInt(bidTime);
        const assetString = await this.ReadAsset(ctx, id);
        var asset = JSON.parse(assetString);
        setInterval(function() {
          if (i == 0) {
            clearInterval(this);
            
          }
          else{
            const newbidTime=i--;
            asset.bidTime=newbidTime; 
            console.info(JSON.stringify(asset))
           
          }
        }, 1000);

    //    await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    //    return JSON.stringify(asset);
      } // End
      

      async Allotment(ctx){
        console.info("Shares Alloted")
      }


}

module.exports = Ipo; //WARNING
