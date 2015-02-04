
var crypto    = require('crypto');

var encMode = "aes-256-cbc";


var ivBuf = new Buffer("00000000000000000000000000000000", 'hex');


module.exports = {
	//Take in a key and data in hex form and spit out the encrypted representation
	encryptData: function(key, data){
		var keyBuf = new Buffer(key, 'hex');

		var cipher = crypto.createCipheriv(encMode,keyBuf,ivBuf);
		cipher.setAutoPadding(false);
		var crypted = cipher.update(data,'hex','hex');
		crypted += cipher.final('hex');
		return crypted.toUpperCase();
	},
	//Take in a key and encrypted data in hex form and spit out the decrypted representation
	decryptData: function(key, data){

		var keyBuf = new Buffer(key, 'hex');
		console.log(keyBuf);

		var decipher = crypto.createDecipheriv(encMode,keyBuf, ivBuf);
		decipher.setAutoPadding(false);
		var dec = decipher.update(data,'hex','hex');
		dec += decipher.final('hex');
		return dec.toUpperCase();
	}
}