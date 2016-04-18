import dispatcher from '../dispatcher/default-dispatcher';
import context from '../context/default-context';
import invariant from 'invariant';

import {
	CTX_ACTION_DISPATCH,
	CTX_VIEW_DISPATCH,
	CTX_EMPTY_STACK
} from '../symbols/context';

import {
	CREATOR, 
	PAYLOAD, 
	DISPATCHER,
	CONTEXT,
	DISPATCH
} from '../symbols/protected';

export default class Action {
	constructor() {
		// WIP  
		context.allow('action:create', CTX_ACTION_DISPATCH, CTX_VIEW_DISPATCH);

		this[PAYLOAD] = null;
		this[DISPATCHER] = dispatcher;
		this[CONTEXT] = context;
	}

	dispatch(OtherAction, ...args) {
		this[CONTEXT].allow('action:dispatch', CTX_EMPTY_STACK);
		this[CONTEXT].push(CTX_ACTION_DISPATCH, () => {
			invariant(
				OtherAction.prototype instanceof Action,
				'The action %s attempted to dispatch the non-action %s',
				this.constructor.name,
				OtherAction.name
			);

			const otherAction = new OtherAction();
			otherAction[CREATOR] = this;
			otherAction[PAYLOAD] = otherAction.transform.apply(otherAction, args);
			this[DISPATCHER][DISPATCH](otherAction);
		});
	}

	transform(arg) {
		return arg;
	}

	setDispatcher(newDispatcher) {
		this[DISPATCHER] = newDispatcher;
	}

	setContext(newContext) {
		this[CONTEXT] = newContext;
	}
}
