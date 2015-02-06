'use strict';
//a global replacement for console.log, disableLog will turn off all outputs
global.enableLogging = true;
global.debug = function(){

	if(enableLogging){
		console.log.apply(this,arguments);
	}
};

var mongoose = require('mongoose'),
	express = require('express'),
	app = express();

var user = require('./schemas/users.js');
var authScheme = require('./lib/authScheme.js');
var fs = require('fs');

var mongoPath = "";


//this is for logging into the db. I'm reluctant to set ENV VARS when developing
//locally as the gulpfile is public, and it would be a pain to add them manually
//every time. 
try{
	mongoPath = fs.readFileSync('mongologin.txt');
}
catch(e){
	//the file doesn't exist, try the env var
	mongoPath = process.env.MONGOLOGIN;
}

mongoose.connect(mongoPath);
var db = mongoose.connection;

//error handling for the database
//http://stackoverflow.com/questions/10873199/how-to-handle-mongoose-db-connection-interruptions
db.on('error', function(err){
	console.log("Database error");
	if(err){
		db.db.close();
		mongoose.connect(mongoPath);
	}
});


app.get('/', function (req, res) {
	res.send('Hello World!');
});


//The code that the front end uses in the login page to get the profile picture
//from a uuid
app.get('/users/:id', user.getFromUID);



//The route for the first stage of device auth. Takes in uuid and encrypted data generated by the 
//wearable and spits out the decrypted block. This is to prevent the screen code from ever having
//the keys locally
app.get('/auth/stage1/:uuid/:randomDataFromClient', authScheme.stage1);


//The route for the second stage of device auth. Takes in uuid and random data generated by the 
//server running on the screen code (the code that runs in the background of the board)
//and spits out the encrypted block. This is to prevent the screen code from ever having
//the keys locally
app.get('/auth/stage2/:uuid/:ourRandomData', authScheme.stage2);


// app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(process.env.PORT || 3000, main);

app.disableLog = function(){
	global.enableLogging = false;
};

function main(){
	var host = server.address().address;
	var port = server.address().port;

	debug('Example app listening at http://%s:%s', host, port);
}

module.exports = app;

