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

const CHANGE_LISTENERS = Symbol();

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
	constructor (options) {
		super(options);

		const store = this;
		let changeEventPending = false;
		let publicMethods;
		let privateMethods;
		let privateMembers;
		let bindActionsWasCalled = false;

		this.dispatchToken = null;

		this[CHANGE_LISTENERS] = new Set();

		// This must be below displayName for displayName uniqueness checks

		publicMethods = Object.assign(this, options.public);

		privateMethods = Object.create(publicMethods, {
			bindActions: {
				enumerable: true,
				value () {
					bindActionsWasCalled = true;

					let i = 0;
					let actions = {};
					let constant;
					let handler;

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
					const dispatchFunction = function (action) {
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
						// This map is used to store mocked public methods
						// to be reset later.
						let originalPublicMethods = new Map();

						store.TestUtils = {
							/**
							 * This method mocks the dispatcher, so that you
							 * can call this method with the same
							 * payload you would pass to dispatch
							 * and only call this stores methods.
							 *
							 * ** Wait fors are ignored **
							 */
							mockDispatch() {
								// Store the current waitFor and reset.
								const waitFor = store.waitFor;
								store.waitFor = function () {};
								/*
									Context doesn't matter here since it
									always has the store's context
								 */
								dispatchFunction.apply(null, arguments);
								// Put the waitFor back
								store.waitFor = waitFor;
							},

							/**
							 * Mock a public method and retain the
							 * `this` context of the store which
							 * has access to private variables
							 * if you need them.
							 *
							 * @param object
							 */
							mockPublicMethods(object) {
								each(object, (key, func) => {
									if (publicMethods[key]) {
										originalPublicMethods.set(key, publicMethods[key]);
										publicMethods[key] = func.bind(store);
									} else {
										throw new Error(`You are trying to mock a public method that
											'does not exist! (${key})`);
									}
								});
							},

							/**
							 *  Reset only the mocked public methods.
							 *
							 */
							resetMockedPublicMethods() {
								originalPublicMethods.forEach((func, key) => {
									publicMethods[key] = func;
								});
							},

							/**
							 * Reset a store back to a clean state by clearing
							 * out it's private members, and reinitializing it.
							 */
							reset() {
								dispatcher.unregister(store.dispatchToken);
								each(privateMembers, key => {
									delete privateMembers[key];
								});

								options.init.call(privateMembers);

								// This must be reset AFTER calling init.
								this.resetMockedPublicMethods();
							}
						};
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

			privateMethods[prop] = function (...args) {
				const returnValue = method.apply(privateMembers, arguments);

				debug.logStore(this, prop, ...args);

				// Notify all listening views that we've potentially changed
				// due to a private fn modifying our state, but only after this
				// tick (so we can batch these events)
				if(!changeEventPending) {
					setTimeout(() => {
						changeEventPending = false;
						store[CHANGE_LISTENERS].forEach(fn => fn.call(this));
					});

					changeEventPending = true;
				}

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

			publicMethods[prop] = function () {
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

	toString () {
		return `[ObjectOrientedStore ${this.displayName}]`;
	}

	/**
	 * Add a function to this store's list of change listeners
	 *
	 * @private
	 * @param {function} fn
	 */
	__addChangeListener (fn) {
		this[CHANGE_LISTENERS].add(fn);
	}

	/**
	 * Remove a function from this store's list of change listeners
	 *
	 * @private
	 * @param {function} fn
	 */
	__removeChangeListener (fn) {
		this[CHANGE_LISTENERS].delete(fn);
	}
}
