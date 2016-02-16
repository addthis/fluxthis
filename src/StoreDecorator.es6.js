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

export default function storeDecorator(Store) {
	invariant(
		Store && typeof Store.mixin === 'object',
		'Please make sure you passed a FluxThis Store into the store' +
		'decorator annotation.'
	);

	return (Component) => {
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

		return Component;
	};
}
