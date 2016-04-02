import React from 'react';
import ReactDOM from 'react-dom';

const {Store, Action, handle, view, mutable} = window.fluxthis;

// Declare a new action
class MyAction extends Action {
	// `transform` should be overridden, if you want to create actions in another tick, or transform args
	// into a different-looking payload
	transform(a, b) {
		$.get('asdasd').then(response => {
			this.dispatch(OtherAction, response)
		})
		return {a, b};
	}
}

// Declare an action - short form
// `transform` just returns the first arg passed
class MyOtherAction extends Action {}

// To declare a store, extend `Store`
class MyChildStore extends Store {
	constructor() {
		super();

		// No need to write accessors, unless you want to do something complex, or return mutable
		// data
		this.bye = 'bye'
		this.lol = 'lol'
	}

	@handle(MyAction)
	updateThing(messages) {
		this.bye = messages.a + ' ' + messages.b;
	}

	@handle(MyOtherAction)
	updateOtherThing(blah) {
		this.lol = blah;
	}
}

class MyStore extends Store {
	constructor() {
		const child = new MyChildStore();
		
		// child stores get registered through their parents like so
		super(child);

		this.hi = 'hi';
		this.child = child;
	}

	// no need for 'waitFor', child stores always resolve actions before their parents do
	@handle(MyAction)
	updateGreeting(messages) {
		this.hi = messages.a + this.child.bye + this.child.lol;
	}

}

const myStore = new MyStore();

// decorating a view sets up `getStateFromStores`, and `this.dispatch`
@view(myStore)
class MyComponent extends React.Component {
	constructor() {
		super();
		this.state = {str: 'whoa'};
	}

	getStateFromStores() {
		return {
			// don't need to write accessors for immutable data
			str: myStore.hi
		};
	}
	handleClick() {
		this.dispatch(MyAction, 'sup', 'dude');
	}

	handleButtonClick() {
		this.dispatch(MyOtherAction, 'haha');
	}

	render() {
		return (
			<div onClick={this.handleClick.bind(this)}>
				{this.state.str}
				<div onClick={this.handleButtonClick.bind(this)}>
					CLICK ME TO UPDATE CHILD STORE
				</div>
			</div>
		);
	}
}


ReactDOM.render(React.createElement(MyComponent), document.getElementById('lol'));
