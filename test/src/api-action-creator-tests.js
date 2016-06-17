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

var APIActionCreator = require('../../src/APIActionCreator.es6');
var dispatcher = require('../../src/dispatcherInstance.es6');

describe('APIActionCreators', function () {

	it('should expose methods passed to their constructor', function () {
        var aac = new APIActionCreator({
			displayName: 'api1',
            doThing: {
                method: 'GET',
                route: '/cat',
                pending: 'TEST_' + Math.random(),
            },
            doOtherThing: {
                method: 'POST',
                route: '/dog',
                pending: 'TEST_' + Math.random()
            }
        });

        Should.exist(aac.doThing);
        Should.exist(aac.doOtherThing);
    });

    it('should be given a request object after being called', function () {
        var aac = new APIActionCreator({
            displayName: 'api45',
            doThing: {
                route: '/mirror',
                method: 'POST',
                pending: 'TEST_' + Math.random()
            }
        });

        var request = aac.doThing();
        Should.exist(request);
        Should.exist(request.abort);
    });

    it('should call handleSuccess on a successful request', function (done) {
        var aac = new APIActionCreator({
			displayName: 'api2',
            doThing: {
                route: '/mirror',
                method: 'POST',
                pending: 'TEST_' + Math.random(),
                handleSuccess: function () {
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should not parse the body as JSON with a mimetype of "text/plain"', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                createRequest: function () {
                    return {
                        query: {
                            contentType: 'text/plain'
                        }
                    };
                },
                handleSuccess: function (req, res) {
                    res.body.should.be.type('string');
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should parse the body as JSON with a mimetype of "application/json"', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                createRequest: function () {
                    return {
                        query: {
                            contentType: 'application/json'
                        }
                    };
                },
                handleSuccess: function (req, res) {
                    res.body.should.be.type('object');
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should parse the body as JSON with a mimetype of "application/json; charset=utf-8"', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                createRequest: function () {
                    return {
                        query: {
                            contentType: 'application/json; charset=utf-8'
                        }
                    };
                },
                handleSuccess: function (req, res) {
                    res.body.should.be.type('object');
                    done();
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing();
    });

    it('should call handleFailure on a failed request', function (done) {
        var aac = new APIActionCreator({
			displayName: 'api3',
            doThing: {
                route: '/bad-endpoint',
                method: 'POST',
                pending: 'TEST_' + Math.random(),
                handleSuccess: function () {
                    done(new Error('handleSuccess was called'));
                },
                handleFailure: function () {
                    done();
                }
            }
        });

        aac.doThing();
    });

    it('should call handleFailure when the application type is json but the payload is not valid JSON', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/invalid-json',
                method: 'GET',
                handleSuccess: function () {
                    done(new Error('handleSuccess was called'));
                },
                handleFailure: function (req, res) {
                    res.body.should.equal('hello world');
                    res.error.should.be.instanceOf(Error);
                    done();
                }
            }
        });

        aac.doThing();
    });

    it('should call handleAbort on a aborted request', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api55',
            doThing: {
                route: '/long-time',
                method: 'POST',
                handleSuccess: function () {
                    done(new Error('handleSuccess was called'));
                },
                handleFailure: function () {
                    done(new Error('handleFailure was called'));
                },
                handleAbort: function () {
                    done();
                }
            }
        });

        var r = aac.doThing();
        r.abort();
    });

    it('should transform a request with createRequest', function (done) {
        var query = {};
		var clonedQuery = {};

        var aac = new APIActionCreator({
			displayName: 'api4',
            doThing: {
                route: '/mirror',
                method: 'POST',
                pending: 'TEST_' + Math.random(),
                createRequest: function (a, b) {
                    query.a = a;
                    query.b = b;

					// setup cloned query for equality
					clonedQuery.a = a;
					clonedQuery.b = b;
                    return {
                        query: query
                    };
                },
                handleSuccess: function (req, res) {
                    try {
                        req.query.should.eql(clonedQuery);
                        res.body.query.should.eql(clonedQuery);
                        done();
                    }
                    catch(err) {
                        done(err);
                    }
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                }
            }
        });

        aac.doThing('hi', 'mom');
    });

    it('should allow for named parameters with file extensions', function (done) {
        var userId = Math.random();
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror/:userId.json',
                method: 'POST',
                createRequest: function (userId) {
                    return {
                        params: {
                            userId: userId
                        }
                    };
                },
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                },
                handleSuccess: function (req, res) {
                    try {
                        req.params.userId.should.eql(userId);
                        res.body.path.should.eql('/mirror/' + userId + '.json');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }
            }
        });

        aac.doThing(userId);
    });

	it('should throw an error for passing args without create request', function () {
		(function () {
			var aac = new APIActionCreator({
				displayName: 'api55',
				doThing: {
					route: '/mirror',
					method: 'POST',
					pending: 'TEST_' + Math.random()
				}
			});
			aac.doThing('hi', 'mom');
		}).should.throw();
	});

    it('should throw errors when route is missing', function () {
        (function () {
            new APIActionCreator({
				displayName: 'api5',
                doThing: {
                    method: 'POST',
                    pending: 'TEST_' + Math.random()
                }
            });
        }).should.throw();
    });

    it('should throw errors when method is missing', function () {
        (function () {
            new APIActionCreator({
				displayName: 'api6',
                doThing: {
                    route: '/dog',
                    penging: 'TEST_' + Math.random(),
                }
            });
        }).should.throw();
    });

    it('should initially set no request headers by default', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                },
                handleSuccess: function (req) {
                    Should.not.exist(req.headers);
                    done();
                }
            }
        });

        aac.doThing();
    });

    it('should initially set no base url by default', function (done) {
        var aac = new APIActionCreator({
            displayName: 'api' + Math.random(),
            doThing: {
                route: '/mirror',
                method: 'POST',
                handleFailure: function (req, res) {
                    done(req.error || res.error || new Error('Request failed'));
                },
                handleSuccess: function (req) {
                    req.route.should.eql('/mirror');
                    done();
                }
            }
        });

        aac.doThing();
    });

    describe('when making the api call', function () {
        var token;
        var pending;
        var success;
        var failure;
        var abort;
        var query;
        var aac;

        beforeEach(function () {
            pending = 'PENDING_' + Math.random();
            success = 'SUCCESS_' + Math.random();
            failure = 'FAILURE_' + Math.random();
            abort = 'ABORT_' + Math.random();

            query = {};
            aac = new APIActionCreator({
				displayName: String(Math.random()),
                doThing: {
                    route: '/cat',
                    method: 'GET',
                    pending: pending,
                    success: success,
                    createRequest: function (a, b) {
                        query.a = a;
                        query.b = b;
                        return {
                            query: query
                        };
                    }
                },
                doThingFailureTest: {
                    route: '/cat',
                    method: 'GET',
                    failure: failure,
                    createRequest: function (a, b) {
                        query.a = a;
                        query.b = b;
                        return {
                            query: query
                        };
                    }
                },
                doBrokenThing: {
                    route: '/bad',
                    method: 'GET',
                    failure: failure
                },
                doAbortThing: {
                    route: '/long-time',
                    method: 'POST',
                    abort: abort
                },

            });
        });

        afterEach(function () {
            dispatcher.unregister(token);
        });

        it('should not send the failure type when success response without success type', function (done) {
            // https://github.com/addthis/fluxthis/issues/121
            token = dispatcher.register(function (action) {
                done(new Error('an action should not have been dispatched'));
            });


            aac.doThingFailureTest();
            setTimeout(done, 1500);
        });

        it('should dispatch the pending action when making the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === pending) {
                    done();
                }
            });

            aac.doThing('hi','mom');
        });

        it('should dispatch the successful action after succeeding with the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === success) {
                    done();
                }
            });

            aac.doThing('hi','mom');
        });

        it('should dispatch the failure action after failing with the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === failure) {
                    done();
                }
            });

            aac.doBrokenThing();
        });


        it('should dispatch the abort action after failing with the call', function (done) {

            token = dispatcher.register(function (action) {
                if(action.type === abort) {
                    done();
                }
            });

            var r = aac.doAbortThing();
            r.abort();
        });
    });

    describe('when setting request headers', function () {
        beforeEach(function () {
            APIActionCreator.setDefaultHeaders({
                'X-FOO-HEADER': 'foo'
            });
        });

        afterEach(function () {
            APIActionCreator.setDefaultHeaders(undefined);
        });

        it('should set the default headers on requests by default', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithDefaultHeaders: {
                    route: '/mirror',
                    method: 'POST',
                    handleFailure: function (req, res) {
                        done(req.error || res.error || new Error('Request failed'));
                    },
                    handleSuccess: function (req) {
                        req.should.have.propertyByPath('headers', 'X-FOO-HEADER').eql('foo');
                        done();
                    }
                }
            });

            aac.doThingWithDefaultHeaders();
        });

        it('should allow unsetting the default headers for specific requests', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithNoDefaultHeaders: {
                    route: '/mirror',
                    method: 'POST',
                    handleFailure: function (req, res) {
                        done(req.error || res.error || new Error('Request failed'));
                    },
                    createRequest: function () {
                        return {
                            headers: {
                                'X-FOO-HEADER': undefined
                            }
                        };
                    },
                    handleSuccess: function (req) {
                        Should.exist(req.headers);
                        req.should.have.propertyByPath('headers', 'X-FOO-HEADER').eql(undefined);
                        done();
                    }
                }
            });

            aac.doThingWithNoDefaultHeaders();
        });

        it('should allow overwriting the value of the default headers for specific requests', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithOverwrittenHeaders: {
                    route: '/mirror',
                    method: 'POST',
                    handleFailure: function (req, res) {
                        done(req.error || res.error || new Error('Request failed'));
                    },
                    createRequest: function () {
                        return {
                            headers: {
                                'X-FOO-HEADER': 'lol horwitz'
                            }
                        };
                    },
                    handleSuccess: function (req) {
                        req.should.have.propertyByPath('headers', 'X-FOO-HEADER').eql('lol horwitz');
                        done();
                    }
                }
            });

            aac.doThingWithOverwrittenHeaders();
        });

        it('should merge additional specified headers with the default headers', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithAdditionalHeaders: {
                    route: '/mirror',
                    method: 'POST',
                    handleFailure: function (req, res) {
                        done(req.error || res.error || new Error('Request failed'));
                    },
                    createRequest: function () {
                        return {
                            headers: {
                                'X-BAR-HEADER': 'bar'
                            }
                        };
                    },
                    handleSuccess: function (req) {
                        req.should.have.propertyByPath('headers', 'X-FOO-HEADER').eql('foo');
                        req.should.have.propertyByPath('headers', 'X-BAR-HEADER').eql('bar');
                        done();
                    }
                }
            });

            aac.doThingWithAdditionalHeaders();
        });

        it('should allow resetting subsequent default headers', function (done) {
            APIActionCreator.setDefaultHeaders(undefined);

            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithResetHeaders: {
                    route: '/mirror',
                    method: 'POST',
                    handleFailure: function (req, res) {
                        done(req.error || res.error || new Error('Request failed'));
                    },
                    createRequest: function () {
                        return {
                            headers: {
                                'X-BAR-HEADER': 'bar'
                            }
                        };
                    },
                    handleSuccess: function (req) {
                        req.should.have.propertyByPath('headers', 'X-BAR-HEADER').eql('bar');
                        Should.not.exist(req.headers['X-FOO-HEADER']);
                        done();
                    }
                }
            });

            aac.doThingWithResetHeaders();
        });

        it('should throw an invariant exception if provided anything other than undefined or a plain object', function () {
            (function () {
                APIActionCreator.setDefaultHeaders(null);
            }).should.throw();

            (function () {
                APIActionCreator.setDefaultHeaders(1);
            }).should.throw();

            (function () {
                APIActionCreator.setDefaultHeaders('test');
            }).should.throw();

            (function () {
                APIActionCreator.setDefaultHeaders(true);
            }).should.throw();
        });

    });

    describe('when setting default base URL', function () {
        beforeEach(function () {
            APIActionCreator.setDefaultBaseURL('http://127.0.0.1:21029');
        });

        afterEach(function () {
            APIActionCreator.setDefaultBaseURL(undefined);
        });

        it('should set the default base domain on requests', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithDefaultBaseURL: {
                    route: '/cat',
                    method: 'GET',
                    handleFailure: function (req, res) {
						done(req.error || res.error || new Error('Request failed'));
                    },
                    handleSuccess: function (req) {
                        req.route.should.eql('http://127.0.0.1:21029/cat');
                        done();
                    }
                }
            });

            aac.doThingWithDefaultBaseURL();
        });

		it('should set the default base domain on requests with no leading slash', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithDefaultBaseURL: {
                    route: 'cat',
                    method: 'GET',
                    handleFailure: function (req, res) {
						done(req.error || res.error || new Error('Request failed'));
                    },
                    handleSuccess: function (req) {
                        req.route.should.eql('http://127.0.0.1:21029/cat');
                        done();
                    }
                }
            });

            aac.doThingWithDefaultBaseURL();
        });

		it('should let the default base domain be overridden', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithDefaultBaseURL: {
                    route: 'http://localhost:21029/cat',
                    method: 'GET',
                    handleFailure: function (req, res) {
						done(req.error || res.error || new Error('Request failed'));
                    },
                    handleSuccess: function (req) {
                        req.route.should.eql('http://localhost:21029/cat');
                        done();
                    }
                }
            });

            aac.doThingWithDefaultBaseURL();
        });

		it('should let the default base domain be overridden with leading slashes', function (done) {
            var aac = new APIActionCreator({
                displayName: 'api' + Math.random(),
                doThingWithDefaultBaseURL: {
                    route: '//localhost:21029/cat',
                    method: 'GET',
                    handleFailure: function (req, res) {
						done(req.error || res.error || new Error('Request failed'));
                    },
                    handleSuccess: function (req) {
                        req.route.should.eql('//localhost:21029/cat');
                        done();
                    }
                }
            });

            aac.doThingWithDefaultBaseURL();
        });

        it('should throw an invariant exception if provided anything other than undefined or a string', function () {
            (function () {
                APIActionCreator.setDefaultBaseURL(null);
            }).should.throw();

            (function () {
                APIActionCreator.setDefaultBaseURL(1);
            }).should.throw();

            (function () {
                APIActionCreator.setDefaultBaseURL(true);
            }).should.throw();
        });

    });

});
