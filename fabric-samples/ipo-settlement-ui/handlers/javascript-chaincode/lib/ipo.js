/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Contract } = require("fabric-contract-api");

var _global_investors_id = "global_user_info_confidential_";

class Ipo extends Contract {
    // Ipo class for shares settlement

    async initLedger(ctx) {
        // Initialize ledger state with the given information
        console.info(
            "============= START : Initialize Shares Ledger ==========="
        );
        const shares = [
            // Expected Initial Ledger State
            // No issuer/ No investor initially
            {
                ID: "global_user_info_confidential_",
                global_user_info_confidential_: {},
            },
        ];

        for (const asset of shares) {
            if (asset.ID == _global_investors_id) {
                asset.docType = "Investor-Info";
            } else {
                asset.docType = "IPO-Info";
            }
            await ctx.stub.putState(
                asset.ID,
                Buffer.from(JSON.stringify(asset))
            );
        }
        console.log("Shares:- ", shares);
        console.info(
            "============= END : Initialize Shares Ledger ==========="
        );
    }

    // Start and Close bidding functions

    async startBidding(ctx, user_id) {
        /*
         The function takes an issuer id as user_id and starts the bidding for that
         particular IPO by changing the required flags 
        */
        let assetJSON = await this.queryIssuer(ctx, user_id); // get the asset from chaincode state
        assetJSON = JSON.parse(assetJSON);
        console.log(assetJSON, typeof assetJSON);
        let ipo_info = assetJSON[user_id]["ipoInfo"];
        console.log(assetJSON[user_id]);
        console.log(ipo_info);
        if (!ipo_info.has_bidding_started && !ipo_info.is_complete) {
            console.log(`--- Bidding Started for ${user_id} ---`);
            assetJSON[user_id]["ipoInfo"]["has_bidding_started"] = true;
            await ctx.stub.putState(user_id, JSON.stringify(assetJSON));
            return 1;
        } else if (ipo_info.has_bidding_started && !ipo_info.is_complete) {
            console.log(
                `Bidding Already Going on from ${ipo_info.bid_start_date}`
            );
            return -1;
        } else {
            console.log("--- Bidding is already Over! ---");
            return 0;
        }
    }

    async closeBidding(ctx, user_id) {
        /*
         The function takes an issuer id as user_id and stops the bidding for that
         particular IPO by changing the required flags 
        */
        let assetJSON = await this.queryIssuer(ctx, user_id); // get the asset from chaincode state
        assetJSON = JSON.parse(assetJSON);
        console.log(assetJSON, typeof assetJSON);
        let ipo_info = assetJSON[user_id]["ipoInfo"];
        console.log(assetJSON[user_id]);
        console.log(ipo_info);
        if (ipo_info.has_bidding_started && !ipo_info.is_complete) {
            console.log(`--- Bidding Closed for ${user_id} ---`);
            assetJSON[user_id]["ipoInfo"]["is_complete"] = true;
            await ctx.stub.putState(user_id, JSON.stringify(assetJSON));
            return 1;
        } else if (!ipo_info.has_bidding_started) {
            console.log(`Bidding hasn't started yet for ${user_id}`);
            return -1;
        } else {
            console.log("--- Bidding is already Over! ---");
            return 0;
        }
    }

    // Buy/Allotment/Refund Functionality

