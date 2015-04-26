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

const each = require('../lib/each');
const invariant = require('invariant');
const Immutable = require('immutable');
const ObjectOrientedStore = require('./ObjectOrientedStore.es6');

const IN_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * A Flux Store which is strict on Immutability
 */
class ImmutableStore extends ObjectOrientedStore {

	/**
	 * Returns true if item is an immutable OR a primitive val
	 *
	 * @param {...} item
	 * @return {boolean}
	 */
	static checkImmutable(item) {
		return item instanceof Immutable.Iterable || !(item instanceof Object);
	}

    /**
	 * @param {object} options
	 * @param {function} options.init - this fn should set up initial state and
	 *	also be used to call `bindActions`
	 * @param {object} [options.private] - object of private functions, usually
	 *	modifiers. Not every store will need this!
	 * @param {object} options.public - object of public functions, usually
	 *	accessors
	 * @param {string} options.displayName - a human readable name, used for
	 *	debugging
	 */
	constructor(options) {
		// If we are in production, then lets skip adding
		// the immutability checks for performance sake.
		if (IN_PRODUCTION) {
			super(options);
			return;
		}

		invariant(
			options,
			'Cannot create FluxThis Stores without arguments'
		);

		// Wrap methods with immutability checkers before creating the OOStore
		const parentOptions = {
			displayName: options.displayName,
			init: null,
			public: {},
			private: options.private
		};


		if (options.init) {
			parentOptions.init = function init() {
				options.init.call(this);

				each(this, (key, member) => {
					invariant(
						ImmutableStore.checkImmutable(member),
						'non-immutable, non-primitive `%s` was added to an ' +
						'ImmutableStore during `init`',
						key
					);
				});
			};
		}

		if (options.public) {
			each(options.public, (key, fn) => {
				parentOptions.public[key] = function publicMethod() {
					let result = fn.apply(this, arguments);

					invariant(
						ImmutableStore.checkImmutable(result),
						'public method `%s` attempted to return a ' +
						'non-immutable, non-primitive value. All accessors ' +
						'must return immutable or primitive values to ' +
						'prevent errors from mutation of objects',
						key
					);

					return result;
				};
			});
		}

		super(parentOptions);
	}

	toString() {
		return `[ImmutableStore ${this.displayName}]`;
	}
}

ImmutableStore.Immutable = Immutable;

export default ImmutableStore;
