export default function defineHiddenProperties(obj, props) {
	for (let prop of props) {
		Object.defineProperty(obj, prop[0], {
			value: prop[1],
			configurable: false,
			enumerable: false,
			writable: false
		});
	}
}
