// Fabcar commandline client for enrolling and Admin

import { registerUserAgent } from "./handlers/client-javascript/MSP/registerUserAgent.js";
import { registerUserInvestor } from "./handlers/client-javascript/MSP/registerUserInvestor.js";
import { registerUserIssuer } from "./handlers/client-javascript/MSP/registerUserIssuer.js";
import { query } from "./handlers/client-javascript/functionality/query.js";
import { queryTransaction } from "./handlers/client-javascript/functionality/queryAllShares.js";
import { invokeBuy } from "./handlers/client-javascript/functionality/invokeBuy.js";
import { IssuertoLedger } from "./handlers/client-javascript/functionality/addIssuerToLedger.js";
import { getIdFromUsername } from "./handlers/client-javascript/database/getUserId.js";
import { SharesAllotment } from "./handlers/client-javascript/functionality/allotment.js";
import { ipoAllotment } from "./handlers/client-javascript/functionality/ipoAllotment.js";
import { makeDbConnection } from "./handlers/client-javascript/database/dbConnection.js";
import { OngoingIpoInfo } from "./handlers/client-javascript/database/OngoingIpoInfo.js";
import { UpcomingIpoInfo } from "./handlers/client-javascript/database/UpcomingIpoInfo.js";
import { getIpoInfo } from "./handlers/client-javascript/database/getIpo.js";
import session from "express-session";

import express from "express";
import bodyParser from "body-parser";

import { v4 as uuidv4 } from "uuid";
import {
  getAllInvestorInfo,
  getInvestorInfo,
} from "./handlers/client-javascript/database/investorInfo.js";
import { getdemat } from "./handlers/client-javascript/database/getDmatFromDB.js";
import { getAllotmentPrinciple } from "./handlers/client-javascript/database/getAllotmentPrinciple.js";
import { getIpoBucket } from "./handlers/client-javascript/database/getIpoBucket.js";
import { getInvestorClassification } from "./handlers/client-javascript/database/getInvestorClassification.js";
import { addDemat } from "./handlers/client-javascript/functionality/addDemat.js";
import { getAgents } from "./handlers/client-javascript/database/getAgents.js";
import { getInvestorTypes } from "./handlers/client-javascript/database/getInvestorTypes.js";
import { getOverSubAllotmentPrinciple } from "./handlers/client-javascript/database/getOverSubAllotmentPrinciple.js";
import { updateIpoIdentifiers } from "./handlers/client-javascript/functionality/updateIpoIdentifiers.js";
import { getInvestorTransactions } from "./handlers/client-javascript/database/getInvestorTransactions.js";
import { modifyBid } from "./handlers/client-javascript/functionality/modifyBid.js";
import { deleteBid } from "./handlers/client-javascript/functionality/deleteBid.js";
import db from "./configurations/sqliteConnection.js";
import { router } from "./routers/index.js";
import passport from "passport";
import localPassport from "./configurations/localPassport.js";
import flash from "connect-flash";

// import { job } from "./utils/cron.js";

/////////////////////////////////////////
// Express setup
// TODO: Protect urls using Authorization
// TODO: Modularize the code
// var express = require("express");
// var bodyParser = require('body-parser')
var app = express();
app.set("views", "./views");
app.use(express.static("public"));
import sqlite3 from "sqlite3";

const oneDay = 1000 * 60 * 60 * 24;

app.use(bodyParser.urlencoded({ extended: true }));

// TODO: Add persistant Sessions
app.use(
  session({
    // It holds the secret key for session
    secret: "test",
    // Forces the session to be saved
    // back to the session store
    resave: true,
    cookie: { maxAge: oneDay },
    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);
app.use(flash());

// Connect to the database
const dbAllot = new sqlite3.Database("ipo.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the database Manage.");
  }
});

// Set up routes for each table
app.get("/tbl_user", (req, res) => {
  dbAllot.all("SELECT * FROM tbl_user", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      res.render("tbl_user.jade", { rows });
    }
  });
});

// Route for tbl_userrole
app.get("/tbl_userrole", (req, res) => {
  dbAllot.all("SELECT * FROM tbl_userrole", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      res.render("tbl_userrole.jade", { rows });
    }
  });
});

// Route for tbl_investor_dmat
app.get("/tbl_investor_dmat", (req, res) => {
  dbAllot.all("SELECT * FROM tbl_investor_dmat", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      res.render("tbl_investor_dmat.jade", { rows });
    }
  });
});

// Route for tbl_investor_ipo_bid
app.get("/tbl_investor_ipo_bid", (req, res) => {
  dbAllot.all("SELECT * FROM tbl_investor_ipo_bid", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      res.render("tbl_investor_ipo_bid.jade", { rows });
    }
  });
});

// Route for tbl_investor_info
app.get("/tbl_investor_info", (req, res) => {
  dbAllot.all("SELECT * FROM tbl_investor_info", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      res.render("tbl_investor_info.jade", { rows });
    }
  });
});

// Route for tbl_ipo_info
app.get("/tbl_ipo_info", (req, res) => {
  dbAllot.all("SELECT * FROM tbl_ipo_info", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      res.render("tbl_ipo_info.jade", { rows });
    }
  });
});

// Use Express Router
app.use("/", router);

// app.get("/", function (req, res) {
//   res.render("layout.jade", { toastContent: "Hello" });
// });

app.listen(3000, function () {
  console.log("fabcar-ui listening on port 3000");
  console.log("Initializing cron...");
  // job;
});

// TODO: Use Sequelize for ORM https://sequelize.org/
