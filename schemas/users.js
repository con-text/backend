

var mongoose = require('mongoose');
var localCrypto = require('../lib/localCrypto.js');

var schema = mongoose.Schema({
	username: String,
	password: String,
	userKey: String,
	serverKey: String,
	profilePicUrl: String,
	uuid: String
});

var model = mongoose.model("users", schema);

module.exports = {
	returnEncryptedData: function(username, randomDataFromClient, callback){
		debug("Looking for", username);

		if(randomDataFromClient.length !== 32){
			callback("Invalid data length");
			return;
		}

		model.findOne({uuid: username}, function(err,data){
			if(err){
				debug("error", err);
				callback(err);
			}
			else if(!data){
				debug(username, "doesnt exist");
				callback("User doesn't exist");
			}
			else{
				debug("fetching block");
				var block = localCrypto.encryptData(data.serverKey, randomDataFromClient);
				callback(null, block);
			}
		});
	},
	returnDecryptedData: function(username, ourRandomData, callback){

		if(ourRandomData.length !== 32){
			callback("Invalid data length");
			return;
		}

		model.findOne({uuid: username}, function(err,data){
			if(err){
				debug("error", err);
				callback(err);
			}
			else if(!data){
				debug(username, "doesnt exist");
				callback("User doesn't exist");
			}
			else{
				debug("fetching block");
				debug(data);
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
	getFromUID: function(req,res){
		model.findOne({uuid: req.params.id}, 'username profilePicUrl', function(err, result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				res.json({message: result});
			}
		});
	}
};