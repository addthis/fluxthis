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

const getPath = require('../../lib/router/getPath.es6');
const RouterActions = require('./RouterActions.es6');

const DEFAULT_ROUTE = Symbol('defaultRoute');
const PREVIOUS_ROUTE = Symbol('previousRoute');

export default class RouterListener {
    constructor({defaultRoute='/'}={}) {
        this[DEFAULT_ROUTE] = defaultRoute;
    }

    /**
     * Removes the event listeners from the DOM
     */
    stop() {
        if (window.removeEventListener) {
            window.removeEventListener('hashchange', this.onHashChange.bind(this), false);
        } else {
            window.detachEvent('onhashchange', this.onHashChange.bind(this));
        }
    }

    /**
     * Starts the listener by adding event listeners to the DOM &
     * ensures the slash is present on the #
     */
    start() {
        if (window.addEventListener) {
            window.addEventListener('hashchange', this.onHashChange.bind(this), false);
        } else {
            window.attachEvent('onhashchange', this.onHashChange.bind(this));
        }
        this.ensureSlash();
        this[PREVIOUS_ROUTE] = getPath();
    }

    /**
     * Ensures the slash is present after the #. It replaces the current
     * hash if not found.
     *
     * @param {string} [path=getPath()]
     * @returns {boolean} - true if found, false otherwise
     */
    ensureSlash(path=getPath()) {
        if (path.charAt(0) === '/') {
            return true;
        }

        if (path) {
            path = '/' + path;
        } else {
            const defaultRoute = this[DEFAULT_ROUTE];
            path = defaultRoute.indexOf('/') === 0 ? defaultRoute : '/' + defaultRoute;
        }

        RouterActions.redirectTo(path);

        return false;
    }

    /**
     * On hash change listener that triggers a change route action
     * if the route changed & is not the same as the previous route.
     */
    onHashChange() {
        // If the previous and current route are the same then we
        // don't want to trigger change route
        const path = getPath();
        if (this[PREVIOUS_ROUTE] === path) {
            return;
        }

        this[PREVIOUS_ROUTE] = path;

        if (this.ensureSlash(path)) {
            RouterActions.changeRoute();
        }
    }
}
