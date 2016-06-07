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

const pathToRegExp = require('path-to-regexp');
const qsParse = require('qs/lib/parse');

const getHashString = require('./utils/getHashString');
const getQueryString = require('./utils/getQueryString');


export default class Route {
	/**
	 *
	 * @param {string} path - path defined by the user
	 * @param {GeneratorFunction} handler
	 * @param {object} [options]
	 * @param {boolean} [options.all]
	 */
	constructor(path, handler, options={}) {
		this.path = path;
		this.handler = handler;
		this.options = options;

		this.keys = [];

		// If the option is an `all` option, then we regex differently
		if (options.all) {
			this.regex = new RegExp(path.replace(/\*/g, '.*?'));
		}
		// Else we want to make sure the path has valid path parameters
		else {
			this.regex = pathToRegExp(path, this.keys);
		}
	}

	/**
	 * Checks to see if the current URL matches the path of the current
	 * route. If so, then it returns an object of mapped param keys
	 * to values.
	 *
	 * This method does not yet take into account query parameters.
	 *
	 * @param url
	 * @returns {Object|null}
	 */
	matches(url) {
		if (!url) {
			return null;
		}

		const {hashString, hashQueryString} = getHashString(url);

		const queryString = getQueryString(url);

		const urlMatchesRoute = this.regex.exec(hashString);

		if (!urlMatchesRoute) {
			return null;
		}

		const result = {
			pathParams: {},
			hashQueryParams: {},
			queryParams: {}
		};

		// If this is an `all` route, then we don't match anything.
		if (this.options.all) {
			return result;
		}

		// Get the query string params, if applicable. default = {}
		result.queryParams = qsParse(queryString);
		result.hashQueryParams = qsParse(hashQueryString);

		// Build up all the route params from the path-to-regexp output
		this.keys.forEach((value, index) => {
			result.pathParams[value.name] = urlMatchesRoute[index + 1];
		});

		return result;
	}
}
