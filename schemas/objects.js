'use strict';

var mongoose = require('mongoose');
var richText = require('rich-text');
var Delta = richText.Delta;


var schema = mongoose.Schema({
	state: Object,
	appId: String,
	collaborators: [String],
	owner: String,
	title: String,

	// Window related stuff
	isOpened: Boolean,
	x: Number,
	y: Number
});

var model = mongoose.model("objects", schema);

var objectLayer = require('../lib/objectLayer.js')(model);

var updateValueFromArray = function(obj,arr,prop,value){
	//loop through until we're at the right object
	for(var i = 0; i<arr.length; i++){
		obj = obj[arr[i]];
		if(obj === undefined){
			return false;
		}
	}
	obj[prop] = value;
	return obj;
};

var deleteValueFromArray = function(obj,arr,prop){
	for(var i = 0; i<arr.length; i++){
		obj = obj[arr[i]];
		if(obj === undefined){
			return false;
		}
	}
	//set the value and discard the changes
	delete obj[prop];
	return obj;
};

var dealWithChange = function(obj, changeInfo){
	// console.log(obj);
	// console.log(changeInfo);

	switch(changeInfo.action){
		case "added":
		case "changed":
			switch(changeInfo.type){
				case "array":
					return parseArrayChange(obj, changeInfo.path, changeInfo.splice, changeInfo.value);

				case "string":
					return updateTextValue(obj, changeInfo.path, changeInfo.value, changeInfo);

				case "number":
				default:
					return updateValueFromArray(obj, changeInfo.path, changeInfo.property, changeInfo.value);

			}
		break;
		case "removed":
			return deleteValueFromArray(obj, changeInfo.path, changeInfo.property);

	}
	return false;
};


//assume that we're doing one change at a time for now...
//plus its just add and remove....
function parseArrayChange(obj, arr, splice, value){
	for(var i = 0; i<arr.length; i++){
		obj = obj[arr[i]];
		if(obj === undefined){
			return false;
		}
	}
	console.log("parse array change");
	console.log(obj,splice,value);
	if(splice.removed.length !== 0){
		obj.splice(splice.index);
	}
	else{
		obj.splice(splice.index, 0, value);
	}
	return obj;
}


var updateTextValue = function(obj,arr,value, changeInfo){
	console.log("UPDATING VALUES");
	//loop through until we're at the right object
	for(var i = 0; i<arr.length; i++){
		obj = obj[arr[i]];
		if(obj === undefined){
			return false;
		}
	}
	if(changeInfo.OTChanges){
		//this needs to be done through OT, build the delta array first
		//then apply the changes
		var origObj = new Delta(obj);
		var deltaObj = new Delta(value);
		origObj.compose(deltaObj);
		obj = origObj.ops;
	}
	else{
		obj = value;
	}
	return obj;
};

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
}

module.exports = {
	getState: function(uuid, objectId, callback){
		uuid = uuid.toLowerCase();
		objectLayer.getState(uuid, objectId, callback);
	},
	createState: function(uuid, appId, state, callback){

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
		objectLayer.getState(uuid, objectId, function(error, result){
			if(error){
				console.log("State doesn't exist", error, result);
				callback(true, "State doesn't exist");
			}
			else{
				if(!result.state)
					result.state = {};

				//do we actually want to do something with this action?
				if(changeInfo.act){


					console.log(changeInfo.path);
					if(changeInfo.path[0] == ''){
						changeInfo.path.shift();
					}

				
					var updatedValue = dealWithChange(result.state, changeInfo);

					if(!updatedValue){
						console.log("CHANGE DIDNT WORK");
					}

					var currentState = result.state;
					for(var i = 0; i<changeInfo.path-1; i++){
						currentState = currentState[changeInfo.path[i]];
					}

					currentState[changeInfo.path.slice(-1)] = updatedValue;

					console.log(result.state);

					var pathInfo;
					if(changeInfo.path[0] === ""){
						pathInfo = changeInfo.path.slice(1).join(".");
					}
					else{
						pathInfo = changeInfo.path.join(".");
					}
					console.log("markmodified","state."+pathInfo);
					// result.markModified("state."+pathInfo);
					objectLayer.saveState(objectId, result, function(err, doc, nt){
						console.log("Saving state", err, nt);
						if(!err){
							if(changeInfo.pushedChange){
								doc.pushedChange = true;
							}
							callback(false, doc);
						}
						else{
							callback(true, err);
						}
					});
				}
				else{
					console.log("Pushing change straight through without action");
					changeInfo.pushedChange = true;
					callback(false, changeInfo)
				}
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
	addCollab: function(objectId, userId, userFunc, cb){
		console.log("####################ENTERING ADD COLAB", objectId, userId);
		model.findOne({_id: objectId}, 'collaborators owner appId', function(err, result){
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
				console.log("#################",result.owner,userIdL,found);
				if(result.owner.toLowerCase() !== userIdL && !found){
					result.collaborators.push(userId);
					result.markModified('collaborators');
					result.save(function(err){
						if(err){
							cb(err);
							return;
						}
						userFunc(userId, result.appId, objectId, function(error, resultUser){
							console.log("Added single state",userId,result.appId,objectId,error);
							if(error){
								res.send(result);
								return;
							}
							result.collaborators.push(result.owner);
							cb(null, result.collaborators);
						});

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
	},
	model: model
};
