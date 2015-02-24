var objects = require('../schemas/objects.js');


module.exports = {
	get: function(req,res){
		console.log("req.params in objectroutesget", req.params);
		objects.getState(req.params.uuid, req.params.objectId, function(err,result){
			console.log("Got into callback");
			res.json({message:result});
		});
	}
}