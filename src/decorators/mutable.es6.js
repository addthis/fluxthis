import {MUTABLE} from '../symbols/protected';

// class method decorator
export default function mutable (prototype, methodName, descriptor) {
	const value = descriptor.value || descriptor.initializer();
	value[MUTABLE] = true;
	return {
		configurable: descriptor.configurable,
		enumerable: descriptor.enumerable,
		writable: descriptor.writable,
		value
	};
}