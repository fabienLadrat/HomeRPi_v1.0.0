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
AIMLInterpreter = require('./AIMLInterpreter');
var tools = require('./scripts/tools.js');

var aimlInterpreter = new AIMLInterpreter({name:'homeRPi', age:'1'});
var logger = log4js.getLogger('dev');
var lastCommand = 'none';
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
//aimlInterpreter.loadAIMLFilesIntoArray(['./test.aiml.xml']);
// ,'./aiml/that.aiml'
aimlInterpreter.loadAIMLFilesIntoArray(['./aimlHomeRPi/actionmessagev3.aiml','./aimlHomeRPi/dial.aiml']);
/*,
'./aiml2/atomique_ed.aiml','./aiml2/comment_ed.aiml','./aiml2/estu_ed.aiml',
'./aiml2/humour_ed.aiml','./aiml2/ou_ed.aiml','./aiml2/pourquoi_ed.aiml',
'./aiml2/quand_ed.aiml','./aiml2/quel_ed.aiml','./aiml2/questceque_ed.aiml',
'./aiml2/qui_ed.aiml','./aiml2/srai_ed.aiml','./aiml2/that_ed.aiml']);

/*
'./aiml/A.aiml','./aiml/apparence.aiml','./aiml/atomique.aiml',
'./aiml/B.aiml','./aiml/botmaster.aiml',
'./aiml/C.aiml','./aiml/calendrier.aiml','./aiml/cest.aiml','./aiml/chngmode.aiml','./aiml/chngvoie.aiml','./aiml/combien.aiml','./aiml/comment.aiml','./aiml/connaissance.aiml','./aiml/connexion.aiml',
'./aiml/D.aiml','./aiml/deduction.aiml',
'./aiml/E.aiml','./aiml/estceque.aiml','./aiml/estu.aiml','./aiml/etranger.aiml','./aiml/exclamation.aiml',
'./aiml/F.aiml','./aiml/feminin.aiml',
'./aiml/G.aiml','./aiml/genre.aiml',
'./aiml/H.aiml','./aiml/humour.aiml',
'./aiml/I.aiml','./aiml/insulte.aiml','./aiml/interjections.aiml','./aiml/interrogation.aiml',
'./aiml/J.aiml',
'./aiml/K.aiml',
'./aiml/L.aiml',
'./aiml/M.aiml','./aiml/masculin.aiml','./aiml/merci.aiml',
'./aiml/N.aiml','./aiml/negation.aiml','./aiml/nom.aiml','./aiml/nombres.aiml',
'./aiml/O.aiml','./aiml/ou.aiml','./aiml/ouinon.aiml',
'./aiml/P.aiml','./aiml/peuxtu.aiml','./aiml/pourquoi.aiml','./aiml/prefixes.aiml','./aiml/profile.aiml',
'./aiml/Q.aiml','./aiml/quand.aiml','./aiml/que.aiml','./aiml/quel.aiml','./aiml/questceque.aiml','./aiml/questions.aiml','./aiml/qui.aiml','./aiml/quoi.aiml',
'./aiml/R.aiml','./aiml/reponses.aiml','./aiml/rumeur.aiml',
'./aiml/S.aiml','./aiml/salutation.aiml','./aiml/sexe.aiml','./aiml/singulier.aiml','./aiml/srai-deduction.aiml','./aiml/srai-insulte.aiml',
'./aiml/srai-sexe.aiml','./aiml/srai.aiml','./aiml/substitueur.aiml','./aiml/suffixes.aiml','./aiml/synonymes.aiml','./aiml/system.aiml',
'./aiml/T.aiml','./aiml/that-questions.aiml','./aiml/that.aiml',
'./aiml/U.aiml',
'./aiml/V.aiml',
'./aiml/W.aiml',
'./aiml/X.aiml',
'./aiml/Z.aiml']);*/

logger.setLevel('DEBUG');

// URL for merignac : http://api.openweathermap.org/data/2.5/forecast/daily?lat=44.8333&lon=-0.6333&mode=json&units=metric&lang=fr
	//var  url = 'http://api.openweathermap.org/data/2.5/forecast/daily?lat='+latitude+'&lon='+longitude+'&mode=json&units=metric&lang=fr';

