'use strict';
var objects = require('../schemas/objects.js');

var users = require('../schemas/users.js');

var io, objectToPeople, people;

function sendToPeople(object, event, msg){
	if(io && objectToPeople && objectToPeople[object]){
		objectToPeople[object].forEach(function(person){
			io.to(people[person].socket.id).emit(event, msg);
		});
	}
}

module.exports = {
	initObjectToPeople: function(ioRef, objectToPeopleRef, peopleRef){
		io = ioRef;
		objectToPeople = objectToPeopleRef;
		people = peopleRef;
	},
	get: function(req,res){
		console.log("req.params in objectroutesget", req.params);
		objects.getState(req.params.uuid, req.params.objectId, function(err,result){
			console.log("Got into callback");
			res.json({message:result});
		});
	},
	create: function(req,res){
		//submitted req.body

		// createState: (uuid, appId, state, callback){
	},
	getCollab: function(req,res){
		objects.getCollab(req.params.stateId, function(err,result){
			if(err){
				res.json({message: err});
			}
			else{
				res.json(result);
			}
		});
	},
	addCollab: function(req,res){
		console.log("######")
		console.log(req.body);
		console.log("######")
		objects.addCollab(req.params.stateId, req.body.userId, users.addSingleState, function(err,result){
			if(err){
				res.json({message: err});
			}
			else{
				sendToPeople(req.params.stateId, 'newCollab', {userId: req.body.userId});
				res.json(result);
			}
		});
	},
	removeCollab: function(req,res){
		objects.removeCollab(req.params.stateId, req.body.userId, function(err,result){
			if(err){
				res.json({message: err});
			}
			else{
				res.json(result);
			}
		});
	}
};
