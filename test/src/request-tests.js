'use strict';

var Request = require('../../lib/request.es6.js');

describe('Request Tests', function () {

	it('should create a request object with one symbol attribute', function () {
		var request = new Request({});
		Object.getOwnPropertySymbols(request).length.should.eql(1);
	});

	it('should have an abort method and return true', function (done) {
		var request = new Request({
			abort: function() {
				done();
			}
		}, {}, function() {});

		request.abort().should.eql(true);
	});

	it('should return false since request is done', function () {
		var request = new Request({
			readyState: 4
		}, {}, function() {});

		request.abort().should.eql(false);
	});
});