import defineHiddenProperties from '../util/define-hidden-properties';
import dispatcher from '../dispatcher/default-dispatcher';
import Dispatcher from '../dispatcher/dispatcher';
import wrapHandler from './wrap-handler';
import wrapAccessor from './wrap-accessor';
import context from '../context/default-context';
import {
	DISPATCHER,
	REGISTER_STORE,
	REGISTER_LISTENER,
	UNREGISTER_LISTENER,
	NOTIFY_LISTENERS,
	LISTENERS,
	HANDLER,
	HANDLERS,
	CHILD_STORES,
	PARENT_STORE,
	CONTEXT
} from '../symbols/protected';

import {
	CTX_VIEW_GET_STATE_FROM_STORES,
	CTX_STORE_ACCESSOR,
	CTX_EMPTY_STACK
} from '../symbols/context';

const STORE = Symbol('STORE');
const ADOPT_CHILDREN = Symbol('ADOPT_CHILDREN');
const DECORATE_STORE = Symbol('DECORATE_STORE');
const FINALIZE = Symbol('FINALIZE');

export default class Store {
	constructor(...args) {
		defineHiddenProperties(this, [
			[DISPATCHER, args[0] instanceof Dispatcher ?
				args.shift() :
				dispatcher],
			[CONTEXT, context],
			[HANDLERS, new Map()],
			[LISTENERS, new Set()],
			[CHILD_STORES, args]
		]);
		
		this[ADOPT_CHILDREN]();
		this[DECORATE_STORE]();
		this[DISPATCHER][REGISTER_STORE](this);

		setTimeout(this[FINALIZE].bind(this));
	}

	[DECORATE_STORE]() {
		// wrap accessor/mutator methods and register handlers
		const proto = this.constructor.prototype;
		const descriptors = Object.getOwnPropertyDescriptors(proto);

		// have we already processed this store?  don't double-decorate
		if (this.constructor[STORE]) {
			return;
		}
		
		this.constructor[STORE] = true;

		// Iterate over store methods and decide if they are accessors or mutators, based on the
		// @handle decorator
		for (let key in descriptors) {
			const fn = descriptors[key].value || descriptors[key].initialize();

			if (key === 'constructor' || !(fn instanceof Function)) {
				continue;
			}

			if (fn[HANDLER]) {
				proto[key] = wrapHandler.call(this, {fn})
				this[HANDLERS].set(fn[HANDLER], this[key]);
			}
			else {
				const storeName = this.constructor.name;
				proto[key] = wrapAccessor.call(this, {fn, key, storeName});
			}
		}
	}

	[ADOPT_CHILDREN]() {
		for (let child of this[CHILD_STORES]) {
			child[PARENT_STORE] = this;
		}
	}

	[FINALIZE]() {
		const values = {};

		for (let key in this) {
			if (!this.hasOwnProperty(key)) {
				continue;
			}

			values[key] = this[key];

			Object.defineProperty(this, key, {
				get: wrapAccessor.call(this, {
					// how do we let accessors read from values w/o immutable flags going off?
					storeName: this.constructor.name,
					fn: () => values[key],
					key
				}),
				set: value => values[key] = value
			});
		}

		Object.freeze(this);
	}

	[REGISTER_LISTENER](fn) {
		this[LISTENERS].add(fn);
	}

	[UNREGISTER_LISTENER](fn) {
		this[LISTENERS].delete(fn);
	}
	
	setContext(newContext) {
		this[CONTEXT] = newContext;
	}
}
