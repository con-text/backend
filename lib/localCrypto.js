
var crypto    = require('crypto');
var node_cryptojs = require('node-cryptojs-aes');

// //create custom json serialization format
// var JsonFormatter = {
//     stringify: function (cipherParams) {
//         // create json object with ciphertext
//         var jsonObj = {
//             ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
//         };

//         // optionally add iv and salt
//         if (cipherParams.iv) {
//             jsonObj.iv = cipherParams.iv.toString();
//         }

//         if (cipherParams.salt) {
//             jsonObj.s = cipherParams.salt.toString();
//         }

//         // stringify json object
//         return JSON.stringify(jsonObj)
//     },

//     parse: function (jsonStr) {
//         // parse json string
//         var jsonObj = JSON.parse(jsonStr);

//         // extract ciphertext from json object, and create cipher params object
//         var cipherParams = CryptoJS.lib.CipherParams.create({
//             ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
//         });

//         // optionally extract iv and salt
//         if (jsonObj.iv) {
//             cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
//         }

//         if (jsonObj.s) {
//             cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
//         }

//         return cipherParams;
//     }
// };

// custom json serialization format
var JsonFormatter = node_cryptojs.JsonFormatter;

// node-cryptojs-aes main object;
var CryptoJS = node_cryptojs.CryptoJS;

var encMode = "aes-256-ctr";

module.exports = {
	encryptData: function(key, data){
		// var encrypted = CryptoJS.AES.encrypt(data, key.toString("base64"), { format: JsonFormatter });

		// // convert CipherParams object to json string for transmission
		// var encrypted_json_str = encrypted.toString();
		// console.log(encrypted_json_str);
		// return encrypted_json_str;
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