require('daemon')();
var http = require('http');
var https = require('https');
var sys = require('sys');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var execSync = require("exec-sync");
var request = require('request');
var log4js = require('log4js');
var sqlite3 = require("sqlite3").verbose();
var express = require('express');
var dateUtils = require('date-utils');
var ejs = require('ejs');
AIMLInterpreter = require('./AIMLInterpreter');
var tools = require('./scripts/js/tools.js');
var dao = require('./scripts/js/daoUtils.js');

var aimlInterpreter = new AIMLInterpreter({name:'homeRPi', age:'1'});
var logger = log4js.getLogger('dev');
var lastCommand = 'none';
var lastState = 'none';
var dataBaseFile ="./databases/homeRPi.db";
var exists = fs.existsSync(dataBaseFile);
var commandExecuted = false;
var heure_alarme = 7;
var minute_alarme = 0;

var weatherCode = new Array("Thunderstorm", "Drizzle", "Rain", "Snow", "Atmosphere", "Clouds", "Extreme", "Additional");

log4js.configure({
    appenders: [{type: 'console'},
                {type: 'file', filename: 'logs/output.log', category: 'dev'}]
});

// chargement ici des fichier aiml pour le bot
// ,'./aiml/that.aiml'
aimlInterpreter.loadAIMLFilesIntoArray(['./aimlHomeRPi/actionmessagev3.aiml','./aimlHomeRPi/dial.aiml']);

logger.setLevel('DEBUG');

if(!exists) {
  logger.debug("The database 'homeRPi.db' does not exist ! Please, create it and relaunch the server :)");
  process.exit(1);
}

var app = express();

// use this to load static and show main.html -----
app.use(express.static(__dirname+'/speak'));
app.use(express.static(__dirname+'/img'));
app.use(express.static(__dirname+'/css'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/main.html');
});

// ssl security to allow automatically microphone usage => not working correctly
var sslOptions = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
  requestCert: true,
  rejectUnauthorized: false
};
 
var server = https.createServer(sslOptions,app);

// Chargement de socket.io
var io = require('socket.io').listen(server);

var socketID = "-1";

var botResponse = "";

