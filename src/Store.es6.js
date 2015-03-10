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

var dispatcher = require('./dispatcherInstance');
var invariant = require('invariant');
var debug = require('./debug');
var renderedComponentSet = new WeakSet();

class Store {
    constructor () {
        var store = this;
        this.mixin = {
            componentDidMount () {
                invariant(
                    this.getStateFromStores instanceof Function,
                    '`%s` must define `getStateFromStores` in order to use ' +
                    'the FluxThis mixin.',
                    this.displayName
                );

                if (!this.__fluxChangeListener) {
                    this.__fluxChangeListener = () => {
                        this.setState(this.getStateFromStores());
                    };
                }

                store.__addChangeListener(this.__fluxChangeListener);
            },

            componentWillUnmount () {
                invariant(
                    this.__fluxChangeListener instanceof Function,
                    'Expected `%s` to provide the function `__fluxChangeListener`.',
                    this.__fluxChangeListener
                );

                store.__removeChangeListener(this.__fluxChangeListener);
            },

            getInitialState() {
                // This check ensures that we do not use the mixins
                // get initial state twice on the same method.
                // This is the case when a view uses more than 1 FluxThis store.
                if (!this.state && !renderedComponentSet.has(this)) {
                    renderedComponentSet.add(this);

                    if (this.props.initialState) {
                        return this.props.initialState;
                    }

                    return this.getStateFromStores();
                }
            },

            componentWillUpdate (nextProps, nextState) {
                debug.logView(this, nextProps, nextState);
            }
        };
    }

    waitFor (...tokens) {
        return dispatcher.waitFor(tokens);
    }
}

module.exports = Store;
