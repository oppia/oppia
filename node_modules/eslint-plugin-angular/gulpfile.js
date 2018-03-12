'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');


gulp.task('quality', function() {
    return gulp.src(['*.js', '{rules,test}/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', function(cb) {
    gulp.src(['rules/*.js'])
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function() {
            gulp.src(['test/*.js'])
                .pipe(mocha())
                .pipe(istanbul.writeReports()) // Creating the reports after tests runned
                .on('end', cb);
        });
});

gulp.task('default', ['quality', 'test']);