if(!exists) {
  logger.debug("The database 'homeRPi.db' does not exist ! Please, create it and relaunch the server :)");
}

var db = new sqlite3.Database(dataBaseFile);

var app = express();

// use this -----
app.use(express.static(__dirname+'/speak'));
app.use(express.static(__dirname+'/img'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/main.html');
});
/*
app.get('/speak', function(req, res){
    res.sendFile(__dirname + '/v3.html');
});*/
// use this -----

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

// Quand on client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
//    console.log('Un client est connecté : ', socket.request.connection.remoteAddress);
  //  console.log('connection :', socket.request.connection._peername);
    socket.session = socket.request.connection.remoteAddress;
	socketID = socket.id;
	logger.debug(socket.session + '/' + socketID + ' est connecté !');

    // Quand le serveur reçoit un signal de type "message" du client    
    socket.on('message', function (message) {
       logger.debug(socket.session +'/'+ socketID + ' me parle ! Il me dit : ' + message);
    });	
	
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
	   //socket(socketID).emit('message','TG');
	   //socket..emit('message', 'Un client vient de se connecter avec l id suivant : ' + socketID);
    });	
	
	socket.on('actionmessage', function (message) {
		var ret = traiteActionMessageClick(withoutAccent(message).toUpperCase());
		if(ret === false){
			logger.debug("Aucune commande n'a été executée : " + message);
		}else{
			socket.emit('message', 'Commande executée correctement !');
		}
    });	

});

server.listen('9093', function(){
  logger.debug("Secure Express server listening on port 9093");
});

var callbackSpeakAction = function(answer, wildCardArray){
	if(answer != "undefined" && typeof answer != 'undefined'){
		logger.debug(answer + ' | ' + wildCardArray);
		botResponse = answer;
	}else{
		//logger.debug("answer = " + answer);
		//logger.debug("Desole, je n'ai pas compris.");
		//botResponse = "Desolé, je n'ai pas compris.";
		aimlInterpreter.findAnswerInLoadedAIMLFiles('CATEGORY NOT FOUND', callbackSpeakAction);
	}
};
/*
var openweathermeteo = function(latitude, longitude, cityname, country, callback){
	var urlMeteo = 'http://api.openweathermap.org/data/2.5/weather?q='+cityname+','+country+'&mode=json&units=metric&lang=fr';
	
	request(urlMeteo, function(err, response, body){
		try{
			var result = JSON.parse(body);
			var previsions = {
				temperature : result.main.temp,
				city : result.name,
				description_precipitation : result.weather[0].description,
				description_code : result.weather[0].main,
				wind_speed : result.wind.speed
			};
			  		
			callback(null, previsions);
		}catch(e){
			callback(e); 
		}
	});
}*/

//tools.smart_wakeup();
//logger.debug(tools.bar);
//console.log(tools);
//getJourFerie();
alarm();
aimlInterpreter.findAnswerInLoadedAIMLFiles('je me nomme Fabien', callbackSpeakAction);
//var check_alarme_interval = setTimeout(check_alarm, 1000 * 60);

function check_alarm(callback) {
    //console.log("------Check alarm-----"); && getJourFerie()==0
    var date = new Date();
    var heure_actuelle = date.getHours();
    var minute_actuelle = date.getMinutes();
	var weekDay = date.getDay();
    if (isWakeUp()===true && isNoWorkingDay()===false) {
        logger.debug("Reveil en cours...");
		storeOPEN(2);
        tools.smart_wakeup();
    } 
	/*else {
        console.log(heure_alarme + ":" + minute_alarme + "=Pas de reveil");
    }*/
	callback();
}

function isWakeUp(){
	var wakeUp = false;
	var date = new Date();
    var heure_actuelle = date.getHours();
    var minute_actuelle = date.getMinutes();
	var weekDay = date.getDay();
    if (heure_alarme == heure_actuelle && minute_alarme == minute_actuelle && weekDay != 0 && weekDay != 6) {
		wakeUp = true;
    }
	return wakeUp;
}

