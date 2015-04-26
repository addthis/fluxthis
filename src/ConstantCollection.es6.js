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

class Constant {
	constructor(name, collection) {
		this.name = name;
		this.collection = collection;
	}
	toString() {
		return `${this.name}_#${this.collection.id}`;
	}
}

/**
 * Creates an immutable collection of constants which are meant to be passed
 * around to your various files.
 *
 * @constructor
 * @param {string...} any amount of strings to transform into constants for this
 *	group. The strings should be unique.
 */
export default class ConstantCollection {
	constructor(...names) {

		this.id = Math.random().toString(36).substring(2);
		names.forEach((name) => {
			invariant(
				this[name] === undefined,
				'The constant `%s` already exists in this collection',
				name
			);

			this[name] = new Constant(name, this);
		});

		Object.freeze(this);
	}
}
