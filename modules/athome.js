var iServ = require('../scripts/js/importServer');
var exec = function (tabValStatic){
	iServ.DAO.getGlobalStateV2(function (dataResponseBDD) {
		if(dataResponseBDD.homePresence == 'false'){
			var updateGlobalState = {
				homePresence : "true",
				jobPresence : "false"
			}
			iServ.DAO.updateGlobalStateV2(updateGlobalState);
			iServ.DAO.getDeviceById(4, function (deviceBdd) {
				var sunHour = tabValStatic[0];
				if(deviceBdd.deviceState === 'off'){
					if(iServ.TOOLS.isTimeToOpenStore(sunHour)===true){
						iServ.TOOLS.executeCommandChacon(4, "on", "Volet roulant", "", "");
					}else{
						//iServ.TOOLS.executeCommandChacon(0, "on", "Lampe Chambre", "", "");
						iServ.TOOLS.executeCommandChacon(5, "on", "Lampe 1", "", "");
						iServ.TOOLS.executeCommandChacon(6, "on", "Lampe 2", "", "");
					}
				}
			});
		}
	});
};
module.exports.exec = exec;
