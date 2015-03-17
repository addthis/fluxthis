var fs = require('fs');
var pj = JSON.parse(fs.readFileSync('./package.json'));
var version = pj.version;
var exec = require('child_process').exec;
exec('git tag -a v' + version + ' -m "Automaticly tagged for npm publish"', function (err) {
    if(err) {
        throw err;
    }
    else {
        exec('git push --tags');
    }
});
