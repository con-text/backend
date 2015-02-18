var assert = require("assert");
var request = require('supertest'),
	express = require('express');
require('blanket')({
    pattern: function (filename) {
        return !/node_modules/.test(filename);
    }
});
var app = require('../app.js');
	app.disableLog();



describe('Crypto', function(){
	it('Input should match output', function(done){
		var initialValue = "5d41402abc4b2a76b9719d911017c592".toUpperCase();
		request(app)
		.get('/auth/stage1/tester/'+initialValue)
		.expect(200)
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(result.message, "286B0FD2009ED9CEE3D948EAB00EEF76");
			request(app)
			.get('/auth/stage2/tester/'+result.message)
			.expect(200)
			.end(function(err,res){
				var result = JSON.parse(res.text);
				assert.equal(err,null);
				assert.equal(result.message, initialValue);
				done();
			})
		});
	});

	it('Should reject strings of length less than 32 for stage1', function(done){
		request(app)
		.get('/auth/stage1/tester/5d41402abc4b2a76b9719d911017c59')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(res.status, 400);
			assert.equal(result.message, "Invalid data length");
			done();
		});
	});

	it('Should reject strings of length greater than 32 for stage1', function(done){
		request(app)
		.get('/auth/stage1/tester/5d41402abc4b2a76b9719d911017c59aa')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(res.status, 400);
			assert.equal(result.message, "Invalid data length");
			done();
		})
	});

	it('Should reject strings of length less than 32 for stage2', function(done){
		request(app)
		.get('/auth/stage2/tester/5d41402abc4b2a76b9719d911017c59')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(res.status, 400);
			assert.equal(result.message, "Invalid data length");
			done();
		});
	});

	it('Should reject strings of length greater than 32 for stage2', function(done){
		request(app)
		.get('/auth/stage2/tester/5d41402abc4b2a76b9719d911017c59aa')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(res.status, 400);
			assert.equal(result.message, "Invalid data length");
			done();
		})
	});

	it('Should reject invalid users for stage1', function(done){
		request(app)
		.get('/auth/stage1/hellooooo/5d41402abc4b2a76b9719d911017c59a')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err,null);
			assert.equal(result.message, "User doesn't exist");
			assert.equal(res.status, 400);
			done();
		});
	});

	it('Should reject invalid users for stage2', function(done){
		request(app)
		.get('/auth/stage2/hellooooo/5d41402abc4b2a76b9719d911017c59a')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err,null);
			assert.equal(result.message, "User doesn't exist");
			assert.equal(res.status, 400);
			done();
		});
	});

	it('Should reject invalid data for stage1', function(done){
		request(app)
		.get('/auth/stage1/tester/5d41402abc4b2a76b9719d911017c59G')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err,null);
			assert.equal(result.message, "Invalid data type");
			assert.equal(res.status, 400);
			done();
		});
	});

	it('Should reject invalid data for stage2', function(done){
		request(app)
		.get('/auth/stage2/tester/5d41402abc4b2a76b9719d911017c59G')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err,null);
			assert.equal(result.message, "Invalid data type");
			assert.equal(res.status, 400);
			done();
		});
	});
});

describe("User functions", function(){
	it('Should return expected values for tester account', function(done){
		request(app)
		.get('/users/tester')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(result.message.name, "TestMun");
			assert.equal(result.message.profilePicUrl, "https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/1/005/09f/0f1/2d8692d.jpg");
			done();
		})
	});

	it('Should return an error for an invalid user', function(done){
		request(app)
		.get('/users/aksdjlaksjda')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(err, null);
			assert.equal(result.message, "Invalid UUID");
			assert.equal(res.status, 404);
			done();
		});
	})
});

describe("Root path", function(){
	it("Should return Hello World!", function(done){
		request(app)
		.get('/')
		.end(function(err,res){
			assert.equal(res.text, "Hello World!");
			done();
		})
	})
});


describe("App States", function(){
	var testUUID = "tester";
	var testAppId = "1234567890101";
	var testState = {state:{"Something":"Cool"}};
	it("Should be able to create a test state", function(done){
		request(app)
		.post('/app/syncState/'+ testUUID +'/'+ testAppId +'/create').send( testState )
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(result.message, "Created");
			done();
		});
	});

	it("Shouldn't be able to create two of the same states", function(done){
		request(app)
		.post('/app/syncState/'+ testUUID +'/'+ testAppId +'/create').send( testState )
		.end(function(err,res){
			// console.log(err,res);
			var result = JSON.parse(res.text);
			assert.equal(result.message, "State already exists");
			done();
		});
	});

	it("Should be able to get the state", function(done){
		request(app)
		.get('/app/syncState/'+ testUUID +'/'+ testAppId )
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(result.message.uuid, testUUID);
			assert.equal(result.message.appId, testAppId);
			assert.equal(result.message.state.Something, testState.state.Something);
			done();
		});
	});

	it("Should be able to push some state", function(done){
		request(app)
		.post('/app/syncState/'+ testUUID +'/'+ testAppId).send({state: {Something: "Something else"}})
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(result.message, true);
			done();
		});
	})

	it("Should be able to delete the state", function(done){
		request(app)
		.get('/app/syncState/'+ testUUID +'/'+ testAppId +'/remove')
		.end(function(err,res){
			// console.log(res);
			var result = JSON.parse(res.text);
			assert.equal(result.message, "Done");
			done();
		});
	});

	it("Shouldn't be able to delete an invalid combination", function(done){
		request(app)
		.get('/app/syncState/'+ testUUID +'/'+ testAppId +'/remove')
		.end(function(err,res){
			var result = JSON.parse(res.text);
			assert.equal(result.message, "Invalid combination");
			done();
		});
	})
});
// describe("REST", function(){
// 	it('Should return uniform ')
// });
