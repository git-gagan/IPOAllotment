
// Fabcar commandline client for enrolling and Admin

// import {enrollAdminAgent} from "./handlers/client-javascript/MSP/enrollAdminAgent.js";
// import {enrollAdminInvestor} from  "./handlers/client-javascript/MSP/enrollAdminInvestor.js";
// import  {enrollAdminIssuer} from  "./handlers/client-javascript/MSP/enrollAdminIssuer.js";
import {registerUserAgent} from "./handlers/client-javascript/MSP/registerUserAgent.js";
import {registerUserInvestor} from  "./handlers/client-javascript/MSP/registerUserInvestor.js";
import {registerUserIssuer}  from  "./handlers/client-javascript/MSP/registerUserIssuer.js";
import {query} from "./handlers/client-javascript/functionality/query.js"
import {queryTransaction} from "./handlers/client-javascript/functionality/queryAllShares.js"
import {invokeBuy} from "./handlers/client-javascript/functionality/invokeBuy.js"
import {IssuertoLedger} from "./handlers/client-javascript/functionality/addIssuerToLedger.js"
import { getIdFromUsername } from './handlers/client-javascript/database/getUserId.js';
import {SharesAllotment} from "./handlers/client-javascript/functionality/allotment.js";
import { ipoAllotment } from "./handlers/client-javascript/functionality/ipoAllotment.js";
import {makeDbConnection} from "./handlers/client-javascript/database/dbConnection.js";
import { OngoingIpoInfo } from "./handlers/client-javascript/database/OngoingIpoInfo.js";
import { UpcomingIpoInfo } from "./handlers/client-javascript/database/UpcomingIpoInfo.js";
import { getIpoInfo } from "./handlers/client-javascript/database/getIpo.js";
// var invoke = require("./handlers/invoke");
// var query = require("./handlers/query");
// var startBid=require("./handlers/startBid");
// const sqlite3 = require('sqlite3');
// const session = require('express-session')
import session from "express-session";
import sqlite3 from "sqlite3";
import express from "express";
import bodyParser from "body-parser";
import fs from 'fs';


import { v4 as uuidv4 } from 'uuid';
import { Console } from "console";
import { getAllInvestorInfo, getInvestorInfo } from "./handlers/client-javascript/database/investorInfo.js";
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

/////////////////////////////////////////
// Express setup
// var express = require("express");
// var bodyParser = require('body-parser')
var app = express();
app.set("views", "./views");
app.use(express.static("public"));

const oneDay = 1000 * 60 * 60 * 24;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  
    // It holds the secret key for session
    secret: 'test',
  
    // Forces the session to be saved
    // back to the session store
    resave: true,

    cookie: { maxAge: oneDay },
  
    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true
}))

var sess="";
var role_id="";

let db = new sqlite3.Database('ipo.db', (err)=>{
    if (err){
        return console.error(err.message);
    }
    else{
        console.log('Connected to the SQlite database.');
    }
})


/////////////////////////////////////////
// VIEWS
app.get('/', function (req, res){
    if(req.session.name){
        res.render("index.jade",{session:req.session.name,role_id:role_id})
    }
    else{
        res.render("index.jade")
    }
});
app.get('/enroll', function (req, res){
    res.render("enroll.jade",{session:req.session.name,role_id:role_id})
});
app.get('/register', function (req, res){
    res.render("register.jade",{session:req.session.name,role_id:role_id})
});




// var user_portfolio=[];
app.get("/portfolio",function(req,res){
    var promiseQuery = query(req.session.name);
    var portfolios;
    
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        portfolios=value[value.length-1].Record.portfolio
        console.log(portfolios)
        res.render("portfolio.jade",{session:req.session.name,role_id:role_id,portfolios:portfolios})
       

      

       
    }
    promiseValue();
});

app.get("/balance",function(req,res){
    var promiseQuery = query(req.session.name);
    var balance;
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        
        try {
            balance=value[value.length-1].Record.wallet.current_balance
        }
        catch(err){
            balance=200000
        }
        res.render("balance.jade",{session:req.session.name,balance:balance,role_id:role_id})
    }
    promiseValue();
});

app.get('/invoke', function (req, res){
    var share_id=req.query.id
    
    console.log("Share id :",share_id)
   

    res.render("invoke.jade",{session:req.session.name,role_id:role_id,id:share_id})
});

