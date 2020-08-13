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
 * @fileoverview Unit tests for ratio expression input interaction rules.
 */

import { RatioExpressionInputRulesService } from
// eslint-disable-next-line max-len
  'interactions/RatioExpressionInput/directives/ratio-expression-input-rules.service';

describe('Ratio expression input rules service', () => {
  let reirs: RatioExpressionInputRulesService = null;
  let inputString;

  beforeEach(() => {
    reirs = new RatioExpressionInputRulesService();
  });

  it('should have a correct Equals rule', () => {
    inputString = '1:2:3';

    expect(reirs.Equals('1:2:3',
      {x: inputString})).toBeTrue();
    expect(reirs.Equals('3:2:1',
      {x: inputString})).toBeFalse();
    expect(reirs.Equals('1:2',
      {x: inputString})).toBeFalse();
    expect(reirs.Equals('1:2:3:4',
      {x: inputString})).toBeFalse();
  });

  it('should have a correct HasNumberOfTermsEqualTo rule', () => {
    inputString = '1:2:3';

    expect(reirs.HasNumberOfTermsEqualTo('1:2:3',
      {x: inputString})).toBeTrue();
    expect(reirs.HasNumberOfTermsEqualTo('3:2:1',
      {x: inputString})).toBeTrue();
    expect(reirs.HasNumberOfTermsEqualTo('1:2',
      {x: inputString})).toBeFalse();
    expect(reirs.HasNumberOfTermsEqualTo('1:2:3:4',
      {x: inputString})).toBeFalse();
  });


  it('should have a correct IsEquivalent rule', () => {
    inputString = '1:2:3';

    expect(reirs.IsEquivalent('1:2:3',
      {x: inputString})).toBeTrue();
    expect(reirs.IsEquivalent('2:4:6',
      {x: inputString})).toBeTrue();
    expect(reirs.IsEquivalent('1:2',
      {x: inputString})).toBeFalse();
    expect(reirs.IsEquivalent('1:2:3:4',
      {x: inputString})).toBeFalse();
    expect(reirs.IsEquivalent('2:4:3',
      {x: inputString})).toBeFalse();
  });
});
