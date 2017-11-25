const FluxThis = require('../../build/FluxThis');
const ActionCreator = FluxThis.ActionCreator;

module.exports = new ActionCreator({
    displayName: 'Counter',
    increaseCounter: {
        type: 'INCREASE_COUNTER',
        payload: ActionCreator.PayloadTypes.number.isRequired
    },
    decreaseCounter: {
        type: 'DECREASE_COUNTER',
        payload: ActionCreator.PayloadTypes.number.isRequired
    }
});
