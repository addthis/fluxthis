import isImmutable from '../util/is-immutable';
import invariant from 'invariant';

import {
	MUTABLE,
	CONTEXT
} from '../symbols/protected';

import {
	CTX_VIEW_GET_STATE_FROM_STORES,
	CTX_STORE_ACCESSOR,
	CTX_STORE_HANDLER,
	CTX_EMPTY_STACK
} from '../symbols/context';

export default function wrapAccessor({storeName, fn, key}) {
	return (...args) => {
		this[CONTEXT].allow(
			'store:accessor',
			CTX_VIEW_GET_STATE_FROM_STORES,
			CTX_STORE_ACCESSOR,
			CTX_STORE_HANDLER,
			CTX_EMPTY_STACK
		);

		const prevCtx = this[CONTEXT].get();

		return this[CONTEXT].push(CTX_STORE_ACCESSOR, () => {
			const result = fn.apply(this, args);
			const allowedMutableContext = [
				CTX_STORE_ACCESSOR,
				CTX_STORE_HANDLER
			].indexOf(prevCtx) > -1;

			if (!fn[MUTABLE]) {
				invariant(
					isImmutable(result) || allowedMutableContext, 
					'The store accessor %s.%s attempted to return a mutable object. Store ' +
					'accesors cannot return mutable objects unless the accessor is explicitly ' +
					'decorated with @mutable',
					storeName,
					key
				)
			}

			return result;
		});
	}
}