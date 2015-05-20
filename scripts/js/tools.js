// tools.js
// ======== common constantes ========
var log4js = require('log4js');
var request = require('request');
var logger = log4js.getLogger('dev');
logger.setLevel('DEBUG');
// ======== restrict constantes ========
var latitude_global = 44.832481;
var longitude_global = -0.63381;
var city_global = 'Merignac';
var country_global = 'fr';
var heure_alarme = 7;
var minute_alarme = 0;
// ========

exports.smart_wakeup = function () {
	//Array("Thunderstorm", "Drizzle", "Rain", "Snow", "Atmosphere", "Clouds", "Extreme", "Additional");
    openweathermeteo(latitude_global, longitude_global, city_global, country_global, detailmeteo);
};

exports.isWakeUp = function (){
	return isWakeUpFunction();
};

exports.isNoWorkingDay = function (){
	return isNoWorkingDayFunction();
};

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
	var weekDay = date.getDay();
    if (heure_alarme == heure_actuelle && minute_alarme == minute_actuelle && weekDay != 0 && weekDay != 6) {
		wakeUp = true;
    }
	return wakeUp;
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

// ---- start meteo part ---------------------------
var detailmeteo = function(err, previsions){
	console.log("detailmeteo 1");
	var msg = "";
	if(err) return logger.debug(err);

	console.log("detailmeteo 2");
	logger.debug('A ' + previsions.city + ', la température est de ' + previsions.temperature + '°C');
	//logger.debug("description_code : " + previsions.description_code);
	//logger.debug("description_precipitation : " + previsions.description_precipitation);
	if(previsions.description_code == 'Rain'){
		msg = 'Risques de ' + previsions.description_precipitation + ' dans la journée, il serait judicieux de prendre un parapluie !';
	}
	if(previsions.description_code == 'Thunderstorm'){
		msg = 'Attention, ' + previsions.description_precipitation + ' annoncé ! Tous aux abris !';
	}
	if(previsions.description_code == 'Drizzle'){
		msg = 'De legères ' + previsions.description_precipitation + ' sont annoncées dans la journée.';
	}
	if(previsions.description_code == 'Snow'){
		msg = previsions.description_precipitation + ' annoncées dans la journée, prépare les chaines !';
	}
	if(previsions.description_code == 'Clouds'){
		msg = 'Le temps est ' + previsions.description_precipitation + '.';
	}
	if(previsions.description_code == 'Clear'){
		msg = 'Le temps est ' + previsions.description_precipitation + '. Enjoy !!';
	}
	logger.debug(msg);
	logger.debug(analyseWind(previsions.wind_speed));
}

var openweathermeteo = function(latitude, longitude, cityname, country, callback){
	var urlMeteo = 'http://api.openweathermap.org/data/2.5/weather?q='+cityname+','+country+'&mode=json&units=metric&lang=fr';
	//console.log("openweathermeteo");
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