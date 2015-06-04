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

const ConstantCollection = require('../ConstantCollection.es6');

export default new ConstantCollection(
	'ROUTER_SOURCE',
	'ROUTER_USE_ACTION',
	'ROUTER_SETUP_ALL_ROUTE_ACTION',
	'ROUTER_SETUP_ROUTE_ACTION',
	'ROUTER_SETUP_ROUTES_ACTION',
	'ROUTER_SET_REACT_ELEMENT',
	'ROUTER_START',
	'ROUTE_CHANGE',
	'ROUTE_REDIRECT',
	'ROUTE_NAVIGATE',
	'SET_DEFAULT_ROUTE'
);
