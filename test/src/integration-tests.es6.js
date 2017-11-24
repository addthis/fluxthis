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
var ConstantCollection = require('../../src/ConstantCollection.es6');
var Dispatcher = require('../../src/Dispatcher.es6');
var Store = require('../../src/ImmutableStore.es6');
var storeListener = require('../../src/StoreListener.es6.js');

describe('Integration', function () {
	var ADD_THING;
	var ADD_THING_2;
	var ADD_THING_3;
	var SOURCE;
	var ac;
	var ac2;
	var viewConfig;
	var store;
	var store2;
	var React;
	var ReactDOM;
	var createReactClass;

	beforeEach(function () {
		React = require('react');
		ReactDOM = require('react-dom');
		createReactClass = require('create-react-class');
	});

	beforeEach(function () {
		ADD_THING = 'ADD_THING_' + Math.random();
		ADD_THING_2 = 'ADD_THING_2_' + Math.random();
		ADD_THING_3 = 'ADD_THING_3_' + Math.random();
		SOURCE = 'ACTION_SOURCE_' + Math.random();

		ac = new ActionCreator({
			displayName: 'apiDisplay_' + String(Math.random()),
			addThing: {
				type: ADD_THING,
				payload: ActionCreator.PayloadTypes.string.isRequired
			},
			addThing2: {
				type: ADD_THING_2,
				payload: ActionCreator.PayloadTypes.string.isRequired
			},
			addThingWithActionType: {
				type: ADD_THING_3
			}
		});

		ac2 = new ActionCreator({
			displayName: 'ac2_' + Math.random(),
			actionSource: SOURCE,
			respondToSource: {
				type: '__' + Math.random()
			}
		});

		store = new Store({
			displayName: String(Math.random()),
			init: function () {
				this.things = Store.Immutable.List([1,2,3,4]);
				this.respondedToSource = false;
				this.bindActions(
					ADD_THING, this.addThing,
					ADD_THING_3, this.addThing,
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

	describe('An action with `actionType`', function () {
		it('should still work', function () {
			var rand = Math.random();
			ac.addThingWithActionType(rand);
			store.hasThing(rand).should.be.true;
		});
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

			var viewClass = createReactClass(viewConfig);
			var test = React.createElement(viewClass);

			ReactDOM.render(test, document.createElement('div'));

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
				var viewClass = createReactClass(viewConfig);
				var test = React.createElement(viewClass);
				var element = document.createElement('div');
				ReactDOM.render(test, element);
				ReactDOM.unmountComponentAtNode(element);
			}).should.not.throw();
		});

		it('should update when either store updates', function (done) {
			var called = 0;
			viewConfig.componentWillUpdate = function () {
				if(++called === 2) {
					done();
				}
			};

			var viewClass = createReactClass(viewConfig);
			var test = React.createElement(viewClass);

			ReactDOM.render(test, document.createElement('div'));
			ac.addThing('hallo');
			setTimeout(function () {
				ac.addThing2('hallo2');
			});
		});
	});

	describe('a store with decorator should work', function () {
		it('should call life cycle methods', function (done) {
			var ac = new ActionCreator({
				displayName: 'DecoratorAC',
				update: {
					type: 'DECORATOR_UPDATE'
				}
			});

			var s = new Store({
				displayName: 'decoratorStore',
				init() {
					this.test = 'pass';
					this.bindActions('DECORATOR_UPDATE', this.update);
				},
				public: {
					get() {
						return this.test;
					}
				},
				private: {
					update() {
						this.test = 'updated';
					}
				}
			});

			var s2 = new Store({
				displayName: 'decoratorStore2',
				init() {
					this.test = 'pass2';
					this.bindActions('DECORATOR_UPDATE', this.update);
				},
				public: {
					get() {
						return this.test;
					}
				},
				private: {
					update() {
						this.test = 'updated2';
					}
				}
			});

			var counter = 0;

			@storeListener(s, s2)
			class TestComponent extends React.Component {
				constructor(props) {
					super(props);
					this.state = {
						initial: 'true'
					};
				}

				getStateFromStores() {
					return {
						test: s.get(),
						test2: s2.get()
					};
				}

				componentDidMount() {
					if (this.state.test !== 'pass') {
						throw 'test was not set as pass for initial mount';
					}

					if (this.state.test2 !== 'pass2') {
						throw 'test2 was not set as updated2 for update';
					}

					if (this.state.initial !== 'true') {
						throw 'initial state wasnt set correctly';
					}

					++counter;
				}

				componentWillUpdate() {
					++counter;
				}

				componentDidUpdate() {
					if (counter === 2 && this.state.test !== 'updated') {
						throw 'test was not set as updated for update';
					}

					if (counter === 4 && this.state.test2 !== 'updated2') {
						throw 'test2 was not set as updated2 for update';
					}

					if (this.state.initial !== 'true') {
						throw 'initial state wasnt still set after update';
					}

					++counter;
				}

				componentWillUnmount() {
					if (counter === 5) {
						return done();
					}

					throw 'lifecycle methods were not called';
				}

				render() {
					return <div>yay decorators</div>;
				}
			}

			TestComponent.displayName = 'DecoratorComponent';

			const div = document.createElement('div');
			ReactDOM.render(React.createElement(TestComponent), div);
			ac.update();
			ReactDOM.unmountComponentAtNode(div);
		});

		it('should call life cycle methods with non-decorator support', function (done) {
			var ac = new ActionCreator({
				displayName: 'DecoratorAC10',
				update: {
					type: 'DECORATOR_UPDATE1'
				}
			});

			var s = new Store({
				displayName: 'decoratorStore10',
				init() {
					this.test = 'pass';
					this.bindActions('DECORATOR_UPDATE1', this.update);
				},
				public: {
					get() {
						return this.test;
					}
				},
				private: {
					update() {
						this.test = 'updated';
					}
				}
			});

			var s2 = new Store({
				displayName: 'decoratorStore11',
				init() {
					this.test = 'pass2';
					this.bindActions('DECORATOR_UPDATE1', this.update);
				},
				public: {
					get() {
						return this.test;
					}
				},
				private: {
					update() {
						this.test = 'updated2';
					}
				}
			});

			var counter = 0;

			class TestComponent extends React.Component {
				constructor(props) {
					super(props);
					this.state = {
						initial: 'true'
					};
				}

				getStateFromStores() {
					return {
						test: s.get(),
						test2: s2.get()
					};
				}

				componentDidMount() {
					if (this.state.test !== 'pass') {
						throw 'test was not set as pass for initial mount';
					}

					if (this.state.test2 !== 'pass2') {
						throw 'test2 was not set as updated2 for update';
					}

					if (this.state.initial !== 'true') {
						throw 'initial state wasnt set correctly';
					}

					++counter;
				}

				componentWillUpdate() {
					++counter;
				}

				componentDidUpdate() {
					if (counter === 2 && this.state.test !== 'updated') {
						throw 'test was not set as updated for update';
					}

					if (counter === 4 && this.state.test2 !== 'updated2') {
						throw 'test2 was not set as updated2 for update';
					}

					if (this.state.initial !== 'true') {
						throw 'initial state wasnt still set after update';
					}

					++counter;
				}

				componentWillUnmount() {
					if (counter === 5) {
						return done();
					}

					throw 'lifecycle methods were not called';
				}

				render() {
					return <div>yay decorators</div>;
				}
			}

			TestComponent.displayName = 'DecoratorComponent';

			const component = storeListener(s, s2)(TestComponent);
			const div = document.createElement('div');
			ReactDOM.render(React.createElement(component), div);
			ac.update();
			ReactDOM.unmountComponentAtNode(div);
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
