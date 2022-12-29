import express from 'express';

const app = express();
const port = 8000;

app.get("/", function(req, res){
    res.send("GET request to Homepage!");
})