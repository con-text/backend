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
	// console.log(obj);
	// console.log(changeInfo);
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

function applyChange(startText, changes){
	var text = startText;
	changes.forEach(function(change){
		console.log("Applying","'"+change.text+"'", "to",text, change.cursor);
		if(change.action === 1){
			text = new ot.TextOperation().retain(change.cursor).insert(change.text).retain(text.length - change.cursor).apply(text);
		}
		else if(change.action === -1){
			text = new ot.TextOperation().retain(change.cursor).delete(change.text).retain(text.length - change.text.length - change.cursor).apply(text);
		}
	});
	return text;
};

module.exports = {
	getState: function(uuid, objectId, callback){
		uuid = uuid.toLowerCase();
		model.findOne({_id: objectId}, function(err,result){
			console.log("looking for object",objectId);
			if(err || !result){
				callback(false, err);
			}
			else{
				//found the object, check that this user has access

				var found = false;
				result.collaborators.forEach(function(collaborator){
					if(collaborator.toLowerCase() === uuid){
						found = true;
					}
				});

				if(found || result.owner.toLowerCase() === uuid){
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
		if(!state){
			state = {};
		}
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
				callback(true, "State doesn't exist");
			}
			else{
				if(!result.state)
					result.state = {};

				if(changeInfo.OTChanges){
					console.log("Applying OT", changeInfo.OTChanges);
					changeInfo.value = applyChange(changeInfo.value, changeInfo.OTChanges);
				}

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
					console.log("Saving state", err,nt);
					if(!err){
						callback(false, gotback);
					}
					else{
						callback(true, err);
					}
				});
			}
		});
	},
	getObjects: function(idArray, cb){

		if(typeof idArray[0] === "object"){
			console.log("Found object type");
			idArray.forEach(function(id, idx){
				idArray[idx] = id.id;
			});
		}
		model.find({
			'_id': {$in: idArray}
		}, function(err,docs){
			// console.log(err)
			// console.log("idarr",idArray);
			// console.log("docs",docs);
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
	},
	getCollab: function(objectId,cb){
		model.findOne({_id: objectId}, 'collaborators owner', function(err,result){
			if(err || !result){
				cb("No object found");
			}
			else{
				result.collaborators.push(result.owner.toLowerCase());
				cb(null, result.collaborators);
			}
		});
	},
	addCollab: function(objectId, userId, cb){
		model.findOne({_id: objectId}, 'collaborators owner', function(err, result){
			if(err || !result){
				cb("No object found");
			}
			else{
				var found = false;
				var userIdL = userId.toLowerCase();
				result.collaborators.forEach(function(collaborator){
					if(collaborator.toLowerCase() == userIdL){
						found = true;
					}
				});
				if(result.owner.toLowerCase() !== userIdL && !found){
					result.collaborators.push(userId);
					result.markModified('collaborators');
					result.save(function(err){
						if(err){
							cb(err);
							return;
						}
						result.collaborators.push(result.owner);
						cb(null, result.collaborators);

					});
				}
				else{
					result.collaborators.push(result.owner);
					cb(null, result.collaborators)
				}
			}
		});
	},
	removeCollab: function(objectId, userId, cb){
		model.findOne({_id: objectId}, 'collaborators owner', function(err, result){
			if(err || !result){
				cb("No object found");
			}
			else{
				var found = false;
				var userIdL = userId.toLowerCase();
				result.collaborators.forEach(function(collaborator, idx){
					if(collaborator.toLowerCase() == userIdL){
						found = idx;
					}
				});
				if(result.owner.toLowerCase() === userIdL){
					cb("Can't remove owner");
				}
				else if(found !== false){
					//user was found, remove them
					result.collaborators.splice(found, 1);
					result.markModified('collaborators');
					result.save(function(err){
						if(err){
							cb(err);
							return;
						}
						result.collaborators.push(result.owner);
						cb(null, result.collaborators);

					});
				}
				else{
					result.collaborators.push(result.owner);
					cb(null, result.collaborators);
				}
			}
		});
	}
};
