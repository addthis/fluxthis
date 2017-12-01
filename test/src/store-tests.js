'use strict';

var Store = require('../../src/ImmutableStore.es6');

describe('Store', function () {
	var config = {};

	beforeEach(function () {
		config.displayName = Math.random();
		config.init = function () { this.bindActions(); };
		config.public = {};
		config.private = {};
	});

	it('should have addChangeListener', function () {
		new Store(config).addChangeListener.should.be.a.Function;
	});

	it('should have deprecated addChangeListener', function () {
		new Store(config).__addChangeListener.should.be.a.Function;
	});

	it('should have removeChangeListener', function () {
		new Store(config).removeChangeListener.should.be.a.Function;
	});

	it('should have deprecated removeChangeListener', function () {
		new Store(config).__removeChangeListener.should.be.a.Function;
	});

	it('should have waitFor', function () {
		new Store(config).waitFor.should.be.a.Function;
	});

	it('should have a mixin object', function () {
		var store = new Store(config);
		var mixin = store.mixin;

		mixin.componentDidMount.should.be.a.Function;
		mixin.componentWillUnmount.should.be.a.Function;
		mixin.componentWillUpdate.should.be.a.Function;
		mixin.getInitialState.should.be.a.Function;
	});
});
