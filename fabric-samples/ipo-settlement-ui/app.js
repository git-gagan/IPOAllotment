
// Fabcar commandline client for enrolling and Admin
var enrollAdmin = require("./handlers/enrollAdmin");
var registerUser = require("./handlers/registerUser");
var invoke = require("./handlers/invoke");
var query = require("./handlers/query");
var startBid=require("./handlers/startBid");
const sqlite3 = require('sqlite3');
const session = require('express-session')

/////////////////////////////////////////
// Express setup
var express = require("express");
var bodyParser = require('body-parser')
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


const db = new sqlite3.Database('./ipo.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {

        db.run('CREATE TABLE tbl_role(\
            role_id int primary key,\
            role_name varchar\
            )', (err) => {
            if (err) {
                console.log("Table already exists.");
            }
        });


        db.run('CREATE TABLE tbl_user(\
            user_id int primary key,\
            user_name varchar(50),\
            user_pwd varchar(20)\
            )', (err) => {
            if (err) {
                console.log("Table already exists.");
            }
        });


        db.run('CREATE TABLE tbl_userrole(\
            user_id varchar(50) primary key,\
            role_id varchar(50),\
            Foreign key (role_id) references tbl_role(role_id), \
            foreign key (user_id) references tbl_user(user_id) ,\
            user_pwd varchar(20)\
            )', (err) => {
            if (err) {
                console.log("Table already exists.");
            }
        });
    
        
    }
});

/////////////////////////////////////////
// VIEWS
app.get('/', function (req, res){
    if(req.session.name){
        res.render("index.jade",{session:req.session.name})
    }
    else{
        res.render("index.jade")
    }
});
app.get('/enroll', function (req, res){
    res.render("enroll.jade",{session:req.session.name})
});
app.get('/register', function (req, res){
    res.render("register.jade",{session:req.session.name})
});
app.get('/invoke', function (req, res){
    res.render("invoke.jade",{session:req.session.name})
});
app.get('/query', function (req, res){
    res.render("query.jade",{session:req.session.name})
});
app.get('/signup', function (req, res){
    res.render("signup.jade",{session:req.session.name})
});
app.get('/issuerpanel', function (req, res){
    var promiseInvoke = query.queryTransaction(req.session.name);
    var promiseValue = async () => {
        const value = await promiseInvoke;
        console.log(value);
        // res.render("invoke.jade", {data: value,session:req.session.name});
        // if (value != undefined && value.length > 0){
        //     res.render("issuerpanel.jade",{session:req.session.name,data: value})
        // }else{
        //     res.render("issuerregister.jade",{session:req.session.name})
        // }

        res.render("issuerpanel.jade",{session:req.session.name,data: value})

    }
    promiseValue();

});
app.get('/agentpanel', function (req, res){
    var promiseInvoke = query.queryTransaction(req.session.name);
    var promiseValue = async () => {
        const value = await promiseInvoke;
        console.log(value);
        res.render("agentpanel.jade",{session:req.session.name,data: value})

    }
    promiseValue();

});
app.post("/actionInvoke",function(req,res){
    var lotQuantity=req.body.lotQuantity;
    var bidperShare=req.body.bidperShare;
    console.log("lot quantity:",lotQuantity);
    console.log("bid per share:",bidperShare);
    var promiseInvoke = invoke.invokeTransaction(req.session.name,lotQuantity,bidperShare);
    var promiseValue = async () => {
        const value = await promiseInvoke;
        console.log(value);
        res.render("invoke.jade", {data: value,session:req.session.name});
    };
    promiseValue();


});
app.post("/signup",function (req, res) {
    console.log(req.body);
    var username = req.body.username
    var password = req.body.password
    db.get(`SELECT * FROM user where username = ?`, [req.body.username], (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          console.log(error.message);
          return;
       }
        else if(row){
            res.render("signup.jade",{message:"Username already exist",session:req.session.name});
        }
        else{
            let insert = 'INSERT INTO user (username, password) VALUES (?,?)';
            try {
                db.run(insert, [username,password]);
                var promiseRegisterUser = registerUser.register(username);
                var promiseValue = async () => {
                    const value = await promiseRegisterUser;
                    console.log(value);
                };
                promiseValue();
                res.render("login.jade",{message:"Successfully registered!!",session:req.session.name});
            } catch (error) {
                console.log(error.message);
            }
               
            }
        
      });

});
app.get('/login', function (req, res){
    res.render("login.jade",{session:req.session.name})
});

app.get("/registerauthority",function(req,res){
    res.render("registerauthority.jade",{session:req.session.name})
})


app.post("/registerauthority",function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    var role=req.body.authority;
    console.log(username,password,role)
    res.render("registerauthority.jade",{session:req.session.name})
})


// app.get("/issuerregister",function(req,res){
//     res.render("issuerregister.jade",{session:req.session.name})
// })


app.post("/login",function(req,res){
    
    db.get(`SELECT * FROM user where username = ? and password = ?`, [req.body.username,req.body.password], (err, row) => {
        console.log(row);
        if(err){
            res.status(400).json({"error":err.message});
            console.log(error.message);
            return;
        }
        
        else if(req.body.username=="admin" && req.body.password=="admin"){
            req.session.name = req.body.username
            sess=req.session.name;
            res.render("index.jade",{session:req.session.name});

        }

        else if(row){
            // user=req.body.username

            req.session.name = req.body.username
            sess=req.session.name;
            res.render("index.jade",{session:req.session.name});
        }
        else{
            res.render("login.jade",{message:"please fill out correct details",session:req.session.name});
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
        res.render("enroll.jade", {data: value,session:req.session.name});
    };
    promiseValue();
});
app.get('/actionRegisterUser', function (req, res){
    //var promiseRegisterUser = registerUser.log();
    var promiseRegisterUser = registerUser.register();
    var promiseValue = async () => {
        const value = await promiseRegisterUser;
        console.log(value);
        res.render("register.jade", {data: value,session:req.session.name});
    };
    promiseValue();
});
app.get('/actionInvoke', function (req, res){
    //ar promiseInvoke = invoke.log();
    var promiseInvoke = invoke.invokeTransaction();
    var promiseValue = async () => {
        const value = await promiseInvoke;
        console.log(value);
        res.render("invoke.jade", {data: value,session:req.session.name});
    };
    promiseValue();
});
app.get('/actionQuery', function (req, res){
    //var promiseQuery = query.log();
    var promiseQuery = query.queryTransaction(req.session.name);
    var promiseValue = async () => {
        const value = await promiseQuery;
        console.log(value);
        res.render("query.jade", {data: value,session:req.session.name});
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
        res.render("issuerpanel.jade", {message: value,session:req.session.name,data:data});
    }; 
    promiseValue();   
})


app.listen(3000,function (){
    console.log('fabcar-ui listening on port 3000');
});

