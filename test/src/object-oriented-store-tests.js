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

var Store = require('../../src/ObjectOrientedStore.es6');

describe('ObjectOrientedStore', function () {

	it('should throw an error when a public function mutates `this`', function () {
		(function () {
			var s = new Store({
				displayName: 'oo1',
				init: function () {
					this.x = 0;
				},
				public: {
					setX: function () {
						this.x = 5;
					}
				},
				private:{}
			});

			s.setX();
		}).should.throw('Invariant Violation: Public function oo1.setX ' +
			'mutated private members. Use a private method instead!');
	});

	it('should throw an error when passed no arguments', function () {
		(function () {
			new Store();
		}).should.throw();
	});

	it('should throw an error when passed no public fns', function () {
		(function () {
			new Store({
				displayName: 'oo1',
				init: function(){},
				private:{}
			});
		}).should.throw();
	});

	it('should throw an error when passed no display name', function () {
		(function () {
			new Store({
				init: function(){},
				public:{},
				private:{}
			});
		}).should.throw();
	});

	it('should create when passed display name, private, public, and init', function () {
		(function () {
			new Store({
				displayName: 'oo2',
				init: function(){},
				public:{},
				private:{}
			});
		}).should.not.throw();
	});

	it('should have a dispatch token without calling bindActions', function () {
		var store = new Store({
			displayName: 'oo3',
			init: function(){},
			public:{},
			private:{}
		});
		Should.exist(store.dispatchToken);
	});

	it('should throw an error when the same action is defined twice', function () {
		(function () {
			new Store({
				displayName: 'oo-twice-action',
				init: function(){
					this.bindActions(
						'TYPE', this.test,
						'TYPE', this.test
					);
				},
				public:{},
				private:{
					test: function() {}
				}
			});
		}).should.throw();
	});

	describe('during init', function () {
		var config;
		beforeEach(function () {
			config = {
				displayName: String(Math.random()),
				public: {},
				private: {}
			};
		});

		it('should have access to private functions', function () {
			config.private.setThingPrivately = function (b) {
				this.thing = b;
			};
			config.init = function () {
				this.setThingPrivately('hello');
			};

			var s = new Store(config);
			Should.exist(s);
		});

		it('should have access to public functions', function () {
			config.public.getThing = function () {
				return this.thing;
			};
			config.init = function () {
				this.thing = 'bye';
				this.thing2 = this.getThing();
			};

			(function () {
				new Store(config);
			}).should.not.throw();
		});

		it('should have access to `bindActions`', function (done) {
			config.init = function () {
				Should.exist(this.bindActions);
				done();
			};

			new Store(config);
		});

		describe('when binding actions', function () {

			beforeEach(function () {
				config.displayName = String(Math.random());
			});

			it('should create a dispatch token', function () {
				config.init = function () {
					this.stuff = false;
					this.bindActions('MY_CONSTANT', this.setStuff);
				};
				config.private = {
					setStuff: function () {
						this.stuff = true;
					}
				};

				var s = new Store(config);
				Should.exist(s.dispatchToken);
			});

			it('should throw errors if passed a null action source/type', function () {
				config.init = function () {
					this.stuff = false;
					this.bindActions(null, this.setStuff);
				};
				config.private = {
					setStuff: function () {
						this.stuff = true;
					}
				};

				(function () {
					new Store(config);
				}).should.throw();
			});

			it('should throw errors if passed an undefined action source/type', function () {
				config.init = function () {
					this.stuff = false;
					this.bindActions(undefined, this.setStuff);
				};
				config.private = {
					setStuff: function () {
						this.stuff = true;
					}
				};

				(function () {
					new Store(config);
				}).should.throw();
			});

			it('should throw errors if passed a non-function handler', function () {
				config.init = function () {
					this.stuff = false;
					this.bindActions('TEST_' + Math.random(), undefined);
				};
				config.private = {
					setStuff: function () {
						this.stuff = true;
					}
				};

				(function () {
					new Store(config);
				}).should.throw();
			});

			it('should throw errors if passed an uneven number of args', function () {
				config.init = function () {
					this.stuff = false;
					this.bindActions('MY_CONSTANT', this.setStuff, 'UNPAIRED_CONSTANT');
				};
				config.private = {
					setStuff: function () {
						this.stuff = true;
					}
				};

				(function () {
					new Store(config);
				}).should.throw();
			});

		});

	});

	describe('after init', function () {
		var privateAttribute = '1234abc';
		var config;
		beforeEach(function () {
			config = {
				displayName: String(Math.random()),
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
		});

		it('should not have access to private methods', function () {
			var s = new Store(config);
			s.should.not.have.property('setThing');
		});

		it('should not have access to private attributes', function () {
			var s = new Store(config);
			s.should.not.have.property('thing');

		});

		it('should have access to public methods', function () {
			var s = new Store(config);
			s.should.have.property('getThing');
		});

		it('should have accessors that work', function () {
			var s = new Store(config);
			s.getThing().should.equal(privateAttribute);
		});
	});

	describe('TestUtils', function () {
		var privateAttribute = '1234abc';
		var config;

		beforeEach(function () {
			config = {
				displayName: String(Math.random()),
				init: function () {
					this.thing = privateAttribute;
					this.bindActions(
						'FOO_BAR', this.setThing
					);
				},
				private: {
					setThing: function (thing) {
						this.waitFor(this.dispatchToken);
						this.thing = thing;
					}
				},
				public: {
					getThing: function () {
						return this.thing;
					}
				}
			};
		});

		it('should exist', function () {
			var s = new Store(config);
			Should.exist(s.TestUtils);
		});

		it('should be able to mock dispatches', function () {
			config.public.getGoodThing = function () {
				return '';
			};
			var s = new Store(config);

			Should.exist(s.TestUtils.mockDispatch);

			s.TestUtils.mockDispatch({
				type: 'FOO_BAR'
			});
		});

		it('should be able to reset a store', function () {
			var s = new Store(config);

			s.TestUtils.mockDispatch({
				type: 'FOO_BAR',
				payload: 5
			});

			s.getThing().should.equal(5);
			s.TestUtils.reset();

			s.getThing().should.equal(privateAttribute);
		});

		it('should be able to mock public method', function () {
			var s = new Store(config);

			s.TestUtils.mockDispatch({
				type: 'FOO_BAR',
				payload: 5
			});

			Should.exist(s.TestUtils.mockPublicMethods);

			s.TestUtils.mockPublicMethods({
				getThing: function () {
					return 'i am mocked';
				}
			});

			s.getThing().should.equal('i am mocked');

			s.TestUtils.reset();
			s.getThing().should.equal(privateAttribute);
		});

		it('should be able to mock public method and reset just mocked public methods', function () {
			var s = new Store(config);

			s.TestUtils.mockPublicMethods({
				getThing: function () {
					return 'i am mocked';
				}
			});

			s.TestUtils.mockDispatch({
				type: 'FOO_BAR',
				payload: 5
			});

			s.getThing().should.equal('i am mocked');

			s.TestUtils.resetMockedPublicMethods();
			s.getThing().should.equal(5);
		});

		it('should throw an error for trying to mock a method that does not exist', function () {
			var s = new Store(config);

			(function() {
				s.TestUtils.mockPublicMethods({
					wtfThisIsntAMethod: function () {}
				});
			}).should.throw();
		});
	});

});
