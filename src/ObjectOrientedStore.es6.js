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
const Store = require('./Store.es6');
const debug = require('./debug.es6');
const each = require('../lib/each');
const invariant = require('invariant');
const testUtils = require('./StoreTestUtils.es6');

/**
 * A Flux Store which allows for public/private methods and attributes
 */
export default class ObjectOrientedStore extends Store {

	/**
	 * @param {object} options
	 * @param {function} options.init - this fn should set up initial state and
	 *	also be used to call `bindActions`
	 * @param {object} [options.private] - object of private functions, usually
	 *	modifiers. Not every store will need this!
	 * @param {object} options.public - object of public functions, usually
	 *	accessors
	 * @param {string} options.displayName - a human readable name, used for
	 *	debugging
	 */
	constructor(options) {
		super(options);

		let publicMethods;
		let privateMethods;
		let privateMembers;
		let bindActionsWasCalled;

		const store = this;
		this.dispatchToken = null;

		// This must be below displayName for displayName uniqueness checks

		publicMethods = Object.assign(this, options.public);

		privateMethods = Object.create(publicMethods, {
			bindActions: {
				enumerable: true,
				value() {
					bindActionsWasCalled = true;

					let actions = new Map();
					let constant;
					let handler;
					let i = 0;

					invariant(
						arguments.length % 2 === 0,
						'The `bindActions` method of %s requires an even ' +
						'number of arguments',
						this
					);

					while (i * 2 < arguments.length) {
						constant = arguments[2 * i];
						handler = arguments[2 * i + 1];

						invariant(
							constant !== undefined && constant !== null,
							'An unrecognizable action type or source, `%s`, ' +
							'was passed to the `bindActions` method of `%s`',
							constant,
							this
						);

						invariant(
							handler instanceof Function,
							'An unrecognizable action handler, `%s`, was ' +
							'passed to the `bindActions` method of `%s` to ' +
							'handle `%s`',
							handler,
							this,
							constant
						);

						invariant(
							!actions.has(constant),
							`${this} - The action ${constant} has already ` +
							'been defined in this store.'
						);

						actions.set(constant, handler);

						debug.registerActionHandler(this, constant);
						i++;
					}

					/**
					 * This method is what the dispatcher uses whenever
					 * an action has been dispatched that this store cares
					 * about. This method will invoke the methods
					 *
					 * @param {object} action
					 * @param {string} action.type
					 * @param {string} action.source
					 * @param {string} action.payload
					 */
					const dispatchFunction = function dispatchFunction(action) {
						const {source, type, payload} = action;

						if (actions.has(source)) {
							actions.get(source).call(store, payload);
						}

						if (actions.has(type)) {
							actions.get(type).call(store, payload);
						}
					};

					/**
					 * Expose TestUtils only if we are not in the
					 * production environment for ease of testing.
					 *
					 */
					if (process.env.NODE_ENV !== 'production') {
						store.TestUtils = testUtils.call(
							store,
							options.init,
							dispatchFunction,
							publicMethods,
							privateMembers
						);
					}

					// Register the store with the Dispatcher
					store.dispatchToken = dispatcher.register(
						dispatchFunction,
						actions
					);
				}
			}
		});

		privateMembers = Object.create(privateMethods);

		// Create private methods
		each(options.private, (prop, method) => {
			invariant(
				method instanceof Function,
				'private member `%s` is not a function. Non-function private ' +
				'members should be declared inside of a Store\'s `init` ' +
				'function',
				prop
			);

			privateMethods[prop] = function privateMethod(...args) {
				const returnValue = method.apply(privateMembers, arguments);

				debug.logStore(this, prop, ...args);

				// Because React batches setState asynchronously, we
				// can call set state multiple times and React
				// will batch or updates so we
				// only update the Controller View once.
				store.__emitChanges();

				return returnValue;
			};
		});

		// Create public methods
		each(options.public, (prop, method) => {
			invariant(
				method instanceof Function,
				'public member `%s` is not a function',
				prop
			);

			publicMethods[prop] = function publicMethod() {
				return method.apply(privateMembers, arguments);
			};
		});

		// Call the init method defined by the user's store.
		options.init.call(privateMembers);

		// If bindActions wasn't called, then we need to setup the
		// store appropriately by calling the method.
		if (!bindActionsWasCalled) {
			if (typeof console !== 'undefined') {
				console.warn('Warning: You are missing a `this.bindActions()`' +
				' method invocation inside your ' + this.toString() + '\'s ' +
				'init method');
			}
			privateMembers.bindActions();
		}
	}

	toString() {
		return `[ObjectOrientedStore ${this.displayName}]`;
	}
}
