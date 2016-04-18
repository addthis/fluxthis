import {Iterable} from 'immutable';
import Store from '../store/store';

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
			return item instanceof Store || Iterable.isIterable(item);
	}
}