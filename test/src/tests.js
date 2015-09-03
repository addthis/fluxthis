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

// THIS MUST BE FIRST. It loads the babel/polyfill
require('babel/polyfill');
require('./require-test');

window.FluxThis = {
    dispatcher: require('../../src/dispatcherInstance.es6'),
    Immutable: require('immutable')
};

require('./dispatcher-tests');
require('./action-creator-tests');
require('./api-action-creator-tests');
require('./immutable-store-tests');
require('./object-oriented-store-tests');
require('./integration-tests');
require('./constant-collection-tests');
require('./store-tests');
require('./router-store-spec.es6.js');
require('./route-spec.es6.js');
