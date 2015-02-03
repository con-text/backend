var mongoose = require('mongoose');
var NodeRSA = require('node-rsa');
var localCrypto = require('../lib/localCrypto.js');

var schema = mongoose.Schema({
	username: String,
	password: String,
	userKey: String,
	serverKey: String
});

var model = mongoose.model("users", schema);

module.exports = {
	returnEncryptedData: function(username, randomDataFromClient, callback){
		console.log("Looking for", username);
		model.findOne({uuid: username}, function(err,data){
			if(err){
				console.log("error", err);
				callback(err);
			}
			else if(!data){
				console.log(username, "doesnt exist");
				callback("User doesn't exist");
			}
			else{
				console.log("fetching block");
				var block = localCrypto.encryptData(data.serverKey, randomDataFromClient);
				callback(null, block);
			}
		});
	},
	returnDecryptedData: function(username, ourRandomData, callback){
		model.findOne({uuid: username}, function(err,data){
			if(err){
				console.log("error", err);
				callback(err);
			}
			else if(!data){
				console.log(username, "doesnt exist");
				callback("User doesn't exist");
			}
			else{
				console.log("fetching block");
				console.log(data);
				var block = localCrypto.decryptData(data.serverKey, ourRandomData);
				callback(null, block);
			}
		});
	},
	attemptLogin: function(username, password, done){
		model.findOne({ username: username }, function(err, result) {
			if (err) {
				return done(err);
			}
			if (!result) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (!result.password === password) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, result);
		});
	},
	getFromUID: function(uid, callback){
		model.findOne({uuid: uid}, 'username profilePicUrl', function(err, result){
			callback(err,result);
		});
	}
};