var gulp         = require('gulp');
var less         = require('gulp-less');
var jshint       = require('gulp-jshint');
var ngTemplates  = require('gulp-angular-templatecache');
var rename       = require('gulp-rename');
var uglify       = require('gulp-uglify');
var concat       = require('gulp-concat');
var minifyCss    = require('gulp-minify-css');

var del          = require('del');
var stylish      = require('jshint-stylish');

gulp.task('less-dev', function() {
  return gulp.src('src/toastr.less')
    .pipe(less())
    .pipe(gulp.dest('gen'));
});

gulp.task('less-prod', function() {
  return gulp.src('src/toastr.less')
    .pipe(less())
    .pipe(rename('angular-toastr.css'))
    .pipe(gulp.dest('dist'))
    .pipe(minifyCss())
    .pipe(rename('angular-toastr.min.css'))
    .pipe(gulp.dest('dist'));
});

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'test/**/*_spec.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('scripts-dev', function() {
  return gulp.src(['src/toastr.js', 'src/**/*.js'])
    .pipe(concat('toastr.js'))
    .pipe(gulp.dest('gen'));
});

gulp.task('scripts-prod', function() {
  return gulp.src(['src/toastr.js', 'src/**/*.js'])
    .pipe(concat('angular-toastr.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('angular-toastr.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('scripts-prod-tpls', ['template'], function() {
  return gulp.src(['src/toastr.js', 'src/**/*.js', 'gen/toastr.tpl.js'])
    .pipe(concat('angular-toastr.tpls.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('angular-toastr.tpls.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('template', function() {
  return gulp.src('src/**/*.html')
    .pipe(ngTemplates({
      module: 'toastr'
    }))
    .pipe(rename('toastr.tpl.js'))
    .pipe(gulp.dest('gen'));
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['lint', 'scripts-dev']);
  gulp.watch('src/toastr.less', ['less-dev']);
  gulp.watch('src/**/*.html', ['template']);
});

gulp.task('clean', function(cb) {
  del(['dist', 'gen'], cb);
});

gulp.task('default', ['less-dev', 'scripts-dev', 'template', 'watch']);
gulp.task('production', ['less-prod', 'scripts-prod', 'scripts-prod-tpls']);
gulp.task('travis', ['less-dev', 'scripts-dev', 'template']);
