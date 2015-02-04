var user = require('../schemas/users.js');

module.exports = {
	stage1: function(req,res){
		var uuid 					= req.params.uuid;
		var randomDataFromClient 	= req.params.randomDataFromClient;


		user.returnEncryptedData(uuid, randomDataFromClient, function(err,result){
			if(err){
				res.send(err);
			}
			else{
				res.send(result);
			}
		});
	},
	stage2: function(req,res){
		var uuid 			= req.params.uuid;
		var ourRandomData 	= req.params.ourRandomData;


		user.returnDecryptedData(uuid, ourRandomData, function(err,result){
			if(err){
				res.send(err);
			}
			else{
				res.send(result);
			}
		});
	}
}