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

'use strict';

/**
 * Iterates over `collection`, passing each key and value to `callback`. If
 * `callback` returns false, the loop will be broken early.
 */
module.exports = function each(collection, callback, context) {
    var key;
    var keepGoing;

    context = context || this;

    for (key in collection) {
        if (collection.hasOwnProperty(key)) {
            keepGoing = callback.call(context, key, collection[key], collection);
            if (keepGoing === false) {
                break;
            }
        }
    }
};
