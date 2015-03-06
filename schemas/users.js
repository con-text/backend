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

				var objects = [];
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
						objects.push(state.id);
						keyToIdx[state.id] = {i: i, j:j};
					});
				});

				objectsSchema.getObjects(objects, function(err,docs){
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
	//are we going to do this based on changes?
	// postApp: function(req,res){
	// 	//add a new app to the states
	// 	model.findOne({uuid: req.params.id}, 'uuid apps', function(err,result){
	// 		if(err){
	// 			debug(err);
	// 			res.status(500).json({message: "An error has occured"});
	// 		}
	// 		else if(!result){
	// 			res.status(404).json({message:"Invalid UUID"});
	// 		}
	// 		else{
	// 			var found = false;
	// 			if(!result.apps || result.apps.length === 0){
	// 				//this is completely fine, add no problem
	// 				result.apps = [{id: req.params.appId, states: []}];
	// 			}
	// 			else{
	// 				result.apps.forEach(function(app){
	// 					if(app.id === req.params.appID){
	// 						found = true;
	// 					}
	// 				});
	// 				if(!found){
	// 					//add it in and return the object
	// 					result.apps.push({id: req.params.appId, states: []});
	// 				}
	// 			}
	// 			if(found){
	// 				//throw error
	// 				res.status(409).json({message: "App already exists for this user"});
	// 			}
	// 			else{
	// 				result.save(function(err){
	// 					if(err){
	// 						console.log(err);
	// 					}
	// 					else{
	// 						res.json({message: result});
	// 					}
	// 				});
	// 			}
	// 		}
	// 	});
	// },
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

				if(req.params.stateId == 0){
					//create one, put it in the apps  db and return the id
					objectsSchema.createState(req.params.id, req.params.appId, req.body.state, function(err,newItem){
						if(err){
							res.json(err);
						}
						else{
							var found = null;
							result.apps.forEach(function(app,idx){
								if(app.id == req.params.appId){
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
								res.json({message: {id: newItem._id}});
							})
						}
					});
				}
				else{
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
						res.status(404).json({message: "App or state doesn't exist in the user's state"});
						return;
					}

					objectsSchema.getObjects([req.params.stateId], function(err,docs){
						if(err || docs.length === 0){
							res.status(404).json({message: "Invalid state"});
							return;
						}
						res.json(docs[0]);
					})
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
				// }
				// else{
				// 	objectsSchema.getObjects([req.params.stateId], function(err,docs){
				// 		if(err){
				// 			res.send(err);
				// 		}
				// 		else{
				// 			docs[0].state = req.body.state;

				// 			docs[0].markModified("state");
				// 			docs[0].save(function(err,d,nt){
				// 				if(err){
				// 					res.json(err);
				// 				}
				// 				else{
				// 					res.json({message: "Updated"+nt});
				// 				}
				// 			})
				// 		}
				// 	})
				// }
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
