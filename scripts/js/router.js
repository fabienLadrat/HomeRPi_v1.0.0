module.exports = (function() {
    'use strict';
    var router = require('express').Router();
	var tools = require('./tools.js');
	var dao = require('./daoUtils.js');
	var log4js = require('log4js');
	var logger = log4js.getLogger('dev');
	var varAction = "";
	var message = "";
	var sunHour = tools.getSunHour();
		
	router.get('/', function(req, res) {
		res.sendFile('/var/www/main.html');
	});

	router.get('/athome', function(req, res) {
		logger.debug("at home !!");
			//if home presence == false
					// if etat store == close and timetopenstore == true => open store
					// else if etat store == close and timetoopenstore == false => allume lumiere
				// send notification arrive + message action
				// update home presence a true, job presence a false, etat store to open/close selon action, etat lumiere salon selon action
		// close db
		
		dao.getGlobalState(function(globalState){
			// etatStore 
			// etatLampeSalon 
			// etatLampeChambre 
			// homePresence 
			// jobPresence
			if(globalState.homePresence === 'false'){
				var changeEtatStore = false;
				if(globalState.etatStore === 'closed'){
					if(tools.isTimeToOpenStore(sunHour)===true){
						changeEtatStore = true;
						logger.debug("/athome : Ouverture des stores...");
						message = "TASKER OUVERTURE DES VOLETS";
						tools.executeCommandChacon(2, "on", "Volet roulant", message, message);
						dao.updateParamsTable("etat_store","opened");
						//sendNotification("HomeR : Ouverture des stores !");
						varAction = ", ouverture des stores."
					}else{
						varAction = ", allumage du salon.";
						tools.executeCommandChacon(5, "on", "Lampe 1", message, message);
						tools.executeCommandChacon(6, "on", "Lampe 2", message, message);
					}
				}
				if(changeEtatStore === true){
				
				}
				tools.sendNotification("HomeR : Bienvenue a la maison Fabien" + varAction);
			}
		});
		
		/*dao.getParamValueByName('etat_store', function (etat) {
			if(etat === "closed" || etat === "N/A" ){
				if(tools.isTimeToOpenStore(sunHour)===true){
					logger.debug("/athome : Ouverture des stores...");
					message = "TASKER OUVERTURE DES VOLETS";
					tools.executeCommandChacon(2, "on", "Volet roulant", message, message);
					dao.updateParamsTable("etat_store","opened");
					//sendNotification("HomeR : Ouverture des stores !");
					varAction = ", ouverture des stores."
				}else{
					varAction = ", allumage du salon.";
					tools.executeCommandChacon(0, "on", "Lampe 1", message, message);
					tools.executeCommandChacon(1, "on", "Lampe 2", message, message);
				}
				//dao.updateParamsTable("home_presence","true");
				//dao.updateParamsTable("job_presence","false");
			}
			tools.sendNotification("HomeR : Bienvenue a la maison Fabien" + varAction);
		});*/
	});

	router.get('/atjob', function(req, res) {
		//logger.debug("at job !!");
		dao.updateParamsTable("home_presence","false");
		dao.updateParamsTable("job_presence","true");
		tools.sendNotification("HomeR : Au travail, bonne journee !");
	});

	router.get('/leavehome', function(req, res) {
		logger.debug("leave home !!");
		dao.updateParamsTable("home_presence","false");
		dao.updateParamsTable("job_presence","false");
		// TODO test hour to send message and test if at home before
		tools.sendNotification("[leavehome] Salut, bonne journee !");
	});

	router.get('/leavejob', function(req, res) {
		logger.debug("leave job !!");
		dao.updateParamsTable("home_presence","false");
		dao.updateParamsTable("job_presence","false");
		// TODO test hour to send message and test if at job before
		tools.sendNotification("[leavejob] Salut, bonne journee !");
	});

	router.get('/gnopenstore', function(req, res) {
		tools.executeCommandChacon(2, "on", "Volet roulant", "", "");
		//sendNotification("HomeR : Ouverture des stores !");
	});

	router.get('/gnclosestore', function(req, res) {
		tools.executeCommandChacon(2, "off", "Volet roulant", "", "");
		//sendNotification("HomeR : Fermeture des stores !");
	});

	router.get('/gnlighton', function(req, res) {
		tools.executeCommandChacon(0, "on", "Lampe 1", "", "");
		tools.executeCommandChacon(1, "on", "Lampe 2", "", "");
		//sendNotification("HomeR : Que la lumière soit !");
	});

	router.get('/gnlightoff', function(req, res) {
		tools.executeCommandChacon(0, "off", "Lampe 1", "", "");
		tools.executeCommandChacon(1, "off", "Lampe 2", "", "");
		//sendNotification("HomeR :  Extinction des lampes !");
	});

	router.get('/clickopenstore', function(req, res) {
		tools.executeCommandChacon(2, "on", "Volet roulant", "", "");
		tools.sendNotification("HomeR : Ouverture des stores !");
	});

	router.get('/clickclosestore', function(req, res) {
		tools.executeCommandChacon(2, "off", "Volet roulant", "", "");
		tools.sendNotification("HomeR : Fermeture des stores !");
	});

	router.get('/clicklighton', function(req, res) {
		tools.executeCommandChacon(0, "on", "Lampe 1", "", "");
		tools.executeCommandChacon(1, "on", "Lampe 2", "", "");
		tools.sendNotification("HomeR : Allumage du salon !");
	});

	router.get('/clicklightoff', function(req, res) {
		tools.executeCommandChacon(0, "off", "Lampe 1", "", "");
		tools.executeCommandChacon(1, "off", "Lampe 2", "", "");
		tools.sendNotification("HomeR :  Extinction du salon !");
	});
	
	router.get('/click/:device/:state', function(req, res) {
		logger.debug("device : "+ req.device + " - state : "+req.state);
		//tools.executeCommandChacon(0, "off", "Lampe 1", "", "");
		//tools.executeCommandChacon(1, "off", "Lampe 2", "", "");
		//tools.sendNotification("HomeR :  Extinction du salon !");
	});

    return router;
})();