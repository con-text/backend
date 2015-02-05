var assert = require("assert");
var request = require('supertest'),
	express = require('express');
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

	it('Should reject strings of length less than 32', function(done){
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

	it('Should reject strings of length greater than 32', function(done){
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
});

describe("User functions", function(){
	it('Should return expected values for tester account', function(done){
		request(app)
		.get('/users/tester')
		.end(function(err,res){
			assert.equal(err, null);
			var result = JSON.parse(res.text);
			assert.equal(result.message.username, "TestMun");
			assert.equal(result.message.profilePicUrl, "https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/1/005/09f/0f1/2d8692d.jpg");
			done();
		})
	});
});


// describe("REST", function(){
// 	it('Should return uniform ')
// });
