
var crypto    = require('crypto');

var encMode = "aes-256-ctr";

module.exports = {
	encryptData: function(key, data){

		console.log("Trying to encrypt",data);
		var cipher = crypto.createCipher(encMode,key)
		var crypted = cipher.update(data,'hex','hex')
		crypted += cipher.final('hex');
		return crypted;
	},
	decryptData: function(key, data){

		var decipher = crypto.createDecipher(encMode,key)
		var dec = decipher.update(data,'hex','hex')
		dec += decipher.final('hex');
		return dec;
	}
}