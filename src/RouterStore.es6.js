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

const invariant = require('invariant');
const Immutable = require('immutable');
const ObjectOrientedStore = require('./ObjectOrientedStore.es6.js');
const debug = require('./debug.es6');

const Route = require('./router/Route.es6');
const Constants = require('./router/RouterConstants.es6');
const RouterActions = require('./router/RouterActions.es6');

const iterateOverGenerator = require('../lib/router/iterateOverGenerator.es6');
const replaceHash = require('../lib/router/replaceHash.es6');
const getPath = require('../lib/router/getPath.es6');

const RouterStore = new ObjectOrientedStore({
	displayName: 'FluxThisRouterStore',
	init() {
		/**
		 * current Route object that is set on each middleware execution
		 * that has a positive match
		 * @type {Route}
		 */
		this.currentRoute = null;

		/**
		 * All the routes the user has defined, not including `all` routes.
		 * These are mapped as route_name => Route for fast look ups.
		 *
		 * @type {{String: Route}}
		 */
		this.routes = {};

		/**
		 * Holds all the middleware functions that have been registered
		 * including route & all generators.
		 *
		 * @type {Array<GeneratorFunctions>}
		 */
		this.middleware = [];

		this.bindActions(
			Constants.ROUTER_USE_ACTION, this.addMiddleware,
			Constants.ROUTER_SETUP_ALL_ROUTE_ACTION, this.setupAllRoute,
			Constants.ROUTER_SETUP_ROUTE_ACTION, this.setupRoute,
			Constants.ROUTER_SET_REACT_ELEMENT, this.setReactElement,
			Constants.ROUTER_START, this.startRouter,
			Constants.ROUTE_CHANGE, this.changeRoute,
			Constants.ROUTE_NAVIGATE, this.navigateTo,
			Constants.ROUTE_REDIRECT, this.redirectTo
		);
	},
	public: {
		getPath() {
			return getPath();
		},
		/**
		 * Get the current react element that has been registered
		 * with the route.
		 *
		 * @returns {ReactElement}
		 */
		getReactElement() {
			return this.reactElement;
		},
		/**
		 * Get the props, if any, for the current react element.
		 * @returns {object}
		 */
		getReactElementProps() {
			return this.reactElementProps || {};
		},
		/**
		 * Get the path parameters for the current route based
		 * on the matched path that has current been matched.
		 *
		 * @returns {Immutable.Map}
		 */
		getPathParams() {
			return Immutable.fromJS(this.currentPathParams);
		},
		/**
		 * Get the query parameters for the current route based
		 * on the matched path that has current been matched.
		 *
		 * @returns {Immutable.Map}
		 */
		getQueryParams() {
			return Immutable.fromJS(this.currentQueryParams);
		}
	},
	private: {
		/**
		 * Starts the router. This should be called once
		 * all the middleware and routes have been defined.
		 */
		startRouter() {
			this.iterateOverMiddleware();
		},
		/**
		 * This method should be called when the user is registering an
		 * `all` middleware route.
		 *
		 * @param {object} payload
		 * @param {string} payload.path
		 * @param {GeneratorFunction} payload.handler
		 */
		setupAllRoute(payload) {
			let {path, handler} = payload;

			let route = new Route(path, handler, {all: true});

			this.middleware.push(this.routeMiddleware(route));
		},
		/**
		 * This method should be called when the user is registering a new
		 * route.
		 *
		 * @param {object} payload
		 * @param {string} payload.path
		 * @param {GeneratorFunction} payload.handler
		 * @param {object} [payload.options]
		 * @param {string} [payload.title] - title to set in the browser
		 * @param {boolean} [payload.default] - default path when 404
		 */
		setupRoute(payload) {
			let {path, handler, options={}} = payload;

			invariant(
				!this.routes[path],
				'`%s` already is a defined route',
				path
			);

			let route = new Route(path, handler, options);

			this.routes[path] = route;

			this.middleware.push(this.routeMiddleware(route));
		},
		/**
		 * This method should be called when the user has set a new
		 * react element based on a route change, so that any
		 * components listening for changes can be updated
		 * accordingly.
		 *
		 * @param {object} payload
		 * @param {ReactElement} payload.reactElement
		 * @param {object} [payload.props]
		 */
		setReactElement(payload) {
			const {reactElement, props={}} = payload;
			this.reactElement = reactElement;
			this.reactElementProps = props;
		},
		/**
		 * This method should be called when the user has changed the
		 * route via navigation or during initial setup of the application
		 * for page load.
		 */
		changeRoute() {
			this.iterateOverMiddleware();
		},
		iterateOverMiddleware() {
			let middleware = [setupRouterMiddleware(this), ...this.middleware];

			iterateOverGenerator(middleware);
		},
		/**
		 * Add a new middleware function with the allowed methods as a context
		 * to the list of middleware functions
		 *
		 * @param {Function}  generator function to be added.
		 */
		addMiddleware(func) {
			this.middleware.push(function *middlewareDebugger(next) {
				const context = getRouteContext();
				debug.logRouter(func.name, context, 'before');
				yield *func.call(context, next);
				debug.logRouter(func.name, context, 'after');
			});
		},
		/**
		 *
		 * @param {Route} route - route object to build middleware with
		 * @returns {GeneratorFunction}
		 */
		routeMiddleware(route) {
			const store = this;
			return function *routeMiddleware(next) {
				let result;

				if ((result = route.matches(window.location.href))) {
					store.currentPathParams = result.pathParams;
					store.currentQueryParams = result.queryParams;
					store.currentRoute = route;

					// Update the title of the page for the given route if
					// that option exists during setup.
					document.title = route.options.title || document.title;

					const routeContext = getRouteContext();
					const handler = store.currentRoute.handler;

					debug.logRouter(handler.name, routeContext, 'route start');
					yield *handler.call(routeContext, next);
					debug.logRouter(handler.name, routeContext, 'route end');
				} else {
					yield *next;
				}
			};
		},
		redirectTo(path) {
			replaceHash(path);
		},
		navigateTo(path) {
			window.location.hash = path;
		}
	}
});

function setupRouterMiddleware(context) {
	return function *setupRouterMiddleware(next) {
		context.currentRoute = null;
		yield *next;

		// Todo figure out some check for 404s... maybe just follow koa.
	};
}

function getRouteContext() {
	return {
		getPath: RouterStore.getPath,
		getPathParams: RouterStore.getPathParams,
		getQueryParams: RouterStore.getQueryParams,
		redirectTo: RouterActions.redirectTo
	};
}

export default RouterStore;
