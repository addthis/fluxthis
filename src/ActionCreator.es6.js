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
const debug = require('./debug.es6');
const each = require('../lib/each');
const PropTypes = require('react/lib/ReactPropTypes');
const deprecated = require('../lib/deprecated.es6');
const invariant = require('invariant');

const RE_REQUIRED_PROP = /Required prop `(.*?)`/;

const RE_WARNING_EXPECTED = /expected (.*`(.*?)`)/;
const RE_WARNING_FOUND = /type `(.*?)`/;

const ActionTypes = new Set();
const DisplayNames = new Set();

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
 * payloads.
 */
class ActionCreator {

	/**
	 * @param {object} options
	 * @param {string} options.displayName
	 * @param {object<ApiDescription>} options.api - used to build public API,
	 *	the key is the resulting function's name
	 * @param {object} [moreReservedKeys] - map of a key found in `options` to 1
	 *  or 0, where 1 indicates the key should not be interpretted as a public
	 *  function
	 */
	constructor(options, moreReservedKeys={}) {
		let reservedKeys = Object.assign({
			actionSource: 1,
			displayName: 1
		}, moreReservedKeys);

		invariant(
			options instanceof Object,
			'Cannot create ActionCreator without an `options` argument'
		);

		invariant(
			options.displayName,
			'Could not create ActionCreator. Missing required parameter `displayName`'
		);

		// Lets make sure we have unique display names
		invariant(
			!DisplayNames.has(options.displayName),
			`ActionCreator - Your displayName of ` +
			`${options.displayName} is not unique.`
		);

		deprecated(
			options.actionSource,
			`ActionCreator.actionSource`
		);

		DisplayNames.add(options.displayName);

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
	 * @param {Function} description.createPayload
	 * @param {PayloadType} description.payload
	 * @param {string} description.type
	 *	create
	 */
	createPublicMethod(name, description) {
		let createPayload = description.createPayload;
		let payloadType = description.payload || description.payloadType;
		let type = description.type || description.actionType;

		deprecated(
			description.actionType,
			'ActionCreator.Action.actionType',
			'ActionCreator.Action.type'
		);

		deprecated(
			description.payloadType,
			'ActionCreator.Action.payloadType',
			'ActionCreator.Action.payload'
		);

		invariant(
			type !== undefined,
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

		// Now lets make sure we haven't already registered aciton type
		invariant(
			!ActionTypes.has(type),
			`%s - already has an action with type %s already ` +
			'registered.',
			this.toString(),
			type.toString()
		);

		// Add the new type to the Set so we can keep checking for uniqueness.
		ActionTypes.add(type);

		let actionSource = this.actionSource || this.displayName;

		this[name] = (payload, ...args) => {
			if (createPayload) {
				payload = createPayload.apply(this, [payload, ...args]);
			}

			if (payloadType) {
				this.validatePayload(name, payload, payloadType);
			}

			let action = {type, payload};

			if (actionSource) {
				action.source = actionSource;
			}

			debug.logActionCreator(this, name, payload, ...args);

			dispatcher.dispatch(action);
		};

		debug.registerAction(this, {type, source: actionSource});
	}

	/**
	 * Validates a payload passed to a public function of the instantiated
	 * ActionCreator. Throws an error if the payload fails to validate.
	 *
	 * @param {object} payload - data to validate
	 * @param {PayloadType} payloadType - a react proptype to validate `payload`
	 *	against.
	 */
	validatePayload(name, payload, payloadType) {
		let err = payloadType({payload}, 'payload', name, 'prop');
		let expected;
		let found;
		let required;

		if (err) {
			const message = err.message;

			// Perform some regex checks on messages to determine
			// which type of error we have.
			required = message.match(RE_REQUIRED_PROP);
			expected = message.match(RE_WARNING_EXPECTED);
			found = message.match(RE_WARNING_FOUND);

			// If the message is that it's missing a required prop
			if (required) {
				err.message = this + ' ' + name + ' was not provided ' +
					'the required prop `' + required[1] + '`.';
			}
			// Else we found a prop of one type when we expected another
			else if (expected && found) {
				expected = expected[1];
				found = message.match(RE_WARNING_FOUND);

				err.message = this + ' ' + name + ' was provided ' +
					'an invalid payload. Expected ' + expected + ', got `' +
					found[1] + '`.';
			}
			// This is used for more complex payload checking
			// like instanceOf, etc.
			else if (expected) {
				err.message = this + ' ' + name + ' was provided ' +
					'an invalid payload. Expected ' + expected + '.';
			}

			throw err;
		}
	}

	toString() {
		return `[ActionCreator ${this.displayName}]`;
	}
}

ActionCreator.PayloadTypes = PropTypes;

export default ActionCreator;
