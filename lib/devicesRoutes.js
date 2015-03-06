var devices = require('../schemas/devices.js');
var users = require('../schemas/users.js');

module.exports = {
	assoc: function(req,res){
		if(req.body.deviceId && req.body.userId){
			devices.deviceExists(req.body.deviceId, function(err){
				if(err){
					res.send(err);
				}
				else{
					users.assocDevice(req.body.userId, req.body.deviceId, function(err){
						if(err){
							res.send(err);
						}
						else{
							res.send("Success");
						}
					});
				}
			});
		}
		else{
			res.send("Missing deviceid or userid");
		}
	}
}