// module.exports = (function() {
    // 'use strict';
	// var tools = require('./tools.js');
	// var dao = require('./daoUtils.js');
	// var log4js = require('log4js');
	// var logger = log4js.getLogger('dev');
// })();

module.exports = Object.freeze({
    TOOLS : require('./tools.js'),
	DAO : require('./daoUtils.js'),
	LOGGER : require('log4js').getLogger('dev')
});