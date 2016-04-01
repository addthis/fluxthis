import {CONTEXT} from 'symbols/protected';

import {
	CTX_DISPATCHER_DISPATCH,
	CTX_STORE_HANDLER
} from 'symbols/context';

export default function wrapHandler({fn}) {
	return (...args) => {
		this[CONTEXT].allow('store:handler', CTX_STORE_HANDLER, CTX_DISPATCHER_DISPATCH);
		this[CONTEXT].push(CTX_STORE_HANDLER, () => {
			fn.apply(this, args)
		});
	}
}
