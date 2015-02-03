
var LocalStrategy = require('passport-local').Strategy;
	

module.exports = function(passport, userModel){

	passport.use(new LocalStrategy(
		function(username, password, done) {
			userModel.findOne({ username: username }, function(err, user) {
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, { message: 'Incorrect username.' });
				}
				if (!user.password === password) {
					return done(null, false, { message: 'Incorrect password.' });
				}
				return done(null, user);
			});
		}
	));
	return passport;
}