    async buyShares(ctx, user_id, investor_obj, ipo_id) {
        /*
            This buy shares functionality allows the investors to buy the ipo
            for the first time or maybe again by doing all the relevant checks
            and updating the ledger state by putting the modified asset
        */
        console.log("---Inside Buy Shares---");
        let asset = await this.queryIssuer(ctx, ipo_id);
        if (!asset) {
            console.log("NOT ASSET:-", asset);
            return 0;
        }
        let assetJSON = JSON.parse(asset);
        let has_bidding_started =
            assetJSON[ipo_id]["ipoInfo"]["has_bidding_started"];
        // assetJSON.ipo_id.ipoInfo.has_bidding_started.ID // . functionality
        let is_complete = assetJSON[ipo_id]["ipoInfo"]["is_complete"];
        if (has_bidding_started && !is_complete) {
            // If bidding has started but not over yet
            console.log("\n---Bidding Allowed---\n");
            investor_obj = JSON.parse(investor_obj);
            console.log(investor_obj);
            let bid_amount =
                investor_obj[user_id]["transactions"][0]["bid_amount"];
            let lots_bid = investor_obj[user_id]["transactions"][0]["lots_bid"];
            let lot_size = assetJSON[ipo_id]["ipoInfo"]["lot_size"];
            let total_size = assetJSON[ipo_id]["ipoInfo"]["totalSize"];
            let is_investor_global = null;
            if (
                bid_amount < assetJSON[ipo_id]["ipoInfo"]["priceRangeLow"] ||
                bid_amount > assetJSON[ipo_id]["ipoInfo"]["priceRangeHigh"]
            ) {
                // If the current bid_amount of the investor is either too low or too high
                console.log(
                    "Your bidding amount is not in the expected range!"
                );
                return -1;
            }
            // Get investor/user info from the ipo as well as from the global dictionary of investors
            let users_info = assetJSON[ipo_id]["userInfo"];
            let global_users_info_obj = await this.getGlobalInvestorInfo(ctx);
            console.log("Info of all the users:\n", users_info);
            console.log(
                "Global info of all the users:\n",
                global_users_info_obj
            );
            let current_balance = null;
            // Checking if the investor has earlier placed a bid globally in the system or not
            if (user_id in global_users_info_obj[_global_investors_id]) {
                current_balance =
                    global_users_info_obj[_global_investors_id][user_id][
                        "wallet"
                    ]["current_balance"];
                is_investor_global = true;
            } else {
                // No investor info globally
                console.log("No global info exists for the investor!");
                is_investor_global = false;
            }
            let temp_investor_obj = global_users_info_obj[_global_investors_id];
            if (!is_investor_global) {
                // If the investor does not exist globally, Create an investor object
                // And Append it to the global temp obj before further processing
                let new_investor_obj = this.createGlobalInvestorInfo(
                    investor_obj,
                    user_id
                );
                current_balance =
                    new_investor_obj[user_id]["wallet"]["current_balance"];
                temp_investor_obj[user_id] = new_investor_obj[user_id];
            }
            if (current_balance < bid_amount * lots_bid * lot_size) {
                console.log(
                    "Insufficient Wallet Balance. Please add more money to wallet before placing the bid!"
                );
                return -2;
            }
            console.log("Sufficient balance in wallet");
            // Check if the investor has already bid for the current ipo or not
            if (user_id in users_info) {
                console.log("Update needed!");
                assetJSON[ipo_id]["userInfo"][user_id]["total_invested"] +=
                    lots_bid * lot_size * bid_amount;
                assetJSON[ipo_id]["userInfo"][user_id]["shares"]["bid"] +=
                    lots_bid * lot_size;
                assetJSON[ipo_id]["userInfo"][user_id]["transactions"].push(
                    investor_obj[user_id]["transactions"][0]
                );
                // temp_investor_obj[user_id]['portfolio'][ipo_id]['avg_price_per_share'] = this.getAveragePricePerShare(assetJSON[ipo_id]['userInfo'][user_id]['transactions'], lot_size);
                console.log("Update set up!");
            } else {
                console.log("Insertion needed!");
                // investor_obj[user_id]['wallet']['current_balance'] = temp_investor_obj[user_id]['wallet']['current_balance'] - bid_amount*lots_bid*assetJSON[ipo_id]['ipoInfo']['lot_size'];
                investor_obj[user_id]["shares"]["bid"] = lots_bid * lot_size;
                investor_obj[user_id]["total_invested"] =
                    lots_bid * lot_size * bid_amount;
                assetJSON[ipo_id]["userInfo"][user_id] = investor_obj[user_id];
                assetJSON[ipo_id]["ipoInfo"]["total_investors"] += 1;
                // temp_investor_obj[user_id]['portfolio'][ipo_id] = {};
                // temp_investor_obj[user_id]['portfolio'][ipo_id]["avg_price_per_share"] = investor_obj[user_id]['transactions'][0]['bid_amount'];
                // temp_investor_obj[user_id]['portfolio'][ipo_id]["totalShares"] = 0;
                // temp_investor_obj[user_id]['portfolio'][ipo_id]["totalValue"] = 0;
                console.log("Insert set up!");
            }
            // Change in global investorInfo
            temp_investor_obj[user_id]["wallet"]["current_balance"] -=
                bid_amount *
                lots_bid *
                assetJSON[ipo_id]["ipoInfo"]["lot_size"];
            global_users_info_obj[_global_investors_id] = temp_investor_obj;
            console.log(temp_investor_obj);
            console.log(global_users_info_obj);
            console.log("----------------------");
            // Change in asset's ipoInfo
            assetJSON[ipo_id]["ipoInfo"]["total_bid"] += lots_bid * lot_size;
            assetJSON[ipo_id]["ipoInfo"]["balance"] =
                total_size - assetJSON[ipo_id]["ipoInfo"]["total_bid"];
            // Change in assets' escrow info
            console.log("=======================");
            assetJSON[ipo_id]["escrowInfo"]["total_amount"] +=
                bid_amount *
                lots_bid *
                assetJSON[ipo_id]["ipoInfo"]["lot_size"];
            assetJSON[ipo_id]["escrowInfo"]["last_transaction"] = `${
                bid_amount * lots_bid * assetJSON[ipo_id]["ipoInfo"]["lot_size"]
            } for IPO ${ipo_id} by user ${user_id}`;
            console.log("\nReady to be put to ledger:- \n", assetJSON);
            await ctx.stub.putState(
                ipo_id,
                Buffer.from(JSON.stringify(assetJSON))
            );
            console.log("\nInvestor info updated for the IPO!!!");
            await ctx.stub.putState(
                _global_investors_id,
                Buffer.from(JSON.stringify(global_users_info_obj))
            );
            console.log("\nGlobal investor info updated!!!");
            console.log("\nShares bought Successfully by the user\n");
            return 1;
        }
        return 0;
    }

