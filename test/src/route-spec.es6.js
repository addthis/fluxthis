'use strict';

const Route = require('../../src/router/Route.es6');

describe('Route Class', function () {
    let route;

    beforeEach(function () {
        route = new Route('/user/:id', function *() { });
    });

    it('should store values passed during instantiation', function () {
        route.path.should.equal('/user/:id');
        route.handler.should.be.a.Function;
        route.options.should.eql({});
        route.keys.should.be.lengthOf(1);
        route.regex.should.be.an.instanceof(RegExp);
    });

    it('should match the url for the route', function () {
        let result = route.matches('http://localhost?foo=bar#/user/1');
        result.should.not.be.empty;
        result.pathParams.id.should.equal('1');
        result.queryParams.foo.should.equal('bar');
    });
});
