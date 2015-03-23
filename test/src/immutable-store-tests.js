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

var Store = require('../../src/ImmutableStore.es6');
var Immutable = Store.Immutable;

describe('ImmutableStore', function () {

	it('should expose the immutable constructor', function () {
		Should.exist(Immutable);
	});

	it('should allow for creation of immutable Maps', function () {
		Should.exist(Immutable.Map());
	});

	it('should allow for creation of immutable Lists', function () {
		Should.exist(Immutable.List());
	});

	it('should allow for creation of immutable Ranges', function () {
		Should.exist(Immutable.Range());
	});

	it('should allow for creation of immutable Iterables', function () {
		Should.exist(Immutable.Iterable());
	});

	it('should throw an error when passed no arguments', function () {
		(function () {
			new Store();
		}).should.throw();
	});

	describe('during init', function () {
		var config = {
			public: {},
			private: {}
		};

		describe('when attempting to set a non-immutable value', function () {
			it('should throw an error', function () {
				config.init = function () {
					this.prop = {};
				};

				(function () {
					new Store(config);
				}).should.throw();
			});
		});

		describe('when attempting to set an immutable value', function () {
			it('should not throw an error', function () {
				config.init = function () {
					this.prop = new Immutable.Map({a: 0});
				};

				(function () {
					new Store(config);
				}).should.not.throw();
			});
		});


		describe('when attempting to set a primitive value', function () {
			it('should not throw an error', function () {
				config.init = function () {
					this.prop = 'hi';
				};

				(function () {
					new Store(config);
				}).should.not.throw();
			});
		});

	});

	describe('after init', function () {
		var privateAttribute = '1234abc';
		var config = {
			init: function () {
				this.thing = privateAttribute;
                this.bindActions();
			},
			private: {
				setThing: function (thing) {
					this.thing = thing;
				}
			},
			public: {
				getThing: function () {
					return this.thing;
				}
			}
		};

		describe('when an accessor returns a non-immutable', function () {
			it('should throw an error', function () {
				config.public.getBadThing = function () {
					return {};
				};
				var s = new Store(config);

				(function () {
					s.getBadThing();
				}).should.throw();
			});
		});

		describe('when an accessor returns an immutable', function () {
			it('should not throw an error', function () {
				config.public.getGoodThing = function () {
					return new Immutable.Map();
				};
				var s = new Store(config);

				(function () {
					s.getGoodThing();
				}).should.not.throw();
			});
		});

    });

});
