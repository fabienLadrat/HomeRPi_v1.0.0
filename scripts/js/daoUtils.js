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
/*
exports.getStateById = function(id){
	var stateDevice = "N/A";
	getStateByIdDevice(id);
	return stateDevice;
}*/

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
	//Perform SELECT Operation
	//db.all("SELECT count(*) as nb from history_action where id="+id,function(err,rows){
	//rows contain values while errors, well you can figure out.
		
	//});
	
	if(!exists) {
		logger.debug("The database 'homeRPi.db' does not exist ! Please, create it and relaunch the server :)");
		process.exit(1);
	}
	var db = new sqlite3.Database(dataBaseFile);
	
	
	
	db.each("SELECT count(*) as nb from history_action where id="+id, function(err, row) {
		logger.debug("nb row for id "+id+" : " + row.nb);
		if(row.nb==0){
			//Perform INSERT operation.
			//db.run("INSERT into table_name(col1,col2,col3) VALUES (val1,val2,val3)");
			db.run("insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (?,?,?,?,?,?,?)", id, command, new Date(), device_name, device_state, text_action, vocal_action);

		}else{
			//Perform UPDATE operation
			db.run("UPDATE history_action set command_executed=?, date_last_execution=?, state_device=?, text_action=?, vocal_action=? where id=?", command, new Date(), device_state, text_action, vocal_action, id);
		}
	});

	

	//Perform DELETE operation
	//db.run("DELETE * from table_name where condition");

	
}
