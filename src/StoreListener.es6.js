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

import invariant from 'invariant';

function mergeMixin(reactComponent, storeMixin) {
	Object.keys(storeMixin).forEach((key) => {
		const mixinFn = storeMixin[key];
		const reactComponentFn = reactComponent[key];

		reactComponent[key] = function wrappedFunction(...args) {
			// Call the storeMixin function first
			if (mixinFn) {
				mixinFn.apply(this, args);
			}

			// Next call the reactComponent function.
			if (reactComponentFn) {
				return reactComponentFn.apply(this, args);
			}
		};
	});
}

function createListener(Store, Component) {
	const mixin = {};
	Object.keys(Store.mixin).forEach((key) => {
		if (key === 'getInitialState') {
			mixin.componentWillMount = function wrappedFunction() {
				this.state = this.state || {};
				Object.assign(this.state, Store.mixin[key].call(this));
			};
		} else {
			mixin[key] = Store.mixin[key];
		}
	});

	mergeMixin(Component.prototype, mixin);
}

export default function storeListener(...Stores) {
	return (Component) => {
		for (let store of Stores) {
			invariant(
				store && typeof store.mixin === 'object',
				'Please make sure you passed a FluxThis Store into the store ' +
				'listener decorator.'
			);

			createListener(store, Component);
		}

		return Component;
	};
}
