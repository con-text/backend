var $ = require('jquery-deferred');
var richText = require('rich-text');
var Delta = richText.Delta;


function objectLayer(model){
	this.model = model;
	this.currentState = {};
	this.currentOperations = [];
	this.accessCountThreshold = 10;
	this.timeoutThreshold = 4;
	this.interval = 0;
	this.staleInt = 0;
	this.holderValues = {};
	// console.log.call(objectLayer, objectLayer.processOperation);
	// console.log(this.prototype);
	// console.log(this.processAllOperations);
}


objectLayer.prototype.processOperation = function(){
	// console.log(this.currentState, this.currentOperations);

	if(this.currentOperations.length === 0){
		return false;
	}



	var handle = $.Deferred();
	// console.log(this);
	var operation = this.currentOperations.shift();
	if(operation.type === "get"){
		this.getStateOp(operation.uuid, operation.id, function(error,result){
			//the get operation has finished, call the callback op
			handle.resolve(operation.callback(error, result));
		});
	}
	else if(operation.type === "delta"){
		this.pushDeltaOp(operation.id, operation.changeInfo, function(err,doc,nt){
			handle.resolve(operation.callback(err,doc,nt));
		});
	}
	else{
		this.saveStateOp(operation.id, operation.newDoc, function(err,doc,nt){
			handle.resolve(operation.callback(err,doc,nt));
		});
	}

	return handle;
}

objectLayer.prototype.processAllOperations = function(){
	// console.log("Starting process all ops");
	var handle = this.processOperation();
	if(handle === false){
		//all have been flushed
		// console.log("Finished processing all operations");
		
		this.finishDeltas();
	}
	else{
		$.when(handle).then(function() {
			// console.log("Move to next one, handle resolved!");
			this.processAllOperations();
			return;
		}.bind(this));
	}
}

objectLayer.prototype.finishDeltas = function(){
	var itemCount = 0;
	var holderKeys = Object.keys(this.holderValues);
	if(holderKeys.length === 0){
		return;
	}
	holderKeys.forEach(function(key){
		itemCount++;
		console.log(key, this.holderValues[key].callbacks);
		if(!this.holderValues[key].callbacks){
			return;
		}
		var item = this.holderValues[key];

		//pointer to parent property
		var pointer = item.doc.state;

		if(item.path.length === 1){
			//no need to loop through, compose the value and save
		}
		else{
			for(var i = 0; i < item.path.length - 1; i++){
				pointer = pointer[item.path[i]];
			}
		}

		//transform all of the changes together
		var firstUser = null;
		Object.keys(item.changes).forEach(function(user){
			if(!firstUser){
				firstUser = user;
			}
			else{
				//make a delta out of the new change
				var transformed = item.changes[firstUser].transform(item.changes[user], true);
				item.changes[firstUser] = item.changes[firstUser].compose(transformed);
			}
		});

		var d = new Delta(pointer[item.path.slice(-1)]);
		pointer[item.path.slice(-1)] = d.compose(item.changes[firstUser]).ops;

		console.log("NEW UPDATED VALUE = ", pointer[item.path.slice(-1)]);


		var itemKey = key.split("_")[0];

		var prevLastAccess = this.currentState[itemKey].lastAccess;
		this.currentState[itemKey].lastAccess = (new Date().getTime());
		//if it's been more than 2 seconds since the last update, save it to the db
		var callbacks = this.holderValues[key].callbacks;
		if(((new Date().getTime() )- prevLastAccess) > 2*1000){

			this.holderValues[key].doc.markModified("state");
			this.holderValues[key].doc.save(function(err,doc,nt){
				if(err){
					callbacks.forEach(function(cb){
						cb(err,doc,nt);
					})
					return;
				}
				else{
					callbacks.forEach(function(cb){
						cb(null, doc, nt);
					});
				}
			}.bind(this));
		}
		else{
			callbacks.forEach(function(cb){
				cb(null, this.currentState[itemKey].doc, 1);
			}.bind(this));
		}
		if(itemCount >= Object.keys(this.holderValues).length){
			//clean up
			this.holderValues = {};
		}
	}.bind(this));
}

objectLayer.prototype.flushStale = function(){
	Object.keys(this.currentState).forEach(function(id){
		var item = this.currentState[id];
		if((new Date().getTime()) - item.lastAccess > (this.timeoutThreshold*1000)){
			//the object is stale, lets save it then delete it
			//it's a callback, but doesn't need to be done in order
			item.doc.markModified("state");
			item.doc.save(function(err,doc,nt){
				console.log("Savind stale item",id,nt);
				delete this.currentState[id];
			}.bind(this));
		}
	}.bind(this));
}

objectLayer.prototype.getState = function(uuid, id, callback){
	this.currentOperations.push({type: "get", id: id, uuid: uuid, callback: callback});
}

objectLayer.prototype.canAccess = function(uuid, owner, collaborators){
	var found = false;
	var uuid = uuid.toLowerCase();
	collaborators.forEach(function(collaborator){
		if(collaborator.toLowerCase() === uuid){
			found = true;
		}
	});

	if(found || owner.toLowerCase() === uuid.toLowerCase()){
		return true;
	}
	return false;
}