app.get('/query', function (req, res){
    res.render("query.jade",{session:req.session.name,role_id:role_id})
});
app.get('/signup', function (req, res){
    res.render("signup.jade",{session:req.session.name,role_id:role_id})
});
// app.post('/invoke',function(req,res){
//     var share=req.body.custId
//     console.log(share)
// });
app.get('/issuerpanel', function (req, res){
    // var promiseInvoke = query.queryTransaction(req.session.name);
    // var promiseValue = async () => {
    //     const value = await promiseInvoke;
    //     console.log(value);
    //     res.render("invoke.jade", {data: value,session:req.session.name});
    //     if (value != undefined && value.length > 0){
    //         res.render("issuerpanel.jade",{session:req.session.name,data: value})
    //     }else{
    //         res.render("issuerregister.jade",{session:req.session.name})
    //     }
        var agents=[]; 
        db.all("select * from tbl_user where user_id in (select user_id from tbl_userrole where role_id='AG')",(err,rows)=>{
            if(err){
                console.log(err)
            }
            else {
                
                rows.forEach(function(row){
                    agents.push({
                        user_id:row.user_id,
                        user_name:row.user_name
                    })
                  
                })
            }

            console.log(agents)
            console.log("All Agents :",agents)
            res.render("issuerpanel.jade",{session:req.session.name,role_id:role_id,agents:agents})


        });


    }
    // promiseValue();
);

app.post("/agentpanel",function(req,res){

    var ipo_id=req.body.ipo
    var promiseQuery = SharesAllotment(req.session.name,ipo_id);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        res.render("agentpanel.jade",{session:req.session.name,role_id:role_id,message:value})
         
        
        

    }
    promiseValue();
    // res.render("agentpanel.jade",{session:req.session.name,role:role_id})

});


app.get("/ipo",function(req,res){
    var promiseQuery = query(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        res.render("ipo.jade",{session:req.session.name,data:value,role_id:role_id,message:""})
    }
    promiseValue();
});

app.post("/issuerpanel",function(req,res){
      var ipo=req.body.ipo
      var totalSize=req.body.totalSize
      var priceRangeLow=req.body.priceRangeLow
      var priceRangeHigh=req.body.priceRangeHigh
      var bidStartDate=req.body.bidStartDate
      var totalBidTime=req.body.totalBidTime
      var lotSize=req.body.lotSize
      var agent=req.body.agent
      
      var value;
      console.log(ipo,totalSize,priceRangeLow,priceRangeHigh,bidStartDate,totalBidTime,agent)
      var promiseInvoke = IssuertoLedger(req.session.name,ipo,totalSize,priceRangeLow,priceRangeHigh,bidStartDate,totalBidTime,lotSize,agent);
      
    var promiseValue = async () => {

        value = await promiseInvoke;
        console.log(value);
        // res.render("invoke.jade", {data: value,session:req.session.name});
        // if (value != undefined && value.length > 0){
        //     res.render("issuerpanel.jade",{session:req.session.name,data: value})
        // }else{
        //     res.render("issuerregister.jade",{session:req.session.name})
        // }
        
        // res.render("issuerpanel.jade",{session:req.session.name,role:role_id,data:value})
        res.redirect("/ipo");



}
    promiseValue();


});

app.get('/agentpanel', function (req, res){
    var promiseQuery = query(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        res.render("agentpanel.jade",{session:req.session.name,data:value,role_id:role_id,message:""})
    }
    promiseValue();

});
app.post("/actionInvoke",function(req,res){
    var lotQuantity=req.body.lotQuantity;
    var bidperShare=req.body.bidperShare;
    var shareId=req.body.custId;

    console.log("lot quantity:",lotQuantity);
    console.log("bid per share:",bidperShare);
    console.log("Share Id:",shareId);

    var promiseInvoke = invokeTransaction(req.session.name,lotQuantity,bidperShare,shareId);
    var promiseValue = async () => {
        const value = await promiseInvoke;
        console.log(value);
        res.render("invoke.jade", {data: value,session:req.session.name,role_id:role_id});
        
    };
    promiseValue();


});


