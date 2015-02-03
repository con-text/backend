var mongoose = require('mongoose');
var express = require('express');
var app = express();
	
var	util	 		= require('util'),
	bodyParser 		= require('body-parser'),
	cookieParser 	= require('cookie-parser'),
	session 		= require('express-session'),
	methodOverride 	= require('method-override'),
	flash 			= require('connect-flash'),
	path 			= require('path');

var user = require('./schemas/users.js');

var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;


var mongoPath = 'mongodb://GaRwSRhDWopa:dyOKeHjSoBPc@mongosoup-cont002.mongosoup.de:31693/cc_GaRwSRhDWopa';



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
	console.log("Database error");
	if(err){
		db.db.close();
		mongoose.connect(mongoPath);;
	}
});

//setup the passport local strategy, a bulk of the login code is within the users schema
//the username, password and done parameters are automatically passed in to the strategy
passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("Attempting login");
		user.attemptLogin(username, password, done);
	}
));

//handle the login data
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
	user.getFromUID(req.params.id, function(err, data){
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


//allow CORS
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
})

// app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(process.env.PORT || 3000, main);

function main(){
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)
}

