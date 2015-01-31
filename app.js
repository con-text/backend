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

mongoose.connect('mongodb://localhost/con-text');

db = mongoose.connection;



//error handling for the database
//http://stackoverflow.com/questions/10873199/how-to-handle-mongoose-db-connection-interruptions
db.on('error', function(err){
	console.log("GOT ERROR EVENT");
	if(err){
		db.db.close();
		mongoose.connect('mongodb://localhost/con-text');;
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

var server = app.listen(3000, main);

function main(){
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)
}

