'use strict';
var objects = require('../schemas/objects.js');


module.exports = {
	get: function(req,res){
		console.log("req.params in objectroutesget", req.params);
		objects.getState(req.params.uuid, req.params.objectId, function(err,result){
			console.log("Got into callback");
			res.json({message:result});
		});
	},
	create: function(req,res){
		//submitted req.body

		// createState: (uuid, appId, state, callback){
	},
	getMultiple: function(req,res){
		console.log("req.params in objectroutesgetmultiple", req.params);
		objects.getObjects(['54eb5238e4b0f2526ea4f06b', '54ee2009e4b0e85464a3e7e3', '54ef0b71e4b0e85464a3f4d1'], function(err,result){
			console.log("Got into callback");
			res.json({message:result});
		});
	},
	getCollab: function(req,res){
		objects.getCollab(req.params.stateId, function(err,result){
			if(err){
				res.json({message: err});
			}
			else{
				res.json({message: result});
			}
		});
	},
	addCollab: function(req,res){
		objects.addCollab(req.params.stateId, req.body.userId, function(err,result){
			if(err){
				res.json({message: err});
			}
			else{
				res.json({message: result});
			}
		});
	},
	removeCollab: function(req,res){
		objects.removeCollab(req.params.stateId, req.body.userId, function(err,result){
			if(err){
				res.json({message: err});
			}
			else{
				res.json({message: result});
			}
		});
	}
};
