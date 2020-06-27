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
    // Success cases.
    expect(mathInteractionsService.validateAnswer('a/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer('sqrt(alpha)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer('a/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer(
      'a^2 + 2*a*b + b^2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer('(a+b+c)^(-3.5)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer(
      '(alpha - beta)^pi')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer(
      '((-3.4)^(gamma/(y^2)))/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAnswer('a/b/c/d/e/f/g')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Failure cases.
    expect(mathInteractionsService.validateAnswer('a/')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '/ is not a valid postfix operator.');

    expect(mathInteractionsService.validateAnswer('(x-)3')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '- is not a valid postfix operator.');

    expect(mathInteractionsService.validateAnswer('(x^3.5)^/2')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'A prefix operator was expected.');

    expect(mathInteractionsService.validateAnswer('12+sqrt(4)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered only numbers. Make sure to include' +
      ' the necessary variables mentioned in the question.');

    expect(mathInteractionsService.validateAnswer('x-y=0')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an algebraic expression instead.');

    expect(mathInteractionsService.validateAnswer('x^2 < 2.5')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an algebraic expression instead.');

    expect(mathInteractionsService.validateAnswer('5 >= 2*alpha')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an algebraic expression instead.');

    expect(mathInteractionsService.validateAnswer('(x+y)/0')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Division by zero not allowed.');

    expect(mathInteractionsService.validateAnswer('(x+y)/(y-y)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Division by zero not allowed.');

    expect(mathInteractionsService.validateAnswer('a)(b')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like your answer has an invalid bracket pairing.');

    expect(mathInteractionsService.validateAnswer('3.4.5 + 45/a')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Invalid integer.');
  });
});
