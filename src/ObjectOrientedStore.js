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

var dispatcher = require('./dispatcherInstance');
var Store = require('./Store');
var debug = require('./debug');
var each = require('../lib/each');
var invariant = require('invariant');

var CHANGE_LISTENERS = Symbol();

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
		var store = this;
		var changeEventPending = false;
		var publicMethods;
		var privateMethods;
		var privateMembers;
		var bindActionsWasCalled = false;

		super();

		invariant(
			options,
			'Cannot create ObjectOrientedStore without arguments'
		);

		invariant(
			options.init,
			'ObjectOrientedStore requires an `init` function'
		);

		invariant(
			options.public,
			'ObjectOrientedStore requires `public` functions'
		);

		this.displayName = options.displayName;
		this.dispatchToken = null;
		this[CHANGE_LISTENERS] = new Set();

		publicMethods = Object.assign(this, options.public);

		privateMethods = Object.create(publicMethods, {
			bindActions: {
				enumerable: true,
				value () {
					bindActionsWasCalled = true;

					var i = 0;
					var actions = {};
					var constant;
					var handler;

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

						actions[constant] = handler;
						debug.registerActionHandler(this, constant);
						i++;
					}

					var dispatchFunction = function (action) {
						var sourceHandler = actions[action.source];
						var typeHandler = actions[action.type];

						if (sourceHandler) {
							sourceHandler.call(store, action.payload);
						}
						if (typeHandler) {
							typeHandler.call(store, action.payload);
						}
					};

					/**
					 * Expose TestUtils only if we are not in the
					 * production environment for ease of testing.
					 *
					 */
					if (process.env.NODE_ENV !== 'production') {
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
								var waitFor = store.waitFor;
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
							 * Reset a store back to a clean state by clearing
							 * out it's private members, and reinitializing it.
							 */
							reset() {
								dispatcher.unregister(store.dispatchToken);
								each(privateMembers, key => {
									delete privateMembers[key];
								});
								options.init.call(privateMembers);
							}
						};
					}

					store.dispatchToken = dispatcher.register(dispatchFunction);
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
				var returnValue = method.apply(privateMembers, arguments);

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
		return `[ObjectOrientedStore ${this.displayName || 'unnamed'}]`;
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
