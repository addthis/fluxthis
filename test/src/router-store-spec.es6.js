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

const RouterStore = require('../../src/RouterStore.es6');
const RouteListenerView = require('../../src/router/RouteListenerView.es6');
const Constants = require('../../src/router/RouterConstants.es6');

function testContext(context) {
    context.getPath.should.be.a.Function;
    context.redirectTo.should.be.a.Function;
    context.getQueryParams.should.be.a.Function;
    context.getPathParams.should.be.a.Function;
}

describe('Router Store', function () {
    let routeListener = new RouteListenerView();

    beforeEach(function () {
        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTE_REDIRECT,
            payload: '/'
        });

        RouterStore.TestUtils.reset();
        routeListener.start();
    });

    afterEach(function () {
        routeListener.stop();
    });

    it('should replace the url', function () {
        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTE_REDIRECT,
            payload: '/foo'
        });

        window.location.hash.should.equal('#/foo');
    });

    it('should navigate to the route name', function (done) {
        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ROUTE_ACTION,
            payload: {
                path: '/foo',
                name: 'foo',
                handler: function*() {
                    done();
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTE_NAVIGATE,
            payload: '/foo'
        });

       window.location.hash.should.equal('#/foo');
    });

    it('should redirect to the route name', function (done) {
        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ROUTE_ACTION,
            payload: {
                path: '/foo',
                name: 'foo',
                handler: function*() {
                    done();
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTE_REDIRECT,
            payload: '/foo'
        });

        window.location.hash.should.equal('#/foo');
    });

    it('should have correct methods on context', function (done) {
        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ROUTE_ACTION,
            payload: {
                path: '/',
                name: 'default',
                handler: function*(next) {
                    testContext(this);
                    yield *next;
                    testContext(this);
                    done();
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ALL_ROUTE_ACTION,
            payload: {
                path: '/',
                handler: function*(next) {
                    testContext(this);
                    yield *next;
                    testContext(this);
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_USE_ACTION,
            payload: function *(next) {
                testContext(this);
                yield *next;
                testContext(this);
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_START
        });
    });

    it('should follow the middleware chain. all(*) -> all(/) -> route(/) -> use', function (done) {
        var count = 0;
        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ALL_ROUTE_ACTION,
            payload: {
                path: '*',
                handler: function*(next) {
                    count++;
                    yield *next;
                    count.should.equal(7);
                    done();
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ALL_ROUTE_ACTION,
            payload: {
                path: '/',
                handler: function*(next) {
                    count++;
                    yield *next;
                    count++;
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_SETUP_ROUTE_ACTION,
            payload: {
                path: '/',
                name: 'default',
                handler: function *(next) {
                    count++;
                    yield *next;
                    count++;
                }
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_USE_ACTION,
            payload: function *(next) {
                count++;
                yield *next;
                count++;
            }
        });

        RouterStore.TestUtils.mockDispatch({
            type: Constants.ROUTER_START
        });
    });
});
