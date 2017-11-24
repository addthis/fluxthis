/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var server = require('gulp-express');
var eslint = require('gulp-eslint');

var webpack = require('webpack');
var gulpWebpack = require('gulp-webpack');
var webpackConfig = require('./webpack.config');
var testWebpackConfig = require('./test/webpack.config');
var saveLicense = require('uglify-save-license');

var tag = require('./bin/tag');
var runSequence = require('run-sequence');

gulp.task('test-server-start', function (done) {
    server.run(['test/server.js']);
    setTimeout(done, 1000);
});

gulp.task('test-server-stop', function () {
    server.stop();
});

gulp.task('mocha-test', function () {
    var stream = mochaPhantomJS();
    stream.write({path: 'http://localhost:21029/test/fixtures/index.html'});
    stream.on('error', function(e) {
        runSequence('test-server-stop', function () { throw e; });
    });
    stream.end();
    return stream;
});

gulp.task('build-test', function () {
    testWebpackConfig.plugins = testWebpackConfig.plugins.concat(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development')
            }
        })
    );
    return gulp.src(testWebpackConfig.entry.tests)
        .pipe(gulpWebpack(testWebpackConfig))
        .pipe(gulp.dest(testWebpackConfig.output.path));
});

gulp.task('test', function(callback) {
    runSequence('clean',
        'lint',
        'build-dev',
        'build-test',
        'test-server-start',
        'mocha-test',
        'test-server-stop',
        callback);
});

gulp.task('build-dev', function () {
    return gulp.src(webpackConfig.entry.FluxThis)
        .pipe(gulpWebpack(webpackConfig))
        .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('build-prod', function () {
    // Make minified file for production.
    webpackConfig.output.filename = 'FluxThis.min.js';

    webpackConfig.plugins = webpackConfig.plugins.concat(
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            comments: saveLicense,
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
        .pipe(clean());
});

gulp.task('lint', function () {
    // Note: To have the process exit with an error code (1) on
    //  lint error, return the stream and pipe to failOnError last.
    return gulp.src(['src/**/*.js', 'lib/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
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


