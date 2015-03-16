'use strict';

var redis = require('redis');
var url = require('url');

module.exports = {
  connect: function() {
    var redisClient;

    if (process.env.REDISTOGO_URL) {

      var rtg = url.parse(process.env.REDISTOGO_URL);
      redisClient = redis.createClient(rtg.port, rtg.hostname);
      redisClient.auth(rtg.auth.split(":")[1]);
    } else {
      redisClient = redis.createClient();
    }

    return redisClient;
  },

  connectSubscriber: function () {

    var redisClient = this.connect();

    /**
     * subscribe to redis channel when client in ready
     */
    redisClient.on('ready', function() {
      redisClient.subscribe('notif');
    });


    return redisClient;
  }
};