io.sockets.on('connection', function (socket) {
    // public ip adress of the client
	socket.session = socket.request.connection.remoteAddress;
	// unique ID of session
	socketID = socket.id;
	// Quand on client se connecte, on le note dans la console
	logger.debug(socket.session + '/' + socketID + ' est connecté !');

    // Quand le serveur reçoit un signal de type "message" du client    
    socket.on('message', function (message) {
       logger.debug(socket.session +'/'+ socketID + ' me parle ! Il me dit : ' + message);
    });	
	
	socket.on('firstconnection', function (data) {
		var id = data-1;
		var db = new sqlite3.Database(dataBaseFile);
		db.get("SELECT state_device, device from history_action where id="+id, function(err, row) {
			var stateDevice = "N/A";
			var deviceName = "";
			if (err) {
				socket.emit('responseclickaction', "error occurred");
				return;
			}
			if(row.length!=0){
				stateDevice = row.state_device;
			}
			//res.send("Lampe " + req.params.id + " : " + row.state_device);
			if(row.device.indexOf("Lampe")!=-1){
				deviceName = "light";
			}else if(row.device.indexOf("Volet")!=-1){
				deviceName = "store";
			}
			var dataResponse={  
				id : data,  
				state : row.state_device,
				deviceType : deviceName,
				msg : row.device + " : " + row.state_device
			}; 
			socket.emit('responseclickaction', dataResponse);
		});
		db.close();
    });	
	
	/*socket.on('firstconnectionstore', function (data) {
		var id = data-1;
		var db = new sqlite3.Database(dataBaseFile);
		db.get("SELECT state_device from history_action where id="+id, function(err, row) {
			var stateDevice = "N/A";
			if (err) {
				socket.emit('responseclickactionstore', "error occurred");
				return;
			}
			if(row.length!=0){
				stateDevice = row.state_device;
			}
			//res.send("Lampe " + req.params.id + " : " + row.state_device);
			var dataResponse={  
				id : data,  
				state : row.state_device,
				msg : "Volet roulant : " + row.state_device
			}; 
			socket.emit('responseclickactionstore', dataResponse);
		});
		db.close();
    });	*/
	
	socket.on('clickaction', function (data) {
		var id = data.id-1;
		var deviceName = "";
		if(data.deviceType.indexOf("light")!=-1){
			deviceName = "Lampe ";
		}else if(data.deviceType.indexOf("store")!=-1){
			deviceName = "Volet roulant ";
		}
		executeCommandChacon(id, data.state, deviceName + data.id);
		var dataResponse={  
			id : data.id,  
			state : data.state,
			deviceType : data.deviceType,
			msg : deviceName + data.id + " : " + data.state
		};
		socket.emit('responseclickaction', dataResponse);
		socket.broadcast.emit('responseclickaction', dataResponse);
    });	
	
	/*socket.on('clickactionstore', function (data) {
		var id = data.id-1;
		executeCommandChacon(id, data.state, "Volet roulant " + data.id);
		var dataResponse={  
			id : data.id,  
			state : data.state,
			msg : "Volet roulant " + data.id + " : " + data.state
		};
		socket.emit('responseclickactionstore', dataResponse);
		socket.broadcast.emit('responseclickactionstore', dataResponse);
    });	*/
	
	
	// Quand le serveur reçoit un signal de type "speakmessage" du client    
	socket.on('speakmessage', function (message) {
		botResponse = "";
		message = withoutThisChar(message);
		message = withoutAccent(message).toUpperCase();
	    aimlInterpreter.findAnswerInLoadedAIMLFiles(message, callbackSpeakAction);
		//logger.debug("botResponse=" + botResponse);
		if(botResponse.indexOf("ACTIONMESSAGE")!=-1){
			traiteActionMessageSpeak(botResponse);
			botResponse = botResponse.replace("ACTIONMESSAGE","").trim();
		}
		socket.emit('message', botResponse);
    });	
});

server.listen('9093', function(){
  logger.debug("Secure Express server listening on port 9093");
});

var callbackSpeakAction = function(answer, wildCardArray){
	if(answer != "undefined" && typeof answer != 'undefined'){
		logger.debug(answer);
		botResponse = answer;
	}else{
		aimlInterpreter.findAnswerInLoadedAIMLFiles('CATEGORY NOT FOUND', callbackSpeakAction);
	}
};

// on startup of server, call alarm function
alarm();
// updating xbmc database
majXBMC();
// set my name to aiml
aimlInterpreter.findAnswerInLoadedAIMLFiles('je me nomme Fabien', callbackSpeakAction);

function alarm(){
	check_alarm(function(){
		setTimeout (alarm, 1000 * 60);
	});
}

function check_alarm(callback) {
    if (tools.isWakeUp()===true && tools.isNoWorkingDay()===false) {
        logger.debug("Reveil en cours...");
		storeOPEN(2);
        tools.smart_wakeup();
    } 
	callback();
}

function stopStore(){
	exec(lastCommand);
	lastCommand = 'none';
}

