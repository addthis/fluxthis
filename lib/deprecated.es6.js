'use strict';

export default function (condition, oldName, newName) {
	if (!condition) {
		return;
	}

	let warning = `Warning: \`${oldName}\` is deprecated and will be removed` +
		`in future versions of FluxThis.`;

	if (newName) {
		warning += ` Please use \`${newName}\` instead.`;
	}

	console.warn(warning);
}
