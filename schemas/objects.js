'use strict';

var mongoose = require('mongoose');

var schema = mongoose.Schema({
	state: Object,
	appId: String,
	collaborators: [String]
	owner: String
});

var model = mongoose.model("appStates", schema);

module.exports = {
	
};