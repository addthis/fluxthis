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

describe('ActionCreators', function () {

	it('should thrown an error for duplicate action types', function () {
		(function () {
			new ActionCreator({
				displayName: 'acDisplay1',
				test: {
					type: 'DUPLICATE_TYPE'
				}
			});

			new ActionCreator({
				displayName: 'acDisplay2',
				test: {
					type: 'DUPLICATE_TYPE'
				}
			});
		}).should.throw();
	});

	it('should thrown an error without display name', function () {
		(function () {
			new ActionCreator({
			});
		}).should.throw();
	});

	it('should thrown an error for duplicate display names', function () {
		(function () {
			new ActionCreator({
				displayName: 'duplicate',
			});

			new ActionCreator({
				displayName: 'duplicate',
			});
		}).should.throw();
	});

	it('should expose methods passed to their constructor', function () {
		var ac = new ActionCreator({
			displayName: 'ac2',
			doThing: {
				type: 'TEST_' + Math.random()
			}
		});

		Should.exist(ac.doThing);
	});

	it('should call createPayload', function (done) {
		var ac = new ActionCreator({
			displayName: 'ac3',
			doThing: {
				type: 'TEST_' + Math.random(),
				createPayload: function () {
					done();
				}
			}
		});

		ac.doThing();
	}).timeout(50);

	it('should not expose a dispatch method', function () {
		var ac = new ActionCreator({
			displayName: 'ac4',
			doThing: {
				type: 'TEST_' + Math.random()
			}
		});

		Should.not.exist(ac.dispatch);
	});

	it('should have a nice looking `toString`', function () {
		var ac = new ActionCreator({
			displayName: 'acSource7'
		});

		ac.toString().should.equal('[ActionCreator acSource7]');
	});

	it('should allow creation without an `actionSource`', function () {
		(function () {
			new ActionCreator({
				displayName: 'ac6'
			});
		}).should.not.throw();
	});

	it('should not allow creation without `type`', function () {
		(function () {
			new ActionCreator({
				displayName: 'ac7',
				doThing: {
					payloadType: ActionCreator.PayloadTypes.string
				}
			});
		}).should.throw();
	});

	it('should allow creation without `payloadType`', function () {
		(function () {
			new ActionCreator({
				displayName: 'ac8',
				doThing: {
					type: 'TEST_' + Math.random()
				}
			});
		}).should.not.throw();
	});

	it('should call createPayload in the context of the actioncreator', function (done) {
		var ac = new ActionCreator({
			displayName: 'ac9',
			doThing: {
				type: 'TEST_' + Math.random(),
				createPayload: function () {
					ac.should.equal(this);
					done();
				}
			}
		});

		ac.doThing();
	});

	it('should not throw an error for having constant collections', function () {

		var ACTION_TYPES =  new ConstantCollection(
			'ADD_COLOR',
			'REMOVE_COLOR'
		);

		(function () {
			var ac = new ActionCreator({
				displayName: 'CCtest',
				addColor: {
					type: ACTION_TYPES.ADD_COLOR
				},
				removeColor: {
					type: ACTION_TYPES.REMOVE_COLOR
				}
			});
		}).should.not.throw();

	});

	it('should throw an error for having duplicate constant collections as types', function () {

		var ACTION_TYPES =  new ConstantCollection(
			'ADD_COLOR',
			'REMOVE_COLOR'
		);

		(function () {
			var ac = new ActionCreator({
				displayName: 'CCtest',
				addColor: {
					type: ACTION_TYPES.ADD_COLOR
				},
				removeColor: {
					type: ACTION_TYPES.ADD_COLOR
				}
			});
		}).should.throw();
	});


	it('should warn correctly when payload types don\'t match', function () {
		var ac = new ActionCreator({
			displayName: 'ac10',
			doThing: {
				type: 'TEST_' + Math.random(),
				payloadType: ActionCreator.PayloadTypes.string
			}
		});


		(function () {
			ac.doThing(5);
		}).should.throw('[ActionCreator ac10] doThing was provided an ' +
		'invalid payload. Expected `string`, got `number`.');
	});

	it('should warn correctly when complex payload types don\'t match', function () {
		var ac = new ActionCreator({
			displayName: 'ac11',
			doThing: {
				type: 'TEST_' + Math.random(),
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
		}).should.throw('[ActionCreator ac11] doThing was provided an ' +
		'invalid payload. Expected `number`, got `string`.');
	});

});
