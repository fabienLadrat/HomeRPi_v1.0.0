// tools.js
// ======== common constantes ========
var log4js = require('log4js');
var request = require('request');
var syncrequest = require('sync-request');
var logger = log4js.getLogger('dev');
logger.setLevel('DEBUG');
var dao = require('./daoUtils.js');
var execSync = require("exec-sync");
// ======== restrict constantes ========
var latitude_global = 44.832481;
var longitude_global = -0.63381;
var apikey = "4a5463f01ddb8f87a4778dd7fa8b81a2";
var city_global = 'Merignac';
var country_global = 'fr';
var heure_alarme = 7;
var minute_alarme = 0;
var lastCommand = 'none';


// ========

exports.smart_wakeup = function () {
	//Array("Thunderstorm", "Drizzle", "Rain", "Snow", "Atmosphere", "Clouds", "Extreme", "Additional");
    openweathermeteo(latitude_global, longitude_global, city_global, country_global, apikey, detailmeteo);
};

exports.getSunHour = function () {
	return syncopenweathermeteo(latitude_global, longitude_global, city_global, country_global, apikey);
};

exports.isWakeUp = function (){
	return isWakeUpFunction();
};

exports.isTimeToOpenStore = function (hour){
	return isTimeToOpenStoreFunction(hour);
};

exports.isTimeToCloseStore = function (hour){
	return isTimeToCloseStoreFunction(hour);
};

exports.isNoWorkingDay = function (){
	return isNoWorkingDayFunction();
};

/*
* fonction destinée a executer des commandes vers les recepteurs RF chacon
* (ouverture store, allumer les lumieres...)
*
*/
exports.executeCommandChacon = function(id, state, device_name, text, speak){
	var actualCommand = './hcc/hcc/radioEmission 7 16517546 ' + id + ' ' + state;
	if(state == "stop"){
		actualCommand = lastCommand;
		lastCommand = "none";
	}
	if((state == "stop" && actualCommand != "none") || lastCommand != actualCommand){
		dao.insertOrUpdateCmd(actualCommand, id, device_name, state, text, speak);
		execSync(actualCommand);
	}
	if(state != "stop"){
		lastCommand = actualCommand;
	}
}

exports.sendNotification = function(msgToPost){
	var appId = "252a4145-040e-477f-9b9b-39f77f4fd35d";
	var url = "http://remote-alert.herokuapp.com/post/" +appId;
	var requestData = { "message" : msgToPost };
	request({
		url: url,
		method: "POST",
		json: requestData
	},function (error, response, body) {
        if (!error && response.statusCode === 200) {
            logger.debug("envoi notification ok");
        }else {
			logger.debug("erreur lors de l'envoi de notification : " + error);
        }
    })
}

