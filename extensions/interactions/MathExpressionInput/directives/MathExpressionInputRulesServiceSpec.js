// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for math expression rules.
 */

describe('Math expression input rules service', function() {
  beforeEach(module('oppia'));

  var meirs = null;
  beforeEach(inject(function($injector) {
    meirs = $injector.get('MathExpressionInputRulesService');
  }));

  it('should have a correct equivalence rule', function() {
    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'x',
      latex: 'x'
    }, {
      x: 'x'
    })).toBe(true);

    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'x + x - x',
      latex: 'x + x - x'
    }, {
      x: 'x'
    })).toBe(true);

    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'x',
      latex: 'x'
    }, {
      x: 'x + x - x'
    })).toBe(true);

    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'x^2/x',
      latex: 'x^{2}/x'
    }, {
      x: 'x'
    })).toBe(true);

    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'y',
      latex: 'y'
    }, {
      x: 'x'
    })).toBe(false);

    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'x^2',
      latex: 'x^{2}'
    }, {
      x: 'x'
    })).toBe(false);

    expect(meirs.IsMathematicallyEquivalentTo({
      ascii: 'x + 0.1',
      latex: 'x + 0.1'
    }, {
      x: 'x'
    })).toBe(false);
  });
});
