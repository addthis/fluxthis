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
var debug = require('./debug.es6');
var each = require('../lib/each');
var PropTypes = require('react/lib/ReactPropTypes');
var invariant = require('invariant');

var RE_WARNING_EXPECTED = /expected `(.*?)`/;
var RE_WARNING_FOUND = /type `(.*?)`/;

/**
 * @typedef {object} ApiDescription
 * @property {Constant} actionType
 * @property {PayloadType} [payloadType] - used to validate payloads passed to
 *	a method. Uses `React.PropTypes`.
 * @property {function} [createPayload] - This function will be called before
 *  dispatch. You should make server calls here. The return value of this
 *  function will be dispatched as the action's payload
 */

/**
 * Creates a flux ActionCreator which dispatches actions after validating
 * payloads. ActionCreators are used to set an action's `source` when
 * dispatching.
 */
class ActionCreator {

	/**
	 * @param {object} options
	 * @param {string} options.displayName
	 * @param {Constant} options.actionSource
	 * @param {object<ApiDescription>} options.api - used to build public API,
	 *	the key is the resulting function's name
	 * @param {object} [moreReservedKeys] - map of a key found in `options` to 1
	 *  or 0, where 1 indicates the key should not be interpretted as a public
	 *  function
	 */
	constructor (options, moreReservedKeys) {
		var reservedKeys = Object.assign({
			actionSource: 1,
			displayName: 1
		}, moreReservedKeys || {});

		invariant(
			options instanceof Object,
			'Cannot create ActionCreator without an `options` argument'
		);

		invariant(
			options.displayName,
			'Could not create ActionCreator. Missing required parameter `displayName`'
		);

		invariant(
			options.actionSource,
			'Could not create `%s`. Missing required parameter `actionSource`',
			this
		);

		// create public methods for every key on options that isn't a reserved
		// one
		each(options, (key, val) => {
			if (reservedKeys[key]) {
				this[key] = val;
			}
			else {
				this.createPublicMethod(key, val);
			}
		});
	}

	/**
	 * Adds a publicly accessable method to the instance of ActionCreator
	 *
	 * @param {string} name - methods name to create
	 * @param {ApiDescription} description - specifics about the method to
	 *	create
	 */
	createPublicMethod (name, description) {
		var createPayload = description.createPayload;
		var payloadType = description.payloadType;
		var actionType = description.actionType;
		var actionSource = this.actionSource;

		invariant(
			actionType !== undefined,
			'The method `%s` could not be created on `%s`; ' +
			'`actionType` must be provided',
			name,
			this
		);

		invariant(
			createPayload === undefined || createPayload instanceof Function,
			'The method `%s` could not be created on `%s`; ' +
			'`createPayload` must be either undefined or a `Function`',
			name,
			this
		);

		this[name] = function (payload, ...args) {
			var action;
			if(createPayload) {
				payload = createPayload.apply(this, arguments);
			}

			if(payloadType) {
				this.validatePayload(name, payload, payloadType);
			}

			action = {
				source: actionSource,
				type: actionType,
				payload: payload
			};

			debug.logActionCreator(this, name, payload, ...args);

			dispatcher.dispatch(action);
		}.bind(this);


		debug.registerAction(this, {
			source: actionSource,
			type: actionType
		});
	}

	/**
	 * Validates a payload passed to a public function of the instantiated
	 * ActionCreator. Throws an error if the payload fails to validate.
	 *
	 * @param {object} payload - data to validate
	 * @param {PayloadType} payloadType - a react proptype to validate `payload`
	 *	against.
	 */
	validatePayload (name, payload, payloadType) {
		var err = payloadType({payload: payload}, 'payload', 'NAME', 'prop');
		var expected;
		var found;

		if(err) {
			expected = err.message.match(RE_WARNING_EXPECTED)[1];
			found = err.message.match(RE_WARNING_FOUND)[1];
			err.message = this + ' ' + name + ' was provided ' +
			'an invalid payload. Expected `' + expected + '`, got `' +
			found + '`.';
			throw err;
		}
	}

	toString () {
		return `[ActionCreator ${this.displayName}]`;
	}
}

ActionCreator.PayloadTypes = PropTypes;

module.exports = ActionCreator;
