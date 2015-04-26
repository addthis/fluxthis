/**
BSD License
For Flux software

Copyright (c) 2014, Facebook, Inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

* Neither the name Facebook nor the names of its contributors may be used to
endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

'use strict';

const invariant = require('invariant');
const warning = require('warning');

let _lastID = 1;
const _prefix = 'ID_';

const CALLBACKS = Symbol();
const LEGACY_STORES = Symbol();
const STORE_ACTIONS = Symbol();

const IS_PENDING = Symbol();
const IS_HANDLED = Symbol();
const IS_DISPATCHING = Symbol();
const PENDING_ACTION = Symbol();
const LAST_ACTION = Symbol();

export default class Dispatcher {
	constructor() {
		this[CALLBACKS] = {};
		this[IS_PENDING] = {};
		this[IS_HANDLED] = {};
		// Using a Map for this allows us to support
		// ConstantCollections as keys.
		this[STORE_ACTIONS] = new Map();
		this[LEGACY_STORES] = new Set();

		this[IS_DISPATCHING] = false;
		this[PENDING_ACTION] = null;
		this[LAST_ACTION] = null;
	}

	/**
	 * Registers a callback to be invoked with every dispatched action. Returns
	 * a token that can be used with `waitFor()`.
	 *
	 * @param {Function} callback
	 * @param {Map} actions
	 * @return {string}
	 */
	register(callback, actions) {
		const id = _prefix + _lastID++;
		this[CALLBACKS][id] = callback;

		// If we are a FluxThis store, then we can optimize
		// dispatches based on calling only stores who
		// care about a given action.
		if (actions) {
			// Iterate over the actions to store them
			// in a lookup table.
			actions.forEach((handler, action) => {
				if (!this[STORE_ACTIONS].has(action)) {
					this[STORE_ACTIONS].set(action, new Set());
				}

				this[STORE_ACTIONS].get(action).add(id);
			});
		}
		// We have a legacy store so we can't tell which
		// actions they listen too. So we have to call
		// them with every action later in dispatch.
		else {
			this[LEGACY_STORES].add(id);
		}

		return id;
	}

	/**
	 * Removes a callback based on its token.
	 *
	 * @param {string} id
	 */
	unregister(id) {
		invariant(
			this[CALLBACKS][id],
			'Dispatcher.unregister(...): `%s` does not map to a ' +
            'registered callback.',
			id
		);

		// Remove the registered callback for the given ID
		delete this[CALLBACKS][id];

		// If we have a legacy store then we can simply delete
		// it from the set.
		if (this[LEGACY_STORES].has(id)) {
			this[LEGACY_STORES].delete(id);
		}
		// Else, we have a FluxThis store, so we need to iterate
		// over all the registered actions and delete the store
		// from each.
		else {
			this[STORE_ACTIONS].forEach((ids) => ids.delete(id));
		}
	}


	/**
	 * Waits for the callbacks specified to be invoked before
     * continuing execution of the current callback. This method
     * should only be used by a callback in response to a dispatched action.
	 *
	 * @param {Array<string>} ids
	 */
	waitFor(ids) {
		invariant(
			this[IS_DISPATCHING],
			'Dispatcher.waitFor(...): Must be invoked while dispatching.'
		);

		if (!Array.isArray(ids)) {
			ids = [ids];
		}

		for (let id of ids) {

			if (this[IS_PENDING][id]) {
				invariant(
					this[IS_HANDLED][id],
					'Dispatcher.waitFor(...): Circular ' +
                    'dependency detected while ' +
					'waiting for `%s`.',
					id
				);
				continue;
			}

			invariant(
				this[CALLBACKS][id],
				'Dispatcher.waitFor(...): `%s` does not map ' +
                'to a registered callback.',
				id
			);

			invokeCallback.call(this, id);
		}
	}

	/**
	 * Dispatches an immutable action to all registered callbacks.
	 *
	 * @param {object} action
	 */
	dispatch(action) {
		let {type, source} = action;

		invariant(
			!this[IS_DISPATCHING],
			'Dispatch.dispatch(...): Cannot dispatch ' +
			'in the middle of a dispatch.'
		);

		invariant(
			type,
			'Attempted to dispatch an action with unrecognizable type `%s`',
			type
		);

		// make the object immutable if we're in production. Otherwise, check
		// to see if the object has changed. The check is not very efficient,
		// but will at least throw errors when things change, like freeze would
		// do for us in strict mode
		let serializedPayload;

		if (process.env.NODE_ENV !== 'production') {
			try {
				serializedPayload = JSON.stringify(action.payload);
			}
			catch(err) {
				warning(
					!err,
					'Your payload could not be stringified, so checks ' +
					'against mutations will not work for this payload. Where ' +
					'possible, use simple, stringifiable payloads.'
				);

				// when the payload is stringified after dispatch, we expect the
				// same error message
				serializedPayload = err.message;
			}
		}

		startDispatching.call(this, action);

		try {
			// Get the stores that care about this source and type
			// so we can optimistically dispatch to just those stores.
			let sources = this[STORE_ACTIONS].get(source);
			let types = this[STORE_ACTIONS].get(type);

			dispatchToStores.call(this, sources);
			dispatchToStores.call(this, types);

			// Since we need to support non-FluxThis stores
			// we keep track of legacy stores that don't
			// give us actions to optimize dispatches.
			dispatchToStores.call(this, this[LEGACY_STORES]);
		}
		finally {
			let newSerializedPayload;

			try {
				newSerializedPayload = JSON.stringify(action.payload);
			}
			catch(err) {
				newSerializedPayload = err.message;
			}

			//check for mutations
			if (process.env.NODE_ENV !== 'production') {
				invariant(
					newSerializedPayload === serializedPayload,
					`An action dispatched by the FluxThis dispatcher was
					mutated. This is bad. Please check the handlers for
					%s %s.`,
					source,
					type
				);
			}

			stopDispatching.call(this);
		}
	}

	/**
	 * Is this Dispatcher currently dispatching.
	 *
	 * @return {boolean}
	 */
	isDispatching() {
		return this[IS_DISPATCHING];
	}

	/**
	 * Grab either the current dispatch or the most recently finished one
	 *
	 * @return {object} - most recent action
	 */
	getRecentDispatch() {
		return this[PENDING_ACTION] || this[LAST_ACTION];
	}
}

/**
 * This method takes an array of store id's and iterates
 * over them to determine if we should invoke a dispatch
 * of the action.
 *
 * @param {Set} ids
 */
function dispatchToStores(ids = new Set()) {
	ids.forEach((storeID) => {
		if (this[IS_PENDING][storeID]) {
			return true;
		}

		invokeCallback.call(this, storeID);
	});
}

/**
 * Call the callback stored with the given id. Also do some internal
 * bookkeeping.
 *
 * @param {string} id
 * @internal
 */
function invokeCallback(id) {
	this[IS_PENDING][id] = true;
	this[CALLBACKS][id](this[PENDING_ACTION]);
	this[IS_HANDLED][id] = true;
}

/**
 * Set up bookkeeping needed when dispatching.
 *
 * @param {object} action
 * @internal
 */
function startDispatching(action) {
	require('./debug.es6').logDispatch(action);

	Object.keys(this[CALLBACKS]).forEach((id) => {
		this[IS_PENDING][id] = false;
		this[IS_HANDLED][id] = false;
	});

	this[PENDING_ACTION] = action;
	this[IS_DISPATCHING] = true;
}

function stopDispatching() {
	this[LAST_ACTION] = this[PENDING_ACTION];
	this[PENDING_ACTION] = null;
	this[IS_DISPATCHING] = false;
}
