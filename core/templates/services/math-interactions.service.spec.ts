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
 * @fileoverview Unit test for MathInteractionsService
 */

import { TestBed } from '@angular/core/testing';

import { MathInteractionsService } from 'services/math-interactions.service';

describe('MathInteractionsService', () => {
  let mathInteractionsService: MathInteractionsService = null;

  beforeEach(() => {
    mathInteractionsService = TestBed.get(MathInteractionsService);
  });

  it('should validate the answer correctly', function() {
    expect(mathInteractionsService.validateAnswer('a/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer('sqrt(alpha)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer('a/')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '/ is not a valid postfix operator.');

    expect(mathInteractionsService.validateAnswer('12+sqrt(4)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered only numbers. Make sure to include' +
      ' the necessary variables mentioned in the question.');

    expect(mathInteractionsService.validateAnswer('x-y=0')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an algebraic expression instead.');
  });
});
