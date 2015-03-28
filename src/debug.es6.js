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
var invariant = require('invariant');
var each = require('../lib/each');

var IN_PRODUCTION = process.env.NODE_ENV === 'production';
var FLUX_DEBUG_DEFAULTS = {
	all: false,
	types: [],
	sources: [],
	stores: [],
	controllerViews: [],
	unused: !IN_PRODUCTION,
	unusedTimeout: 3000
};

var styles = {
	plain: 'color: #000000',
	view: 'color: #3827ef', //dark blue
	dispatcher: 'color: #6940a0', //purple
	store: 'color: #4db848', //muted green
	actionCreator: 'color: #eb6e84' //salmon
};

var consoleGroup = console.group ?
	console.group.bind(console) :
	function (...args) {
		//can't use bind here because IE9 issues
		console.log(...args);
	};

var consoleGroupEnd = console.groupEnd ?
	console.groupEnd.bind(console) :
	function (){};

/**
 * @typedef {object} Action
 * @property {Constant} action.type
 * @property {Constant} action.source
 * @property {object} action.payload
 */

class FluxDebugger {

	static shouldLog (dispalyName) {
		var settings = FluxDebugger.getDebugSettings();
		var action = dispatcher.getRecentDispatch();

		return action && (settings.all ||
			settings.stores.indexOf(this.storeDisplayName) > -1 ||
			settings.controllerViews.indexOf(this.viewDisplayName) > -1 ||
			settings.types.indexOf(action.type) > -1 ||
			settings.sources.indexOf(action.source) > -1);
	}

	static getDebugSettings () {
		var FLUX_DEBUG = typeof window === 'undefined' ?
			{} :
			window.FLUX_DEBUG;

		return Object.assign(
			{},
			FLUX_DEBUG_DEFAULTS,
			process.env.FLUX_DEBUG || {},
			FLUX_DEBUG || {}
		);
	}

	constructor () {
		var settings = FluxDebugger.getDebugSettings();
		this.registeredHandlers = {};
		this.registeredActions = {};
		this.registeredSources = {};
		this.registeredTypes = {};
		this.warned = {
			getRecentDispatch: false
		};

		if(settings.unused) {
			setTimeout(() => {
				this.warnForUnusedActions();
			}, settings.unusedTimeout);
		}
	}

	/**
	 * Called by Stores to notify the debugger that they will consume actions
	 * which have a certain type or source.
	 *
	 * @param {Store} store - the store which handles this action
	 * @param {Constant} typeOrSource - an action type or source that a handler
	 *  expects some action to have
	 */
	registerActionHandler (store, typeOrSource) {
		if(!this.registeredHandlers[typeOrSource]) {
			this.registeredHandlers[typeOrSource] = [];
		}

		this.registeredHandlers[typeOrSource].push(store);
	}

	/**
	 * Called by an ActionCreator to register an action source for debugging
	 * purposes.
	 *
	 * @param {ActionCreator} actionCreator - what is trying to register the
	 * @param {Action} action - payload is not used, only type/source
	 */
	registerAction (actionCreator, action) {
		var existingEntry;

		if(!this.registeredActions[action.source]) {
			this.registeredActions[action.source] = {};
			this.registeredSources[action.source] = actionCreator;
		}

		existingEntry = this.registeredActions[action.source][action.type];

		invariant(
			existingEntry === undefined,
			'An action with source `%s` and type `%s` was already registered ' +
			'by `%s` and cannot be registered a second time.',
			action.source,
			action.type,
			existingEntry
		);

		this.registeredActions[action.source][action.type] = actionCreator;
		this.registeredTypes[action.type] = actionCreator;
	}

	logActionCreator (actionCreator, methodName, ...args) {
		if(!FluxDebugger.shouldLog()) {
			return;
		}
		consoleGroupEnd();
		consoleGroup('%c%s', styles.actionCreator, actionCreator.toString());
		console.log('%c%s', styles.plain, methodName);
		args.forEach(arg => console.log(arg));
		consoleGroupEnd();
	}

	logStore (store, methodName, ...args) {
		if(!FluxDebugger.shouldLog
				.call({storeDisplayName: store.displayName})) {
			return;
		}

		consoleGroup('%c%s', styles.store, store.toString());
		console.log('%c%s', styles.plain, methodName);
		args.forEach(arg => console.log(arg));
		consoleGroupEnd();
	}

	/**
	 *
	 * @param view - context of view
	 * @param {object} nextProps - optional. defaults to current props
	 * @param nextState - optional. defaults to current state
	 */
	logView (view, nextProps, nextState) {
		var str = view.constructor.displayName ?
			`[Component ${view.constructor.displayName}]` :
			`[unnamed Component]`;

		if (!FluxDebugger
				.shouldLog.call({viewDisplayName: view.displayName})) {
			return;
		}

		consoleGroup('%c%s', styles.view, str);

		if (nextProps || nextState) {
			console.log('%componentWillUpdate', styles.plain);
			console.log('nextProps', nextProps);
			console.log('nextState', nextState);
		} else {
			console.log('%componentDidMount', styles.plain);
			console.log('current props', view.props);
			console.log('next props', view.state);
		}

		consoleGroupEnd();
	}

	logDispatch (action) {
		consoleGroupEnd();
		if(!FluxDebugger.shouldLog()) {
			return;
		}
		consoleGroup(
			'%c%s | %s | %o',
			styles.dispatcher,
			action.source,
			action.type,
			action.payload
		);
	}

	/**
	 * When called, this funciton will console warn if there are any actions
	 * which seem to be half-complete; that is to say if an action exists in an
	 * action creator, but no store is set up to handle to action (or a store
	 * is set up to handle actions which do not exist in any action creator),
	 * you'll get a warning.
	 */
	warnForUnusedActions () {
		var unregistered = [];
		var unhandled = [];

		var registeredSources = Object.keys(this.registeredSources);
		var registeredTypes = Object.keys(this.registeredTypes);

		// Find actions which have handlers in Stores, but which have not been
		// registered through an ActionCreator
		each(this.registeredHandlers, (sourceOrType, stores) => {
			var sourceMatched = registeredSources.indexOf(sourceOrType) > -1;
			var typeMatched = registeredTypes.indexOf(sourceOrType) > -1;

			if (!sourceMatched && !typeMatched) {
				unregistered.push({
					sourceOrType: sourceOrType,
					stores: stores
				});
			}
		});

		// Find actions registered through ActionCreators which are not handled
		// by Stores
		each(this.registeredActions, (source, actionsByType) => {
			each(actionsByType, (type, actionCreator) => {
				if (!this.registeredHandlers[source] &&
					!this.registeredHandlers[type]) {
					unhandled.push({
						actionCreator: actionCreator,
						source: source,
						type: type
					});
				}
			});
		});

		if (unregistered.length > 1) {
			console.warn(
				'The following actions have handlers in stores, but no ' +
				'ActionCreator has registered an action for them:\n',
				unregistered
			);
		}

		if (unhandled.length > 1) {
			console.warn(
				'The following actions were registered by ActionCreators but ' +
				'are not handled in any known Store:\n',
				unhandled
			);
		}
	}
}

export default new FluxDebugger();
