

var user = require('../schemas/users.js');

module.exports = {
	stage1: function(req,res){
		var uuid 					= req.params.uuid;
		var randomDataFromClient 	= req.params.randomDataFromClient;

		user.returnEncryptedData(uuid, randomDataFromClient, function(err,result){
			if(err){
				res.status(400).json({message:err});
			}
			else{
				res.json({message:result});
			}
		});
	},
	stage2: function(req,res){
		var uuid 			= req.params.uuid;
		var ourRandomData 	= req.params.ourRandomData;

		user.returnDecryptedData(uuid, ourRandomData, function(err,result){
			if(err){
				res.status(400).json({message:err});
			}
			else{
				res.json({message:result});
			}
		});
	}
}