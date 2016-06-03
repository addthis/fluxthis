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

let defaultHeaders;

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
			response.status < 300 &&
			!response.error;
	}

	/**
	 * Sets default headers that will be used with all subsequent requests
	 * triggered by APIActionCreator instances. Can be cleared by setting
	 * headers to `undefined`. Default headers can be overridden by
	 * individual requests by setting the header to a different value or
	 * to `undefined` (forcing the header not to be set) for that request.
	 *
	 * @param {object|undefined} headers
	 */
	static setDefaultHeaders(headers) {
		invariant(
			typeof headers === 'undefined' || headers instanceof Object,
			'Cannot set default headers for APIActionCreator to %s.' +
			'`headers` must be `undefined` or a plain object.',
			headers
		);

		defaultHeaders = headers;
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
	 * @param {string} options.abort
	 * @param {Function} options.createRequest
	 * @param {Function} options.handleSuccess
	 * @param {Function} options.handleFailure
	 * @param {Function} options.handleAbort
	 * @param {Function} options.successTest
	 */
	createPublicMethod(name, options) {
		const {route, method} = options;
		const {createRequest, handleSuccess, handleFailure, handleAbort} = options;
		const {success: successActionType,
			failure: failureActionType,
			pending: pendingActionType,
			abort: abortActionType} = options;

		// successTest can come from the top level object
		// or each function can use their own successTest.
		// The default is response code 2xx.
		const successTest = options.successTest || this.successTest ||
			APIActionCreator.defaultSuccessTest;

		const payloadType = ActionCreator.PayloadTypes.shape({
			body: ActionCreator.PayloadTypes.any,
			query: ActionCreator.PayloadTypes.object,
			params: ActionCreator.PayloadTypes.object
		}).isRequired;

		const actionSource = this.actionSource || this.displayName;

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

		if (pendingActionType) {
			debug.registerAction(this, {type: pendingActionType, source: actionSource});
		}

		if (successActionType) {
			debug.registerAction(this, {type: successActionType, source: actionSource});
		}

		if (failureActionType) {
			debug.registerAction(this, {type: failureActionType, source: actionSource});
		}

		if (abortActionType) {
			debug.registerAction(this, {type: abortActionType, source: actionSource});
		}

		this[name] = (...args) => {
			invariant(
				createRequest || args.length === 0,
				`${this.toString()}'s ${name} action received ` +
				'arguments without a `createRequest` method. You must ' +
				'provide a `createRequest` method so you can format ' +
				'these arguments in the request.'
			);

			// If the user wants to create their own request with body, query
			// and/or params, then lets do that first.
			let request = createRequest ? createRequest.apply(this, args) : {};

			// If the user has defined default headers, merge them into the
			// request.
			if (defaultHeaders) {
				if (!request.headers) {
					// No specific headers set; just copy default headers.
					request.headers = Object.assign({}, defaultHeaders);
				}
				else {
					// Headers were specified on this request; merge them with
					// any default headers, removing any headers set to
					// `undefined` (thereby allowing the caller to remove even
					// the default headers for a particular request).
					const specifiedHeaders = Object.assign({}, defaultHeaders, request.headers);
					request.headers = Object.keys(specifiedHeaders).reduce((headers, header) => {
						if (typeof specifiedHeaders[header] !== 'undefined') {
							headers = headers || {};
							headers[header] = specifiedHeaders[header];
						}

						return headers;
					}, undefined); // `undefined` allows for back-compatibility
				}
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

			return send(request, (result) => {
				const {response, request} = result;
				const success = successTest(response);
				const isAborted = !!response.fluxthisAborted;

				// These methods allow the user to process
				// the request and modify it how they please
				// or dispatch more actions.
				if (success && handleSuccess) {
					handleSuccess.call(this, request, response);
				} else if (isAborted && handleAbort) {
					handleAbort.call(this, request, response);
				} else if (handleFailure) {
					handleFailure.call(this, request, response);
				}

				let type;
				if (success && successActionType) {
					type = successActionType;
				} else if (isAborted && abortActionType) {
					type = abortActionType;
				} else if (!success && failureActionType) {
					type = failureActionType;
				}

				if (!type) {
					return;
				}

				// If we reach the end and we have an action
				// type, then that means we need to dispatch.
				dispatcher.dispatch({
					source: actionSource,
					type,
					payload: {
						request,
						response: isAborted ? undefined : response
					}
				});
			});
		};
	}

	toString() {
		return `[APIActionCreator ${this.displayName}]`;
	}
}
