'use strict';
var version = require('../package.json').version;
var exec = require('child_process').exec;

module.exports = function (callback) {
    exec('git tag -a v' + version + ' -m "Automaticly tagged for npm publish"', function (err) {
        if (err) {
            return callback(err);
        }

        exec('git push --tags', function (err) {
            return callback(err);
        });
    });
};