app.get('/userinfo',  async function (req, res){
    
       var userinfo=[]
       let user_promise = await getIdFromUsername(req.session.name);
        console.log("USER promise:- ", user_promise);

        let user_id, role_id;
        if (user_promise){
            user_id = user_promise['user_id'];
            role_id = user_promise['role_id'];
        }
        else{
            user_id = null;
        }
        
        console.log(user_id, role_id)

        db.all(`select user_name,lots_bid,bid_amount,is_allotted from tbl_user 
        inner join tbl_investor_transactions
         on 
         tbl_user.user_id=tbl_investor_transactions.ipo_id 
         where investor_id='${user_id}'`,(err,rows)=>{
            if(err){
                console.log(err)
            }
            else {
                
                rows.forEach(function(row){
                    userinfo.push({
                        user_name:row.user_name,
                        lots_bid:row.lots_bid,
                        bid_amount:row.bid_amount,
                        is_allotted:row.is_allotted
                    })

                  
                })

            }
            console.log(userinfo)
            if(userinfo){
                console.log(userinfo)
                res.render("userinfo.jade",{session:req.session.name,role_id:role_id,userinfo:userinfo})

            }



        });


    }
    // promiseValue();
);



app.post("/signup",function (req, res) {
    console.log(req.body);
    var username = req.body.username
    var password = req.body.password
    var identity=req.body.identity
    console.log("Identity :",identity)
    db.get(`SELECT * FROM tbl_user where user_name = ?`, [req.body.username], (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          console.log(error.message);
          return;
       }
        else if(row){
            res.render("signup.jade",{message:"Username already exist",session:req.session.name,role_id:role_id});
        }
        else{
            let user_id=uuidv4()
            var promiseRegister,filepath;
            let insert = 'INSERT INTO tbl_user (user_id,user_name, user_pwd) VALUES (?,?,?)';
            let insert2 = 'INSERT INTO tbl_userrole (user_id,role_id) VALUES (?,?)';

            try {
               
                if(identity=='IN'){
                    promiseRegister=registerUserInvestor(username);
                   
                }
                else if(identity=='IS'){
                    promiseRegister=registerUserIssuer(username)
                   
                }
                else if(identity=='AG'){
                    promiseRegister=registerUserAgent(username)
                    

                }
                
                var promiseValue = async () => {
                    const value = await promiseRegister;
                    
                };
                promiseValue();
               
                db.run(insert, [user_id,username,password]);
                db.run(insert2, [user_id,identity]);
               
                res.render("login.jade",{message:"Successfully registered!!",session:req.session.name,role_id:role_id});

            } catch (error) {
                console.log(error.message);
            }
               
            }
        
      });

});
app.get('/login', function (req, res){
    res.render("login.jade",{session:req.session.name,role_id:role_id})
});

app.get("/registerauthority",function(req,res){
    res.render("registerauthority.jade",{session:req.session.name,role_id:role_id})
})


app.post("/registerauthority",function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    var role=req.body.authority;
    console.log(username,password,role)
    res.render("registerauthority.jade",{session:req.session.name,role_id:role_id})
})



// app.get("/issuerregister",function(req,res){
//     res.render("issuerregister.jade",{session:req.session.name})
// })




