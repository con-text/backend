var livedb = require('livedb');
var sharejs = require('share');
var livedbMongo = require('livedb-mongo');
var Duplex = require('stream').Duplex;
var browserChannel = require('browserchannel').server;
// LiveDb & Share JS
var backend;


var share;
// Register the Share JS rich-text custom Operational Transformation
var richText = require('rich-text');
livedb.ot.registerType(richText.type);



module.exports = function(express, app, mongoPath){

	backend = livedb.client(livedbMongo(mongoPath.toString() + '?auto_reconnect', {
		safe: false
	}));

	share = require('share').server.createClient({backend: backend});

	// Load static share.js file into front end
	app.use(express.static(sharejs.scriptsDir));



	app.use(browserChannel({webserver: express, cors: '*'}, function (client) {
		var stream = new Duplex({objectMode: true});
		stream._write = function (chunk, encoding, callback) {
			if (client.state !== 'closed') {
				client.send(chunk);
			}
			callback();
		};

		stream._read = function () {
		};

		stream.headers = client.headers;
		stream.remoteAddress = stream.address;

		client.on('message', function (data) {
			console.log("MESSAGE", data);
			stream.push(data);
		});
		stream.on('error', function (msg) {
			console.log("ERROR",msg);
			client.stop();
		});
		client.on('close', function (reason) {
			console.log("CLOSE",reason);
			stream.emit('close');
			stream.emit('end');
			stream.end();
		});

		share.listen(stream);
	}));
}