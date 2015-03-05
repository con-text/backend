'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema({
	state: Object,
	appId: String,
	collaborators: [String],
	owner: String
});

var model = mongoose.model("objects", schema);

var updateValueFromArray = function(obj,arr,prop,value){
	console.log("UPDATING VALUES");
	//loop through until we're at the right object
	for(var i = 0; i<arr.length; i++){
		obj = obj[arr[i]];
		if(obj === undefined){
			return false;
		}
	}
	obj[prop] = value;
	return obj;
}

var deleteValueFromArray = function(obj,arr,prop){
	for(var i = 0; i<arr.length; i++){
		obj = obj[arr[i]];
		if(obj === undefined){
			return false;
		}
	}
	//set the value and discard the changes
	delete obj[prop]
	return obj;
}

var dealWithChange = function(obj, changeInfo){
	console.log(obj);
	console.log(changeInfo);
	switch(changeInfo.action){
		case "added":
		case "changed":
			return updateValueFromArray(obj, changeInfo.path, changeInfo.property, changeInfo.value);
		break;
		case "removed":
			return deleteValueFromArray(obj, changeInfo.path, changeInfo.property);
		break;
	}
	return false;
}


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
				callback(null, newState);
			}
		});
	},
	updateState: function(uuid, objectId, changeInfo, callback){
		this.getState(uuid, objectId, function(success, result){
			if(!success){
				console.log("State doesn't exist", result);
				callback(false, result);
			}
			else{
				if(!result.state)
					result.state = {};
				dealWithChange(result.state, changeInfo);
				if(!result.state){
					console.log("CHANGE DIDNT WORK");
				}
				var pathInfo = changeInfo.path.join(".");
				if(pathInfo.length !== 0){
					pathInfo+=".";
				}
				result.markModified("state."+changeInfo.path.join(".")+changeInfo.property);
				result.save(function(err, gotback, nt){
					// console.log("Saving state", err);
					if(err){
						callback(false, err);
					}
					else{
						callback(true);
					}
				});
			}
		});
	},
	getObjects: function(idArray, cb){

		if(typeof idArray[0] === "object"){
			idArray.forEach(function(id, idx){
				idArray[idx] = id.id;
			});
		}
		model.find({
			'_id': {$in: idArray}
		}, function(err,docs){
			console.log(idArray);
			console.log(docs);
			var idObj = {};
			
			docs.forEach(function(doc){
				idObj[doc._id] = true;
			});
			idArray.forEach(function(id){
				if(!idObj[id]){
					console.log("Didnt find",id);
				}
			});
			cb(err,docs);
		});
	}
};