app.post("/login", async function(req,res){
    var data;
    var template;
    var value;
    db.get(`SELECT * FROM tbl_user where user_name = ? and user_pwd = ?`, [req.body.username,req.body.password], async (err, row) => {
        console.log(row);
        if(err){
            res.status(400).json({"error":err.message});
            console.log(error.message);
            return;
        }
        
       

        else if(row){
            // user=req.body.username
           
            let user_promise = await getIdFromUsername(req.body.username);
            console.log("USER promise:- ", user_promise);

           
            if (user_promise){
               
                role_id = user_promise['role_id'];
                if(role_id=="IN"){
                    template="ongoing-ipo.jade"
                    req.session.name = req.body.username
                    sess=req.session.name;
                    var ongoing=await OngoingIpoInfo();
                    console.log(ongoing);
                    res.render(template,{session:req.session.name,role_id:role_id,ongoing:ongoing});
                }
                else if(role_id=="IS"){
                    req.session.name = req.body.username
                    sess=req.session.name;
                    let user_promise=await getIdFromUsername(req.session.name);
                    let user_id=user_promise["user_id"]
                    let ipoInfo=await getIpoInfo(user_id)
                    if(ipoInfo){
                        template="issuer-dashboard.jade"
                        console.log(ipoInfo)
                        console.log(ipoInfo.bid_start_date)
                        var date=new Date(ipoInfo.bid_start_date)
                        const yyyy = date.getFullYear();
                        let mm = date.getMonth() + 1; // Months start at 0!
                        let dd = date.getDate();

                        if (dd < 10) dd = '0' + dd;
                        if (mm < 10) mm = '0' + mm;

                        const formattedDate = dd + '-' + mm + '-' + yyyy;
                        console.log(formattedDate)
                        let allotmentPrinciple=await getAllotmentPrinciple(ipoInfo.allotment_principle)
                        let ipoBucket=await getIpoBucket(user_id)
                        console.log(ipoBucket)
                        let investorClassification=await getInvestorClassification(user_id)
                        console.log(investorClassification)
                        res.render(template,{session:req.session.name,role_id:role_id,ipoInfo:ipoInfo,bid_start_date:formattedDate,
                            allotment_principle:allotmentPrinciple.name,ipoBucket:ipoBucket,investorClassification:investorClassification});
                    }
                    else{
                        template="launch-ipo.jade"
                        
                        var agents=await getAgents()
                        console.log(agents)
                        
                        var investor_types=await getInvestorTypes()
                        console.log(investor_types)
                        
                        
                        var principles=await getOverSubAllotmentPrinciple()
                        console.log(principles)

                        var investors=await getAllInvestorInfo()
                        console.log(investors)
    
                        res.render(template,{session:req.session.name,role_id:role_id,principles:principles,agents:agents,
                            investor_types:investor_types,investors:investors})
                    
                                    
                    }
                    
                }
                else if(role_id=="AG"){
                    var promiseQuery = query(req.body.username);
                    var promiseValue = async () => {
                        value = await promiseQuery;
                        console.log("IPO : ",value);
                        template="agent-dashboard.jade"
                        console.log(role_id)
                        req.session.name = req.body.username
                        sess=req.session.name;
                        res.render(template,{session:req.session.name,role_id:role_id,data:value})
                        
                        // template="agent-dashboard.jade"

                    }
                    promiseValue();
                   
                    
                }
            }
            else{
                role_id = null;
            }
            
            // console.log(role_id)
            // req.session.name = req.body.username
            // sess=req.session.name;
            // res.render(template,{session:req.session.name,role_id:role_id,data:value});
        }
        else{
            res.render("login.jade",{message:"please fill out correct details",session:req.session.name,role_id:role_id});
        }
        
      });
});

app.get("/logout",function(req,res){
    req.session.destroy(function(error){
        console.log("Session Destroyed")
        
    })
    res.render("index.jade");
});


/////////////////////////////////////////
// ACTIONS
app.get('/actionEnrollAdmin', function (req, res){
    //var promiseEnrollAdmin = enrollAdmin.log();
    var promiseEnrollAdmin = enrollAdmin.enroll();
    var promiseValue = async () => {
        const value = await promiseEnrollAdmin;
        console.log(value);
        res.render("enroll.jade", {data: value,session:req.session.name,role:role_id});
    };
    promiseValue();
});
app.get('/actionRegisterUser', function (req, res){
    //var promiseRegisterUser = registerUser.log();
    var promiseRegisterUser = registerUser.register();
    var promiseValue = async () => {
        const value = await promiseRegisterUser;
        console.log(value);
        res.render("register.jade", {data: value,session:req.session.name,role:role_id});
    };
    promiseValue();
});
// app.get('/actionInvoke', function (req, res){
//     //ar promiseInvoke = invoke.log();
//     var promiseInvoke = invokeTransaction(req.session.name);
//     var promiseValue = async () => {
//         const value = await promiseInvoke;
//         console.log(value);
//         res.render("invoke.jade", {data: value,session:req.session.name});
//     };
//     promiseValue();
// });
app.get('/actionQuery', function (req, res){
    //var promiseQuery = query.log();
    var promiseQuery = queryTransaction(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        value.pop([Object.keys(value).length-1])
        console.log(value)
        res.render("query.jade", {data: value,session:req.session.name,role:role_id});
    }; 
    promiseValue();
});


