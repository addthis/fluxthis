import context from 'context/default-context';
import StoreGraph from 'store/store-graph';

import {
	CTX_ACTION_ENACT,
	CTX_DISPATCHER_DISPATCH
} from 'symbols/context';

import {
	DISPATCH,
	REGISTER_STORE,
	CONTEXT,
	PARENT_STORE,
	HANDLERS,
	PAYLOAD,
	LISTENERS
} from 'symbols/protected';

export default class Dispatcher {
	constructor() {
		this[CONTEXT] = context;
		this.stores = new StoreGraph();
	}

	setContext(newContext) {
		this[CONTEXT] = newContext;
	}

	[REGISTER_STORE](store) {
		this.stores.addStore(store);
	}

	[DISPATCH](action) {
		this[CONTEXT].allow('dispatcher:dispatch', CTX_ACTION_ENACT);
		this[CONTEXT].push(CTX_DISPATCHER_DISPATCH, () => {
			// Gather a set of each unique listener that needs to fire in order to avoid duplicate
			// calls
			const storeListeners = new Set();

			for (let store of this.stores) {
				const handler = store[HANDLERS].get(action.constructor);
				
				if (handler) {
					handler(action[PAYLOAD])
					store[LISTENERS].forEach(fn => storeListeners.add(fn));
				}

				// ensure the chain of parents recieve their updates from a child updating
				let parent = store[PARENT_STORE];
				while (parent) {
					parent[LISTENERS].forEach(fn => storeListeners.add(fn));
					parent = parent[PARENT_STORE];
				}
			}

			// notify the views to update their states
			storeListeners.forEach(fn => fn());
		});
	}
}
