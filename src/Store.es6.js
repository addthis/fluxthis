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
var debug = require('./debug.es6');
var renderedComponentSet = new WeakSet();

var IN_PRODUCTION = process.env.NODE_ENV === 'production';

var DisplayNames = new Set();

export default class Store {
	constructor () {
		var store = this;

		// Ensure we have unique display names to assist with debugging.
		if (!IN_PRODUCTION) {
			if (DisplayNames.has(this.displayName)) {
				throw new Error(`Store Error: Your ${this.displayName} is not unique.`);
			}
			DisplayNames.add(this.displayName);
		}

		// Expose the mixin for the Store.
		this.mixin = {
			/**
			 * Automatically add the change listener for the given
			 * store when the component is going did mount.
			 */
			componentDidMount () {
				invariant(
					this.getStateFromStores instanceof Function,
					'`%s` must define `getStateFromStores` in order to use ' +
					'the FluxThis mixin.',
					this.displayName
				);

				debug.logView(this);

				if (!this.__fluxChangeListener) {
					this.__fluxChangeListener = () => {
						this.setState(this.getStateFromStores());
					};
				}

				store.__addChangeListener(this.__fluxChangeListener);
			},

			/**
			 * Automatically remove the change listener for the given
			 * store when the component is going to unmount.
			 */
			componentWillUnmount () {
				store.__removeChangeListener(this.__fluxChangeListener);
			},

			getInitialState () {
				// This check ensures that we do not use the mixins
				// get initial state twice on the same method.
				// This is the case when a view uses more than 1 FluxThis store.
				if (!this.state && !renderedComponentSet.has(this)) {
					renderedComponentSet.add(this);

					// the initialState props is used to create state
					// from props in certain cases like tests.
					if (this.props.initialState) {
						return this.props.initialState;
					}

					return this.getStateFromStores();
				}
			},

			componentWillUpdate (nextProps, nextState) {
				debug.logView(this, nextProps, nextState);
			}
		};
	}

	waitFor (...tokens) {
		return dispatcher.waitFor(tokens);
	}
}