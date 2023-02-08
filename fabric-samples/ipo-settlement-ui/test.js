import express from "express";


var app = express();
app.set("views", "./test-views");
app.use(express.static("public"));

app.get("/",function(req,res){
    res.render("home.jade")
});

app.get("/login",function(req,res){
    res.render("login.jade")
});


app.get("/register-step1",function(req,res){
    res.render("register-step1.jade")
});

app.get("/register-investor-step3",function(req,res){
    res.render("register-investor-step3.jade")
});


app.get("/register-step2",function(req,res){
    res.render("register-step2.jade")
});

app.get("/ongoing-ipo",function(req,res){
    res.render("ongoing-ipo.jade")
});

app.get("/apply-ipo",function(req,res){
    res.render("apply-ipo.jade")
});

app.get("/upcoming-ipo",function(req,res){
    res.render("upcoming-ipo.jade")
});

app.get("/register-issuer-step3",function(req,res){
    res.render("register-issuer-step3.jade")
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
   });