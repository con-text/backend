'use strict';

var states = require("../schemas/states.js");

function isValidApp(appId){
	//need to maintain a list of app ids

	return true;
}

module.exports = {
	create: function(req,res){
		console.log("In create state");
		states.createState(req.params.uuid, req.params.appId, req.body.state, function(err, result){
			if(err){
				res.json({message:err});
				return;
			}
			else{
				res.json({message:"Created"});
				return;
			}
		});
	},
	post: function(req,res){
		console.log("Entered post", req.body);
		if(isValidApp){
			states.postState(req.params.uuid, req.params.appId, req.body.state, function(err, result){
				if(err){
					res.json({message:err});
				}
				else{
					res.json({message:result});
				}
			});
		}
		else{
			res.json({message:"Invalid App"});
			return;
		}
	},
	get: function(req,res){
		console.log("In get state");
		if(isValidApp){
			states.getState(req.params.uuid, req.params.appId, function(err,result){
				if(err){
					res.json({message:err});
				}
				else{
					res.json({message:result});
				}
			});
		}
		else{
			res.json({message:"Invalid App"});
			return;
		}
	},
	remove: function(req,res){
		console.log("In remove state");
		if(isValidApp){
			states.removeState(req.params.uuid, req.params.appId, function(err, result){
				if(err){
					res.json({message:err});
				}
				else{
					res.json({message:result});
				}
			});
		}
		else{
			res.json({message:"Invalid app"});
		}
	}
};