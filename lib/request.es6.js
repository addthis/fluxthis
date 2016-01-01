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

const XHR = Symbol();

export default class {
	/**
	 * Creates a new Request object returned by api action creator
	 *
	 * @param {XMLHttpRequest} xhr
	 */
	constructor(xhr) {
		this[XHR] = xhr;
	}

	/**
	 * Stops the request by calling abort if any only if the request
	 * is not already done.
	 *
	 * @return {boolean} true if aborted, false if already done
	 */
	abort() {
		const xhr = this[XHR];

		// if the request has already been aborted then return true.
		if (xhr.readyState === 0) {
			return true;
		}

		// if the request is done then we can't abort it.
		if (xhr.readyState === 4) {
			return false;
		}

		this[XHR].abort();

		return true;
	}

	/**
	 * Returns true if the request has been aborted or the request is finished.
	 *
	 * @return {boolean}
	 */
	isDone() {
		return this[XHR].readyState === 4 || this[XHR].readyState === 0;
	}
}
