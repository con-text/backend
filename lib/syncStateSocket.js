'use strict';

var states = require("../schemas/objects.js");

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
	post: function(uuid,objectId,state,cb){
		// console.log("Entered post", uuid,objectId,state);
		states.updateState(uuid, objectId, state, function(err, result){
			console.log("UPDATED STATE",err);
			if(err){
				cb(false, err);
			}
			else{
				cb(true, result);
			}
		});
	},
	get: function(user,objectId,cb){
		console.log("In get state",user,objectId);
		states.getState(user, objectId, function(success,result){
			if(!success){
				console.log("error in get state", result);
				cb(false, success);
			}
			else{
				if(!result.state){
					result.state = {};
				}
				console.log("Got",result._id, result.owner,"from get state");
				cb(true, result);
			}
		});
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
