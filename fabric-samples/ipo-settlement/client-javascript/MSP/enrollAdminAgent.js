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


async function main() {
    try {
        // load the network configuration
        const __dirname = path.resolve(path.dirname(''));
        const ccpPath = path.resolve(__dirname, '..', '..', '..' , 'test-network', 'organizations', 'peerOrganizations', 'org3.example.com', 'connection-org3.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org3.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
        // console.log("CAAAAAAAAAAAAAAAAAAAAAAAAA",ca)

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin-agent');
        if (identity) {
            console.log('An identity for the admin user "admin-agent" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        console.log("-------------------------")
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        console.log("-------------------------")
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org3MSP',
            type: 'X.509',
        };
        await wallet.put('admin-agent', x509Identity);
        console.log('Successfully enrolled admin user "admin-agent" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin-agent": ${error}`);
        process.exit(1);
    }
}

main();
