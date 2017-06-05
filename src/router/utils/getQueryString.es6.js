'use strict';

export default function (url) {
	const stripHash = url.replace(/#.*$/, '');
	const match = stripHash.match(/\?(.*)/);

	// Strip out query string.
	if (match) {
		return match[1];
	}
	return '';
}
