'use strict';

const dispatcher = require('./dispatcherInstance.es6');
const each = require('../lib/each');

/**
 * This function provides all the test utilities
 * for a store.
 *
 * @param initializeStore - options.init function to reset store
 * @param dispatchFunction - dispatch function registered with dispatcher
 * @param publicMethods - public methods of the store
 * @param privateMembers - private methods of the store
 * @returns {object}
 */
export default function (initializeStore,
                         dispatchFunction,
                         publicMethods,
                         privateMembers) {

	const store = this;

	// This map is used to store mocked public methods
	// to be reset later.
	let originalPublicMethods = new Map();

	return {
		/**
		 * This method mocks the dispatcher, so that you
		 * can call this method with the same
		 * payload you would pass to dispatch
		 * and only call this stores methods.
		 *
		 * ** waitFor's are ignored **
		 */
		mockDispatch() {
			// Store the current waitFor and reset.
			const waitFor = store.waitFor;
			store.waitFor = () => {};
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

			initializeStore.call(privateMembers);

			// This must be reset AFTER calling init.
			this.resetMockedPublicMethods();
		}
	};
}