app.post("/update-issuer",async function(req,res){
   let cusip=req.body.cusip
   let ticker=req.body.ticker
   let isin=req.body.isin

   let updateIpo=await updateIpoIdentifiers(req.session.name,isin,cusip,ticker)
   console.log(updateIpo)

   let user_promise=await getIdFromUsername(req.session.name);
   let user_id=user_promise["user_id"]
   let ipoInfo=await getIpoInfo(user_id)
   if(ipoInfo){
       let template="issuer-dashboard.jade"
       console.log(ipoInfo)
       console.log(ipoInfo.bid_start_date)
       var date=new Date(ipoInfo.bid_start_date)
       const yyyy = date.getFullYear();
       let mm = date.getMonth() + 1; // Months start at 0!
       let dd = date.getDate();

       if (dd < 10) dd = '0' + dd;
       if (mm < 10) mm = '0' + mm;

       const formattedDate = dd + '-' + mm + '-' + yyyy;
       console.log(formattedDate)
       let allotmentPrinciple=await getAllotmentPrinciple(ipoInfo.allotment_principle)
       let ipoBucket=await getIpoBucket(user_id)
       console.log(ipoBucket)
       let investorClassification=await getInvestorClassification(user_id)
       console.log(investorClassification)
       res.render(template,{session:req.session.name,role_id:role_id,ipoInfo:ipoInfo,bid_start_date:formattedDate,
           allotment_principle:allotmentPrinciple.name,
           ipoBucket:ipoBucket,investorClassification:investorClassification,message:updateIpo});
   }



});




app.post("/add-demat",async function(req,res){
    let dmat_ac_no=req.body.demataccno
    let dp_id=req.body.dpid
    let adddDemat=await addDemat(req.session.name,dmat_ac_no,dp_id)
    let user=await getIdFromUsername(req.session.name)
    console.log(user)
    let investor=await getInvestorInfo(user.user_id)
    console.log(investor)
    let demat=await getdemat(user.user_id)
    console.log(demat)
    var promiseQuery = query(req.session.name);
    var balance;
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        
        try {
            balance=value[value.length-1].Record.wallet.current_balance
        }
        catch(err){
            balance=100000
        }
    res.render("profile.jade",{session:req.session.name,role_id:role_id,user:user,investor:investor,demat:demat,balance:balance})
        
    }
    promiseValue();
    
});


app.get("/startBid",function(req,res){
    var promiseQuery=startBid.startBid();
    var promiseInvoke = query.queryTransaction(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        const data = await promiseInvoke;
        console.log(value);
        res.render("issuerpanel.jade", {message: value,session:req.session.name,data:data,role:role_id});
    }; 
    promiseValue();   
})


app.get("/register-step1",function(req,res){
    var role_type=[]; 
    db.all("select * from tbl_role_type",(err,rows)=>{
        if(err){
            console.log(err)
        }
        else {
            
            rows.forEach(function(row){
                role_type.push(
                    {role_type_id:row.role_type_id,
                    role_type:row.role_type
                    })
              
            })
        }

        console.log(role_type)
       
        res.render("register-step1.jade",{role_type:role_type,session:req.session.name,role_id:role_id})


    });
    
});

var role_type;
app.post("/register-step1",function(req,res){
    role_type=req.body.flexRadioDefault
    console.log(role_type)
    res.render("register-step2.jade",{role:role_type})
   
    
});

app.get("/register-investor-step3",function(req,res){
    res.render("register-investor-step3.jade",{session:req.session.name,role_id:role_id})
});

app.post("/register-investor-step3",async function(req,res){
    let acctnum,ifsc,acctholder,pan,dacctnum,dpartid,investor_type_id,username,full_name
    acctnum=req.body.acctnum
    ifsc=req.body.ifsc
    acctholder=req.body.acctholder
    pan=req.body.pan
    dacctnum=req.body.dacctnum
    dpartid=req.body.dpartid
    investor_type_id=req.body.investor_type_id
    username=req.body.username


    let user_promise = await getIdFromUsername(username);
    console.log("USER promise:- ", user_promise);

    let user_id, user_name;
    if (user_promise){
        user_id = user_promise['user_id'];
        full_name=user_promise['full_name'];
    }
    else{
        user_id = null;
        full_name=null;
    }
    
    


    console.log(user_id)
    console.log(investor_type_id)
    console.log(full_name)

    let insert_investor_info = 'INSERT INTO tbl_investor_info (investor_id,investor_type, pan,investor_name,bank_account_no,ifsc_code,lei,swift_address) VALUES (?,?,?,?,?,?,?,?)';
    let insert_investor_dmat='INSERT INTO tbl_investor_dmat (investor_id,demat_ac_no,dp_id) values(?,?,?)'
    let id=uuidv4()

    db.run(insert_investor_info,[user_id,investor_type_id,pan,full_name,acctnum,ifsc])
    db.run(insert_investor_dmat,[user_id,dacctnum,dpartid])
    res.render("login.jade",{session:req.session.name,role_id:role_id})
    
});

