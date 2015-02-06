var gulp = require('gulp');
var jshint = require('gulp-jshint');
var summary = require('jshint-summary');
var notify = require('gulp-notify');
var nodemon = require('gulp-nodemon');

gulp.task('lint', function() {
    gulp.src(['lib/*.js', 'schemas/*.js', 'app.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
        // .pipe(notify({
        //     title: 'JSHint',
        //     message: 'JSHint Passed. Let it fly!',
        // }))
});

gulp.task('build', ['lint'], function() {
    gulp.src('./')
        //pipe through other tasks such as sass or coffee compile tasks
        .pipe(notify({
            title: 'Task Builder',
            message: 'Successfully built application'
        }))
});

gulp.task('develop', function () {
  nodemon({ script: 'app.js', ignore:['test/test.js', 'gulpfile.js']})
    .on('change', ['lint'])
    .on('restart', function () {
      console.log('restarted!')
    })
})

gulp.task('default', function() {
  // place code for your default task here
});