function traiteActionMessageAiml(message){
	commandExecuted = false;
	var numeroRecepteur = -1;
	var device_state = -1;	
	var device_name = "";
	logger.debug("MESSAGE SENT : " + message);
	if(message == 'ACTIONMESSAGE OUVERTURE DES VOLETS'){
		storeOPEN(2);
		numeroRecepteur = 2;
		device_state = 'opened';
		device_name = 'Volet roulant';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE FERMETURE DES VOLETS'){
		storeCLOSE(2);
		numeroRecepteur = 2;
		device_state = 'closed';
		device_name = 'Volet roulant';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER TOUTES LES LAMPES'){
		lightON(0);
		lightON(1);
		device_name = 'Lampes';
		numeroRecepteur = 4;
		device_state = 'on';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER LAMPE 1'){
		lightON(0);
		device_name = 'Lampe 1';
		numeroRecepteur = 0;
		device_state = 'on';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER LAMPE 2'){
		lightON(1);
		numeroRecepteur = 1;
		device_name = 'Lampe 2';
		device_state = 'on';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE TOUTES LES LAMPES'){
		lightOFF(0);
		lightOFF(1);
		device_name = 'Lampes';
		numeroRecepteur = 4;
		device_state = 'off';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE LAMPE 1'){
		lightOFF(0);
		numeroRecepteur = 0;
		device_state = 'off';
		device_name = 'Lampe 1';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE LAMPE 2'){
		lightOFF(1);
		numeroRecepteur = 1;
		device_state = 'off';
		device_name = 'Lampe 2';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE MAJ XBMC'){
		majXBMC();
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE STOP STORE'){
		stopStore();
		commandExecuted = true;
	}
	dao.insertOrUpdateCmd(lastCommand, numeroRecepteur, device_name, device_state, message, message);
}

function traiteActionMessageSpeak(message){
	traiteActionMessageAiml(message);
	if(commandExecuted === false){
		//logger.debug("Désolé, je ne connais pas cet ordre !");
		aimlInterpreter.findAnswerInLoadedAIMLFiles('CATEGORY NOT FOUND', callbackSpeakAction);
	}
	return commandExecuted;
}

/*
* fonction destinée a executer des commandes vers les recepteurs RF chacon
* (ouverture store, allumer les lumieres...)
*
*/
function executeCommandChacon(id, state, device_name){
	var actualCommand = './hcc/hcc/radioEmission 7 16801622 ' + id + ' ' + state;
	if(state == "stop"){
		actualCommand = lastCommand;
		lastCommand = "none";
	}
	if((state == "stop" && actualCommand != "none") || lastCommand != actualCommand){
		dao.insertOrUpdateCmd(actualCommand, id, device_name, state, "", "");
		execSync(actualCommand);
	}
	if(state != "stop"){
		lastCommand = actualCommand;
	}
}

/*
* fonction destinée a executer des commandes vers les recepteurs IR
* (allumer la tv, la clim...)
*
*/
function executeCommandIR(){

}

/*
* fonction destinée a executer des commandes shell directement sur l'hote
* (executer un script python, sh, ping...)
*
*/
function executeCommand(){

}

function storeOPEN(numeroStore){
	lastCommand = './hcc/hcc/radioEmission 7 16801622 ' + numeroStore + ' on';
	execSync(lastCommand);
}

function storeCLOSE(numeroStore){
	lastCommand = './hcc/hcc/radioEmission 7 16801622 ' + numeroStore + ' off';
	execSync(lastCommand);
}

function lightON(numeroLampe){
	lastCommand = './hcc/hcc/radioEmission 7 16801622 ' + numeroLampe + ' on';
	execSync(lastCommand);
}

function lightOFF(numeroLampe){
	lastCommand = './hcc/hcc/radioEmission 7 16801622 ' + numeroLampe + ' off';
	execSync(lastCommand);
}

function majXBMC(){
	lastCommand = "./scripts/python/maj_xbmc_database.py";
	execSync(lastCommand);
}

function puts(error, stdout, stderr) { sys.puts(error);sys.puts(stdout);sys.puts(stderr); }

function checkFabienPortable(){
	ping(function(){
		setTimeout (checkFabienPortable, 5000);
	});
}

 function withoutAccent(str){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
     
    //var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }
     
    return str;
}

function withoutThisChar(str){
	var chars = ["-","_","'"];
	for(var i = 0; i < chars.length; i++){
		str = str.replace(chars[i]," ");
	}
	return str;
}


function ping(callback){
	exec("ping -c 1 -w 2  192.168.0.16", putsPing);
	callback();
}

function logCallback(callback){
	logger.debug("DONE");
	callback();
}


function putsPing(error, stdout, stderr) { 
	//sys.puts(stdout) 
	if(stdout.indexOf('0 received')!=-1){
        	sys.puts("Ping KO");
      	}else{
        	sys.puts("Ping OK");
      	}
}
