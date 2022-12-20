/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Gateway, Wallets } from 'fabric-network';

async function retrieveContract(userName, wallet, ccp) {
    try {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('ipo');
        return [contract, gateway];
    }
    catch(error){
        console.error(`Failed to retrieve contract: ${error}`);
        process.exit(1);
    }
}

export { retrieveContract };