function alarm(){
	check_alarm(function(){
		setTimeout (alarm, 1000 * 60);
	});
}
/*
//Array("Thunderstorm", "Drizzle", "Rain", "Snow", "Atmosphere", "Clouds", "Extreme", "Additional");
function smart_wakeup() {
	openweathermeteo(latitude_global, longitude_global, city_global, country_global, function(err, previsions){
		if(err) return logger.debug(err);

		logger.debug('A ' + previsions.city + ', la température est de ' + previsions.temperature + '°C');
		//logger.debug("description_code : " + previsions.description_code);
		//logger.debug("description_precipitation : " + previsions.description_precipitation);
		if(previsions.description_code == 'Rain'){
			logger.debug('Risques de ' + previsions.description_precipitation + ' dans la journée, il serait judicieux de prendre un parapluie !');
		}
		if(previsions.description_code == 'Thunderstorm'){
			logger.debug('Attention, ' + previsions.description_precipitation + ' annoncé ! Tous aux abris !');
		}
		if(previsions.description_code == 'Drizzle'){
			logger.debug('De legères ' + previsions.description_precipitation + ' sont annoncées dans la journée.');
		}
		if(previsions.description_code == 'Snow'){
			logger.debug(previsions.description_precipitation + ' annoncées dans la journée, prépare les chaines !');
		}
		if(previsions.description_code == 'Clouds'){
			logger.debug('Le temps est ' + previsions.description_precipitation + '.');
		}
		if(previsions.description_code == 'Clear'){
			logger.debug('Le temps est ' + previsions.description_precipitation + '. Enjoy !!');
		}
		logger.debug(analyseWind(previsions.wind_speed));
	});
}*/

function stopStore(){
	exec(lastCommand);
	lastCommand = 'none';
}
/*
function analyseWind(windSpeed){
	var msg = "";
	if(windSpeed <= 10){
		msg = "Le vent est calme aujourd'hui";
		return msg;
	}
	if(windSpeed < 20){
		msg = "Le vent souffle legerement aujourd'hui";
		return msg;
	}
	if(windSpeed < 40){
		msg = "Le vent souffle beaucoup aujourd'hui, couvre toi !";
		return msg;
	}
	if(windSpeed < 60){
		msg = "Le vent souffle tres fort aujourd'hui, couvre toi !";
		return msg;
	}
	if(windSpeed > 90){
		msg = "C'est la tempete ! Tous aux abris !";
		return msg;
	}
	if(windSpeed > 60){
		msg = "Tres impotantes raffales de vent, habille toi correctement!";
		return msg;
	}
}*/

