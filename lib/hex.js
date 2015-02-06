'use strict';
module.exports = {
	isValidHex: function(string){
		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]+$");
		return checkForHexRegExp.test(string);
	}	
};