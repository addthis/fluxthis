'use strict';

export default function (obj, oldName, newName) {
	console.log(`Warning: ${oldName} is deprecated when calling ${obj}` +
		' and will be removed in future versions of FluxThis. Please' +
		` change this function to be ${newName}`);
}
