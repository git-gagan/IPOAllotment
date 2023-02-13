import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express'; // Import express
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { ipoApiInfo } from './client-javascript/utils/api.js';

const app = express(); // Create an instance of express application object
const __dirname = path.resolve();
const port = 8080; // A port number betweem 3000-8000

// defining an array to work as the database (temporary solution)
const ads = [
    {title: 'Hello, world (again)!'}
  ];

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// REST API for information to be shared with regulators
app.get("/api", async function(req, res){
    // Pass the request object to ipoApiInfo
    let info = {
        "status": null,
        "body": {}
    }
    console.log(info);
    let result = await ipoApiInfo(req);
    info['status'] = result[0];
    info['body'] = result[1];
    console.log(info);
    res.json(info);
})

// Get request for root
app.get('/', function(req, res){
    res.sendFile('index.html', {root: __dirname});
})

// Server Starts listening
app.listen(port, ()=>{
    console.log("Server Listening on port: ", port);
})

  

