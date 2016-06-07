export default getHashString(url) {
	const hashMatch = url.match(/#([^?]*)/);
	if (hashMatch) {
		return hashMatch[1];
	}
	return '';
}
