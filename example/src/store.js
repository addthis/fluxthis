const Immutable = require('immutable');
const FluxThis = require('../../build/FluxThis');

module.exports = new FluxThis.ImmutableReducerStore({
    displayName: 'CounterStore',

    init() {
        this.defaultState = Immutable.List();

        this.bindActions(
            'INCREASE_COUNTER', this.increaseCounter,
            'DECREASE_COUNTER', this.decreaseCounter
        );
    },

    public: {
        getState() {
            return this.state;
        },

        getCount() {
            return this.state.reduce(function (total, value) {
                return total + value;
            }, 0);
        }
    },

    private: {
        increaseCounter(state, increasedAmount) {
            return state.push(increasedAmount);
        },

        decreaseCounter(state, decreasedAmount) {
            return state.push(-1 * decreasedAmount);
        }
    }
});
