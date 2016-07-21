/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const invariant = require('invariant');
const deprecated = require('./deprecated.es6');
const Request = require('./request.es6');

/**
 * @typedef {object} request
 * @property {string} method
 * @property {string} route - string like /abc/:abc
 * @property {string} params
 * @property {object} [body]
 * @property {object} headers
 */

/**
 * @typedef {object} response
 * @property {Error} error - an error which occured during req or res
 * @property {object} body - content received from server (parsed)
 * @property {object} headers - set additional request headers
 * @property {number} status - http status code; 0 on failure
 */

/**
 * XHR wrapper for same-domain requests with Content-Type: application/json
 *
 * @param {Object} request
 * @param {Function} callback function
 * @return {Object} request object that is cancelable
 */
export default function implore(request, callback) {
	const response = {
		error: null
	};

	const {withCredentials=false, headers={}} = request;
	const xhr = new XMLHttpRequest();

	invariant(
		request,
		'implore requires a `request` argument'
	);

	invariant(
		typeof request.route === 'string',
		'implore requires parameter `route` to be a string'
	);

	invariant(
		typeof request.method === 'string',
		'implore requires parameter `method` to be a string'
	);

	invariant(
		typeof withCredentials === 'boolean',
		'implore requires parameter `withCredentials` to be a boolean'
	);

	invariant(
		typeof headers === 'object',
		'implore requires parameter `headers` to be an object'
	);

	xhr.open(request.method, getURLFromRequest(request));
	xhr.withCredentials = withCredentials;

	let contentTypeSetByUser = false;

	if (request.contentType) {
		deprecated(true, 'contentType in createRequest', 'headers');
		xhr.setRequestHeader('Content-Type', request.contentType);
		contentTypeSetByUser = true;
	}

	Object.keys(headers).forEach((header) => {
		// Don't send headers with `undefined` as a value; those headers are
		// used for removing default headers from particular requests.
		if (typeof headers[header] !== 'undefined') {
			if (header === 'Content-Type') {
				contentTypeSetByUser = true;
			}
			xhr.setRequestHeader(header, headers[header]);
		}
	});

	if (!contentTypeSetByUser) {
		switch (request.method) {
			case 'POST':
			case 'PUT':
			case 'PATCH':
				xhr.setRequestHeader('Content-Type', 'application/json');
				break;
		}
	}

	xhr.onabort = function onabort() {
		callback({
			request,
			response: {
				fluxthisAborted: true
			}
		});
	};

	xhr.onreadystatechange = function onreadystatechange() {
		if (xhr.readyState === 4 && xhr.status !== 0) {
			response.body = xhr.responseText;
			response.status = xhr.status;
			response.type = xhr.getResponseHeader('Content-Type');

			// Expose headers in raw form (string) and in a more convenient form (hash)
			response.rawHeaders = xhr.getAllResponseHeaders();
			const responseHeaders = response.rawHeaders.split('\n');
			response.headers = {};
			for (let header of responseHeaders) {
				const parts = header.split(':');
				if (parts.length === 2) {
					response.headers[parts[0].trim()] = parts[1].trim();
				}
			}

			if (/application\/json/.test(response.type)) {
				if (response.body && response.status !== 204) {
					try {
						response.body = JSON.parse(response.body);
					} catch (err) {
						response.status = xhr.status || 0;
						response.error = err;
					}
				}
			}

			callback({
				request,
				response
			});
		}
	};

	try {
		if (request.body) {
			if (typeof request.body === 'string') {
				xhr.send(request.body);
			} else {
				xhr.send(JSON.stringify(request.body));
			}
		}
		else {
			xhr.send();
		}
	}
	catch (err) {
		response.body = {};
		response.status = 0;
		response.error = err;

		callback({
			request,
			response
		});

		return null;
	}

	return new Request(xhr);
}

implore.get = function get(options) {
	options.method = 'GET';
	return implore(options);
};

implore.post = function post(options) {
	options.method = 'POST';
	return implore(options);
};

implore.put = function put(options) {
	options.method = 'PUT';
	return implore(options);
};

implore.delete = function httpDelete(options) {
	options.method = 'DELETE';
	return implore(options);
};

/**
 * Combine the route/params/query of a request into a complete URL
 *
 * @param {request} request
 * @param {object|array} request.query
 * @return {string} url
 */
function getURLFromRequest(request) {
	const queryString = makeQueryString(request.query || {});
	let formatted = request.route;
	let value;
	let regexp;

	// Replace route params with their values. If the route param is specified
	// with an extension (e.g., ':id.json'), keep the extension.
	Object.keys(request.params || {}).forEach((name) => {
		value = request.params[name];
		regexp = new RegExp(':' + name + '(?=(?:\\.|\\/|$|\\?))');
		formatted = formatted.replace(regexp, value);
	});

	return formatted + (queryString ? '?' + queryString : '');
}

/**
 * Take a simple object and turn it into a queryString, recursively.
 *
 * @param {object} obj - query object
 * @param {string} prefix - used in recursive calls to keep track of the parent
 * @return {string} queryString without the '?''
 */
function makeQueryString(obj, prefix='') {
	const str = [];
	let prop;
	let key;
	let value;

	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			key = prefix ?
				prefix + '[' + prop + ']' :
				prop;
			value = obj[prop];
			str.push(typeof value === 'object' ?
				makeQueryString(value, key) :
				encodeURIComponent(key) + '=' + encodeURIComponent(value));
		}
	}

	return str.join('&');
}
