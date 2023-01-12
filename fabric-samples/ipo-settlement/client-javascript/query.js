/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');


async function main() {
    try {
        console.log(process.argv);
        const userName = "user-" + process.argv[2];   // Take username from command line
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        console.log("==========================================\n", ccpPath)
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        if (!identity) {
            console.log(`An identity for the user '${userName}' does not exist in the wallet`);
            console.log(`Run the registerUser.js ${userName} application before retrying`);
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('ipo');

        // Evaluate the specified transaction.
        // const result = await contract.evaluateTransaction('queryAllShares');
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        const isBidTimeOver = await contract.evaluateTransaction('isBidTimeOver');
        console.log(`Remaining time for bidding: ${isBidTimeOver}`);
        const start = await contract.evaluateTransaction('startBidding');
        console.log(start.toString());
        // const start1 = await contract.evaluateTransaction('startBidding');
        // console.log(start1.toString());
        const isBidTimeOver1 = await contract.evaluateTransaction('isBidTimeOver');
        console.log(`Remaining time for bidding: ${isBidTimeOver1}`);
        console.log("\nSUCCESS\n");
        // Disconnect from the gateway.
        await gateway.disconnect();
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();