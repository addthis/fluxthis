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

var dispatcher = require('./dispatcherInstance.es6');
var invariant = require('invariant');
var implore = require('../lib/implore.es6');
var debug = require('./debug.es6');
var ActionCreator = require('./ActionCreator.es6');


export default class APIActionCreator extends ActionCreator {

	/**
	 * Fallback when no successTest is provided. Given a response, check to
	 * make sure we got a code back in the 200s range
	 *
	 * @param {XMLHTTPResponse} response\
	 * @param {number} response.status
	 * @return {boolean}
	 */
	static defaultSuccessTest (response) {
		return response &&
		response.status &&
		response.status >= 200 &&
		response.status < 300;
	}

	/**
	 * Given a route string, get the expected argument names from it
	 *
	 * @param {string} route - a route e.g. '/abc/:def/ghi/:hi'
	 * @return {string[]} - list of url param names e.g. ['def','hi']
	 */
	static getURLParamsFromRoute (route) {
		var match;
		var regexp = /\/:([^:\/]+)/g;
		var args = [];
		while((match = regexp.exec(route)) !== null) {
			args.push(match);
		}
		return args;
	}

	constructor (options) {
		super(options, {successTest: 1});
	}

	createPublicMethod (name, description) {
		var createRequest = description.createRequest;
		var handleSuccess = description.handleSuccess;
		var handleFailure = description.handleFailure;
		var successActionType = description.success;
		var failureActionType = description.failure;
		var pendingActionType = description.pending;

		// successTest can come from the top level object
		// or each function can use their own successTest.
		// The default is response code 2xx.
		var successTest = description.successTest ||
			this.successTest ||
			APIActionCreator.defaultSuccessTest;

		var payloadType = ActionCreator.PayloadTypes.shape({
			route: ActionCreator.PayloadTypes.string.isRequired,
			body: ActionCreator.PayloadTypes.object,
			query: ActionCreator.PayloadTypes.object,
			params: ActionCreator.PayloadTypes.object
		}).isRequired;

		var actionSource = this.actionSource;

		invariant(
			successTest instanceof Function,
			'The method `%s` could not be created on `%s`; ' +
			'`successTest` must be a `Function`',
			name,
			this
		);

		invariant(
			handleSuccess === undefined || handleSuccess instanceof Function,
			'The method `%s` could not be created on `%s`; ' +
			'`handleSuccess` must be a `Function`',
			name,
			this
		);

		invariant(
			handleFailure === undefined || handleFailure instanceof Function,
			'The method `%s` could not be created on `%s`; ' +
			'`handleFailure` must be a `Function`',
			name,
			this
		);

		invariant(
			typeof description.route === 'string',
			'The method `%s` could not be created on `%s`; ' +
			'`route` must be a `string`, like "/example/:example"',
			name,
			this
		);

		invariant(
			typeof description.method === 'string',
			'The method `%s` could not be created on `%s`; ' +
			'`method` must be a `string`, like "GET"',
			name,
			this
		);

		this[name] = (...args) => {
			var action;
			var request;

			if (createRequest) {
				request = createRequest.apply(this, args);
			}

			request = Object.assign({
				method: description.method,
				route: description.route
			}, request);

			this.validatePayload(name, request, payloadType);

			action = {
				source: actionSource,
				type: pendingActionType,
				payload: request
			};

			debug.logActionCreator(this, name, request, ...args);

			if (description.pending) {
				dispatcher.dispatch(action);
			}

			implore(request)
				.then(result => {
					var {response, request} = result;
					var success = successTest(response);
					var action;

					// These methods allow the user to process
					// the request and modify it how they please
					// or dispatch more actions.
					if (success && handleSuccess) {
						handleSuccess.call(this, request, response);
					}
					else if (handleFailure) {
						handleFailure.call(this, request, response);
					}

					action = {
						source: actionSource,
						type: success ? successActionType : failureActionType,
						payload: {
							request,
							response
						}
					};

					// Finally, lets dispatch the action if the user
					// specified the required conditionals.
					if ((success && successActionType) ||
						(!success && failureActionType)) {
						dispatcher.dispatch(action);
					}
				});
		};
	}

	toString () {
		return `[APIActionCreator ${this.displayName}]`;
	}
}
