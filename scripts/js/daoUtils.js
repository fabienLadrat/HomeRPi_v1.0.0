// daoUtils.js
// ======== common constantes ========
var log4js = require('log4js');
var logger = log4js.getLogger('dev');
var fs = require('fs');
logger.setLevel('DEBUG');
var sqlite3 = require("sqlite3").verbose();
// ======== restrict constantes ========
var dataBaseFile ="./databases/homeRPi.db";
var exists = fs.existsSync(dataBaseFile);

function checkDatabase(){
	if(!exists) {
		logger.debug("The database 'homeRPi.db' does not exist ! Please, create it and relaunch the server :)");
		process.exit(1);
	}
}

exports.getGlobalState = function (cb) {
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);
	db.get("SELECT * from global_state", function(err, row) {
		if(row){
			var globalState={  
				etatStore : row.etat_store,  
				etatLampeSalon : row.etat_lampe_salon,
				etatLampeChambre : row.etat_lampe_chambre,
				homePresence : row.home_presence,
				jobPresence : row.job_presence
			};
			cb(globalState);
        }
	});
	db.close();
}


exports.updateGlobalState = function(name, value){
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);
	db.run("UPDATE global_state set etat_store=?, etat_lampe_salon=?", value, name);
	db.close();
}


exports.getParamValueByName = function (name, cb) {
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);
	db.get("SELECT param_value from params where param_name='"+name+"'", function(err, row) {
		if(row){
			cb(row.param_value);
        }
	});
	db.close();
}

exports.getDeviceList = function(data, cb){
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);
	var dataResponse = [];
	
	db.all("SELECT id, device_libelle, physical_id, device_name from device", function(err, rows) {  
        rows.forEach(function (row) {  
            var dataDevice={  
				id : row.id,  
				deviceLibelle : row.device_libelle,
				physicalId : row.physical_id,
				deviceName : row.device_name
			};
			dataResponse.push(dataDevice); 
        })  
		cb(dataResponse);
    }); 
	db.close();
}

exports.getClickAction = function(data, cb){
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);
	//logger.debug("SELECT device_libelle, physical_id, device_name from device where device_count="+data.id+ " and device_name='"+data.deviceType+"_"+data.id);
	db.get("SELECT device_libelle, physical_id, device_name from device where device_count="+data.id+ " and device_name='"+data.deviceType+"_"+data.id+"'", function(err, row) {
		var dataResponse={  
			id : data.id,  
			state : data.state,
			deviceType : row.device_name,
			msg : row.device_libelle + " : " + data.state,
			physical_id : row.physical_id,
			device_libelle : row.device_libelle
		};
		cb(dataResponse);
	});
	db.close();
}

exports.getFirstConnection = function (data, cb){
	checkDatabase();
	data = "'"+data+"'";
	var db = new sqlite3.Database(dataBaseFile);
	db.get("SELECT id, device_name, device_libelle, physical_id, device_count from device where device_name="+data, function(err, row) {
		if (err) {
			cb("error occurred");
			return;
		}
		if(row && row.length!=0){
			db.get("SELECT state_device, device from history_action where id="+row.physical_id, function(errHisto, rowHisto) {
				var stateDevice = "N/A";
				if (errHisto) {
					cb("error occurred");
					return;
				}
				if(rowHisto && rowHisto.length!=0){
					stateDevice = rowHisto.state_device;
				}

				var dataResponse={  
					id : row.device_count,  
					state : stateDevice,
					deviceType : row.device_name,
					msg : row.device_libelle + " : " + stateDevice
				}; 
				cb(dataResponse);
			});
		}
	});
	db.close();
}

exports.updateParamsTable = function(name, value){
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);
	db.run("UPDATE params set param_value=? where param_name=?", value, name);
	db.close();
}

/*
var stateDevice = "";
exports.getStateById = function(id, callback){
	if(!exists) {
		logger.debug("The database 'homeRPi.db' does not exist ! Please, create it and relaunch the server :)");
		process.exit(1);
	}
	var db = new sqlite3.Database(dataBaseFile);
	db.get("SELECT state_device from history_action where id="+id, function(err, row) {
		callback(row);
		return;
	});
}
*/
exports.insertOrUpdateCmd = function(command, id, device_name, device_state, vocal_action, text_action){
	checkDatabase();
	var db = new sqlite3.Database(dataBaseFile);

	db.each("SELECT count(*) as nb from history_action where id="+id, function(err, row) {
		logger.debug("nb row for id "+id+" : " + row.nb);
		if(row.nb==0){
			//Perform INSERT operation.
			db.run("insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (?,?,?,?,?,?,?)", id, command, new Date(), device_name, device_state, text_action, vocal_action);
		}else{
			//Perform UPDATE operation
			db.run("UPDATE history_action set command_executed=?, date_last_execution=?, state_device=?, text_action=?, vocal_action=? where id=?", command, new Date(), device_state, text_action, vocal_action, id);
		}
	});
	db.close();
}