app.get("/issuer-dashboard",function(req,res){
    res.render("issuer-dashboard.jade",{session:req.session.name,role_id:role_id})
});

app.get("/register-step2",function(req,res){
    
    res.render("register-step2.jade",{session:req.session.name,role:role_type,role_id:role_id})
});


async function getInvestorTypeId(role_type) {
    try {
        // Create DB connection
        
        console.log("===============================");
        let db = await makeDbConnection();
         // let sql = `select user_id, role_id from tbl_userrole 
        //             where user_id=(
        //                 select user_id from tbl_user where name='${user_name}'
        //             )`;
        let sql = `select * from tbl_investor_type where investor_type='${role_type}'`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.get(sql, (err, row) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log(row);
                    console.log("Query Successful!");
                    resolve(row);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}


async function getRoleTypeId(role_type) {
    try {
        // Create DB connection
        
        console.log("===============================");
        let db = await makeDbConnection();
         // let sql = `select user_id, role_id from tbl_userrole 
        //             where user_id=(
        //                 select user_id from tbl_user where name='${user_name}'
        //             )`;
        let sql = `select * from tbl_role_type where role_type='${role_type}'`;
        console.log(sql);
        // db.all()/db.get() returns the rows as results unlike db.run()
        const dbpromise = new Promise((resolve, reject)=>{
            db.get(sql, (err, row) => {
                if (err) {
                    console.log("[][][][][][][][][][][][][")
                    reject(err.message);
                }
                else {
                    console.log(row);
                    console.log("Query Successful!");
                    resolve(row);
                }
            });
        })
        db.close();
        return dbpromise;
    } 
    catch (error) {
        console.error(`Failed to get user information: ${error}`);
        process.exit(1);
    }
}

app.post("/register-step2",async function(req,res){
    let role_type,username,password,fullname,role_type_id,investor_type_id
    var template;

    role_type=req.body.role

    let role_type_promise=await getRoleTypeId(role_type)
   

    
    if (role_type_promise){
        
        role_type_id = role_type_promise['role_type_id'];
        
    }
    else{
        role_type_id = null;
    }

  
    

    let investor_type_promise=await getInvestorTypeId(role_type)
   

    
    if (investor_type_promise){
        
        investor_type_id = investor_type_promise['investor_type_id'];
        
    }
    else{
        investor_type_id = null;
    }

  
    
    username=req.body.username
    password=req.body.password
    fullname=req.body.fullname
    // console.log(role_type)

    db.get(`SELECT * FROM tbl_user where user_name = ?`, [req.body.username], (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          console.log(error.message);
          return;
       }
        else if(row){
            res.render("register-step2.jade",{message:"Username already exist"});
        }
        else{
            let user_id=uuidv4()
            console.log(username,password,fullname)
            var promiseRegister,filepath;
            let insert = 'INSERT INTO tbl_user (user_id,user_name, user_pwd,full_name) VALUES (?,?,?,?)';
            let insert2 = 'INSERT INTO tbl_userrole (user_id,role_id) VALUES (?,?)';

            try {
               
                if(role_type_id=='IN'){
                    
                    promiseRegister=registerUserInvestor(username);
                    template="register-investor-step3.jade"
                   
                   
                }
                else if(role_type_id=='IS'){
                    promiseRegister=registerUserIssuer(username)
                    template="login.jade"
                   
                }
                else if(role_type_id=='AG'){
                    promiseRegister=registerUserAgent(username)
                    template="login.jade"
                    

                }
                
                var promiseValue = async () => {
                    const value = await promiseRegister;
                    
                };
                promiseValue();
               
                db.run(insert, [user_id,username,password,fullname]);
               
                db.run(insert2, [user_id,role_type_id]);
                console.log(template)
                console.log("Investor Type Id:",investor_type_id)
                res.render(template,{message:"Successfully registered!!",session:req.session.name,role_id:role_id,investor_type_id:investor_type_id,username:username});

            } catch (error) {
                console.log(error.message);
            }
               
            }
        
      });
  
});

app.get("/profile",async function(req,res){
    let user=await getIdFromUsername(req.session.name)
    console.log(user)
    let investor=await getInvestorInfo(user.user_id)
    console.log(investor)
    let demat=await getdemat(user.user_id)
    console.log(demat)
    var promiseQuery = query(req.session.name);
    var balance;
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        
        try {
            balance=value[value.length-1].Record.wallet.current_balance
        }
        catch(err){
            balance=100000
        }
    res.render("profile.jade",{session:req.session.name,role_id:role_id,user:user,investor:investor,demat:demat,balance:balance})
        
    }
    promiseValue();
});

