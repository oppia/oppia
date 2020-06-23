// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for math equation input interaction rules.
 */

import { MathEquationInputRulesService } from
// eslint-disable-next-line max-len
  'interactions/MathEquationInput/directives/math-equation-input-rules.service';

describe('Math equation input rules service', () => {
  let aeirs: MathEquationInputRulesService = null;
  let inputString, positionOfTerms;

  beforeEach(() => {
    aeirs = new MathEquationInputRulesService();
  });

  it('should have a correct MatchesExactlyWith rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';
    positionOfTerms = 'both';

    expect(aeirs.MatchesExactlyWith('((x)^(2)-x)/(z)-4*y',
      {x: inputString, y: positionOfTerms})).toBeTrue();
  });

  it('should have a correct IsEquivalentTo rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';

    expect(aeirs.IsEquivalentTo('((x)^(2)-x)/(z)-4*y',
      {x: inputString})).toBeTrue();
  });
});
