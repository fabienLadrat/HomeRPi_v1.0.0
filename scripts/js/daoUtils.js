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

var sqli = require('sqli')
, sqlite = sqli.getDriver('sqlite')
, db = sqlite.connect(':memory:');

var pool = sqlite.createPool(dataBaseFile, 5, 10000);
db = pool.get();

function checkDatabase(){
	if(!exists) {
		logger.debug("The database 'homeRPi.db' does not exist ! Please, create it and relaunch the server :)");
		process.exit(1);
	}
}
/*
exports.getGlobalState = function (cb) {
	checkDatabase();
	// var db = new sqlite3.Database(dataBaseFile);
	db.exec("SELECT * from global_state").each(function(row) {
		if(row){
			var globalState={  
				etatStore : row.etat_store,  
				etatLampeBaieSalon : row.etat_lampe_baie_salon,
				etatLampeBarSalon : row.etat_lampe_bar_salon,
				etatLampeChambre : row.etat_lampe_chambre,
				homePresence : row.home_presence,
				jobPresence : row.job_presence
			};
			cb(globalState);
        }
	});
	// db.close();
}
*/
exports.getModuleById = function (id, cb) {
	checkDatabase();
	db.exec("SELECT * from modules where id=?",id).each(function(row) {
		if(row){
			var module={  
				id : row.id,
				moduleName : row.module_name,
				moduleFileName : row.module_file_name,
				modulCallerName : row.module_caller_name
			};
			cb(module);
        }
	});
}

exports.getGlobalStateV2 = function (cb) {
	checkDatabase();
	db.exec("SELECT * from global_state").each(function(row) {
		if(row){
			var globalState={  
				homePresence : row.home_presence,
				jobPresence : row.job_presence
			};
			cb(globalState);
        }
	});
}

exports.updateGlobalStateV2 = function(globalStateJson){
	checkDatabase();
	var globalStateSql = "UPDATE global_state set home_presence=?, job_presence=?";
	db.exec(globalStateSql, [globalStateJson.homePresence, globalStateJson.jobPresence]);
}
/*
* var globalState={  
*				etatStore : row.etat_store,  
*				etatLampeBaieSalon : row.etat_lampe_baie_salon,
*				etatLampeBarSalon : row.etat_lampe_bar_salon,
*				etatLampeChambre : row.etat_lampe_chambre,
*				homePresence : row.home_presence,
*				jobPresence : row.job_presence
*			};
*
*/
/*exports.updateGlobalState = function(globalStateJson){
	checkDatabase();
	// var db = new sqlite3.Database(dataBaseFile);
	var globalStateSql = "UPDATE global_state set ";
	var arrayDbRun = [];
	
	if(globalStateJson.hasOwnProperty('etatStore')){
		globalStateSql += "etat_store=?, ";
		arrayDbRun.push(globalStateJson.etatStore);
	}
	if(globalStateJson.hasOwnProperty('etatLampeBaieSalon')){
		globalStateSql += "etat_lampe_baie_salon=?, ";
		arrayDbRun.push(globalStateJson.etatLampeBaieSalon);
	}
	if(globalStateJson.hasOwnProperty('etatLampeBarSalon')){
		globalStateSql += "etat_lampe_bar_salon=?, ";
		arrayDbRun.push(globalStateJson.etatLampeBarSalon);
	}
	if(globalStateJson.hasOwnProperty('etatLampeChambre')){
		globalStateSql += "etat_lampe_chambre=?, ";
		arrayDbRun.push(globalStateJson.etatLampeChambre);
	}
	if(globalStateJson.hasOwnProperty('homePresence')){
		globalStateSql += "home_presence=?, ";
		arrayDbRun.push(globalStateJson.homePresence);
	}
	if(globalStateJson.hasOwnProperty('jobPresence')){
		globalStateSql += "job_presence=?, ";
		arrayDbRun.push(globalStateJson.jobPresence);
	}
	globalStateSql = globalStateSql.substring(0,globalStateSql.length - 2);
	
	db.run(globalStateSql, arrayDbRun);
	// db.close();
}*/


exports.getParamValueByName = function (name, cb) {
	checkDatabase();
	db.exec("SELECT param_value from params where param_name='"+name+"'").each(function(row) {
		if(row){
			cb(row.param_value);
        }
	});
}

