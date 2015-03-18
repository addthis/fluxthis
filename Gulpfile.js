'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var server = require('gulp-express');

var webpack = require('webpack');
var gulpWebpack = require('gulp-webpack');
var webpackConfig = require('./webpack.config');
var testWebpackConfig = require('./test/webpack.config');

var tag = require('./bin/tag');
var runSequence = require('run-sequence');

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

gulp.task('build-test', function (callback) {
    testWebpackConfig.plugins = testWebpackConfig.plugins.concat(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development')
            }
        })
    );
    return gulp.src(testWebpackConfig.entry.tests)
        .pipe(webpack(testWebpackConfig))
        .pipe(gulp.dest(testWebpackConfig.output.path));
});
gulp.task('test', function(callback) {

    runSequence('build-test',
        'test-server-start',
        'mocha-test',
        'test-server-stop',
        callback);
});

gulp.task('build-dev', function (callback) {
    return gulp.src(webpackConfig.entry.FluxThis)
        .pipe(gulpWebpack(webpackConfig))
        .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('build-prod', function (callback) {
    // Make minified file for production.
    webpackConfig.output.filename = 'FluxThis.min.js';

    webpackConfig.plugins = webpackConfig.plugins.concat(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
           compress: {
               warnings: false
           }
        })
    );

    return gulp.src(webpackConfig.entry.FluxThis)
        .pipe(gulpWebpack(webpackConfig))
        .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('watch', function () {
    webpackConfig.watch = true;
    return gulp.src(webpackConfig.entry.FluxThis)
        .pipe(gulpWebpack(webpackConfig))
        .pipe(gulp.dest(webpackConfig.output.path));
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
        'build-prod',
        'build-dev',
        'tag',
        callback);
});