objectLayer.prototype.getStateOp = function(uuid, id, callback){
	if(this.currentState[id]){

		//this exists in the db
		this.currentState[id].lastAccess = (new Date().getTime());

		if(this.canAccess(uuid, this.currentState[id].doc.owner, this.currentState[id].doc.collaborators)){
			callback(null, this.currentState[id].doc);
		}
		else{
			callback("User doesn't have access to item", null);
		}

	}
	else{
		//need to fetch it
		this.model.findOne({_id: id}, function(err,object){
			if(err || !object){
				//object doesn't exist, not sure what to do about this yet
				callback(err || "Object doesn't exist", null);
			}
			else if(!this.canAccess(uuid, object.owner, object.collaborators)){
				callback("Can't access item", null);
			}
			else{
				//object exists, add it to the current state object
				this.currentState[id] = {doc: object, lastAccess: (new Date().getTime()), accessCount: 0};
				callback(null, object);
			}
		}.bind(this));
	}
}

objectLayer.prototype.saveState = function(id, newDoc, callback){
	this.currentOperations.push({type: "post", id: id, callback: callback, newDoc: newDoc});
}


objectLayer.prototype.saveStateOp = function(id, newDoc, callback){
	if(this.currentState[id]){
		//exists in the current state
		this.currentState[id].doc = newDoc;
		var prevLastAccess = this.currentState[id].lastAccess;
		this.currentState[id].lastAccess = (new Date().getTime());
		//if it's been more than 2 seconds since the last update, save it to the db
		if(((new Date().getTime() )- prevLastAccess) > 2*1000){
			newDoc.markModified("state");
			newDoc.save(function(err,doc,nt){
				if(err){
					callback(err, doc, nt);
					return;
				}
				callback(null, doc, nt);
			});
		}
		else{
			callback(null, this.currentState[id].doc, 1);
		}

	}
}

objectLayer.prototype.pushDelta = function(id, changeInfo, callback){
	this.currentOperations.push({type: "delta", id: id, callback: callback, changeInfo: changeInfo});
}

objectLayer.prototype.pushDeltaOp = function(id, changeInfo, callback){
	if(this.currentState[id]){
		// var holdObject = this.holderValues[id + '_' + changeInfo.property];
		if(!this.holderValues[id + '_' + changeInfo.property]){
			this.holderValues[id + '_' + changeInfo.property] = this.currentState[id];
			this.holderValues[id + '_' + changeInfo.property].path = changeInfo.path;
			this.holderValues[id + '_' + changeInfo.property].callbacks = [callback];
			this.holderValues[id + '_' + changeInfo.property].changes = {};
			this.holderValues[id + '_' + changeInfo.property].changes[changeInfo.uuid] = new Delta(changeInfo.value);

		}
		else{
			//push the callback to the stack so that we can call it later
			this.holderValues[id + '_' + changeInfo.property].callbacks.push(callback);

			if(this.holderValues[id + '_' + changeInfo.property].changes[changeInfo.uuid]){
				//a change has already come from this person, compose it
				this.holderValues[id + '_' + changeInfo.property].changes[changeInfo.uuid] = this.holderValues[id + '_' + changeInfo.property].changes[changeInfo.uuid].compose(new Delta(changeInfo.value));
			}
			else{
				//a change hasn't already come from this user, add it in
				this.holderValues[id + '_' + changeInfo.property].changes[changeInfo.uuid] = new Delta(changeInfo.value);
			}
			console.log(this.holderValues[id + '_' + changeInfo.property].changes[changeInfo.uuid]);
		}

		return;

		//exists in the current state
		var obj = this.holderValues[id].doc.state;
		var arr = changeInfo.path;

		//this is messy, can change it to 
		if(arr.length === 1){
			var origObj = new Delta(obj);
			var deltaObj= new Delta(changeInfo.value);

			origObj = deltaObj.transform(origObj, true);

			console.log("Updating delta obj", origObj);

			obj[changeInfo.property] = deltaObj;

		}

		for(var i = 0; i<arr.length-1; i++){
			obj = obj[arr[i]];
			if(i === arr.length-2){
				//this is the penultimate value in the path object
				//lets set the object then update
				var origObj = new Delta(obj);
				var deltaObj= new Delta(changeInfo.value);

				deltaObj = origObj.transform(deltaObj, true);

				console.log("Updating delta obj", deltaObj);

				obj[arr.length-1] = deltaObj;
			}
			if(obj === undefined){
				console.log("OBJECT NOT FOUND IN PUSH DELTA OBJ",id);
				return false;
			}
		}
	}
}

var updateTextValue = function(obj,arr,value, changeInfo){
	console.log("UPDATING VALUES");
	//loop through until we're at the right object

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


var testFunc = function(a,b,c){
	console.log(this.currentState,a,b,c);
}

module.exports = function(model){
	var instance = new objectLayer(model);

	// instance.processAllOperations();
	instance.interval = setInterval(instance.processAllOperations.bind(instance), 2000);
	instance.staleInt = setInterval(instance.flushStale.bind(instance), 5000);
	// console.log(instance);

	return {
		getState: instance.getState.bind(instance),
		saveState: instance.saveState.bind(instance),
		pushDelta: instance.pushDelta.bind(instance),
		test: instance.testFunc
	}
}