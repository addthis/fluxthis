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

const getHashString = require('../../src/router/utils/getHashString.es6');
const getQueryString = require('../../src/router/utils/getQueryString.es6');

describe('url parsing', function () {
	it('should extract query string', function () {
		getQueryString('https://xyz.com/#/test/?a=1')
			.should.eql('a=1');
		getQueryString('https://xyz.com/test/?a=1')
			.should.eql('a=1');
	});

	it('should not extract query string within hash', function () {
		getQueryString('https://xyz.com/test/?b=2#/hash?a=1')
			.should.equal('b=2');
		getQueryString('https://xyz.com/test/#/hash?a=1')
			.should.eql('');
	});

	it('should extract empty hash as empty string', function () {
		getHashString('xyz.com/test/#')
			.should.eql('');
		getHashString('xyz.com/test/#/')
			.should.eql('/');
	});
});