exports.getDeviceListV2 = function(cb){
	checkDatabase();
	db.exec("SELECT d.id as id, d.device_libelle as deviceLibelle, d.physical_id as physicalId, d.device_name as deviceName, d.device_piece as devicePiece, d.device_type as deviceType, ds.state_device as deviceState from device d inner join device_state ds on ds.id_device = d.physical_id").all(function(rows) {  
		var dataResponse = {
			devices : rows
		};
		cb(dataResponse);
    });
}

/*exports.getDeviceList = function(cb){
	checkDatabase();
	// var db = new sqlite3.Database(dataBaseFile);
	//var dataResponse = [];
	var dataResponse = '{"devices":[]}';
	var obj = JSON.parse(dataResponse);

	db.all("SELECT id, device_libelle, physical_id, device_name, device_piece, device_type from device", function(err, rows) {  
        rows.forEach(function (row) {  
            var dataDevice={  
				id : row.id,  
				deviceLibelle : row.device_libelle,
				physicalId : row.physical_id,
				deviceName : row.device_name,
				devicePiece : row.device_piece,
				deviceType : row.device_type
			};
			obj['devices'].push(dataDevice);
			//dataResponse.push(dataDevice); 
        }) 
		dataResponse = JSON.stringify(obj);
		cb(dataResponse);
    }); 
	// db.close();
}*/

exports.countDeviceByPhysicalId = function(physicalId, cb){
	checkDatabase();
	var dataResponse = [];
	
	db.exec("SELECT count(*) as nb from device where physical_id=?",physicalId).scalar(function(value) {  
		cb(value);
    }); 
}

exports.getDeviceStateById = function(id, cb){
	checkDatabase();
	var dataResponse = [];
	
	db.exec("SELECT * from device_state ds where ds.id_device=?",id).each(function(row) {  
		var dataDevice={  
			id : row.id_device,  
			deviceState : row.state_device
		};
		cb(dataDevice);
    }); 
}

exports.updateDeviceStateById = function(id, state){
	checkDatabase();
	db.begin();
	db.exec("UPDATE device_state set state_device=? where id_device=?", [state, id]);
	db.commit();
}

exports.insertNewDevice = function(jsonDevice, cb){
	checkDatabase();
	db.begin();
	db.exec("insert into device(device_name, device_libelle, physical_id, device_type, device_piece) values (?,?,?,?,?)", [jsonDevice.deviceName, jsonDevice.deviceLibelle, jsonDevice.physicalId, jsonDevice.deviceType, jsonDevice.devicePiece]);
	db.commit();
	db.exec('SELECT MAX(id) FROM device').scalar(function(value) {
		db.begin();
		db.exec("insert into device_state(id_device, state_device) values (?,?)", [jsonDevice.physicalId, jsonDevice.deviceState]);
		db.commit();
		cb(value);
	});
}


exports.updateExistingDevice = function(jsonDevice, cb){
	checkDatabase();
	db.begin();
	db.exec("update device set device_name=?, device_libelle=?, physical_id=?, device_type=?, device_piece=? where id=?", [jsonDevice.deviceName, jsonDevice.deviceLibelle, jsonDevice.physicalId, jsonDevice.deviceType, jsonDevice.devicePiece, jsonDevice.id]);
	db.commit();
	cb(jsonDevice.id);
}

/*
exports.getClickAction = function(data, cb){
	checkDatabase();
	// var db = new sqlite3.Database(dataBaseFile);
	//logger.debug("SELECT device_libelle, physical_id, device_name from device where device_count="+data.id+ " and device_name='"+data.deviceType+"_"+data.id);
	db.exec("SELECT device_libelle, physical_id, device_name from device where device_name='"+data.deviceType+"_"+data.id+"'").all(function(row) {
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
	// db.close();
}*/
/*
exports.getFirstConnection = function (data, cb){
	checkDatabase();
	data = "'"+data+"'";
	// var db = new sqlite3.Database(dataBaseFile);
	db.exec("SELECT id, device_name, device_libelle, physical_id from device where device_name="+data, function(row) {
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
					id : row.physical_id,  
					state : stateDevice,
					deviceType : row.device_name,
					msg : row.device_libelle + " : " + stateDevice
				}; 
				cb(dataResponse);
			});
		}
	});
	// db.close();
}*/

exports.updateParamsTable = function(name, value){
	checkDatabase();
	db.begin();
	db.exec("UPDATE params set param_value=? where param_name=?", [value, name]);
	db.commit();
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
/*
exports.insertOrUpdateCmd = function(command, id, device_name, device_state, vocal_action, text_action){
	checkDatabase();
	// var db = new sqlite3.Database(dataBaseFile);

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
	// db.close();
}*/
