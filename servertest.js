var log4js = require('log4js');
var logger = log4js.getLogger('dev');
var express = require('express');
var tools = require('./scripts/js/tools.js');
var dao = require('./scripts/js/daoUtils.js');
var bodyParser = require('body-parser');
var sunHour = tools.getSunHour();
var tabStatic = [];
tabStatic.push(sunHour);

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.end('Developpement et test de modules');
});


app.get('/testmodule', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
	var modulename = "athome";
	var module = require('./modules/'+modulename);
	module.exec(tabStatic);
    res.sendStatus(1);
});

app.get('/test', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
	//tools.executeCommandChacon(5, "on", "Lampe 1", "", "");
	//tools.executeCommandChacon(6, "on", "Lampe 2", "", "");
	dao.getDeviceStateById(4,function(ret){
		// console.log(ret);
		res.end(ret.deviceState);
	});
    
});

app.post('/testinsertdevice', function(req, res) {
	var jsonDeviceIn = req.body.device[0];
    dao.insertNewDevice(jsonDeviceIn, function (id) {
		res.end(JSON.stringify(id));
	});
});

app.post('/testupdatedevice', function(req, res) {
	var jsonDeviceIn = req.body.device[0];
    dao.updateExistingDevice(jsonDeviceIn, function (id) {
		res.end(JSON.stringify(id));
	});
});


app.get('/devicelist', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
	//tools.executeCommandChacon(5, "on", "Lampe 1", "", "");
	//tools.executeCommandChacon(6, "on", "Lampe 2", "", "");
	dao.getDeviceListV2(function(ret){
		// console.log(ret);
		// console.log(ret);
		res.end(JSON.stringify(ret));
	});
    
});

app.get('/countdevice', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
	//tools.executeCommandChacon(5, "on", "Lampe 1", "", "");
	//tools.executeCommandChacon(6, "on", "Lampe 2", "", "");
	dao.countDeviceByPhysicalId(4, function(ret){
		// console.log(ret);
		// console.log(ret);
		if(ret !== 0){
			res.end("1");
		}else{
			res.end("0");
		}
	});
    
});




//app.listen(8080);
/*
var http = require("http");
var server = http.createServer(function(request, response) {
	var modulename = "athome";
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write("<html>");
  response.write("<head>");
  response.write("<title>Server TEST fabienladrat11</title>");
  response.write("</head>");
  response.write("<body>");
  response.write("Developpement et test de modules");
  response.write("</body>");
  response.write("</html>");
  response.end();
  /*var module = require('./modules/'+modulename);
  module.exec(function(ret){
		response.write(ret.homePresence);
  });
  //response.end();
});*/


app.listen('9099', function(){
  logger.debug("Express server TEST listening on port 9099");
});

