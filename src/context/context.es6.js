import invariant from 'invariant';
import {CTX_EMPTY_STACK} from 'symbols/context';

const STACK = Symbol('STACK');

export default class Context {
	constructor() {
		this[STACK] = [];
	}

	get() {
		return this[STACK][this[STACK].length - 1] || CTX_EMPTY_STACK;
	}

	push(ctx, fn) {
		this[STACK].push(ctx);
		try {
			return fn();
		}
		finally {
			this[STACK].pop();
		}
	}

	allow(label, ...CTXs) {
		const ctx = this.get();
		
		CTXs.forEach(CTX => {
			invariant(
				CTX !== undefined,
				'an undefined context was passed to \'allow\'.'
			);
		});

		invariant(
			CTXs.indexOf(ctx) > -1,
			'Illegal state detected. %s can only be entered from the following contexts: %s',
			label.toString(),
			'[' + CTXs.map(CTX => CTX.toString()).join(', ') + ']'
		);
	}
}
