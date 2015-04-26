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
const each = require('../lib/each');

const IN_PRODUCTION = process.env.NODE_ENV === 'production';
const FLUX_DEBUG_DEFAULTS = {
	all: false,
	types: [],
	sources: [],
	stores: [],
	controllerViews: [],
	unused: !IN_PRODUCTION,
	unusedTimeout: 3000
};

const styles = {
	plain: 'color: #000000',
	view: 'color: #3827ef', //dark blue
	dispatcher: 'color: #6940a0', //purple
	store: 'color: #4db848', //muted green
	actionCreator: 'color: #eb6e84' //salmon
};

const consoleGroup = console.group ?
	console.group.bind(console) :
	function log(...args) {
		//can't use bind here because IE9 issues
		console.log(...args);
	};

const consoleGroupEnd = console.groupEnd ?
	console.groupEnd.bind(console) :
	function noop(){};

/**
 * @typedef {object} Action
 * @property {Constant} action.type
 * @property {Constant} action.source
 * @property {object} action.payload
 */

class FluxDebugger {

	static shouldLog() {
		const settings = FluxDebugger.getDebugSettings();
		const action = dispatcher.getRecentDispatch();

		return action && (settings.all ||
			settings.stores.indexOf(this.storeDisplayName) > -1 ||
			settings.controllerViews.indexOf(this.viewDisplayName) > -1 ||
			settings.types.indexOf(action.type) > -1 ||
			settings.sources.indexOf(action.source) > -1);
	}

	static getDebugSettings() {
		const FLUX_DEBUG = typeof window === 'undefined' ?
			{} :
			window.FLUX_DEBUG;

		return Object.assign(
			{},
			FLUX_DEBUG_DEFAULTS,
			process.env.FLUX_DEBUG || {},
			FLUX_DEBUG || {}
		);
	}

	constructor() {
		const settings = FluxDebugger.getDebugSettings();
		this.registeredHandlers = new Map();
		this.registeredActions = new Map();
		this.registeredSources = new Map();
		this.registeredTypes = new Map();

		if (settings.unused) {
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
	registerActionHandler(store, typeOrSource) {
		if (!this.registeredHandlers.has(typeOrSource)) {
			this.registeredHandlers.set(typeOrSource, []);
		}

		this.registeredHandlers.get(typeOrSource).push(store);
	}

	/**
	 * Called by an ActionCreator to register an action source for debugging
	 * purposes.
	 *
	 * @param {ActionCreator} actionCreator - what is trying to register the
	 * @param {Action} action - payload is not used, only type/source
	 * @param {string} action.type
	 * @param {string} action.source
	 */
	registerAction(actionCreator, action) {
		let {source, type} = action;

		if (!this.registeredActions.has(source)) {
			this.registeredActions.set(source, new Map());
			this.registeredSources.set(source, actionCreator);
		}

		this.registeredActions.get(source).set(type, actionCreator);
		this.registeredTypes.set(type, actionCreator);
	}

	logActionCreator(actionCreator, methodName, ...args) {
		if (!FluxDebugger.shouldLog()) {
			return;
		}
		consoleGroupEnd();
		consoleGroup('%c%s', styles.actionCreator, actionCreator.toString());
		console.log('%c%s', styles.plain, methodName);
		args.forEach(arg => console.log(arg));
		consoleGroupEnd();
	}

	logStore(store, methodName, ...args) {
		const {displayName} = store;
		if (!FluxDebugger.shouldLog.call({storeDisplayName: displayName})) {
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
	logView(view, nextProps, nextState) {
		const {displayName} = view.constructor;
		const str = `[Component ${displayName}]`;

		if (!FluxDebugger.shouldLog.call({viewDisplayName: displayName})) {
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

	logDispatch(action) {
		consoleGroupEnd();
		if (!FluxDebugger.shouldLog()) {
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
	warnForUnusedActions() {
		const unregistered = [];
		const unhandled = [];

		// Find actions which have handlers in Stores, but which have not been
		// registered through an ActionCreator
		this.registeredHandlers.forEach((stores, sourceOrType) => {
			let sourceMatched = this.registeredSources.has(sourceOrType);
			let typeMatched = this.registeredTypes.has(sourceOrType);

			if (!sourceMatched && !typeMatched) {
				unregistered.push({
					sourceOrType,
					stores
				});
			}
		});

		// Find actions registered through ActionCreators which are not handled
		// by Stores
		this.registeredActions.forEach((actionsByType, source) => {
			each(actionsByType, (type, actionCreator) => {
				if (!this.registeredHandlers.has(source) &&
					!this.registeredHandlers.has(type)) {
					unhandled.push({
						actionCreator,
						source,
						type
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
