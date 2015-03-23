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

describe('ActionCreators', function () {

	it('should expose methods passed to their constructor', function () {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			doThing: {
				actionType: 'TEST_' + Math.random()
			}
		});

		Should.exist(ac.doThing);
	});

	it('should call createPayload', function (done) {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			doThing: {
				actionType: 'TEST_' + Math.random(),
				createPayload: function () {
					done();
				}
			}
		});

		ac.doThing();
	}).timeout(50);

	it('should not expose a dispatch method', function () {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			doThing: {
				actionType: 'TEST_' + Math.random()
			}
		});

		Should.not.exist(ac.dispatch);
	});

	it('should have a nice looking `toString`', function () {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			displayName: 'Cool'
		});

		ac.toString().should.equal('[ActionCreator Cool]');
	});

	it('should not allow creation without an `actionSource`', function () {
		(function () {
			new ActionCreator({
				displayName: 'Cool'
			});
		}).should.throw();
	});

	it('should not allow creation without `actionType`', function () {
		(function () {
			new ActionCreator({
				actionSource: 'TEST',
				displayName: 'Cool',
				doThing: {
					payloadType: ActionCreator.PayloadTypes.string
				}
			});
		}).should.throw();
	});

	it('should allow creation without `payloadType`', function () {
		(function () {
			new ActionCreator({
				actionSource: 'TEST',
				displayName: 'Cool',
				doThing: {
					actionType: 'TEST_' + Math.random()
				}
			});
		}).should.not.throw();
	});

	it('should call createPayload in the context of the actioncreator', function (done) {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			displayName: 'Cool',
			doThing: {
				actionType: 'TEST_' + Math.random(),
				createPayload: function () {
					ac.should.equal(this);
					done();
				}
			}
		});

		ac.doThing();
	});

	it('should warn correctly when payload types don\'t match', function () {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			displayName: 'Cool',
			doThing: {
				actionType: 'TEST_' + Math.random(),
				payloadType: ActionCreator.PayloadTypes.string
			}
		});


		(function () {
			ac.doThing(5);
		}).should.throw('[ActionCreator Cool] doThing was provided an ' +
		'invalid payload. Expected `string`, got `number`.');
	});

	it('should warn correctly when complex payload types don\'t match', function () {
		var ac = new ActionCreator({
			actionSource: 'TEST',
			displayName: 'Cool',
			doThing: {
				actionType: 'TEST_' + Math.random(),
				payloadType: ActionCreator.PayloadTypes.shape({
					a: ActionCreator.PayloadTypes.string,
					b: ActionCreator.PayloadTypes.number
				})
			}
		});


		(function () {
			ac.doThing({
				a: 'sup',
				b: 'boo'
			});
		}).should.throw('[ActionCreator Cool] doThing was provided an ' +
		'invalid payload. Expected `number`, got `string`.');
	});

});
