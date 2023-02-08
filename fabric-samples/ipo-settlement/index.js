const express = require('express'); // Import express
const app = express(); // Create an instance of express application object
const port = 8080; // A port number betweem 3000-8000

const cron = require('node-cron');

// Get request
app.get('/', function(req, res){
    res.sendFile('index.html', {root: __dirname});
})

// Server Starts listening
app.listen(port, ()=>{
    console.log("Server Listening on port: ", port);
})

// Schedule tasks to be run on the server.
// cron.schedule('*/2 * * * * *', function() {
//     console.log('running a task 2 sec');
//   });
  

