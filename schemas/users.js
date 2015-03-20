'use strict';

var mongoose = require('mongoose');
var localCrypto = require('../lib/localCrypto.js');
var objectsSchema = require('../schemas/objects.js');
var hex = require('../lib/hex.js');

var schema = mongoose.Schema({
	name: String,
	password: String,
	userKey: String,
	serverKey: String,
	profilePicUrl: String,
	uuid: String,
	apps: Array,
	deviceId: String
});

var model = mongoose.model("users", schema);

module.exports = {

	//Takes in the random data generated by the wearable, and encrypts it using the symmetric
	//server key, which will then be sent back. The wearable will encrypt the block with
	//the same key and compare what it receive from the screen device.
	returnEncryptedData: function(username, randomDataFromClient, callback){
		debug("Looking for", username);

		if(randomDataFromClient.length !== 32){
			callback("Invalid data length");
			return;
		}

		if(!hex.isValidHex(randomDataFromClient)){
			callback("Invalid data type");
			return;
		}

		model.findOne({uuid: username}, function(err,data){
			if(err){
				debug("error", err);
				callback(err);
			}
			else if(!data){
				debug(username, "doesnt exist");
				callback("User doesn't exist");
			}
			else{
				// debug("fetching block");
				var block = localCrypto.encryptData(data.serverKey, randomDataFromClient);
				callback(null, block);
			}
		});
	},
	//Takes in the random data that we generate generated, and encrypts it using the symmetric
	//client key, which will then be compared to what we receive from the wearable.
	returnDecryptedData: function(username, ourRandomData, callback){

		if(ourRandomData.length !== 64){
			callback("Invalid data length");
			return;
		}

		if(!hex.isValidHex(ourRandomData)){
			callback("Invalid data type");
			return;
		}



		model.findOne({uuid: username}, function(err,data){
			if(err){
				debug("error", err);
				callback(err);
			}
			else if(!data){
				debug(username, "doesnt exist");
				callback("User doesn't exist");
			}
			else{
				// debug("fetching block");
				// debug(data);
				var block = localCrypto.decryptData(data.serverKey, ourRandomData);
				callback(null, block);
			}
		});
	},
	getFromUID: function(req,res){
		model.findOne({uuid: req.params.id}, 'name profilePicUrl uuid', function(err, result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				res.json(result);
			}
		});
	},
	getAppStates: function(req,res){
		model.findOne({uuid: req.params.id}, 'name profilePicUrl uuid apps', function(err, result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				//should have a list of apps and states now, lets crawl through and grab the list of object ids

				var objectList = [];
				var keyToIdx = {};
				console.log(result);
				if(!result.apps || result.apps.length === 0){
					console.log("Found no apps");
					res.json({message: result});
					return;
				}

				//Loop through every app, there'll be a state property that's an array full of object ids
				//push that to the array to look up, and keep track of the indices
				result.apps.forEach(function(app, i){
					app.states.forEach(function(state, j) {
						//cast to string
						objectList.push(state.id + '');
						keyToIdx[state.id] = {i: i, j:j};
					});
				});

				console.log("Passing",objectList,"To get objects");
				objectsSchema.getObjects(objectList, function(err,docs){
					docs.forEach(function(doc){

						//update the value from result with the fetched document
						var mapping = keyToIdx[doc._id];
						result.apps[mapping.i].states[mapping.j] = doc;
					});
					res.json({message: result});
				});
			}
		});
	},
	postAppStates: function(req,res){
		model.findOne({uuid: req.params.id}, 'name profilePicUrl uuid apps', function(err, result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				//should have a list of apps and states now, lets crawl through and grab the list of object ids

				console.log(result);
				if(!req.body.appId){
					res.status(404).json({message: "Invalid appid"});
					return;
				}
				if(!result.apps || result.apps.length === 0){
					console.log("Found no apps");
					res.json({message: result});
					return;
				}

				//Loop through every app, there'll be a state property that's an array full of object ids
				//push that to the array to look up, and keep track of the indices
				var found = false;
				result.apps.forEach(function(app, i){
					if(app.id == req.body.appId){
						found = true;
					}
				});

				if(found){
					res.json({message: "Added"});
				}
				else{
					result.apps.push({id: req.body.appId, states:[]});
					result.markModified("apps");
					result.save(function(err){
						if(err){
							res.json(err);
							return;
						}
						res.json({message: "Added"});
					});
				}
			}
		});
	},
	getApp: function(req,res){
		model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				//all exists ok

				if(!result.apps || result.apps.length === 0){
					res.status(404).json({message: "App id doesn't exist in the user's state thing"});
					return;
				}

				var returnApp = null;

				result.apps.forEach(function(app){
					if(app.id === req.params.appId){
						returnApp = app;
					}
				});

				if(!returnApp){
					res.status(404).json({message: "App id doesn't exist in the user's state thing"});
					return;
				}

				objectsSchema.getObjects(returnApp.states, function(err,docs){
					res.json(docs);
				})
			}
		});
	},
	deleteApp: function(req,res){
		model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				if(!result.apps || result.apps.length === 0){
					res.json({message: "Deleted"});
				}
				else{
					var found = false;
					result.apps.forEach(function(app,idx){
						if(app.id == req.params.appId){
							found = idx;
						}
					});
					if(found !== false){
						result.apps = result.apps.splice(idx,1);
						result.save(function(err){
							if(err){
								console.log("Err");
							}
							res.json({message: "Deleted"});
						})
					}
				}
			}
		});
	},

	/**
	* GET /users/:id/apps/:appId/states/:stateId
	*
	*	Get single state object
	*
	*/
	getSingleState: function(req,res){
		model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				//all exists ok

				if(!result.apps){
					result.apps = [];
				}


				var found = null;
				result.apps.forEach(function(app){
					if(app.id === req.params.appId){
						app.states.forEach(function(state){
							if(state.id == req.params.stateId){
								found = true;
							}
						})
					}
				});

				if(!found){
					objectsSchema.getState(req.params.id, req.params.stateId, function(error, message){
						console.log("not found, looking up", req.params, exists, message);
						if(error){
							res.status(404).json({message: "App or state doesn't exist in the user's state"});
						}
						else{
							message.collaborators.forEach(function(collab){
								if(collab.toLowerCase() == req.params.id.toLowerCase()){
									found = true;
								}
							});
							if(found){
								objectsSchema.getObjects([req.params.stateId], function(err,docs){
									if(err || docs.length === 0){
										res.status(404).json({message: "Invalid state"});
										return;
									}
									res.json(docs[0]);
								});
							}
							else{
								res.status(404).json({message: "Invalid state"});
								return;
							}
						}

					});
				}
				else{
					objectsSchema.getObjects([req.params.stateId], function(err,docs){
						if(err || docs.length === 0){
							res.status(404).json({message: "Invalid state"});
							return;
						}
						res.json(docs[0]);
					});
				}
			}
		});
	},

	/**
	* PUT /users/:id/apps/:appId/states/:stateId
	*
	*	Update state
	*
	*/
	updateSingleState: function(req, res) {

		// Find the user first
		model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else {

				// The users exists, ok

				if(!result.apps){
					result.apps = [];
				}

				// Find app
				var found = null;
				result.apps.forEach(function(app){
					if(app.id === req.params.appId){
						app.states.forEach(function(state){
							if(state.id == req.params.stateId){
								found = true;
							}
						})
					}
				});

				if(!found){
					objectsSchema.getState(req.params.id, req.params.stateId, function(exists, message){

						if(!exists){
							res.status(404).json({message: "App or state doesn't exist in the user's state"});
						}
						else{
							message.collaborators.forEach(function(collab){
								if(collab.toLowerCase() === req.params.id.toLowerCase()){
									found = true;
								}
							});
							if(found){
								objectsSchema.getObjects([req.params.stateId], function(err,docs){
									if(err || docs.length === 0){
										res.status(404).json({message: "Invalid state"});
										return;
									}

									// Update the object
									Object.keys(req.body).forEach(function(key){

										console.log('updating ' + key);
										docs[0][key] = req.body[key];
										docs[0].markModified(key);
									});


									// Save it the object
									docs[0].save(function(err, doc, nt) {
										if(err) {
											res.status(404).send(err);
											return;
										}

										if(nt !== 1) {
											res.status(401).json({message: "Not update one", status: doc});
											return;
										}

										// Send back updated state
										res.json(doc);
										return;
									});

								});
							}
							else{
								res.status(404).json({message: "Invalid state"});
								return;
							}
						}

					});
				}
				else{
					objectsSchema.getObjects([req.params.stateId], function(err,docs){
						if(err || docs.length === 0){
							res.status(404).json({message: "Invalid state"});
							return;
						}

						var docToUpdate = docs[0];

						// Update the object
						Object.keys(req.body).forEach(function(key){

							console.log('updating ' + key);
							docs[0][key] = req.body[key];
							docs[0].markModified(key);
						});

						// Save it the object
						docToUpdate.save(function(err, doc, nt) {
							if(err) {
								res.status(404).send(err);
								return;
							}

							if(nt !== 1) {
								res.status(401).json({message: "Not update one", status: doc});
								return;
							}

							// Send back updated state
							res.json(doc);
							return;
						});
					});
				}
			}
		});

	},

	postSingleState: function(req,res){
		model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				//all exists ok


				if(!result.apps){
					result.apps = [];
				}



				//create one, put it in the apps  db and return the id
				objectsSchema.createState(req.params.id, req.params.appId, req.body.state, function(err,newItem){
					if(err){
						res.json(err);
					}
					else{
						var found = null;

						result.apps.forEach(function(app,idx){
							if(app.id === req.params.appId){
								found = idx;
							}
						});
						if(found === null){
							result.apps.push({id: req.params.appId, states: [{id: newItem._id}]});
						}
						else{
							result.apps[found].states.push({id: newItem._id});
						}

						result.markModified("apps");
						result.save(function(err){
							if(err){
								res.json(err);
								return;
							}
							res.json(newItem);
						})
					}
				});
			}
		});
	},
	//doesn't work yet
	removeSingleState: function(req,res){
		model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
			if(err){
				debug(err);
				res.status(500).json({message: "An error has occured"});
			}
			else if(!result){
				res.status(404).json({message:"Invalid UUID"});
			}
			else{
				//all exists ok

				if(!result.apps || result.apps.length === 0){
					res.status(404).json({message: "App id doesn't exist in the user's state "});
					return;
				}

				var found = null;
				var i,j;
				result.apps.forEach(function(app,idx){
					if(app.id == req.params.appId){
						app.states.forEach(function(state,jdx){
							if(state.id == req.params.stateId){
								i = idx;
								j = jdx;
								found = true;
							}
						})
					}
				});

				if(!found){
					objectsSchema.getState(req.params.id, req.params.stateId, function(exists, message){
						found = exists;
					});
				}

				if(!found){
					res.status(404).json({message: "App or state doesn't exist in the user's state"});
					return;
				}
				console.log(result.apps);
				result.apps[i].states.splice(j,1);
				result.markModified("apps");
				result.save(function(err){
					if(err){
						res.json(err);
						return;
					}
					objectsSchema.getObjects([req.params.stateId], function(err,docs){
						docs[0].remove();
						res.json(docs);
					})

				})
			}
		});
	},
	addSingleState: function(uuid, appId, stateId, cb){
		model.findOne({uuid: uuid}, 'uuid apps', function(err,result){
			if(err || !result){
				//user doesn't exist
				cb(true, "User doesn't exist");
			}
			else{
				//user exists
				var found = false;
				result.apps.forEach(function(app, idx){
					if(app.id == appId){
						found = idx;
					}
				});
				if(found === false){
					found = result.apps.push({id: appId, states:[]}) - 1;
				}
				var idx = found;
					found = false;
				result.apps[idx].states.forEach(function(state, idx){
					if(state.id == stateId){
						found = true;
					}
				});
				if(found){
					cb(false, result);
				}
				else{
					result.apps[idx].states.push({id: stateId});
					result.markModified('apps');
					result.save(function(err,doc,nx){
						if(err){
							cb(true, err);
						}
						else{
							if(nx === 0){
								cb(true, "No documents were updated");
							}
							else{
								cb(false, doc);
							}
						}
					});
				}
			}
		});
	},
	assocDevice: function(userId, deviceId, cb){
		model.findOne({uuid: userId}, 'deviceId', function(err,result){
			if(err){
				cb(err);
			}
			else if(!result){
				cb("User doesn't exist");
			}
			else{
				if(!result.deviceId){
					//ok to assoc
					result.deviceId = deviceId;
					result.save(function(err,doc,nx){
						if(err){
							cb(err);
						}
						else if(nx == 0){
							cb("No documents updated");
						}
						else{
							cb(false);
						}
					})
				}
				else{
					cb("Device already associated");
				}
			}
		});
	}
};
