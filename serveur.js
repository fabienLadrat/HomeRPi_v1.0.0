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
//var router = express.Router();
var routes = require('./scripts/js/router');
var app = express();

app.use('/', routes);

// use this to load static and show main.html -----
app.use(express.static(__dirname+'/speak'));
app.use(express.static(__dirname+'/img'));
app.use(express.static(__dirname+'/css'));
 
//var server = https.createServer(sslOptions,app);
var server = http.createServer(app);

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
	
	socket.emit('newmessage', "Bienvenue " + socketID);

    // Quand le serveur reçoit un signal de type "message" du client    
    socket.on('message', function (message) {
       logger.debug(socket.session +'/'+ socketID + ' me parle ! Il me dit : ' + message);
    });	
	
	socket.on('firstconnection', function (data) {
		dao.getFirstConnection(data, function (dataResponse) {
			//logger.debug("socket firstconnection");
			socket.emit('responseclickaction', dataResponse);			
		});
    });	

	
	socket.on('clickaction', function (data) {
		dao.getClickAction(data, function (dataResponse) {
			tools.executeCommandChacon(dataResponse.physical_id, dataResponse.state, dataResponse.device_libelle, "", "");
			socket.emit('responseclickaction', dataResponse);
			socket.broadcast.emit('responseclickaction', dataResponse);				
		});
    });	
	
	socket.on('getDeviceList', function (callback) {
		dao.getDeviceList("", function (dataResponse) {
			dataResponse.forEach(function(device) {
				logger.debug(device.id + " | " + device.deviceLibelle + " | " + device.physicalId + " | " + device.deviceName);
			});
		});
    });	

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
	
	
	socket.on('localisationmessage', function (msg) {
		logger.debug(msg);
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

// set my name to aiml
aimlInterpreter.findAnswerInLoadedAIMLFiles('je me nomme Fabien', callbackSpeakAction);
// init variable to stock sun hour 
var sunHour = tools.getSunHour();
// call nodeCron function
nodeCronReveil();
nodeCronActivities();
// updating xbmc database
//majXBMC();

tools.sendNotification("Lancement du serveur nodejs OK !");

function nodeCronReveil(){
	check_nodeCronReveil(function(){
		setTimeout (nodeCronReveil, 1000 * 60);
	});
}

function nodeCronActivities(){
	check_nodeCronActivities(function(){
		setTimeout (nodeCronActivities, 5000 * 60);
	});
}

/*
* fonction appelée toute les minutes pour effectuer des traitements cron
*
*/
function check_nodeCronReveil(callback) {
    wakeUp();
	callback();
}

/*
* fonction appelée toute les 5 minutes pour effectuer des traitements cron
*
*/
function check_nodeCronActivities(callback) {
	if(typeof sunHour !== 'undefined'){
		startOfDay();
		endOfDay();
	}
	callback();
}

/*
* fonction reveil, meteo et ouverture store
*/
function wakeUp(){
	if (tools.isWakeUp()===true && tools.isNoWorkingDay()===false) {
        logger.debug("Reveil en cours...");
		startOfDay();
		// get etat store
		/*dao.getParamValueByName('etat_store', function (etat) {
			logger.debug("wakeUp() : etatStore : " + etat);
			if(typeof sunHour !== 'undefined'){
				if((etat === "closed" || etat === "N/A" ) && tools.isTimeToOpenStore(sunHour)===true){
					logger.debug("wakeUp() : Ouverture des stores...");
					var message = "CRON OUVERTURE DES VOLETS";
					tools.executeCommandChacon(2, "on", "Volet roulant", message, message);
					dao.updateParamsTable("etat_store","opened");
					tools.sendNotification("Ouverture des stores");
				}
			}			
		});*/
		// TODO allumer lampe chambre
		tools.smart_wakeup();
    } 
}

/*
* fonction qui check si faut ouvrir les volets
*/
function startOfDay(){
	// get etat store
	dao.getParamValueByName('etat_store', function (etat) {
		//logger.debug("startOfDay() : etatStore : " + etat);
		if(typeof sunHour !== 'undefined'){
			if((etat === "closed" || etat === "N/A" ) && tools.isTimeToOpenStore(sunHour)===true 
				&& tools.isNoWorkingDay()===false){
				logger.debug("startOfDay() : Ouverture des stores...");
				var message = "CRON OUVERTURE DES VOLETS";
				tools.executeCommandChacon(4, "on", "Volet roulant", message, message);
				dao.updateParamsTable("etat_store","opened");
				tools.sendNotification("Ouverture des stores");
				// TODO implemente extinction lumiere salon si necessaire
			}
		}
	});
}

/*
* fonction qui check si faut fermer les volets
*/
function endOfDay(){
	// get etat store
	dao.getParamValueByName('etat_store', function (etat) {
		//logger.debug("endOfDay() : etatStore : " + etat);
		if(typeof sunHour !== 'undefined'){
			if((etat === "opened" || etat === "N/A" ) && tools.isTimeToCloseStore(sunHour)===true){
				logger.debug("endOfDay() : Fermeture des stores...");
				var message = "CRON FERMETURE DES VOLETS";
				tools.executeCommandChacon(4, "off", "Volet roulant", message, message);
				dao.updateParamsTable("etat_store","closed");
				dao.getParamValueByName('home_presence', function (homePresence) {
					if(homePresence === 'true'){
						tools.executeCommandChacon(5, "on", "Lampe 1", message, message);
						tools.executeCommandChacon(6, "on", "Lampe 2", message, message);
						message = ", allumage du salon.";
					}
				});
				tools.sendNotification("Fermeture des stores" + message);
			}	
		}
	});
}

function stopStore(){
	exec(lastCommand);
	lastCommand = 'none';
}

function traiteActionMessageAiml(message){
	commandExecuted = false;
	logger.debug("MESSAGE SENT : " + message);
	if(message == 'ACTIONMESSAGE OUVERTURE DES VOLETS'){
		executeCommandChacon(4, 'on', 'Volet roulant', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE FERMETURE DES VOLETS'){
		executeCommandChacon(4, 'off', 'Volet roulant', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER TOUTES LES LAMPES'){
		executeCommandChacon(5, 'on', 'Lampe 1', message, message);
		executeCommandChacon(6, 'on', 'Lampe 2', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER LAMPE 1'){
		executeCommandChacon(5, 'on', 'Lampe 1', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER LAMPE 2'){
		executeCommandChacon(6, 'on', 'Lampe 2', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE TOUTES LES LAMPES'){
		executeCommandChacon(5, 'off', 'Lampe 1', message, message);
		executeCommandChacon(6, 'off', 'Lampe 2', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE LAMPE 1'){
		executeCommandChacon(5, 'off', 'Lampe 1', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE LAMPE 2'){
		executeCommandChacon(6, 'off', 'Lampe 2', message, message);
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE MAJ XBMC'){
		majXBMC();
		commandExecuted = true;
		dao.insertOrUpdateCmd(lastCommand, -1, device_name, device_state, message, message);
	}
	if(message == 'ACTIONMESSAGE STOP STORE'){
		executeCommandChacon(4, 'stop', 'Volet roulant', message, message);
		commandExecuted = true;
	}
	//dao.insertOrUpdateCmd(lastCommand, numeroRecepteur, device_name, device_state, message, message);
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
