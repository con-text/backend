var ccmenc = require("./CCMEnc.js");
var ccmdec = require("./CCMDec.js");
module.exports = {
	enc: function(req,res){
		var plaintext = req.params.plaintext;
		var key = req.params.key;
		res.json(ccmenc(plaintext,key));
		// res.json(req.params);
	},
	dec: function(req,res){
		var cipher = req.params.ciphertext;
		var mac = req.params.mac;
		var key = req.params.key;
		res.json(ccmdec(cipher,mac,key));
	}
};