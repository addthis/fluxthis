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

var ActionCreator = require('../../src/ActionCreator.es6');
var ConstantCollection = require('../../src/ConstantCollection.es6')
var Dispatcher = require('../../src/Dispatcher.es6');
var Store = require('../../src/ImmutableStore.es6');

describe('Integration', function () {
	var ADD_THING;
	var ADD_THING_2;
	var ac;
	var viewConfig;
	var store;
	var store2;
	var React;

	beforeEach(function () {
		React = require('react');
	});

	beforeEach(function () {
		ADD_THING = 'ADD_THING_' + Math.random();
		ADD_THING_2 = 'ADD_THING_2_' + Math.random();
		SOURCE = 'ACTION_SOURCE_' + Math.random();

		ac = new ActionCreator({
			displayName: 'apiDisplay_' + String(Math.random()),
			addThing: {
				actionType: ADD_THING,
				payloadType: ActionCreator.PayloadTypes.string.isRequired
			},
			addThing2: {
				actionType: ADD_THING_2,
				payloadType: ActionCreator.PayloadTypes.string.isRequired
			}
		});

		ac2 = new ActionCreator({
			displayName: 'ac2_' + Math.random(),
			actionSource: SOURCE,
			respondToSource: {
				actionType: '__' + Math.random()
			}
		})

		store = new Store({
			displayName: String(Math.random()),
			init: function () {
				this.things = Store.Immutable.List([1,2,3,4]);
				this.respondedToSource = false;
				this.bindActions(
					ADD_THING, this.addThing,
					SOURCE, this.respondToSource
				);
			},
			private: {
				addThing: function (thing) {
					this.things = this.things.push(thing);
				},
				respondToSource: function () {
					this.respondedToSource = true;
				}
			},
			public: {
				hasThing: function (thing) {
					return this.things.contains(thing);
				},
				getThings: function () {
					return this.things;
				},
				didRespondToSource: function () {
					return this.respondedToSource;
				}
			}
		});

		store2 = new Store({
			displayName: String(Math.random()),
			init: function () {
				this.things = Store.Immutable.List([1,2,3,4]);
				this.bindActions(
					ADD_THING_2, this.addThing
				);
			},
			private: {
				addThing: function (thing) {
					this.things = this.things.push(thing);
				}
			},
			public: {
				hasThing: function (thing) {
					return this.things.contains(thing);
				},
				getThings: function () {
					return this.things;
				}
			}
		});

		viewConfig = {
			mixins: [store.mixin],
			displayName: 'VIEW_' +  Math.random(),
			getStateFromStores: function () {
				return {
					things: store.getThings()
				};
			},
			render: function () {
				var things = this.state.things.map(function (thing, i) {
					return React.createElement('div', {key: '_' + i}, thing + '...');
				}).toJS();

				return React.createElement('div', {}, things);
			}
		};
	});

	describe('A created action', function () {
		it('should update relevant stores', function () {
			ac.addThing('hallo');
			store.hasThing('hallo').should.be.true;
		});
	});

	describe('Stores with actionSource handlers', function () {
		it('should work', function () {
			store.didRespondToSource().should.be.false;
			ac2.respondToSource();
			store.didRespondToSource().should.be.true;
		});
	});

	describe('A view which depends on a store', function () {
		it('should update when the store updates', function (done) {
			viewConfig.componentWillUpdate = function () {
				done();
			};

			var viewClass = React.createClass(viewConfig);
			var test = React.createElement(viewClass);

			React.render(test, document.createElement('div'));

			ac.addThing('hallo');
		});
	});

	describe('A view which depends on multiple stores', function () {
		beforeEach(function () {
			viewConfig.displayName = 'VIEW_' +  Math.random();
			viewConfig.mixins = [store.mixin, store2.mixin];
		});

		it('should not throw errors', function () {
			(function () {
				var viewClass = React.createClass(viewConfig);
				var test = React.createElement(viewClass);
				var element = document.createElement('div');
				React.render(test, element);
				React.unmountComponentAtNode(element);
			}).should.not.throw();
		});

		it('should update when either store updates', function (done) {
			var called = 0;
			viewConfig.componentWillUpdate = function () {
				if(++called === 2) {
					done();
				}
			};

			var viewClass = React.createClass(viewConfig);
			var test = React.createElement(viewClass);

			React.render(test, document.createElement('div'));
			ac.addThing('hallo');
			setTimeout(function () {
				ac.addThing2('hallo2');
			});
		});
	});

	describe('a store which waits for other stores', function () {
		it('should wait for other stores', function () {
			var str = '';
			var s = new Store({
				displayName: 'store1',
				init: function () {
					this.bindActions(ADD_THING, this.a);
				},
				public: {},
				private: {
					a: function () {
						str += 'a';
					}
				}
			});
			var s2 = new Store({
				displayName: 'store2',
				init: function () {
					this.bindActions(ADD_THING, this.b);
				},
				public: {},
				private: {
					b: function () {
						this.waitFor(s.dispatchToken);
						str += 'b';
					}
				}
			});

			new Store({
				displayName: 'store3',
				init: function () {
					this.bindActions(ADD_THING, this.c);
				},
				public: {},
				private: {
					c: function () {
						this.waitFor(s.dispatchToken, s2.dispatchToken);
						str += 'c';
					}
				}
			});
			ac.addThing('hi');
			str.should.equal('abc');
		});
	});

	describe('A dispatcher', function () {
		describe('when dispatching an event with ConstantCollection types', function () {
			it('should not throw', function () {
				var CC = new ConstantCollection('HI');
				var dispatcher = new Dispatcher();

				(function () {
					dispatcher.dispatch({
						type: CC.HI,
						payload: 'derp'
					});
				}).should.not.throw();
			});
		});
	});
});