var dateEquals = function(d1, d2){
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

var getFormattedDate = function(){
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

var isWakeUpFunction = function(){
	var wakeUp = false;
	var date = new Date();
    var heure_actuelle = date.getHours();
    var minute_actuelle = date.getMinutes();
    if (heure_alarme == heure_actuelle && minute_alarme == minute_actuelle) {
		wakeUp = true;
    }
	return wakeUp;
}

var isTimeToOpenStoreFunction = function(horaire){
	var date = new Date();
	var isTime = false;

	if(horaire.sunrise_time.getTime()<=date.getTime() 
		&& horaire.sunset_time.getTime()>date.getTime()){
		isTime = true;
	}
	return isTime;
}

var isTimeToCloseStoreFunction = function(horaire){
	var date = new Date();
	var isTime = false;
	
	if(horaire.sunset_time.getTime()<=date.getTime() 
		&& horaire.sunrise_time.getTime()<date.getTime()){
		isTime = true;
	}
	return isTime;
}

var isNoWorkingDayFunction = function(){
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
	var weekDay = today.getDay();
	
	var noWorkingDay = false;

	// VendrediSaint, Paques, LundiPaques, Ascension, Pentecote, LundiPentecote, 
	
	var tabJourFerie = new Array(JourAn, FeteTravail, Victoire1945, FeteNationale, Assomption, Toussaint, Armistice, Noel, Ascension);

	for(var i = 0; i < tabJourFerie.length; i++){
		if(dateEquals(today,tabJourFerie[i])===true){
			noWorkingDay = true;
			break;
		}
    }
	if(weekDay == 0 || weekDay == 6){
		noWorkingDay = true;
	}
	return noWorkingDay;
}

// ---- start meteo part ---------------------------
var detailmeteo = function(err, previsions){
	//console.log("detailmeteo 1");
	var msg = "";
	if(err) return logger.debug(err);

	//console.log("detailmeteo 2");
	//clear-day, clear-night, rain, snow, sleet, wind, fog, cloudy, partly-cloudy-day partly-cloudy-night hail thunderstorm tornado
	logger.debug('A ' + previsions.city + ', la température est de ' + previsions.temperature + '°C');
	//logger.debug("description_code : " + previsions.description_code);
	//logger.debug("description_precipitation : " + previsions.description_precipitation);
	/*if(previsions.code == 'rain'){
		msg = 'Risques de ' + previsions.description + ' dans la journée, il serait judicieux de prendre un parapluie !';
	}
	if(previsions.code == 'Thunderstorm'){
		msg = 'Attention, ' + previsions.description + ' annoncé ! Tous aux abris !';
	}
	if(previsions.code == 'sleet'){
		msg = 'De legères ' + previsions.description + ' sont annoncées dans la journée.';
	}
	if(previsions.code == 'snow'){
		msg = previsions.description + ' annoncées dans la journée, prépare les chaines !';
	}
	if(previsions.code == 'cloudy'){
		msg = 'Le temps est ' + previsions.description + '.';
	}
	if(previsions.code == 'clear-day'){
		msg = 'Le temps est ' + previsions.description + '. Enjoy !!';
	}*/
	logger.debug(previsions.description);
	logger.debug(analyseWind(previsions.wind_speed));
}

var openweathermeteo = function(latitude, longitude, cityname, country, apikey, callback){

	//var urlMeteo = 'http://api.openweathermap.org/data/2.5/weather?q='+cityname+','+country+'&mode=json&units=metric&lang=fr&appid=97948a385d7e16d96b37d300101c94f5';
	var urlMeteo = 'https://api.forecast.io/forecast/'+apikey+'/'+latitude+','+longitude;
	request(urlMeteo, function(err, response, body){
		try{
			var result = JSON.parse(body);
			var previsions = {
				city : "Mérignac",
				code : result.daily.data[0].icon,
				description : result.daily.summary,
				temperature : ((parseFloat(result.hourly.data[0].temperature) - 32) * 5 / 9),
				wind_speed : (parseFloat(result.hourly.data[0].windSpeed) / 0.62),
				sunrise_time : new Date(result.daily.data[0].sunriseTime * 1000),
				sunset_time : new Date(result.daily.data[0].sunsetTime * 1000)
			};
			  		
			callback(null, previsions);
		}catch(e){
			callback(e); 
		}
	});
}


var syncopenweathermeteo = function(latitude, longitude, cityname, country, apikey){
	//var urlMeteo = 'http://api.openweathermap.org/data/2.5/weather?q='+cityname+','+country+'&mode=json&units=metric&lang=fr';
	var urlMeteo = 'https://api.forecast.io/forecast/'+apikey+'/'+latitude+','+longitude;
	var requestResult = syncrequest("GET",urlMeteo);
	return analyseSunHour(requestResult);
}


var analyseSunHour = function(jsonBody){
	var horaire;
	try{
		var result = JSON.parse(jsonBody.getBody());
		horaire = {
			sunrise_time : new Date(result.daily.data[0].sunriseTime * 1000),
			sunset_time : new Date(result.daily.data[0].sunsetTime * 1000)
		};
	}catch(e){
		logger.debug("analyseSunHour error : " + e);
	}
	return horaire;
}

var analyseWind = function(windSpeed){
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
}

// ---- end meteo part ---------------------------