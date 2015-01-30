var mongoose = require('mongoose');
var NodeRSA = require('node-rsa');

// var key = new NodeRSA("-----BEGIN PUBLIC KEY-----MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANpNnHs2XxV5HwCfGtUAwhRZK+HdMibQ95rufTm1VlCyKIWkDRhVQzTBctqEl3RswPeEh37SqPsTrP2MFsI8RisCAwEAAQ==-----END PUBLIC KEY-----");

var key2 = new NodeRSA("-----BEGIN RSA PRIVATE KEY-----MIIBOwIBAAJBANpNnHs2XxV5HwCfGtUAwhRZK+HdMibQ95rufTm1VlCyKIWkDRhVQzTBctqEl3RswPeEh37SqPsTrP2MFsI8RisCAwEAAQJBALAL1LycXVOgyLqklGvf36OvQa80xYP+Ex/TYhNOxJvvgztA4X3/NLknQ2SP2p3cIveGvygKAysAe7D5bTEs+xECIQDz3qJ69vz1B6NEMttVWvCL/3re4zsCimpCBUhPc7nG2QIhAOUpa5QpEAXJ5b6R8fe75jHwNOkW7e1RxkdbHJsaobqjAiAKHh+BmIOwKsv0RWPiK661MDlJzAWjulhkOtHgMf3wKQIhAJf54z2MCfM81V+QHJ+F/oDp470dlscHr26NLyhx/gXvAiBCWfCye3jgbNFaG9osizsJ11+kaj0FlP5y/I5Mg6XGnQ==-----END RSA PRIVATE KEY-----")

var schema = mongoose.Schema({
	username: String,
	key: String
});

var model = mongoose.model("users", schema);

module.exports = {
	returnEncryptedNonce: function(username, nonce, cb){
		console.log("Looooooking");
		model.findOne({username: username}, function(err, result){
			console.log("Got something back");
			if(err || !result){
				console.log("Err");
				cb(err);
			}
			else{
				var keyBack = "-----BEGIN PUBLIC KEY-----";
					keyBack+= result.key;
					keyBack+= "-----END PUBLIC KEY-----";
				console.log(keyBack);
				// console.log(result);
				var key = new NodeRSA(keyBack);
				// console.log(key.isPublic());
				console.log(username);
				console.log(nonce);

				var encrypted = key.encrypt(nonce, 'base64');

				console.log(key2.decrypt(encrypted, 'utf8'));
				cb(null, encrypted);
				// console.log(result);
			}
		});
	},
	testKey: function(){
		console.log(key.isPrivate());
		console.log(key.isPublic());
	}
};