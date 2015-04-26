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

const dispatcher = require('./dispatcherInstance.es6');
const invariant = require('invariant');
const send = require('../lib/implore.es6');
const debug = require('./debug.es6');
const ActionCreator = require('./ActionCreator.es6');


export default class APIActionCreator extends ActionCreator {

	/**
	 * Fallback when no successTest is provided. Given a response, check to
	 * make sure we got a code back in the 200s range
	 *
	 * @param {XMLHTTPResponse} response
	 * @param {number} response.status
	 * @return {boolean}
	 */
	static defaultSuccessTest(response) {
		return response &&
			response.status &&
			response.status >= 200 &&
			response.status < 300;
	}

	constructor(options) {
		super(options, {successTest: 1});
	}

	/**
	 *
	 * @param name
	 * @param {object} options
	 * @param {string} options.route
	 * @param {string} options.method
	 * @param {string} options.success
	 * @param {string} options.failure
	 * @param {string} options.pending
	 * @param {Function} options.createRequest
	 * @param {Function} options.handleSuccess
	 * @param {Function} options.handleFailure
	 * @param {Function} options.successTest
	 */
	createPublicMethod(name, options) {
		const {route, method} = options;
		const {createRequest, handleSuccess, handleFailure} = options;
		const {success: successActionType,
			failure: failureActionType,
			pending: pendingActionType} = options;

		// successTest can come from the top level object
		// or each function can use their own successTest.
		// The default is response code 2xx.
		const successTest = options.successTest || this.successTest ||
			APIActionCreator.defaultSuccessTest;

		const payloadType = ActionCreator.PayloadTypes.shape({
			body: ActionCreator.PayloadTypes.object,
			query: ActionCreator.PayloadTypes.object,
			params: ActionCreator.PayloadTypes.object
		}).isRequired;

		const actionSource = this.actionSource;

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
			typeof route === 'string',
			'The method `%s` could not be created on `%s`; ' +
			'`route` must be a `string`, like "/example/:example"',
			name,
			this
		);

		invariant(
			typeof method === 'string',
			'The method `%s` could not be created on `%s`; ' +
			'`method` must be a `string`, like "GET"',
			name,
			this
		);

		this[name] = (...args) => {
			let action;
			let request;

			invariant(
				createRequest || args.length === 0,
				`${this.toString()}'s ${name} action received ` +
				'arguments without a `createRequest` method. You must ' +
				'provide a `createRequest` method so you can format ' +
				'these arguments in the request.'
			);

			// If the user wants to create their own request
			// with body, query and/or params, then lets
			// do that first.
			if (createRequest) {
				request = createRequest.apply(this, args);
			}

			request = Object.assign({
				method,
				route
			}, request);

			this.validatePayload(name, request, payloadType);

			debug.logActionCreator(this, name, request, ...args);

			// If the user wants to dispatch a pending action
			// then we do that here.
			if (pendingActionType) {
				dispatcher.dispatch({
					source: actionSource,
					type: pendingActionType,
					payload: request
				});
			}

			send(request)
				.then((result) => {
					const {response, request} = result;
					const success = successTest(response);

					// These methods allow the user to process
					// the request and modify it how they please
					// or dispatch more actions.
					if (success && handleSuccess) {
						handleSuccess.call(this, request, response);
					} else if (handleFailure) {
						handleFailure.call(this, request, response);
					}

					// Setup action for success/failure
					action = {
						source: actionSource,
						type: success ? successActionType : failureActionType,
						payload: {
							request,
							response
						}
					};

					// If we reach the end and we have an action
					// type, then that means we need to dispatch.
					if (action.type) {
						dispatcher.dispatch(action);
					}
				});
		};
	}

	toString() {
		return `[APIActionCreator ${this.displayName}]`;
	}
}
