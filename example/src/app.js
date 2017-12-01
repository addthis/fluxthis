const React = require('react');
const createReactClass = require('create-react-class');
const CounterActionCreator = require('./action-creator');
const CounterStore = require('./store');

module.exports = createReactClass({
    displayName: 'CounterApp',

    mixins: [CounterStore.mixin],

    getStateFromStores() {
        return {
            count: CounterStore.getCount()
        };
    },

    decreaseCounterBy(value) {
        return function () {
            CounterActionCreator.decreaseCounter(value);
        }
    },

    increaseCounterBy(value) {
        return function () {
            CounterActionCreator.increaseCounter(value);
        }
    },

    render() {
        return React.createElement(
            'div',
            { style: { width: 250, textAlign: 'center', margin: '0 auto' } },
            React.createElement(
                'p',
                null,
                React.createElement('strong', null, 'Current count:'),
                ' ',
                this.state.count
            ),
            React.createElement(
                'div',
                { style: { float: 'left' } },
                React.createElement(
                    'button',
                    { onClick: this.decreaseCounterBy(5) },
                    '-5'
                )
            ),
            React.createElement(
                'div',
                { style: { float: 'left' } },
                React.createElement(
                    'button',
                    { onClick: this.decreaseCounterBy(1) },
                    '-1'
                )
            ),
            React.createElement(
                'div',
                { style: { float: 'right' } },
                React.createElement(
                    'button',
                    { onClick: this.increaseCounterBy(5) },
                    '+5'
                )
            ),
            React.createElement(
                'div',
                { style: { float: 'right' } },
                React.createElement(
                    'button',
                    { onClick: this.increaseCounterBy(1) },
                    '+1'
                )
            ),
            React.createElement(
                'hr',
                { style: { clear: 'both' } }
            ),
            React.createElement(
                'pre',
                { style: { textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word' } },
                JSON.stringify(CounterStore.getState())
            )
        );
    }
});
