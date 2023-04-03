// Cron Job file to start and close the bid timer for each IPO
import pkg from "node-cron";
import { bidTimer } from "../handlers/client-javascript/functionality/bidTimer.js";
import { getIpoInfo } from "../handlers/client-javascript/database/getIpoeligibility.js";

const { schedule } = pkg;

let count = 0;

export const job = schedule("*/10 * * * * *", async function () {
  console.log("running a task 10 sec");
  let ipoList = await getIpoInfo();
  console.log(ipoList);
  // Iterate in the list to see for whom bidding can be started or stopped
  let current_time = new Date();
  for (let i in ipoList) {
    let result = null;
    let bid_start_date = new Date(ipoList[i]["bid_start_date"]);
    let bid_end_date = new Date(ipoList[i]["bid_time"]);
    if (ipoList[i]["has_bidding_started"] == "false") {
      // If bidding hasn't started yet, check if it can be started
      console.log("Looping");
      console.log("Current Time:- ", current_time);
      // Calculate the diff between current time and bid start date
      let diff = bid_start_date - current_time;
      console.log(diff);
      if (diff <= 0) {
        console.log("Start the bid now!");
        result = await bidTimer(ipoList[i]["issuer_name"], true);
      }
    } else if (ipoList[i]["is_complete"] == "false") {
      // If bidding has started but not closed yet,
      // Check if it can be closed
      console.log("------");
      //   let bid_close_time =
      //     bid_start_date.getTime() + ipoList[i]["bid_time"] * 1000;
      let bid_close_date = bid_end_date.getTime();
      console.log(bid_close_date);
      if (current_time.getTime() >= bid_close_date) {
        console.log("Close the bid now!");
        result = await bidTimer(ipoList[i]["issuer_name"], false, true);
      }
    }
    if (!result) {
      console.log("\nBidding can't be started or closed!");
    }
  }

  // count += 1;
  // if (count==2){
  //     console.log("Stop!");
  //     job.stop();
  // }
});
