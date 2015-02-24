'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema({
	state: Object,
	appId: String,
	collaborators: [String],
	owner: String
});

var model = mongoose.model("objects", schema);

module.exports = {
	getState: function(uuid, objectId, callback){
		uuid = uuid.toLowerCase();
		model.findOne({_id: objectId}, function(err,result){
			console.log("looking for object",objectId);
			if(err){
				callback(false, err);
			}
			else{
				//found the object, check that this user has access
				if(result.owner.toLowerCase() === uuid || result.collaborators.indexOf(uuid) > -1){
					callback(true, result);
				}
				else{
					callback(false, "User doesn't have access to this object");
				}
			}
		});
	},
	createState: function(uuid, appId, state, callback){
		// console.log(state);

		if(typeof state === "string"){
			state = JSON.parse(state);
		}
		console.log("Creating state",uuid,appId, state);
		var newState = new model({owner: uuid, appId: appId, state: state });
		newState.save(function(err){
			if(err){
				callback(err);
			}
			else{
				callback(null);
			}
		});
	},
	updateState: function(uuid, objectId, state, callback){
		this.getState(uuid, objectId, function(success, result){
			if(!success){
				console.log("State doesn't exist", result);
				callback(false, result);
			}
			else{
				console.log()
				result.state = state;
				result.save(function(err){
					console.log("Saving state");
					if(err){
						callback(false, err);
					}
					else{
						callback(true);
					}
				});
			}
		});
	}
};