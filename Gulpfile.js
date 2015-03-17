'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var server = require('gulp-express');
var runSequence = require('run-sequence');

var webpack = require('webpack');
var webpackConfig = require('./webpack.config');

var tag = require('./bin/tag');

gulp.task('test-server-start', function () {
    server.run(['test/server.js']);
});

gulp.task('test-server-stop', function () {
    server.stop();
});

gulp.task('mocha-test', function () {
    var stream = mochaPhantomJS();
    stream.write({path: 'http://localhost:21029/test/fixtures/index.html'});
    stream.end();
    return stream;
});

gulp.task('test', function(callback) {
    runSequence('test-server-start',
        'mocha-test',
        'test-server-stop',
        callback);
});

gulp.task('build', function (callback) {
    process.env.NODE_ENV = 'development';

    webpack(webpackConfig, function(err, stats) {
        console.log(process.env.NODE_ENV);
        if (err) {
            throw new gutil.PluginError('webpack', err);
        }

        gutil.log('[webpack]', stats.toString());
        return callback();
    });
});

gulp.task('clean', function () {
    return gulp.src(['build/*', 'test/build/*'])
        .pipe(clean())
});

gulp.task('tag', function (callback){
    tag(function (err) {
        if (err) {
            throw new gutil.PluginError('tag', err);
        }

        return callback();
    });
});

gulp.task('publish', function (callback) {
    runSequence('test',
        'build',
        'tag',
        callback);
});