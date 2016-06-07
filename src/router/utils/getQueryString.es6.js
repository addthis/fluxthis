export default function (url) {
	// Get the query param position and strip it from the url for parsing.
	const match = url.match(/\?([^#]*)/);

	// Strip out query string.
	if (match) {
		return match[1];
	}
	return '';
}
