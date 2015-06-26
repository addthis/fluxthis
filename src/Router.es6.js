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

const RouteListenerView = require('./router/RouteListenerView.es6.js');
const RouterStore = require('./RouterStore.es6');
const RouterActions = require('./router/RouterActions.es6');
const invariant = require('invariant');

const REGISTERED = Symbol('registered');

let started = false;
let defaultRoute = '/';

class Router {
    defaultRoute(route='/') {
        defaultRoute = route;
        return this;
    }

    register(callback) {
        invariant(
            typeof callback === 'function',
            'You must register a callback function that takes a router ' +
            'object in order to register new routes.'
        );

        const self = this;
        callback({
            use(...args) {
                RouterActions.use(...args);
                return this;
            },
            all(...args) {
                RouterActions.all(...args);
                return this;
            },
            route(...args) {
                self[REGISTERED] = true;
                RouterActions.route(...args);
                return this;
            }
        });

        return this;
    }

    start() {
        invariant(
            started === false,
            'You can only start the router once'
        );

        started = true;

        invariant(
            this[REGISTERED] === true,
            'You must register some routes before you can start your router.'
        );

        new RouteListenerView({defaultRoute}).start();
        RouterActions.start();
    }
}

module.exports = new Router();
module.exports.mixin = {
    redirectTo: RouterActions.redirectTo,
    navigateTo: RouterActions.navigateTo,
    getPath: RouterStore.getPath,
    getPathParams: RouterStore.getPathParams,
    getQueryParams: RouterStore.getQueryParams
};
