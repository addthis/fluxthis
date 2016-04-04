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

const each = require('../lib/each.es6');
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
		// http://stackoverflow.com/questions/31907470/how-to-check-if-object-is-immutable
		return Immutable.Iterable.isIterable(item) || !(item instanceof Object);
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
			private: {},
			dispatchFunction: options.dispatchFunction
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

		if (options.private) {
			each(options.private, (key, fn) => {
				invariant(
					typeof fn === 'function',
					'Only functions can be added to the private config object' +
					'on stores. Please check the type of `%s`',
					key
				);

				parentOptions.private[key] = function privateMethod() {
					let result = fn.apply(this, arguments);

					each(this, (key, member) => {
						invariant(
							ImmutableStore.checkImmutable(member),
							'non-immutable, non-primitive `%s` was added to an ' +
							'ImmutableStore private method `%s`',
							key,
							fn.name
						);
					});

					return result;
				};
			});
		}
		if (options.public) {
			each(options.public, (key, fn) => {

				invariant(
					typeof fn === 'function',
					'Only functions can be added to the public config object' +
					'on stores. Please check the type of `%s`',
					key
				);

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

					each(this, (key, member) => {
						invariant(
							ImmutableStore.checkImmutable(member),
							'non-immutable, non-primitive `%s` was added to an ' +
							'ImmutableStore public method `%s`',
							key,
							fn.name
						);
					});

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
