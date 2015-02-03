var mongoose = require('mongoose');
var express = require('express');
var app = express();

var path = require('path');

	
var	util	 		= require('util'),
	bodyParser 		= require('body-parser'),
	cookieParser 	= require('cookie-parser'),
	session 		= require('express-session'),
	methodOverride 	= require('method-override'),
	flash 			= require('connect-flash')

var user = require('./schemas/users.js');
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

var crypto    = require('crypto');


var mongoPath = 'mongodb://GaRwSRhDWopa:dyOKeHjSoBPc@mongosoup-cont002.mongosoup.de:31693/cc_GaRwSRhDWopa';

// var keyHandler = require('./lib/handleKeys.js');

app.use(cookieParser());
app.use(methodOverride());
app.use(session({ 
	secret: 'jidfso8fmsf[]-==--@', 
	cookie: {httpOnly: true},
	resave: false,
	saveUninitialized: false
}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

mongoose.connect(mongoPath);

db = mongoose.connection;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//error handling for the database
//http://stackoverflow.com/questions/10873199/how-to-handle-mongoose-db-connection-interruptions
db.on('error', function(err){
	console.log("GOT ERROR EVENT");
	if(err){
		db.db.close();
		mongoose.connect(mongoPath);;
	}
});


passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("Attempting login");
		user.attemptLogin(username, password, done);
	}
));


app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure'
  })
);


app.get('/login', function(req, res) {
  res.sendFile('./public/login.html');
});

app.get('/', function (req, res) {

	res.send('Hello World!')
})

app.get('/fetchUserInfo/:id', function(req,res){
	users.getFromUID(req.params.id, function(err, data){
		if(err){
			res.json(err);
		}
		else if(!data){
			res.json("Invalid UID");
		}
		else{
			res.json(data);
		}
	});
});

app.get('/auth/stage1/:username/:randomDataFromClient', function(req,res){
	// res.send("Hello ethan");
	// console.log(req.body);
	// console.log(req.params);
	// res.json(req.params);
	var username = req.params.username;
	var randomDataFromClient 	= req.params.randomDataFromClient;
	// console.log("Looking");
	user.returnEncryptedData(username, randomDataFromClient, function(err,result){
		if(err){
			res.send(err);
		}
		else{
			res.send(result);
		}
	});
});

app.get('/auth/stage2/:username/:ourRandomData', function(req,res){
	var username = req.params.username;
	var ourRandomData 	= req.params.ourRandomData;
	console.log("Looking");
	user.returnDecryptedData(username, ourRandomData, function(err,result){
		if(err){
			res.send(err);
		}
		else{
			res.send(result);
		}
	});
});

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


// app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(process.env.PORT || 3000, main);

function main(){
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)
}

