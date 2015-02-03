var mongoose = require('mongoose');
var express = require('express');
var app = express();

var path = require('path');

var user = require('./schemas/users.js');
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

var crypto    = require('crypto');

// var keyHandler = require('./lib/handleKeys.js');


mongoose.connect('mongodb://GaRwSRhDWopa:dyOKeHjSoBPc@mongosoup-cont002.mongosoup.de:31693/cc_GaRwSRhDWopa');

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
		mongoose.connect('mongodb://GaRwSRhDWopa:dyOKeHjSoBPc@mongosoup-cont002.mongosoup.de:31693/cc_GaRwSRhDWopa');;
	}
});


passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("Attempting login");
		user.getModel().findOne({ username: username }, function(err, result) {
			if (err) {
				return done(err);
			}
			if (!result) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (!result.password === password) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, result);
		});
	}
));


app.post('/login', function(req,res,next)
{
	console.log(req);
	next();
}, 

  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);



app.get('/', function (req, res) {

	res.send('Hello World!')
})

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


app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(process.env.PORT || 3000, main);

function main(){
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)
}

