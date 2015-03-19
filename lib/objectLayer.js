var $ = require('jquery-deferred');


function objectLayer(model){
	this.model = model;
	this.currentState = {};
	this.currentOperations = [];
	this.accessCountThreshold = 10;
	this.timeoutThreshold = 4;
	this.interval = 0;
	this.staleInt = 0;
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
	else{
		this.saveStateOp(operation.id, operation.newDoc, function(err,doc,nt){
			handle.resolve(operation.callback(err,doc,nt));
		});
	}

	return handle;
}

objectLayer.prototype.processAllOperations = function(){
	console.log("Starting process all ops");
	var handle = this.processOperation();
	if(handle === false){
		//all have been flushed
		console.log("Finished processing all operations");
	}
	else{
		$.when(handle).then(function() {
			console.log("Move to next one, handle resolved!");
			this.processAllOperations();
			return;
		}.bind(this));
	}
}

objectLayer.prototype.flushStale = function(){
	Object.keys(this.currentState).forEach(function(id){
		var item = this.currentState[id];
		if((new Date().getTime()) - item.lastAccess > (this.timeoutThreshold*1000)){
			//the object is stale, lets save it then delete it
			//it's a callback, but doesn't need to be done in order
			item.doc.markModified("state");
			item.doc.save(function(err,doc,nt){
				console.log("Savind stale item",id);
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

var testFunc = function(a,b,c){
	console.log(this.currentState,a,b,c);
}

module.exports = function(model){
	var instance = new objectLayer(model);

	// instance.processAllOperations();
	instance.interval = setInterval(instance.processAllOperations.bind(instance), 500);
	instance.staleInt = setInterval(instance.flushStale.bind(instance), 5000);
	// console.log(instance);

	return {
		getState: instance.getState.bind(instance),
		saveState: instance.saveState.bind(instance),
		test: instance.testFunc
	}
}