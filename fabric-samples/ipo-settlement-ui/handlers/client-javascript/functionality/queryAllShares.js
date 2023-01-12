/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Gateway, Wallets } from 'fabric-network'
import path from 'path'
import fs from 'fs'


async function queryTransaction(userName) {
    try {
        var queryResult = '';
        var shares=[];
         // load the network configuration
         const ccpPath = path.resolve('..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
         let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
 
         // Create a new file system based wallet for managing identities.
         const walletPath = path.join(process.cwd(), 'wallet');
         const wallet = await Wallets.newFileSystemWallet(walletPath);
         console.log(`Wallet path: ${walletPath}`);
         const username="IN-"+userName;
         // Check to see if we've already enrolled the user.
         const identity = await wallet.get(username);
         if (!identity) {
             console.log(`An identity for the user ${username} does not exist in the wallet`);
             console.log('Run the registerUser.js application before retrying');
             return;
         }
 
         // Create a new gateway for connecting to our peer node.
         const gateway = new Gateway();
         await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });
 
         // Get the network (channel) our contract is deployed to.
         const network = await gateway.getNetwork('mychannel');
 
         // Get the contract from the network.
         const contract = network.getContract('ipo');

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction('queryAll');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // const isBidTimeOver = await contract.evaluateTransaction('isBidTimeOver');
        // console.log(`Remaining time for bidding: ${isBidTimeOver}`);
        // const start = await contract.evaluateTransaction('startBidding');
        // console.log(start.toString());
        // const start1 = await contract.evaluateTransaction('startBidding');
        // console.log(start1.toString());
        // const isBidTimeOver1 = await contract.evaluateTransaction('isBidTimeOver');
        // console.log(`Remaining time for bidding: ${isBidTimeOver1}`);
        // console.log("\nSUCCESS\n");
        // Disconnect from the gateway.
        queryResult = `Transaction has been evaluated, result is: ${result.toString()}`;
        shares=JSON.parse(result);
        await gateway.disconnect();
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        queryResult = `Failed to enroll admin user "admin": ${error}`;
        process.exit(1);
    }

    return shares;
}

export {queryTransaction}