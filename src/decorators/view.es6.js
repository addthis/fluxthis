import invariant from 'invariant';
import context from '../context/default-context';
import dispatcher from '../dispatcher/default-dispatcher';
import Action from '../action/action';

import {
	CONTEXT,
	DISPATCHER,
	REGISTER_LISTENER,
	UNREGISTER_LISTENER,
	PAYLOAD,
	CREATOR,
	DISPATCH
} from '../symbols/protected';

import {
	CTX_EMPTY_STACK,
	CTX_VIEW_RENDER,
	CTX_ACTION_DISPATCH,
	CTX_VIEW_GET_STATE_FROM_STORES
} from '../symbols/context';


// class method decorator
export default function view(...stores) {
	return function (ctor) {
		const {
			getStateFromStores,
			componentWillMount,
			componentWillUnmount,
			render
		} = ctor.prototype;

		Object.assign(ctor.prototype, {
			[CONTEXT]: context,
			[DISPATCHER]: dispatcher,
			setContext(newContext) {
				this[CONTEXT] = newContext;
			},
			setDispatcher(newDispatcher) {
				this[DISPATCHER] = newDispatcher;
			},
			dispatch(ActionCtor, ...args) {
				this[CONTEXT].allow('view:dispatch', CTX_EMPTY_STACK);
				this[CONTEXT].push(CTX_ACTION_DISPATCH, () => {
					invariant(
						ActionCtor.prototype instanceof Action,
						'The view %s attempted to dispatch the non-action %s',
						this.displayName || this.constructor.name,
						ActionCtor.name
					);

					const action = new ActionCtor();
					action[CREATOR] = this;
					action[PAYLOAD] = action.transform.apply(action, args);
					this[DISPATCHER][DISPATCH](action);
				});
			},
			componentWillMount(...args) {
				if (componentWillMount) {
					componentWillMount.apply(this, args);
				}

				// Ensure this method is bound to the instance, because it wont
				// be by default, if es6 classes were used. So we copy the
				// method from the prototype to the instance, and bind it to the
				// instance.
				this.setStateFromStores = this.setStateFromStores.bind(this);

				this.setStateFromStores();

				stores.forEach((store) => {
					store[REGISTER_LISTENER](this.setStateFromStores);
				});
			},
			componentWillUnmount(...args) {
				if (componentWillUnmount) {
					componentWillUnmount.apply(this, args);
				}

				stores.forEach((store) => {
					store[UNREGISTER_LISTENER](this.setStateFromStores);
				});
			},
			setStateFromStores(...args) {
				if (getStateFromStores) {
					this[CONTEXT].push(CTX_VIEW_GET_STATE_FROM_STORES, () => {
						this.setState(getStateFromStores.apply(this, args));
					});
				}
			},
			render(...args) {
				return this[CONTEXT].push(CTX_VIEW_RENDER, () => {
					return render.apply(this, args);
				});
			}
		});
	}
}