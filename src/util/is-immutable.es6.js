import {Iterable} from 'immutable';

export default function isImmutable(item) {
	const type = typeof item;
	switch(type) {
		case 'symbol':
		case 'number':
		case 'boolean':
		case 'string':
		case 'function':
			return true;
		default:
			return item instanceof Iterable;
	}
}