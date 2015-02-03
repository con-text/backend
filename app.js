var mongoose = require('mongoose');
var express = require('express');
var app = express();

var crypto    = require('crypto');
var hmac;
var algorithm = 'sha1';
var key       = 'abcdeg';
var text      = 'I love cupcakes';
var hash;

// var keyHandler = require('./lib/handleKeys.js');

var user = require('./schemas/users.js');

mongoose.connect('mongodb://GaRwSRhDWopa:dyOKeHjSoBPc@mongosoup-cont002.mongosoup.de:31693/cc_GaRwSRhDWopa');

db = mongoose.connection;



//error handling for the database
//http://stackoverflow.com/questions/10873199/how-to-handle-mongoose-db-connection-interruptions
db.on('error', function(err){
	console.log("GOT ERROR EVENT");
	if(err){
		db.db.close();
		mongoose.connect('mongodb://GaRwSRhDWopa:dyOKeHjSoBPc@mongosoup-cont002.mongosoup.de:31693/cc_GaRwSRhDWopa');;
	}
});




app.get('/', function (req, res) {

	res.send('Hello World!')
})

app.get('/auth/:username/:nonce', function(req,res){
	// res.send("Hello ethan");
	// console.log(req.body);
	// console.log(req.params);
	// res.json(req.params);
	var username = req.params.username;
	var nonce = req.params.nonce;
	console.log("Looking");
	user.returnEncryptedNonceAlt(username, nonce, function(err,result){
		if(err){
			res.send("null");
		}
		else{
			res.send(result);
		}
	});
})

app.get('/test', function(req,res){
	user.testKey();
});

app.get('/testDB', function(req,res){
	user.dumpDB(function(err, result){
		if(err){
			res.send("Oh shit");
		}
		else{
			res.json(result);
		}
	});
});

var server = app.listen(process.env.PORT || 3000, main);

function main(){
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)
}