    async allotShares(ctx, ipo_id, issuer_info, allocation_dict) {
        /*
            The allotment functionality allots the shares to the investors &
            update the ledger depending upon the case of oversubscription or
            undersubscription. It receives a processed dictionary from the nodejs
            backend and using that dictionary updates the ledger.
        */
        console.log("--- Inside Allotment ---");
        // let asset = await this.queryIssuer(ctx, ipo_id);
        let asset = issuer_info;
        let assetJSON = JSON.parse(asset);
        let allocation_info = JSON.parse(allocation_dict);
        let has_bidding_started =
            assetJSON[ipo_id]["ipoInfo"]["has_bidding_started"];
        let is_complete = assetJSON[ipo_id]["ipoInfo"]["is_complete"];
        if (has_bidding_started && is_complete) {
            let global_investor_info = await this.getGlobalInvestorInfo(ctx);
            console.log("-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-=");
            console.log(global_investor_info);
            let total_bid = assetJSON[ipo_id]["ipoInfo"]["total_bid"];
            let total_size = assetJSON[ipo_id]["ipoInfo"]["totalSize"];
            let is_oversubscribed = null;
            if (total_bid > total_size) {
                console.log("\n--- OVERSUBSCRIPTION ---\n");
                is_oversubscribed = true;
            } else {
                is_oversubscribed = false;
                console.log("\n--- UNDERSUBSCRIPTION ---\n");
            }
            assetJSON = this.makeAllotment(
                ipo_id,
                assetJSON,
                allocation_info,
                is_oversubscribed
            );
            for (let key in global_investor_info[_global_investors_id]) {
                // Updating global investor information
                console.log(key);
                console.log(global_investor_info[_global_investors_id]);
                if (!(key in assetJSON[ipo_id]["userInfo"])) {
                    // If investor hasn't bid for this ipo, no need to update global information
                    console.log("Investor hasn't bid for this IPO: ", {
                        ipo_id,
                    });
                    continue;
                } else if (!(key in allocation_info["investorInfo"])) {
                    // Investor bid for the IPO but didn't get it allotted, So initiate refund!
                    console.log("Investor hasn't been allotted this IPO!");
                } else {
                    // Investor bidded and got allotted
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id] = {};
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["ipo_name"] =
                        assetJSON[ipo_id]["ipoInfo"]["issuer_fullname"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["issuer_username"] =
                        assetJSON[ipo_id]["ipoInfo"]["issuer_name"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["avg_price_per_share"] =
                        allocation_info["investorInfo"][key][
                            "amount_invested"
                        ] /
                        allocation_info["investorInfo"][key]["shares_allotted"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["totalShares"] =
                        allocation_info["investorInfo"][key]["shares_allotted"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["totalValue"] =
                        allocation_info["investorInfo"][key]["amount_invested"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["demat_account"] =
                        allocation_info["investorInfo"][key]["demat_account"];
                }
                if (is_oversubscribed) {
                    console.log("refund initiated");
                    global_investor_info[_global_investors_id][key]["wallet"][
                        "current_balance"
                    ] += assetJSON[ipo_id]["userInfo"][key]["refund_amount"];
                    global_investor_info[_global_investors_id][key]["wallet"][
                        "refund_amount"
                    ] += `->${assetJSON[ipo_id]["userInfo"][key]["refund_amount"]} refunded for ipo ${ipo_id}`;
                }
            }
            console.log(assetJSON);
            await ctx.stub.putState(
                ipo_id,
                Buffer.from(JSON.stringify(assetJSON))
            );
            console.log("\n\n ----Alloted---- \n\n");
            // Update global investor information
            console.log(global_investor_info);
            await ctx.stub.putState(
                _global_investors_id,
                Buffer.from(JSON.stringify(global_investor_info))
            );
            console.log("\nGlobal investor info updated!!!");
            return 1;
        }
        return 0;
    }

    makeAllotment(ipo_id, assetJSON, allocation_info, is_oversubscribed) {
        /*
            Here, we are creating a global ledger object using allocation_info
            which will replace the current ledger info for all cases of subscription
        */
        console.log("\n---Making Allotment---\n");
        if (is_oversubscribed) {
            console.log("OVERSUBSCRIBED");
            assetJSON[ipo_id]["escrowInfo"]["refund_amount"] =
                assetJSON[ipo_id]["escrowInfo"]["total_amount"] -
                allocation_info["totalAmount"];
            assetJSON[ipo_id]["escrowInfo"]["transfer_amount"] =
                allocation_info["totalAmount"];
            // assetJSON[ipo_id]['ipoInfo']['total_allotted'] = assetJSON[ipo_id]['ipoInfo']['totalSize'];
            assetJSON[ipo_id]["ipoInfo"]["total_allotted"] =
                allocation_info["totalShares"];
        } else {
            console.log("UNDERSUBSCRIBED");
            assetJSON[ipo_id]["escrowInfo"]["refund_amount"] = 0;
            assetJSON[ipo_id]["escrowInfo"]["transfer_amount"] =
                assetJSON[ipo_id]["escrowInfo"]["total_amount"];
            assetJSON[ipo_id]["ipoInfo"]["total_allotted"] =
                assetJSON[ipo_id]["ipoInfo"]["total_bid"];
        }
        assetJSON[ipo_id]["escrowInfo"]["total_amount"] = 0;
        assetJSON[ipo_id]["ipoInfo"]["balance"] =
            assetJSON[ipo_id]["ipoInfo"]["totalSize"] -
            assetJSON[ipo_id]["ipoInfo"]["total_allotted"];
        assetJSON[ipo_id]["ipoInfo"]["wallet_balance"] +=
            assetJSON[ipo_id]["escrowInfo"]["transfer_amount"];
        assetJSON[ipo_id]["ipoInfo"]["is_allotted"] = true;
        // Now update each invester's info
        let users_info = assetJSON[ipo_id]["userInfo"];
        console.log(users_info);
        for (let key in users_info) {
            console.log("KEY:- ", key);
            console.log(assetJSON[ipo_id]["userInfo"][key]);
            if (key in allocation_info["investorInfo"]) {
                assetJSON[ipo_id]["userInfo"][key]["shares"]["allotted"] =
                    allocation_info["investorInfo"][key]["shares_allotted"];
                if (is_oversubscribed) {
                    console.log("Putting Refund amount of each investor");
                    assetJSON[ipo_id]["userInfo"][key]["refund_amount"] =
                        assetJSON[ipo_id]["userInfo"][key]["total_invested"] -
                        allocation_info["investorInfo"][key]["amount_invested"];
                }
            } else {
                // Case of oversubscription where this investor got nothing!
                assetJSON[ipo_id]["userInfo"][key]["shares"]["allotted"] = 0;
                console.log("Refunding full Amount to the user");
                assetJSON[ipo_id]["userInfo"][key]["refund_amount"] =
                    assetJSON[ipo_id]["userInfo"][key]["total_invested"];
            }
        }
        return assetJSON;
    }

    // Adding Users here...

    async addIssuer(ctx, user_id, issuer_obj) {
        /*
        This function receives an issuer object along with its user_id from the backend
        and put it onto the ledger
        */
        issuer_obj = JSON.parse(issuer_obj);
        console.log(issuer_obj, typeof issuer_obj);
        issuer_obj.docType = "IPO-Info";
        try {
            await ctx.stub.putState(
                user_id,
                Buffer.from(JSON.stringify(issuer_obj))
            );
            console.log("\n--- Issuer Updated Successfully ---\n");
            return true;
        } catch (err) {
            console.log(err);
            console.log("\n--- Addition Failed ---\n");
            return false;
        }
    }

    // Query Functions here...

    async queryIssuer(ctx, user_id) {
        /*
        An issuer can see all the data related to its ipo so we pass the user_id
        of the issuer and fetch the complete record for this unique issuer_id
        */
        const assetJSON = await ctx.stub.getState(user_id); // get the asset from chaincode state
        try {
            if (!assetJSON || assetJSON.length === 0) {
                throw new Error(`The share ${user_id} does not exist`);
            }
        } catch (err) {
            console.log(err);
            console.log("---------------");
            return 0;
        }
        return assetJSON.toString();
    }

    async queryInvestor(ctx, user_id) {
        /*
        An investor can only see his/her info so we iterate over all the ipo's to fetch
        investor specific information from each one of them
        */
        const startKey = "";
        const endKey = "";
        const investorResults = [];
        var investor_info = {};
        for await (const { key, value } of ctx.stub.getStateByRange(
            startKey,
            endKey
        )) {
            if (key == _global_investors_id) {
                continue;
            }
            const strValue = Buffer.from(value).toString("utf8");
            console.log(key);
            let record;
            try {
                record = JSON.parse(strValue);
                console.log(record[key], record[`${key}`]);
                let investor_dictionary = record[key]["userInfo"];
                console.log(investor_dictionary);
                if (user_id in investor_dictionary) {
                    investor_info = investor_dictionary[user_id];
                    investor_info["ipo"] = key;
                    console.log(investor_info);
                } else {
                    continue;
                }
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            investorResults.push({ Key: user_id, Record: investor_info });
        }
        let personal_info_investor = await this.getGlobalInvestorInfo(
            ctx,
            user_id
        );
        investorResults.push({ Key: user_id, Record: personal_info_investor });
        console.info(investorResults);
        return JSON.stringify(investorResults);
    }

    async queryAgent(ctx, user_id) {
        /*
        An agent can see complete information of all the issuers he is dealing with.
        So here, we loop and fetch the records where escrow_info_id is same as user_id
        */
        const startKey = "";
        const endKey = "";
        const agentResults = [];
        for await (const { key, value } of ctx.stub.getStateByRange(
            startKey,
            endKey
        )) {
            if (key == _global_investors_id) {
                continue;
            }
            const strValue = Buffer.from(value).toString("utf8");
            let record;
            try {
                record = JSON.parse(strValue);
                let escrow_id = record[key]["escrowInfo"]["agentId"];
                console.log("\n\n", escrow_id, "\n\n");
                if (escrow_id != user_id) {
                    continue;
                }
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            agentResults.push({ Key: key, Record: record });
        }
        console.info(agentResults);
        return JSON.stringify(agentResults);
    }

    async queryAll(ctx) {
        const startKey = "";
        const endKey = "";
        const allResults = [];
        for await (const { key, value } of ctx.stub.getStateByRange(
            startKey,
            endKey
        )) {
            const strValue = Buffer.from(value).toString("utf8");
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async deleteBid(ctx, txn_id, investor_id, ipo_id) {
        /*
            This function takes the transaction id of the ipo 
            and deletes that txn
        */
        console.log("---Inside Delete Transaction---");
        let asset = await this.queryIssuer(ctx, ipo_id);
        if (!asset) {
            console.log("NOT ASSET:-", asset);
            return 0;
        }
        asset = JSON.parse(asset);
        let lots_bid = 0;
        let bid_amount = 0;
        let lot_size = asset[ipo_id]["ipoInfo"]["lot_size"];
        let transactions_array =
            asset[ipo_id]["userInfo"][investor_id]["transactions"];
        for (let i in transactions_array) {
            // iterate over each txn in the transactions and find the given txn
            if (transactions_array[i]["txn_id"] == txn_id) {
                lots_bid = transactions_array[i]["lots_bid"];
                bid_amount = transactions_array[i]["bid_amount"];
                transactions_array.splice(i, 1);
                break;
            }
        }
        asset[ipo_id]["ipoInfo"]["balance"] += lots_bid * lot_size;
        asset[ipo_id]["ipoInfo"]["total_bid"] -= lots_bid * lot_size;
        asset[ipo_id]["userInfo"][investor_id]["transactions"] =
            transactions_array;
        asset[ipo_id]["userInfo"][investor_id]["shares"]["bid"] -=
            lots_bid * lot_size;
        asset[ipo_id]["escrowInfo"]["refund_amount"] +=
            lots_bid * lot_size * bid_amount;
        asset[ipo_id]["escrowInfo"]["total_amount"] -=
            lots_bid * lot_size * bid_amount;
        console.log("New Asset:- \n", asset);
        await ctx.stub.putState(ipo_id, Buffer.from(JSON.stringify(asset)));
        console.log("---Success---");
        return 1;
    }

    async updateBid(
        ctx,
        txn_id,
        investor_id,
        ipo_id,
        new_lots_bid,
        new_bid_amount
    ) {
        /*
            This function takes the transaction id and new bid 
            of the investor for the ipo and updates the ledger
        */
        console.log("---Inside Modify Transaction---");
        let asset = await this.queryIssuer(ctx, ipo_id);
        if (!asset) {
            console.log("NOT ASSET:-", asset);
            return 0;
        }
        asset = JSON.parse(asset);
        let lots_bid = 0; // Final no of lots
        let bid_amount = 0; // Final bid amount
        let old_lots_bid = 0;
        let old_bid_amount = 0;
        let lot_size = asset[ipo_id]["ipoInfo"]["lot_size"];
        let transactions_array =
            asset[ipo_id]["userInfo"][investor_id]["transactions"];
        let transaction_index = null;
        for (let i in transactions_array) {
            // iterate over each txn in the transactions and find the given txn
            if (transactions_array[i]["txn_id"] == txn_id) {
                console.log("Matched at index:", i);
                old_lots_bid = transactions_array[i]["lots_bid"];
                old_bid_amount = transactions_array[i]["bid_amount"];
                transaction_index = i;
                break;
            }
        }
        // Check if new bid_amount is allowed
        if (
            new_bid_amount < asset[ipo_id]["ipoInfo"]["priceRangeLow"] ||
            bid_amount > asset[ipo_id]["ipoInfo"]["priceRangeHigh"]
        ) {
            // If the current bid_amount of the investor is either too low or too high
            console.log("Your bidding amount is not in the expected range!");
            return -1;
        }
        let previous_investment = old_bid_amount * old_lots_bid * lot_size;
        let new_investment = new_bid_amount * new_lots_bid * lot_size;
        let investment_diff = previous_investment - new_investment;
        console.log("Investment Difference:-", investment_diff);
        if (investment_diff >= 0) {
            // if new bid amount is less than old one
            // investor has ample money and can make a bid
            asset[ipo_id]["escrowInfo"]["refund_amount"] += investment_diff;
            asset[ipo_id]["escrowInfo"]["total_amount"] -= investment_diff;
            asset[ipo_id]["userInfo"][investor_id]["total_invested"] -=
                investment_diff;
            asset[ipo_id]["userInfo"][investor_id]["refund_amount"] +=
                investment_diff;
        } else {
            // Check if investor has got funds to place this bid
            let global_investors_info = await this.getGlobalInvestorInfo(ctx);
            console.log("Investor INFO:- ", global_investors_info);
            let current_balance =
                global_investors_info[_global_investors_id][investor_id][
                    "wallet"
                ]["current_balance"];
            if (investment_diff > current_balance) {
                console.log("Not Sufficient Funds to increment the Bid");
                return -2;
            }
            asset[ipo_id]["escrowInfo"]["total_amount"] += -1 * investment_diff;
            asset[ipo_id]["userInfo"][investor_id]["total_invested"] +=
                -1 * investment_diff;
            global_investors_info[_global_investors_id][investor_id]["wallet"][
                "current_balance"
            ] -= -1 * investment_diff;
            console.log("Updating global investor info now");
            await ctx.stub.putState(
                _global_investors_id,
                Buffer.from(JSON.stringify(global_investors_info))
            );
            console.log("\nGlobal investor info updated!!!");
        }
        lots_bid = new_lots_bid;
        bid_amount = new_bid_amount;
        console.log("Updating IPO bid info");
        if (new_lots_bid > old_lots_bid) {
            asset[ipo_id]["ipoInfo"]["balance"] -=
                (new_lots_bid - old_lots_bid) * lot_size;
            asset[ipo_id]["ipoInfo"]["total_bid"] +=
                (new_lots_bid - old_lots_bid) * lot_size;
            asset[ipo_id]["userInfo"][investor_id]["shares"]["bid"] +=
                (new_lots_bid - old_lots_bid) * lot_size;
        } else {
            asset[ipo_id]["ipoInfo"]["balance"] +=
                (old_lots_bid - new_lots_bid) * lot_size;
            asset[ipo_id]["ipoInfo"]["total_bid"] -=
                (old_lots_bid - new_lots_bid) * lot_size;
            asset[ipo_id]["userInfo"][investor_id]["shares"]["bid"] -=
                (old_lots_bid - new_lots_bid) * lot_size;
        }
        console.log("Updating transactions Array");
        console.log("Old transactions Array: ", transactions_array);
        console.log("Transaction Index:- ", transaction_index);
        transactions_array[transaction_index]["lots_bid"] = lots_bid;
        transactions_array[transaction_index]["bid_amount"] = bid_amount;
        asset[ipo_id]["userInfo"][investor_id]["transactions"] =
            transactions_array;
        console.log("New Asset:- \n", asset);
        await ctx.stub.putState(ipo_id, Buffer.from(JSON.stringify(asset)));
        console.log("---Successfully updated ASSET---");
        return 1;
    }

    // Global investor information function (confidential)
    async getGlobalInvestorInfo(ctx, investor_id = -1) {
        /*
            This function gets the global investor confidential information like
            wallet from the ledger
        */
        const asset = await ctx.stub.getState(_global_investors_id);
        let assetJSON = JSON.parse(asset);
        console.log(assetJSON);
        if (investor_id == -1) {
            return assetJSON;
        }
        if (investor_id in assetJSON[_global_investors_id]) {
            let investor_info = assetJSON[_global_investors_id][investor_id];
            console.log(investor_info);
            return investor_info;
        } else {
            console.log(
                `${investor_id} does not exist in global investor info`
            );
            return 0;
        }
    }

    // Create Global Investor object utility
    createGlobalInvestorInfo(investor_obj, user_id, ipo_id) {
        /*
            This utility function helps create a global investor object to be put 
            onto the global investor key of the ledger
        */
        console.log("\n---Inside createGlobalInvestorInfo utility---\n");
        let temp_obj = {};
        temp_obj[user_id] = {};
        temp_obj[user_id]["wallet"] = {};
        temp_obj[user_id]["full_name"] = investor_obj[user_id]["full_name"];
        temp_obj[user_id]["portfolio"] = {};
        // Fill the portfolio and wallet dictionary
        temp_obj[user_id]["wallet"]["initial_wallet_balance"] = 1000000; // Default initial wallet balance for every investor
        temp_obj[user_id]["wallet"]["current_balance"] = 1000000; // Since no purchase has been made yet
        temp_obj[user_id]["wallet"]["refund_amount"] = "";
        console.log(temp_obj);
        console.log("-----RETURN-----");
        return temp_obj;
    }

    // Utility Function
    getAveragePricePerShare(transactions, lot_size) {
        /*
            This function calculates average price per share for the global investor object per ipo_id
        */
        console.log("---Inside getAveragePrice---");
        let total_price = 0;
        let total_shares = 0;
        for (let i in transactions) {
            total_price +=
                transactions[i]["bid_amount"] *
                transactions[i]["lots_bid"] *
                lot_size;
            total_shares += transactions[i]["lots_bid"] * lot_size;
        }
        console.log(total_price, total_shares);
        return total_price / total_shares;
    }

    async allotSharesNew(ctx, ipo_id, issuer_info, allocation_dict) {
        /*
            The allotment functionality allots the shares to the investors &
            update the ledger depending upon the case of oversubscription or
            undersubscription. It receives a processed dictionary from the nodejs
            backend and using that dictionary updates the ledger.
        */
        console.log("--- Inside Allotment ---");
        // let asset = await this.queryIssuer(ctx, ipo_id);
        let asset = issuer_info;
        let assetJSON = JSON.parse(asset);
        let allocation_info = JSON.parse(allocation_dict);
        let has_bidding_started =
            assetJSON[ipo_id]["ipoInfo"]["has_bidding_started"];
        let is_complete = assetJSON[ipo_id]["ipoInfo"]["is_complete"];
        if (has_bidding_started && is_complete) {
            let global_investor_info = await this.getGlobalInvestorInfo(ctx);
            console.log("-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-=");
            console.log(global_investor_info);
            assetJSON = this.makeAllotmentNew(
                ipo_id,
                assetJSON,
                allocation_info
            );
            for (let key in global_investor_info[_global_investors_id]) {
                // Updating global investor information
                console.log(key);
                console.log(global_investor_info[_global_investors_id]);
                if (!(key in assetJSON[ipo_id]["userInfo"])) {
                    // If investor hasn't bid for this ipo, no need to update global information
                    console.log("Investor hasn't bid for this IPO: ", {
                        ipo_id,
                    });
                    continue;
                } else if (!(key in allocation_info["investorInfo"])) {
                    // Investor bid for the IPO but didn't get it allotted, So initiate refund!
                    console.log("Investor hasn't been allotted this IPO!");
                } else {
                    // Investor bidded and got allotted
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id] = {};
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["ipo_name"] =
                        assetJSON[ipo_id]["ipoInfo"]["issuer_fullname"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["issuer_username"] =
                        assetJSON[ipo_id]["ipoInfo"]["issuer_name"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["avg_price_per_share"] =
                        allocation_info["investorInfo"][key][
                            "amount_invested"
                        ] /
                        allocation_info["investorInfo"][key]["shares_allotted"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["totalShares"] =
                        allocation_info["investorInfo"][key]["shares_allotted"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["totalValue"] =
                        allocation_info["investorInfo"][key]["amount_invested"];
                    global_investor_info[_global_investors_id][key][
                        "portfolio"
                    ][ipo_id]["demat_account"] =
                        allocation_info["investorInfo"][key]["demat_account"];
                }
                console.log("Refund initiated, if ANY: ");
                global_investor_info[_global_investors_id][key]["wallet"][
                    "current_balance"
                ] += assetJSON[ipo_id]["userInfo"][key]["refund_amount"];
                global_investor_info[_global_investors_id][key]["wallet"][
                    "refund_amount"
                ] += `->${assetJSON[ipo_id]["userInfo"][key]["refund_amount"]} refunded for ipo ${ipo_id}`;
            }
            console.log(assetJSON);
            await ctx.stub.putState(
                ipo_id,
                Buffer.from(JSON.stringify(assetJSON))
            );
            console.log("\n\n ----Alloted---- \n\n");
            // Update global investor information
            console.log(global_investor_info);
            await ctx.stub.putState(
                _global_investors_id,
                Buffer.from(JSON.stringify(global_investor_info))
            );
            console.log("\nGlobal investor info updated!!!");
            return 1;
        }
        return 0;
    }

    makeAllotmentNew(ipo_id, assetJSON, allocation_info) {
        /*
            Here, we are creating a global ledger object using allocation_info
            which will replace the current ledger info for all cases of subscription
        */
        console.log("\n---Making Allotment---\n");
        assetJSON[ipo_id]["escrowInfo"]["refund_amount"] +=
            assetJSON[ipo_id]["escrowInfo"]["total_amount"] -
            allocation_info["totalAmount"];
        assetJSON[ipo_id]["escrowInfo"]["transfer_amount"] +=
            allocation_info["totalAmount"];
        assetJSON[ipo_id]["ipoInfo"]["total_allotted"] =
            allocation_info["totalShares"];
        assetJSON[ipo_id]["escrowInfo"]["total_amount"] = 0;
        assetJSON[ipo_id]["ipoInfo"]["balance"] =
            assetJSON[ipo_id]["ipoInfo"]["totalSize"] -
            assetJSON[ipo_id]["ipoInfo"]["total_allotted"];
        assetJSON[ipo_id]["ipoInfo"]["wallet_balance"] +=
            assetJSON[ipo_id]["escrowInfo"]["transfer_amount"];
        assetJSON[ipo_id]["ipoInfo"]["is_allotted"] = true;
        // Now update each invester's info
        let users_info = assetJSON[ipo_id]["userInfo"];
        console.log(users_info);
        for (let key in users_info) {
            console.log("KEY:- ", key);
            console.log(assetJSON[ipo_id]["userInfo"][key]);
            if (key in allocation_info["investorInfo"]) {
                assetJSON[ipo_id]["userInfo"][key]["shares"]["allotted"] =
                    allocation_info["investorInfo"][key]["shares_allotted"];
                console.log("Calculating Refund, if any");
                assetJSON[ipo_id]["userInfo"][key]["refund_amount"] +=
                    assetJSON[ipo_id]["userInfo"][key]["total_invested"] -
                    allocation_info["investorInfo"][key]["amount_invested"];
            } else {
                // Case of oversubscription where this investor got nothing!
                assetJSON[ipo_id]["userInfo"][key]["shares"]["allotted"] = 0;
                console.log("Refunding full Amount to the user");
                assetJSON[ipo_id]["userInfo"][key]["refund_amount"] +=
                    assetJSON[ipo_id]["userInfo"][key]["total_invested"];
            }
        }
        return assetJSON;
    }
}

module.exports = Ipo;