app.get("/holdings",function(req,res){
    res.render("holdings.jade",{session:req.session.name,role_id:role_id})
});

app.get("/agent-dashboard",function(req,res){
    var promiseQuery = query(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log("IPO : ",value);
        res.render("agent-dashboard.jade",{session:req.session.name,role_id:role_id})
    }
    promiseValue();

    
});

app.post("/agent-dashboard",function(req,res){
    var ipo_id=req.body.ipo
    var action=req.body.action
    if(action=="1"){
        var promiseQuery = ipoAllotment(req.session.name,ipo_id);
        var promiseValue = async () => {
            const value = await promiseQuery;
            console.log(value);
            res.render("agent-dashboard.jade",{session:req.session.name,role_id:role_id,message:value})
        }
        promiseValue();
    }
    
})

app.get("/launch-ipo",async function(req,res){
    var agents=await getAgents()
    console.log(agents)
    
    var investor_types=await getInvestorTypes()
    console.log(investor_types)
    
    
    var principles=await getOverSubAllotmentPrinciple()
    console.log(principles)

    var investors=await getAllInvestorInfo()
    console.log(investors)

    res.render("launch-ipo.jade",{session:req.session.name,role_id:role_id,principles:principles,agents:agents,investor_types:investor_types})

    
});


app.post("/launch-ipo",function(req,res){
    var value;
    console.log("IPO Buckets:",ipo_buckets)
    console.log("Investor Categories",investor_categories)
    var promiseInvoke = IssuertoLedger(req.session.name,req.body.issuer,req.body.isin,req.body.cusip,
        req.body.ticker,req.body.totalShares,req.body.lowPrice,req.body.highPrice,req.body.ipoStartDate,
        req.body.ipoEndTime,req.body.lotSize,req.body.agent,req.body.principle,ipo_buckets,investor_categories);
      
    var promiseValue = async () => {

        value = await promiseInvoke;
        console.log(value);

        let user_promise=await getIdFromUsername(req.session.name);
                    let user_id=user_promise["user_id"]
                    let ipoInfo=await getIpoInfo(user_id)
                    if(ipoInfo){
                        let template="issuer-dashboard.jade"
                        console.log(ipoInfo)
                        console.log(ipoInfo.bid_start_date)
                        var date=new Date(ipoInfo.bid_start_date)
                        const yyyy = date.getFullYear();
                        let mm = date.getMonth() + 1; // Months start at 0!
                        let dd = date.getDate();

                        if (dd < 10) dd = '0' + dd;
                        if (mm < 10) mm = '0' + mm;

                        const formattedDate = dd + '-' + mm + '-' + yyyy;
                        console.log(formattedDate)
                        let allotmentPrinciple=await getAllotmentPrinciple(ipoInfo.allotment_principle)
                        let ipoBucket=await getIpoBucket(user_id)
                        console.log(ipoBucket)
                        let investorClassification=await getInvestorClassification(user_id)
                        console.log(investorClassification)
                        res.render(template,{session:req.session.name,role_id:role_id,ipoInfo:ipoInfo,bid_start_date:formattedDate,
                            allotment_principle:allotmentPrinciple.name,
                            ipoBucket:ipoBucket,investorClassification:investorClassification});
                    }
       
        // res.render("issuer-dashboard.jade",{session:req.session.name,role_id:role_id});



}
    promiseValue();


});

var investor_categories=[]
app.post("/add-investor-category",async function(req,res){

    let investor_type=req.body.investorType
    let quota=req.body.quota
    let lot_quantity=req.body.lotQuantity
    
    let user_promise=await getIdFromUsername(req.session.name)
    let user_id=user_promise["user_id"]

    investor_categories.push({
        ipo_id: user_id,
        investor_type_id: investor_type,
        min_lot_qty: lot_quantity,
        reserve_lots: quota
           
    });

    console.log("Investor Categories",investor_categories)

    
    var agents=await getAgents()
    console.log(agents)
    
    var investor_types=await getInvestorTypes()
    console.log(investor_types)
    
    
    var principles=await getOverSubAllotmentPrinciple()
    console.log(principles)

    var investors=await getAllInvestorInfo()
    console.log(investors)

    res.render("launch-ipo.jade",{session:req.session.name,role_id:role_id,principles:principles,agents:agents,
        investor_types:investor_types,investors:investors})


    


});

