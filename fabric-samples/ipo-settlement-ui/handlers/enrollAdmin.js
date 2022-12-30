/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');


async function enroll(req, res) {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        const db = new sqlite3.Database('./user_database.db', (err) => {
            if (err) {
                console.error("Error opening database " + err.message);
            } else {
                const admin='admin'
                const adminpw='admin'
                db.get(`SELECT * FROM user where username = ? `, [admin], (err, row) => {
                    if (err) {
                    res.status(400).json({"error":err.message});
                    console.log(error.message);
                    return;
                }
                    else if(row){
                    console.log('admin already exist in database')
                    }
                    else{
                        let insert = 'INSERT INTO user (username, password) VALUES (?,?)';
                        try {
                            db.run(insert, [admin,adminpw]);
                    console.log('successfully registered admin!!')

                        
                        } catch (error) {
                            console.log(error.message);
                        }
                        
                        }
                    
                });
                        
        
                
            
                
            }
        });
        
        

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

enroll()