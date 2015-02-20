'use strict';

var crypto    = require('crypto');

var ccmenc = require("./CCMEnc.js");
var ccmdec = require("./CCMDec.js");

//Using CBC mode as ECB mode wouldn't produce the same output as the wearable's encryption
var encMode = "aes-256-cbc";

//use a fixed IV, this isn't problematic as we're only encypting a single block of random data
var ivBuf = new Buffer("00000000000000000000000000000000", 'hex');


module.exports = {
	//Take in a key and data in hex form and spit out the encrypted representation
	encryptData: function(key, data){
		// var keyBuf = new Buffer(key, 'hex');
		// var cipher = crypto.createCipheriv(encMode,keyBuf,ivBuf);

		// cipher.setAutoPadding(false);
		// var crypted = cipher.update(data,'hex','hex');
		// crypted += cipher.final('hex');
		// return crypted.toUpperCase();
		var encValue = ccmenc(data, key);
		return encValue.mac + encValue.cipher;

	},
	//Take in a key and encrypted data in hex form and spit out the decrypted representation
	decryptData: function(key, data){
		// var keyBuf = new Buffer(key, 'hex');
		// var decipher = crypto.createDecipheriv(encMode,keyBuf, ivBuf);

		// decipher.setAutoPadding(false);
		// var dec = decipher.update(data,'hex','hex');
		// dec += decipher.final('hex');
		// return dec.toUpperCase();
		var mac = data.substring(0,32);
		var data = data.substring(32);
		var decValue = ccmdec(data,mac,key);
		if(decValue.status === 0){
			return false;
		}
		else{
			return decValue.plaintext;
		}
	}
};