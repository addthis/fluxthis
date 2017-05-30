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

var ConstantCollection = require('../../src/ConstantCollection.es6');

describe('Constant Collections', function () {
    it('should create a collection of constants', function () {
        var CC = new ConstantCollection('HI', 'MOM');
        Should.exist(CC.HI);
        Should.exist(CC.MOM);
    });

    it('should create constants with the same name that are not equal to eachother', function () {
        var CC1 = new ConstantCollection('HI');
        var CC2 = new ConstantCollection('HI');

        CC1.should.not.equal(CC2);
    });

    it('should throw errors when duplicate names are passed', function () {
        (function () {
            new ConstantCollection('A','B','A');
        }).should.throw();
    });

    it('should produce frozen objects', function () {
        var CC = new ConstantCollection('HI');
        if(Object.isFrozen) {
            Should(Object.isFrozen(CC)).equal(true);
        }
    });

    it('should provide constants with good toString methods', function () {
        var CC = new ConstantCollection('HI');
        CC.HI.toString().should.equal('HI_#' + CC.id);
    });

    it('should provide constants with unique strings when they share keys', function () {
        var CC1 = new ConstantCollection('HI');
        var CC2 = new ConstantCollection('HI');
        CC1.HI.toString().should.not.equal(CC2.HI.toString());
    });
    
    it('should be safe to JSON.stringify', function () {
        var CC1 = new ConstantCollection('HI');
        (function () {
            JSON.stringify(CC1)
        }).should.not.throw();
    });
});
