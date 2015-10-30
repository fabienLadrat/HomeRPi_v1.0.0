var http = require('http');
var express = require('express');
var app = express();
 
var server = http.createServer(app);

server.listen('9095', function(){
  console.log("Secure Express server listening on port 9095");
});

console.log("getJourFerie()=" + getJourFerie());


function dateEquals(d1, d2){
	var noWorkingDay = true;
	if(d1.getDate()!=d2.getDate()){
		noWorkingDay = false;
	}
	if(d1.getMonth()!=d2.getMonth()){
		noWorkingDay = false;
	}
	return noWorkingDay;
}

function getJourFerie(){
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
	var noWorkingDay = false;
	
	// VendrediSaint, Paques, LundiPaques, Ascension, Pentecote, LundiPentecote, 
	
	var tabJourFerie = new Array(JourAn, FeteTravail, Victoire1945, FeteNationale, Assomption, Toussaint, Armistice, Noel);

	for(var i = 0; i < tabJourFerie.length; i++){
		if(dateEquals(today,tabJourFerie[i])===true){
			noWorkingDay = true;
		}
    }
	return noWorkingDay;
}