'use strict';

const ActionCreator = require('../ActionCreator.es6');
const Constants = require('./RouterConstants.es6');

export default new ActionCreator({
	displayName: Constants.ROUTER_SOURCE,

	use: {
		type: Constants.ROUTER_USE_ACTION,
		payload: ActionCreator.PayloadTypes.func.isRequired
	},

	all: {
		type: Constants.ROUTER_SETUP_ALL_ROUTE_ACTION,
		payload: ActionCreator.PayloadTypes.shape({
			path: ActionCreator.PayloadTypes.string.isRequired,
			handler: ActionCreator.PayloadTypes.func.isRequired
		}),
		createPayload(path, handler) {
			return {
				path,
				handler
			};
		}
	},

	route: {
		type: Constants.ROUTER_SETUP_ROUTE_ACTION,
		payload: ActionCreator.PayloadTypes.shape({
			path: ActionCreator.PayloadTypes.string.isRequired,
			handler: ActionCreator.PayloadTypes.func.isRequired,
			options: ActionCreator.PayloadTypes.shape({
				default: ActionCreator.PayloadTypes.bool,
				title: ActionCreator.PayloadTypes.string
			})
		}),
		createPayload(path, name, handler, options={}) {
			return {
				path,
				name,
				handler,
				options
			};
		}
	},

	setReactElement: {
		type: Constants.ROUTER_SET_REACT_ELEMENT,
		payload: ActionCreator.PayloadTypes.shape({
			reactElement: ActionCreator.PayloadTypes.func.isRequired,
			props: ActionCreator.PayloadTypes.object
		}),
		createPayload(reactElement, props={}) {
			return {
				reactElement,
				props
			};
		}
	},

	start: {
		type: Constants.ROUTER_START,
		payload: ActionCreator.PayloadTypes.string.isRequired
	},

	changeRoute: {
		type: Constants.ROUTE_CHANGE
	},

	navigateTo: {
		type: Constants.ROUTE_NAVIGATE,
		payload: ActionCreator.PayloadTypes.string.isRequired
	},

	redirectTo: {
		type: Constants.ROUTE_REDIRECT,
		payload: ActionCreator.PayloadTypes.string.isRequired
	}
});
