import dispatcher from 'dispatcher/default-dispatcher';
import context from 'context/default-context';
import invariant from 'invariant';

import {
	CTX_ACTION_ENACT,
	CTX_VIEW_ENACT,
	CTX_EMPTY_STACK
} from 'symbols/context';

import {
	CREATOR, 
	PAYLOAD, 
	DISPATCHER,
	CONTEXT
} from 'symbols/protected';

export default class Action {
	constructor() {
		// WIP  
		context.allow('action:create', CTX_ACTION_ENACT, CTX_VIEW_ENACT);

		this[PAYLOAD] = null;
		this[DISPATCHER] = dispatcher;
		this[CONTEXT] = context;
	}

	enact(OtherAction, ...args) {
		this[CONTEXT].allow('action:enact', CTX_EMPTY_STACK);
		this[CONTEXT].push(CTX_ACTION_ENACT, () => {
			invariant(
				OtherAction.prototype instanceof Action,
				'The action %s attempted to enact the non-action %s',
				this.constructor.name,
				OtherAction.name
			);

			const otherAction = new OtherAction();
			otherAction[CREATOR] = this;
			otherAction[PAYLOAD] = otherAction.act.apply(otherAction, args);
			this[DISPATCHER][DISPATCH](otherAction);
		});
	}

	act(arg) {
		return arg;
	}

	setDispatcher(newDispatcher) {
		this[DISPATCHER] = newDispatcher;
	}

	setContext(newContext) {
		this[CONTEXT] = newContext;
	}
}
