/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


// Don't INVOKE!

'use strict';

import { authorizeUser } from '../userAuth.js';
import { performDBquery } from '../DBquery.js';
import { retrieveContract } from '../getContract.js';


async function main() {
    try {
        console.log(process.argv);
        const userName = "user-" + process.argv[2];

        // Random fixed User object
        let userObj = {
            "userName": userName,
            "stockToBuy": "share1",
            //"lotQuantity": 0,
            "sharesBid": 0,
            "sharesAlloted": 0,
            "walletBalance": 2000,
            "bidPerShare": 100
        }

        let [isAuthUser, wallet, ccp] = await authorizeUser(userName);
        console.log("\n1, ")

        if (isAuthUser){
            console.log("USER AUTH:- ", isAuthUser)
            var [contract, gateway] = await retrieveContract(userName, wallet, ccp);
            console.log("\n2")

            let result = await contract.evaluateTransaction('isBidTimeOver')
            result = result.toString();
            console.log(result);
            if (result != "0" && result != "-1"){
                console.log("RESULT:- ", result, typeof(result));
                // Submit the specified transaction.
                console.log(`User information before the bid:- ${JSON.stringify(userObj)}\n`);
                userObj = await contract.submitTransaction('FnBuyShares', userObj["stockToBuy"], 2, JSON.stringify(userObj));
                console.log('Transaction has been submitted');
                // Perform the DB operation
                //user_name text primary key,
                //    ...>     stock_name text,
                //    ...>     shares_bidded integer,
                //    ...>     shares_allotted integer,
                //    ...>     amount_for_bidding integer,
                //    ...>     bid_per_share integer);
                // let sql = `insert into ipo_users (user_name, stock_name, shares_bidded, shares_allotted, amount for bidding, bid_per_share)
                //                 Values(${userName}, ${userObj.stockToBuy}, ${userObj.sharesBid}, ${userObj.sharesAlloted}, ${userObj.amountForBidding}, ${userObj.bidPerShare})`;
                // let sql = `insert into ipo_users (user_name) values ('${userName}')`;
                // performDBquery(sql);
                console.log(`User information after the bid:- ${userObj}\n`);
            }
            else{
                console.log("Bidding hasn't started yet! Buy Not allowed!")
            }
            await gateway.disconnect();
        }
        else{
            console.log("\n3")
            console.log("Unauthorized User!");
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();


// // load the network configuration
// const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
// let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// // Create a new file system based wallet for managing identities.
// const walletPath = path.join(process.cwd(), 'wallet');
// const wallet = await Wallets.newFileSystemWallet(walletPath);
// console.log(`Wallet path: ${walletPath}`);

// // Check to see if we've already enrolled the user.
// const identity = await wallet.get(userName);
// if (!identity) {
//     console.log(`An identity for the user ${userName} does not exist in the wallet`);
//     console.log(`Run the registerUser.js ${userName} application before retrying`);
//     return;
// }

// // Create a new gateway for connecting to our peer node.
// const gateway = new Gateway();
// await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });

// // Get the network (channel) our contract is deployed to.
// const network = await gateway.getNetwork('mychannel');

// // Get the contract from the network.
// const contract = network.getContract('ipo');

// // Submit the specified transaction.
// console.log(`User information before the bid:- ${JSON.stringify(userObj)}\n`);
// userObj = await contract.submitTransaction('FnBuyShares', userObj["stockToBuy"], 2, JSON.stringify(userObj));

// console.log('Transaction has been submitted');
// console.log(`User information after the bid:- ${userObj}\n`);

// // Disconnect from the gateway.
// await gateway.disconnect();