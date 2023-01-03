
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


// var invoke = require("./handlers/invoke");
// var query = require("./handlers/query");
// var startBid=require("./handlers/startBid");
// const sqlite3 = require('sqlite3');
// const session = require('express-session')
import session from "express-session";
import sqlite3 from "sqlite3";
import express from "express";
import bodyParser from "body-parser";


import { v4 as uuidv4 } from 'uuid';

/////////////////////////////////////////
// Express setup
// var express = require("express");
// var bodyParser = require('body-parser')
var app = express();
app.set("views", "./views");
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  
    // It holds the secret key for session
    secret: 'test',
  
    // Forces the session to be saved
    // back to the session store
    resave: true,
  
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
app.get('/invoke', function (req, res){
    res.render("invoke.jade",{session:req.session.name,role:role_id})
});
app.get('/query', function (req, res){
    res.render("query.jade",{session:req.session.name,role:role_id})
});
app.get('/signup', function (req, res){
    res.render("signup.jade",{session:req.session.name,role:role_id})
});
app.get('/issuerpanel', function (req, res){
    // var promiseInvoke = query.queryTransaction(req.session.name);
    // var promiseValue = async () => {
    //     const value = await promiseInvoke;
    //     console.log(value);
        // res.render("invoke.jade", {data: value,session:req.session.name});
        // if (value != undefined && value.length > 0){
        //     res.render("issuerpanel.jade",{session:req.session.name,data: value})
        // }else{
        //     res.render("issuerregister.jade",{session:req.session.name})
        // }

        res.render("issuerpanel.jade",{session:req.session.name,role:role_id})

    }
    // promiseValue();
);


app.post("/issuerpanel",function(req,res){
    

});

app.get('/agentpanel', function (req, res){
    var promiseInvoke = query.queryTransaction(req.session.name);
    var promiseValue = async () => {
        const value = await promiseInvoke;
        console.log(value);
        res.render("agentpanel.jade",{session:req.session.name,data: value,role:role_id})

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
            var promiseRegister;
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
                    console.log(value);
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

