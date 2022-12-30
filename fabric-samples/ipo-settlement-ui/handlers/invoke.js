/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


// Don't INVOKE!

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

exports.invokeTransaction=async function(user,lotQuantity,bidperShare) {
    try {
        var queryResult = '';
    
        // Random fixed User object
        
        let userObj = {
            "userName": user,
            "stockToBuy": "share1",
            "lotQuantity": lotQuantity,
            "sharesBid": 0,
            "sharesAlloted": 0,
            "amountForBidding": 2000,
            "bidPerShare": bidperShare
        }
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(user);
        if (!identity) {
            console.log(`An identity for the user ${user} does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('ipo');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        // const result=await contract.submitTransaction('FnBuyShares', 'share1','2');
        // console.log('Transaction has been submitted');
        // queryResult = `Transaction has been evaluated, result is: ${result.toString()}`;
        let result = await contract.evaluateTransaction('isBidTimeOver')
            result = result.toString();
            console.log(result);
            if (result != "0" && result != "-1"){
                console.log("RESULT:- ", result, typeof(result));
                // Submit the specified transaction.
                console.log(`User information before the bid:- ${JSON.stringify(userObj)}\n`);
                userObj = await contract.submitTransaction('FnBuyShares', userObj["stockToBuy"],userObj["lotQuantity"] , JSON.stringify(userObj));
                console.log('Transaction has been submitted');
                console.log(`User information after the bid:- ${userObj}\n`);
                queryResult=`Bidding Details Submitted`;
                // queryResult=JSON.parse(userObj);
            }
            else{
                queryResult="Bidding hasn't started yet! Buy Not allowed!";
                console.log("Bidding hasn't started yet! Buy Not allowed!")
                // queryResult=JSON.parse("Bidding hasn't started yet! Buy Not allowed!")
            }
        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
    return queryResult;

}


