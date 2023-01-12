
// Fabcar commandline client for enrolling and Admin

// import {enrollAdminAgent} from "./handlers/client-javascript/MSP/enrollAdminAgent.js";
// import {enrollAdminInvestor} from  "./handlers/client-javascript/MSP/enrollAdminInvestor.js";
// import  {enrollAdminIssuer} from  "./handlers/client-javascript/MSP/enrollAdminIssuer.js";
import {registerUserAgent} from "./handlers/client-javascript/MSP/registerUserAgent.js";
import {registerUserInvestor} from  "./handlers/client-javascript/MSP/registerUserInvestor.js";
import {registerUserIssuer}  from  "./handlers/client-javascript/MSP/registerUserIssuer.js";
import {query} from "./handlers/client-javascript/functionality/query.js"
import {queryTransaction} from "./handlers/client-javascript/functionality/queryAllShares.js"
import {invokeTransaction} from "./handlers/client-javascript/functionality/invokeBuy.js"
import {IssuertoLedger} from "./handlers/client-javascript/functionality/addIssuerToLedger.js"
import { getIdFromUsername } from './handlers/client-javascript/utils/getUserId.js';
import {SharesAllotment} from "./handlers/client-javascript/functionality/allotment.js";


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
        res.render("index.jade",{session:req.session.name,role:role_id})
    }
    else{
        res.render("index.jade")
    }
});
app.get('/enroll', function (req, res){
    res.render("enroll.jade",{session:req.session.name,role:role_id})
});
app.get('/register', function (req, res){
    res.render("register.jade",{session:req.session.name,role:role_id})
});
// var user_portfolio=[];
app.get("/portfolio",function(req,res){
    var promiseQuery = query(req.session.name);
    var portfolios;
    var user_portfolio=[];
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        portfolios=value[value.length-1].Record.portfolio
        console.log(portfolios)
        for(let key in portfolios){
             
            db.all(`select user_name from tbl_user where user_id = '${key}'`,(err,rows)=>{
                if(err){
                    console.log(err)
                }
                else {
                    
                    rows.forEach(function(row){
                        user_portfolio.push({
                            ipo:row.user_name,
                            totalShares:portfolios[key].totalShares,
                            totalValue:portfolios[key].totalValue
                        })
                    
                    })
                }

                // console.log(user_portfolio)
                console.log("User portfolio",user_portfolio)

                res.render("portfolio.jade",{session:req.session.name,role:role_id,portfolios:user_portfolio})


            });
        }

      

       
    }
    promiseValue();
});

app.get("/balance",function(req,res){
    var promiseQuery = query(req.session.name);
    var balance,portfolio;
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        balance=value[value.length-1].Record.wallet.current_balance
        res.render("balance.jade",{session:req.session.name,balance:balance,role:role_id})
    }
    promiseValue();
});

app.get('/invoke', function (req, res){
    var share_id=req.query.id
    var priceRangeHigh=req.query.priceRangeHigh
    var priceRangeLow=req.query.priceRangeLow
    console.log("Share id :",share_id)
   

    res.render("invoke.jade",{session:req.session.name,role:role_id,id:share_id,priceRangeLow:priceRangeLow,priceRangeHigh:priceRangeHigh})
});
app.get('/query', function (req, res){
    res.render("query.jade",{session:req.session.name,role:role_id})
});
app.get('/signup', function (req, res){
    res.render("signup.jade",{session:req.session.name,role:role_id})
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
            res.render("issuerpanel.jade",{session:req.session.name,role:role_id,agents:agents})


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
        res.render("agentpanel.jade",{session:req.session.name,role:role_id,message:value})
         
        
        

    }
    promiseValue();
    // res.render("agentpanel.jade",{session:req.session.name,role:role_id})

});


app.get("/ipo",function(req,res){
    var promiseQuery = query(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        res.render("ipo.jade",{session:req.session.name,data:value,role:role_id,message:""})
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
        res.render("agentpanel.jade",{session:req.session.name,data:value,role:role_id,message:""})
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
        res.render("invoke.jade", {data: value,session:req.session.name,role:role_id});
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
                res.render("userinfo.jade",{session:req.session.name,role:role_id,userinfo:userinfo})

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
            res.render("signup.jade",{message:"Username already exist",session:req.session.name,role:role_id});
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
               
                res.render("login.jade",{message:"Successfully registered!!",session:req.session.name,role:role_id});

            } catch (error) {
                console.log(error.message);
            }
               
            }
        
      });

});
app.get('/login', function (req, res){
    res.render("login.jade",{session:req.session.name,role:role_id})
});

app.get("/registerauthority",function(req,res){
    res.render("registerauthority.jade",{session:req.session.name,role:role_id})
})


app.post("/registerauthority",function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    var role=req.body.authority;
    console.log(username,password,role)
    res.render("registerauthority.jade",{session:req.session.name,role:role_id})
})



// app.get("/issuerregister",function(req,res){
//     res.render("issuerregister.jade",{session:req.session.name})
// })




app.post("/login", async function(req,res){
    var data;
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
            }
            else{
                role_id = null;
            }
            
            console.log(role_id)
            req.session.name = req.body.username
            sess=req.session.name;
            res.render("index.jade",{session:req.session.name,role:role_id});
        }
        else{
            res.render("login.jade",{message:"please fill out correct details",session:req.session.name,role:role_id});
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


app.listen(3000,function (){
    console.log('fabcar-ui listening on port 3000');
});

