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

var invariant = require('invariant');

var _lastID = 1;
var _prefix = 'ID_';

var CALLBACKS = Symbol();
var IS_PENDING = Symbol();
var IS_HANDLED = Symbol();
var IS_DISPATCHING = Symbol();
var PENDING_ACTION = Symbol();
var LAST_ACTION = Symbol();

export default class Dispatcher {
	constructor () {
		this[CALLBACKS] = {};
		this[IS_PENDING] = {};
		this[IS_HANDLED] = {};
		this[IS_DISPATCHING] = false;
		this[PENDING_ACTION] = null;
		this[LAST_ACTION] = null;
	}

	/**
	 * Registers a callback to be invoked with every dispatched action. Returns
	 * a token that can be used with `waitFor()`.
	 *
	 * @param {function} callback
	 * @return {string}
	 */
	register (callback) {
		var id = _prefix + _lastID++;
		this[CALLBACKS][id] = callback;
		return id;
	}

	/**
	 * Removes a callback based on its token.
	 *
	 * @param {string} id
	 */
	unregister (id) {
		invariant(
			this[CALLBACKS][id],
			'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
			id
		);
		delete this[CALLBACKS][id];
	}


	/**
	 * Waits for the callbacks specified to be invoked before continuing execution
	 * of the current callback. This method should only be used by a callback in
	 * response to a dispatched action.
	 *
	 * @param {array<string>} ids
	 */
	waitFor (ids) {
		invariant(
			this[IS_DISPATCHING],
			'Dispatcher.waitFor(...): Must be invoked while dispatching.'
		);

		if (!Array.isArray(ids)) {
			ids = [ids];
		}

		for (var i = 0; i < ids.length; i++) {
			var id = ids[i];

			if (this[IS_PENDING][id]) {
				invariant(
					this[IS_HANDLED][id],
					'Dispatcher.waitFor(...): Circular dependency detected while ' +
					'waiting for `%s`.',
					id
				);
				continue;
			}

			invariant(
				this[CALLBACKS][id],
				'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
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
	dispatch (action) {
		var serializedAction;

		invariant(
			!this[IS_DISPATCHING],
			'Dispatch.dispatch(...): Cannot dispatch ' +
			'in the middle of a dispatch.'
		);

		invariant(
			action.type !== undefined && action.type !== null,
			'Attempted to dispatch an action with unrecognizable type `%s`',
			action.type
		);

		// make the object immutable if we're in production. Otherwise, check
		// to see if the object has changed. The check is not very efficient,
		// but will at least throw errors when things change, like freeze would
		// do for us in strict mode
		if (process.env.NODE_ENV !== 'production') {
			try {
				serializedAction = JSON.stringify(action);
			}
			catch(err) {
				invariant(
					!err,
					'Actions must be simple objects, and must be stringifyable.'
				);
			}
		}

		startDispatching.call(this, action);

		try {
			for (var id in this[CALLBACKS]) {
				if (this[IS_PENDING][id]) {
					continue;
				}

				invokeCallback.call(this, id);
			}
		}
		finally {
			stopDispatching.call(this);

			//check for mutations
			if (process.env.NODE_ENV !== 'production') {
				invariant(
					JSON.stringify(action) === serializedAction,
					`An action dispatched by the FluxThis dispatcher was
					mutated. This is bad. Please check the handlers for
					%s %s.`,
					action.source,
					action.type
				);
			}
		}
	}

	/**
	 * Is this Dispatcher currently dispatching.
	 *
	 * @return {boolean}
	 */
	isDispatching () {
		return this[IS_DISPATCHING];
	}

	/**
	 * Grab either the current dispatch or the most recently finished one
	 *
	 * @return {object} - most recent action
	 */
	getRecentDispatch () {
		return this[PENDING_ACTION] || this[LAST_ACTION];
	}
}

/**
 * Call the calback stored with the given id. Also do some internal
 * bookkeeping.
 *
 * @param {string} id
 * @internal
 */
function invokeCallback (id) {
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
function startDispatching (action) {
	require('./debug').logDispatch(action);

	for (var id in this[CALLBACKS]) {
		this[IS_PENDING][id] = false;
		this[IS_HANDLED][id] = false;
	}
	this[PENDING_ACTION] = action;
	this[IS_DISPATCHING] = true;
}

function stopDispatching () {
	this[LAST_ACTION] = this[PENDING_ACTION];
	this[PENDING_ACTION] = null;
	this[IS_DISPATCHING] = false;
}
