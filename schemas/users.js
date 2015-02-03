var mongoose = require('mongoose');
var NodeRSA = require('node-rsa');
var localCrypto = require('../lib/localCrypto.js');


// var key = new NodeRSA("-----BEGIN PUBLIC KEY-----MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANpNnHs2XxV5HwCfGtUAwhRZK+HdMibQ95rufTm1VlCyKIWkDRhVQzTBctqEl3RswPeEh37SqPsTrP2MFsI8RisCAwEAAQ==-----END PUBLIC KEY-----");

var key2 = new NodeRSA("-----BEGIN RSA PRIVATE KEY-----MIIBOwIBAAJBANpNnHs2XxV5HwCfGtUAwhRZK+HdMibQ95rufTm1VlCyKIWkDRhVQzTBctqEl3RswPeEh37SqPsTrP2MFsI8RisCAwEAAQJBALAL1LycXVOgyLqklGvf36OvQa80xYP+Ex/TYhNOxJvvgztA4X3/NLknQ2SP2p3cIveGvygKAysAe7D5bTEs+xECIQDz3qJ69vz1B6NEMttVWvCL/3re4zsCimpCBUhPc7nG2QIhAOUpa5QpEAXJ5b6R8fe75jHwNOkW7e1RxkdbHJsaobqjAiAKHh+BmIOwKsv0RWPiK661MDlJzAWjulhkOtHgMf3wKQIhAJf54z2MCfM81V+QHJ+F/oDp470dlscHr26NLyhx/gXvAiBCWfCye3jgbNFaG9osizsJ11+kaj0FlP5y/I5Mg6XGnQ==-----END RSA PRIVATE KEY-----")

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
		model.findOne({username: username}, function(err,data){
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
		model.findOne({username: username}, function(err,data){
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
	testKey: function(){
		console.log(key.isPrivate());
		console.log(key.isPublic());
	},
	dumpDB: function(callback){
		model.find({}, function(err,result){
			if(err || !result){
				callback(err);
			}
			else{
				callback(null, result);
			}
		});
	},
	getModel: function(){
		// console.log("FETCHING MODEL");
		return model;
	}
};