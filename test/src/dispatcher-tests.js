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

var Dispatcher = require('../../src/Dispatcher.es6');
var dispatcher;

describe('Dispatcher', function () {

    beforeEach(function () {
        dispatcher = new Dispatcher();
    });

    it('should create', function () {
        Should.exist(dispatcher);
    });

    it('should register/unregister callbacks without error', function () {
        (function () {
            var token = dispatcher.register(function(){});
            dispatcher.unregister(token);
        }).should.not.throw();
    });

    it('should call all registered callbacks on dispatch', function () {
        var called = 0;
        var cbs = [
            function () {
                called++;
            },
            function () {
                called++;
            },
            function () {
                called++;
            }
        ];
        var tokens = [];

        tokens[0] = dispatcher.register(cbs[0]);
        tokens[1] = dispatcher.register(cbs[1]);
        tokens[2] = dispatcher.register(cbs[2]);
        dispatcher.dispatch({type: 'a'});
        called.should.equal(3);
    });

    it('should not call unregistered callbacks', function () {
        var called = 0;
        var cbs = [
            function () {
                called++;
            },
            function () {
                called++;
            },
            function () {
                called++;
            }
        ];
        var tokens = [];

        tokens[0] = dispatcher.register(cbs[0]);
        tokens[1] = dispatcher.register(cbs[1]);
        tokens[2] = dispatcher.register(cbs[2]);
        dispatcher.unregister(tokens[1]);
        dispatcher.dispatch({type: 'a'});

        called.should.equal(2);
    });

    it('should call emitChanges', function (done) {
        dispatcher.register(function() {

        }, null, function () {
            done();
        });

        dispatcher.dispatch({type: 'a'});
    });

    it('should return a token from register', function () {
        var cb = function () {};
        var token = dispatcher.register(cb);
        token.should.be.type('string');
    });

    it('should order things correctly with waitfor', function () {
        var result = '';

        var a = dispatcher.register(function () {
            dispatcher.waitFor([b, c]);
            result += 'a';
        });

        var b = dispatcher.register(function () {
            result += 'b';
        });

        var c = dispatcher.register(function () {
            dispatcher.waitFor(b);
            result += 'c';
        });

        dispatcher.dispatch({type: 'a'});

        result.should.equal('bca');
    });

    it('should throw an error if double-dispatching', function () {
        (function () {
            dispatcher.register(function () {
                dispatcher.dispatch({type: 'a'});
            });

            dispatcher.dispatch({type: 'a'});
        }).should.throw();
    });

    it('should throw an error when a dispatched action is mutated', function () {
        (function () {
            dispatcher.register(function (action) {
                action.payload.bye = 'bad!';
            });

            dispatcher.dispatch({payload: {hi: 'sup'}, type: Math.random()});
        }).should.throw(/mutate/);
    });

    it('should not throw an error when a dispatched payload is not stringifiable', function () {
        var payload = {};
        var a = {};
        var b = {};
        a.b = b;
        b.a = a;
        payload.a = a;
        payload.b = b;
        (function() {
            dispatcher.dispatch({payload: payload, type: Math.random()});
        }).should.not.throw();
    });

});
