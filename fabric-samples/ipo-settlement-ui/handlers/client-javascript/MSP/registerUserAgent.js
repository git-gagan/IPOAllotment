/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import FabricCAServices from 'fabric-ca-client';
import { Wallets } from 'fabric-network';
import fs from 'fs';
import path from 'path';

// const { Wallets } = require('fabric-network');
// const FabricCAServices = require('fabric-ca-client');
// const fs = require('fs');
// const path = require('path');

async function registerUserAgent() {
    try {
        // load the network configuration
        console.log(process.argv);
        const userName = "AG-" + process.argv[2];   // Take username from command line
        const __dirname = path.resolve(path.dirname(''));
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org3.example.com', 'connection-org3.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org3.example.com'].url;
        const ca = new FabricCAServices(caURL);
        
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(userName);
        if (userIdentity) {
            console.log(`An identity for the user ${userName} already exists in the wallet`);
            return;
        }
        
        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin-agent');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin-agent" does not exist in the wallet');
            console.log('Run the enrollAdminInvestor.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin-agent');
        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org3.department1',
            enrollmentID: userName,
            role: 'client'
        }, adminUser);
        console.log("----------------------")
        const enrollment = await ca.enroll({
            enrollmentID: userName,
            enrollmentSecret: secret
        });
        console.log("22222222222222222222222222")
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org3MSP',
            type: 'X.509',
        };
        await wallet.put(userName, x509Identity);
        console.log(`Successfully registered and enrolled admin user ${userName} and imported it into the wallet`);
    } catch (error) {
        console.error(`Failed to register the given user: ${error}`);
        process.exit(1);
    }
}

export {registerUserAgent}
