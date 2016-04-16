import {
	HANDLER,
	CONTEXT
} from '../symbols/protected';

import {
	CTX_STORE_HANDLER,
	CTX_DISPATCHER_DISPATCH
} from '../symbols/context';


// class method decorator
export default function handle(ActionClass) {
	return function (storePrototype, methodName, descriptor) {
		const handler = descriptor.value || descriptor.initializer();
		handler[HANDLER] = ActionClass;

		return {
			configurable: descriptor.configurable,
			enumerable: descriptor.enumerable,
			writable: descriptor.writable,
			value: handler
		};
	}
}