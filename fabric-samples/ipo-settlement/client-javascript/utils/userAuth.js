/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Gateway, Wallets } from 'fabric-network';
import path from 'path';
import fs from 'fs';

// const { Gateway, Wallets } = require('fabric-network');
// const path = require('path');
// const fs = require('fs');

async function authorizeUser(userName) {
    try {
        console.log("Username:- ", userName);
        const __dirname = path.resolve(path.dirname(''));
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        console.log("==========================================\n")
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '../MSP/wallet');
        // console.log(walletPath);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(userName);
        // console.log(identity);
        if (!identity) {
            console.log(`An identity for the user '${userName}' does not exist in the wallet`);
            console.log(`Run the registerUser.js ${userName} application before retrying`);
            return [false, null, ccp];
        }
        else{
            console.log("---Valid User!---");
            return [true, wallet, ccp];
        }
        
    } catch (error) {
        console.error(`Failed to evaluate user: ${error}`);
        process.exit(1);
    }
}

export { authorizeUser };

