'use strict';

var states = require("../schemas/appStates.js");

function isValidApp(appId){
	//need to maintain a list of app ids

	return true;
}

module.exports = {
	create: function(user,appId,state, cb){
		console.log("In create state");
		states.createState(req.params.uuid, req.params.appId, req.body.state, function(err, result){
			if(err){
				cb(false, err);
			}
			else{
				cb(true, "Created");
			}
		});
	},
	post: function(user,appId,state,cb){
		console.log("Entered post", user,appId,state);
		if(isValidApp(appId)){
			states.postState(user, appId, state, function(err, result){
				if(err){
					cb(false, err);
				}
				else{
					cb(true, result);
				}
			});
		}
		else{
			res.json({message:"Invalid App"});
			return;
		}
	},
	get: function(user,appId,cb){
		console.log("In get state",user,appId);
		if(isValidApp(appId)){
			states.getState(user, appId, function(err,result){
				if(err){
					console.log("Error",err,"in get state");
					cb(false, err);
				}
				else{
					console.log("Got",result,"from get state");
					cb(true, result);
				}
			});
		}
		else{
			console.log("INVALID APP");
			res.json({message:"Invalid App"});
			return;
		}
	},
	remove: function(user,appId){
		console.log("In remove state");
		if(isValidApp(appId)){
			states.removeState(req.params.uuid, req.params.appId, function(err, result){
				if(err){
					cb(false, err);
				}
				else{
					cb(true, result);
				}
			});
		}
		else{
			res.json({message:"Invalid app"});
		}
	}
};