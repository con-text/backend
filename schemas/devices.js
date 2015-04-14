'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema({
	deviceId: String,
	userKey: String,
	serverKey: String
});

var model = mongoose.model("devices", schema);

module.exports = {
	deviceExists: function(deviceId, cb){
		model.findOne({deviceId: deviceId}, function(err,result){
			if(err || !result){
				cb("Device doesn't exist");
			}
			else{
				cb(null);
			}
		});
	},
	addDevice: function(deviceId, userKey, serverKey, cb){
		model.findOne({deviceId: deviceId}, function(err,result){
			if(!err && !result){
				//doesn't exist, add it
				var device = new model({deviceId: deviceId, userKey: userKey, serverKey: serverKey});
				device.save(function(err){
					if(err){
						cb(err);
					}
					else{
						cb(null);
					}
				})
			}
			else{
				cb("Device already exists");
			}
		});
	},
	fetchKeys: function(deviceId, cb){
		model.findOne({deviceId:deviceId}, function(err,result){
			if(err || !result){
				cb("Device doesn't exist", null);
			}
			else{
				cb(null, {serverKey: result.serverKey, userKey: result.userKey});
			}
		});
	}
}