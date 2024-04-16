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

import {
  RatioExpressionInputRulesService,
  // eslint-disable-next-line max-len
} from 'interactions/RatioExpressionInput/directives/ratio-expression-input-rules.service';
import {TestBed} from '@angular/core/testing';

describe('Ratio expression input rules service', () => {
  let reirs: RatioExpressionInputRulesService;
  let inputList: number[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RatioExpressionInputRulesService],
    });
    reirs = TestBed.get(RatioExpressionInputRulesService);
  });

  it('should have a correct Equals rule', () => {
    inputList = [1, 2, 3];

    expect(reirs.Equals([1, 2, 3], {x: inputList})).toBeTrue();
    expect(reirs.Equals([3, 2, 1], {x: inputList})).toBeFalse();
    expect(reirs.Equals([1, 2], {x: inputList})).toBeFalse();
    expect(reirs.Equals([1, 2, 3, 4], {x: inputList})).toBeFalse();
    expect(reirs.Equals([2, 4, 6], {x: inputList})).toBeFalse();
  });

  it('should have a correct HasNumberOfTermsEqualTo rule', () => {
    let inputNumber = 3;

    expect(
      reirs.HasNumberOfTermsEqualTo([1, 2, 3], {y: inputNumber})
    ).toBeTrue();
    expect(
      reirs.HasNumberOfTermsEqualTo([3, 2, 1], {y: inputNumber})
    ).toBeTrue();
    expect(reirs.HasNumberOfTermsEqualTo([1, 2], {y: inputNumber})).toBeFalse();
    expect(
      reirs.HasNumberOfTermsEqualTo([1, 2, 3, 4], {y: inputNumber})
    ).toBeFalse();
  });

  it('should have a correct HasSpecificTermEqualTo rule', () => {
    let answer = [2, 4, 6];

    expect(reirs.HasSpecificTermEqualTo(answer, {x: 1, y: 2})).toBeTrue();
    expect(reirs.HasSpecificTermEqualTo(answer, {x: 1, y: 4})).toBeFalse();
    expect(reirs.HasSpecificTermEqualTo(answer, {x: 1, y: 6})).toBeFalse();
    expect(reirs.HasSpecificTermEqualTo(answer, {x: 2, y: 4})).toBeTrue();
    expect(reirs.HasSpecificTermEqualTo(answer, {x: 3, y: 6})).toBeTrue();
    expect(reirs.HasSpecificTermEqualTo(answer, {x: 4, y: 6})).toBeFalse();
  });

  it('should have a correct IsEquivalent rule', () => {
    inputList = [2, 4, 6];

    expect(reirs.IsEquivalent([1, 2, 3], {x: inputList})).toBeTrue();
    expect(reirs.IsEquivalent([1, 2], {x: inputList})).toBeFalse();
    expect(reirs.IsEquivalent([1, 2, 3, 4], {x: inputList})).toBeFalse();
    expect(reirs.IsEquivalent([2, 4, 3], {x: inputList})).toBeFalse();
    expect(reirs.IsEquivalent([3, 6, 9], {x: inputList})).toBeTrue();
    expect(reirs.IsEquivalent([4, 8, 12], {x: inputList})).toBeTrue();

    inputList = [2, 3, 5];

    expect(reirs.IsEquivalent([2, 3, 5], {x: inputList})).toBeTrue();
    expect(reirs.IsEquivalent([2, 4, 6], {x: inputList})).toBeFalse();
    expect(reirs.IsEquivalent([1, 2], {x: inputList})).toBeFalse();
    expect(reirs.IsEquivalent([1, 2, 3, 4], {x: inputList})).toBeFalse();
    expect(reirs.IsEquivalent([2, 4, 3], {x: inputList})).toBeFalse();
  });
});