/*
function logger(message){
	console.log(getFormattedDate() + ' : ' + message);
}*/
/*
function parseActionMessage(message){
	var splitted = message.split(" ");
	for(var i= 0; i < splitted.length; i++){
		 document.write(x[i]);
	}
}
*/
// properties contenant les instructions potentielles :
/*
allume.lampe
allume.lampe.droite
allume.lampe.fenetre
allume.lampe.cote.fenetre
allume.lampe.numero.1
allume.lampe.1
allume.lampe.une
*/
function traiteActionMessageAiml(message){
	commandExecuted = false;
	var numeroRecepteur = -1;
	var device_state = -1;	
	var device_name = "";
	logger.debug("MESSAGE SENT : " + message);
	if(message == 'ACTIONMESSAGE OUVERTURE DES VOLETS'){
		storeOPEN(2);
		numeroRecepteur = 3;
		device_state = 'open';
		device_name = 'store';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE FERMETURE DES VOLETS'){
		storeCLOSE(2);
		numeroRecepteur = 3;
		device_state = 'close';
		device_name = 'store';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER TOUTES LES LAMPES'){
		lightON(0);
		lightON(1);
		device_name = 'lampes';
		numeroRecepteur = 4;
		device_state = 'on';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER LAMPE 1'){
		lightON(0);
		device_name = 'lampe 1';
		numeroRecepteur = 0;
		device_state = 'on';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ALLUMER LAMPE 2'){
		lightON(1);
		numeroRecepteur = 1;
		device_name = 'lampe 2';
		device_state = 'on';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE TOUTES LES LAMPES'){
		lightOFF(0);
		lightOFF(1);
		device_name = 'lampes';
		numeroRecepteur = 4;
		device_state = 'off';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE LAMPE 1'){
		lightOFF(0);
		numeroRecepteur = 0;
		device_state = 'off';
		device_name = 'lampe 1';
		commandExecuted = true;
	}
	if(message == 'ACTIONMESSAGE ETEINDRE LAMPE 2'){
		lightOFF(1);
		numeroRecepteur = 1;
		device_state = 'off';
		device_name = 'lampe 2';
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
	//insertOrUpdateCmd(command, id, device_name, device_state, vocal_action, text_action);	
	insertOrUpdateCmd(lastCommand, numeroRecepteur, device_name, device_state, message, message);
}

function traiteActionMessageClick(message){
	traiteActionMessageAiml(message);
	if(commandExecuted === false){
		//logger.debug("Désolé, je ne connais pas cet ordre !");
		aimlInterpreter.findAnswerInLoadedAIMLFiles('CATEGORY NOT FOUND', callbackSpeakAction);
	}
	return commandExecuted;
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
function traiteActionMessage(message,socket){
	message = withoutAccent(message).toLowerCase();
	var numeroRecepteur = -1;
	var device_state = -1;	
	var device_name = "";
	commandExecuted = false;
    logger.debug(socket.session + ' execute : ' + message);
	if(message.indexOf("allume")!=-1 && (message.indexOf("lampe")!=-1 || message.indexOf("lumiere")!=-1) && message.indexOf("pas")==-1){
		if((message.indexOf("1")!=-1 && message.indexOf("numero")!=-1) 
			|| message.indexOf("gauche")!=-1 || (message.indexOf("fenetre")!=-1 && message.indexOf("cote") !=-1)){
			lightON(0);
			numeroRecepteur = 0;
			device_state = 'on';
			commandExecuted = true;
		}else if((message.indexOf("2")!=-1 && message.indexOf("numero")!=-1) 
			|| message.indexOf("droite")!=-1 || (message.indexOf("bar")!=-1 && message.indexOf("cote") !=-1)){
			lightON(1);
			device_state = 'on';
			numeroRecepteur = 1;
			commandExecuted = true;
		}else {
			lightON(0);
			lightON(1);
			device_state = 'on';
			numeroRecepteur = 2;
			commandExecuted = true;
		}
		device_name = 'Lampe '+numeroRecepteur;
	}
	if((message.indexOf("etein")!=-1 || message.indexOf("eteindre")!=-1) && (message.indexOf("lampe")!=-1 || message.indexOf("lumiere")!=-1) && message.indexOf("pas")==-1){
		if((message.indexOf("1")!=-1 && message.indexOf("numero")!=-1) 
			|| message.indexOf("gauche")!=-1 || (message.indexOf("fenetre")!=-1 && message.indexOf("cote") !=-1)){
			lightOFF(0);
			device_state = 'off';
			numeroRecepteur = 0;
			commandExecuted = true;
		}else if((message.indexOf("2")!=-1 && message.indexOf("numero")!=-1) 
			|| message.indexOf("droite")!=-1 || (message.indexOf("bar")!=-1 && message.indexOf("cote") !=-1)){
			lightOFF(1);
			device_state = 'off';
			numeroRecepteur = 1;
			commandExecuted = true;
		}else {
			lightOFF(0);
			lightOFF(1);
			device_state = 'off';
			numeroRecepteur = 2;
			commandExecuted = true;
		}
		device_name = 'Lampe '+numeroRecepteur;
	}
	if(message.indexOf("xbmc")!=-1){
		majXBMC();
		commandExecuted = true;
	}
	if(message.indexOf("volet")!=-1 || message.indexOf("roulant")!=-1 || message.indexOf("store")!=-1){
		if((message.indexOf("monte")!=-1 || message.indexOf("ouvre")!=-1) && message.indexOf("pas")==-1){
			storeOPEN(2);
			device_state = 'open';
			commandExecuted = true;
		}else if((message.indexOf("baisse")!=-1 || message.indexOf("ferme")!=-1) && message.indexOf("pas")==-1){
			storeCLOSE(2);
			device_state = 'close';
			commandExecuted = true;
		}
		device_name = 'Volet roulant';
	}
	if(message.indexOf("stop")!=-1 || message.indexOf("arret")!=-1 || (message.indexOf("pas")!=-1 && message.indexOf("ferme")!=-1) || (message.indexOf("pas")!=-1 && message.indexOf("ouvre")!=-1)){
		stopStore();
		device_state = 'stopped';
		device_name = 'Volet roulant';
		commandExecuted = true;
	}
	if(commandExecuted === false){
		logger.debug("Désolé, je ne connais pas cet ordre !");
	}else{
		insertOrUpdateCmd(lastCommand, numeroRecepteur, device_name, device_state, "", message);
	}
}
*/
function isNoWorkingDay(){
	var today = new Date();
	var yyyy = today.getFullYear();
	var JourAn = new Date(yyyy, "0", "1");
	var FeteTravail = new Date(yyyy, "4", "1");
	var Victoire1945 = new Date(yyyy, "4", "8");
	var FeteNationale = new Date(yyyy,"6", "14");
	var Assomption = new Date(yyyy, "7", "15");
	var Toussaint = new Date(yyyy, "10", "1");
	var Armistice = new Date(yyyy, "10", "11");
	var Noel = new Date(yyyy, "11", "25");
	var Ascension = new Date(yyyy, "4", "14");
	var noWorkingDay = false;

	// VendrediSaint, Paques, LundiPaques, Ascension, Pentecote, LundiPentecote, 
	
	var tabJourFerie = new Array(JourAn, FeteTravail, Victoire1945, FeteNationale, Assomption, Toussaint, Armistice, Noel, Ascension);

	for(var i = 0; i < tabJourFerie.length; i++){
		if(dateEquals(today,tabJourFerie[i])===true){
			noWorkingDay = true;
		}
    }
	return noWorkingDay;
}

function dateEquals(d1, d2){
	var sameDate = true;
	if(d1.getDate()!=d2.getDate()){
		sameDate = false;
	}
	if(d1.getMonth()!=d2.getMonth()){
		sameDate = false;
	}
	if(d1.getFullYear()!=d2.getFullYear()){
		sameDate = false;
	}
	return sameDate;
}

function getFormattedDate(){
	var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
	var hh = today.getHours();
    var mi = today.getMinutes();
    var ss = today.getSeconds();
	
	if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
	if(hh<10){
        h='0'+hh;
    } 
	if(mi<10){
        mi='0'+mi;
    } 
	if(ss<10){
        ss='0'+ss;
    } 
    var today = dd+'/'+mm+'/'+yyyy + ' ' + hh + ':' + mi + ':' + ss;
    return today;
}

/*
* fonction destinée a executer des commandes vers les recepteurs RF chacon
* (ouverture store, allumer les lumieres...)
*
*/
function executeCommandChacon(){
	
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
	lastCommand = "./scripts/maj_xbmc_database.py";
	execSync(lastCommand);
}

function insertOrUpdateCmd(command, id, device_name, device_state, vocal_action, text_action){
	//Perform SELECT Operation
	//db.all("SELECT count(*) as nb from history_action where id="+id,function(err,rows){
	//rows contain values while errors, well you can figure out.
		
	//});
	
	db.each("SELECT count(*) as nb from history_action where id="+id, function(err, row) {
		logger.debug("nb row for id "+id+" : " + row.nb);
		if(row.nb==0){
			//Perform INSERT operation.
			//db.run("INSERT into table_name(col1,col2,col3) VALUES (val1,val2,val3)");
			db.run("insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (?,?,?,?,?,?,?)", id, command, new Date(), device_name, device_state, text_action, vocal_action);

		}else{
			//Perform UPDATE operation
			db.run("UPDATE history_action set command_executed=?, date_last_execution=?, state_device=?, text_action=?, vocal_action=? where id=?", command, new Date(), device_state, text_action, vocal_action);
		}
	});

	

	//Perform DELETE operation
	//db.run("DELETE * from table_name where condition");

	
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
