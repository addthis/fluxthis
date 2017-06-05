'use strict';

export default function (url) {
	const hashMatch = url.match(/#([^?]*)/);
	if (hashMatch) {
		return hashMatch[1];
	}
	return '';
}
