(function () {
   
   var gulp = require('gulp'),
  eslint = require('gulp-eslint');

 gulp.task('quality', function() {

  gulp.src(['app/**/*.js'])
   .pipe(eslint({
    
   }))
   .pipe(eslint.format());
 });

 gulp.task('default', ['quality']);
}());
