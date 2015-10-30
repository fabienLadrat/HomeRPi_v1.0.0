var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
app.use(express.static('../client/'));

var sslOptions = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
  requestCert: true,
  rejectUnauthorized: false
};

var secureServer = https.createServer(sslOptions,app);

secureServer.listen('9093', function(){
  console.log("Secure Express server listening on port 9093");
});