var ipo_buckets=[]
app.post("/add-ipo-buckets",async function(req,res){
    let investor_type=req.body.investorTypeBucket
    let bucket_size=req.body.BucketSize
    let alloc_priority=req.body.allocPriority
    let investor_id=req.body.investorId
    let user_promise=await getIdFromUsername(req.session.name)
    let user_id=user_promise["user_id"]
    ipo_buckets.push({
        ipo_id:user_id,
        investor_type_id:investor_type,
        no_of_shares:bucket_size,
        priority:alloc_priority,
        investor_id:investor_id
    });

    console.log("IPO Buckets",ipo_buckets)

    
    var agents=await getAgents()
    console.log(agents)
    
    var investor_types=await getInvestorTypes()
    console.log(investor_types)
    
    
    var principles=await getOverSubAllotmentPrinciple()
    console.log(principles)

    var investors=await getAllInvestorInfo()
    console.log(investors)

    res.render("launch-ipo.jade",{session:req.session.name,role_id:role_id,principles:principles,agents:agents,
        investor_types:investor_types,investors:investors})


    


});


app.get("/ongoing-ipo",async function(req,res){
    let ongoing=await OngoingIpoInfo();
    console.log(ongoing);

    res.render("ongoing-ipo.jade",{session:req.session.name,role_id:role_id,ongoing:ongoing})
});


app.get("/applied-ipo",async function(req,res){
    let user=await getIdFromUsername(req.session.name)
    console.log(user)
    
    let investor_transactions=await getInvestorTransactions(user.user_id)
    console.log(investor_transactions)

   

    res.render("applied-ipo.jade",{session:req.session.name,role_id:role_id,user:user,investor_transactions:investor_transactions})

});

app.post("/modify-bid",async function(req,res){
    let transaction_id=req.body.modify_transaction_id
    let bid_amount=req.body.bid_amount
    let lots_applied=req.body.lots_applied

    let modify_bid=await modifyBid(req.session.name,transaction_id,lots_applied,bid_amount)
    console.log(modify_bid)

    res.redirect("/ongoing-ipo")
});


app.post("/delete-bid",async function(req,res){
    let transaction_id=req.body.delete_transaction_id
    

    let delete_bid=await deleteBid(req.session.name,transaction_id)
    console.log(delete_bid)

    res.redirect("/ongoing-ipo")
});



app.post("/apply",async function(req,res){
    let ipo_id=req.body.ipo_id;
    console.log(ipo_id)
    var ipo=await getIpoInfo(ipo_id)
    console.log(ipo)
    let user=await getIdFromUsername(req.session.name)
    console.log(user)
    let demat=await getdemat(user.user_id)
    console.log(demat)
    res.render("apply-ipo.jade",{session:req.session.name,role_id:role_id,ipo:ipo,demat:demat})
});

app.get("/apply-ipo",async function(req,res){
    let user=await getIdFromUsername(req.session.name)
    console.log(user)
    let demat=await getdemat(user.user_id)
    console.log(demat)
    res.render("apply-ipo.jade",{session:req.session.name,role_id:role_id,demat:demat})
});

app.post("/apply-ipo",async function(req,res){
    let demat=req.body.demat
    let qty=req.body.qty
    let price=req.body.price
    let ipo_id=req.body.ipo_id
    console.log(demat,qty,price)
    var Buy=await invokeBuy(req.session.name,ipo_id,demat,qty,price)
    console.log(Buy)
    let ongoing=await OngoingIpoInfo();
    console.log(ongoing);
    res.render("ongoing-ipo.jade",{session:req.session.name,role_id:role_id,ongoing:ongoing})



});

app.get("/upcoming-ipo",async function(req,res){
    let upcoming=await UpcomingIpoInfo();
    console.log(upcoming)
    res.render("upcoming-ipo.jade",{session:req.session.name,role_id:role_id,upcoming:upcoming})
});


app.listen(3000,function (){
    console.log('fabcar-ui listening on port 3000');
});

