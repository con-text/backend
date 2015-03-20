'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema({
	state: Object,
	currentObject: String,
	appId: String,
	uuid: String
});

var model = mongoose.model("appStates", schema);

module.exports = {
	createState: function(uuid, appId, state, callback){
		// console.log(state);

		if(typeof state === "string"){
			state = JSON.parse(state);
		}
		console.log("Creating state",uuid,appId, state);
		this.getState(uuid, appId, function(err) {
			if(err){
				//state doesn't already exist, lets create it
				console.log("State doesn't exist, creating");
				var newState = new model({uuid: uuid, appId: appId, state: state });
				newState.save(function(err){
					if(err){
						callback(err);
					}
					else{
						callback(null);
					}
				});
			}
			else{
				callback("State already exists", null);
			}

		});
	},
	getState: function(uuid, appId, callback){
		model.findOne({uuid: uuid, appId: appId}, "uuid appId state",function(err, result){
			if(err){
				//error in the fetch
				callback(err, null);
			}
			else if(!result){
				//nothing was found
				callback("No app state for that combination of application and user exists", null);
			}
			else{
				callback(null, result);
			}
		});
	},
	postState: function(uuid, appId, state, callback){
		// try{
		// 	state = JSON.parse(state);
		// 	console.log("Parsed state to",state);
		// }
		// catch(e){
		// 	console.log("Failed to parse state");
		// }
		if(typeof state === "string"){
			state = JSON.parse(state);
			console.log("Parsed state to be", state);
		}
		this.getState(uuid, appId, function(err, result){
			console.log("poststate", err,result);
			result.state = state;
			result.save(function(err){
				if(err){
					callback("Error updating state", null);
				}
				else{
					callback(null, true);
				}
			})
		});
	},
	removeState: function(uuid, appId, callback){
		this.getState(uuid, appId, function(err,result){
			if(err){
				callback("Invalid combination");
			}
			else{
				result.remove();
				callback(null, "Done");
			}
		});
	}
};
