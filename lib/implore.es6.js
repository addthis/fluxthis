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
 
var invariant = require('invariant');

module.exports = implore;

/**
 * @typedef {object} request
 * @property {string} method
 * @property {string} route - string like /abc/:abc
 * @property {string} params
 * @property {object} [body]
 */

/**
 * @typedef {object} reponse
 * @property {Error} error - an error which occured during req or res
 * @property {object} body - content received from server (parsed)
 * @property {number} status - http status code; 0 on failure
 */

/**
 * XHR wrapper for same-domain requests with Content-Type: application/json
 *
 * @param {request} request
 * @param {function} callback - called with (request, response) on completion or
 *	error
 */
function implore (request) {
	return new Promise(resolve => {
		var response = {
			error: null
		};
		var xhr;

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


		xhr = new XMLHttpRequest();
		xhr.open(request.method, getURLFromRequest(request));

		switch (request.method) {
			case 'POST':
			case 'PUT':
			case 'PATCH':
				xhr.setRequestHeader('Content-Type','application/json');
				break;
		}

		xhr.onreadystatechange = function () {
			var responseText;

			if(xhr.readyState === 4) {
				responseText = xhr.responseText;
				response.status = xhr.status;
				response.type = xhr.getResponseHeader('Content-Type');

				if(response.type === 'application/json') {
					try {
						response.body = JSON.parse(responseText);
					}
					catch (err) {
						err.message = err.message + ' while parsing `' +
						responseText + '`';
						response.body = {};
						response.status = xhr.status || 0;
						response.error = err;
					}
				}
				else {
					response.body = responseText;
				}

				return resolve({
					request,
					response
				});
			}
		};

		try {
			if(request.body) {
				xhr.send(JSON.stringify(request.body));
			}
			else {
				xhr.send();
			}
		}
		catch (err) {
			response.body = {};
			response.status = 0;
			response.error = err;

			return resolve({
				request,
				response
			});
		}
	})
}

implore.get = function (options, callback) {
	options.method = 'GET';
	return implore(options, callback);
};

implore.post = function (options, callback) {
	options.method = 'POST';
	return implore(options, callback);
};

implore.put = function (options, callback) {
	options.method = 'PUT';
	return implore(options, callback);
};

implore.delete = function (options, callback) {
	options.method = 'DELETE';
	return implore(options, callback);
};

/**
 * Combine the route/params/query of a request into a complete URL
 * 
 * @param {request} request,
 * @return {string} url
 */
function getURLFromRequest (request) {
	var formatted = request.route;
	var queryString = makeQueryString(request.query || {});
	var name;
	var value;
	var regexp;

	for(name in request.params) {
		if(request.params.hasOwnProperty(name)) {
			value = request.params[name];
			regexp = new RegExp(':' + name + '(?=(\\\/|$))');
			formatted = formatted.replace(regexp, value);
		}
	}

	return formatted + (queryString ? '?' + queryString : '');
}

/**
 * Take a simple object and turn it into a queryString, recursively.
 * 
 * @param {object} obj - query object
 * @param {string} prefix - used in recursive calls to keep track of the parent
 * @return {string} queryString without the '?''
 */
function makeQueryString (obj, prefix) {
	var str = [];
	var prop;
	var key;
	var value;

	for(prop in obj) {
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