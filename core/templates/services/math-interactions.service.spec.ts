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

  it('should validate expressions correctly', function() {
    // Success cases.
    // Algebraic Expressions.
    expect(mathInteractionsService.validateExpression('a/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      'sqrt(alpha)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      'a^2 + 2*a*b + b^2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '(a+b+c)^(-3.5)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '(alpha - beta)^pi')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '((-3.4)^(gamma/(y^2)))/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      'a/b/c/d/e/f/g')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Numeric Expressions.
    expect(mathInteractionsService.validateExpression(
      '1/2', false)).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      'sqrt(49)', false)).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '4^2 + 2*3*4 + 2^2', false)).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '(1+2+3)^(-3.5)', false)).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '((-3.4)^(35/(2^2)))/2', false)).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateExpression(
      '1/2/3/4/5/6/7', false)).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Failure cases.
    expect(mathInteractionsService.validateExpression('')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Please enter a non-empty answer.');

    expect(mathInteractionsService.validateExpression('a/')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '/ is not a valid postfix operator.');

    expect(mathInteractionsService.validateExpression('(x-)3')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '- is not a valid postfix operator.');

    expect(mathInteractionsService.validateExpression(
      '(x^3.5)^/2')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'A prefix operator was expected.');

    expect(mathInteractionsService.validateExpression(
      '12+sqrt(4)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered only numbers. Make sure to include' +
      ' the necessary variables mentioned in the question.');

    expect(mathInteractionsService.validateExpression('x-y=0')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an expression instead.');

    expect(mathInteractionsService.validateExpression('x^2 < 2.5')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an expression instead.');

    expect(mathInteractionsService.validateExpression(
      '5 >= 2*alpha')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an expression instead.');

    expect(mathInteractionsService.validateExpression('(x+y)/0')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Division by zero not allowed.');

    expect(mathInteractionsService.validateExpression(
      '(x+y)/(y-y)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Division by zero not allowed.');

    expect(mathInteractionsService.validateExpression('a)(b')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like your answer has an invalid bracket pairing.');

    expect(mathInteractionsService.validateExpression('a_2 + 3')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Invalid character \'_\' present in the expression.');

    expect(mathInteractionsService.validateExpression(
      '3.4.5 + 45/a')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Invalid integer.');

    expect(mathInteractionsService.validateExpression(
      'a/2', false)).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered some non-numeric values. ' +
      'Please enter numbers only.');

    expect(mathInteractionsService.validateExpression(
      'sqrt(alpha/beta)', false)).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered some non-numeric values. ' +
      'Please enter numbers only.');
  });

  it('should validate equations correctly', function() {
    // Success cases.
    expect(mathInteractionsService.validateEquation(
      'x=y')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'sqrt(alpha) = -1')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'x + y - 12^3 = 0')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      '(a+b+c)^(-3.5) = (-3.5)^(a+b+c)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'y = m*x + c')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'T = t*(1/sqrt(1-(v^2)/(c^2)))')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Failure cases.
    expect(mathInteractionsService.validateEquation('')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Please enter a non-empty answer.');

    expect(mathInteractionsService.validateEquation('a+b = ')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'The RHS of your equation is empty.');

    expect(mathInteractionsService.validateEquation(' =(x-y)/2')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'The LHS of your equation is empty.');

    expect(mathInteractionsService.validateEquation('a/ = (-5)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '/ is not a valid postfix operator.');

    expect(mathInteractionsService.validateEquation('(x-)3 = 2.5')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      '- is not a valid postfix operator.');

    expect(mathInteractionsService.validateEquation(
      '(x^3.5)^/2 = 0')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'A prefix operator was expected.');

    expect(mathInteractionsService.validateEquation(
      '12 = sqrt(144)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'The equation must contain at least one variable.');

    expect(mathInteractionsService.validateEquation('x^2 < 2.5')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an inequality. ' +
      'Please enter an equation instead.');

    expect(mathInteractionsService.validateEquation(
      '5 >= 2*alpha')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an inequality. ' +
      'Please enter an equation instead.');

    expect(mathInteractionsService.validateEquation(
      '2*x^2 + 3')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an expression. ' +
      'Please enter an equation instead.');

    expect(mathInteractionsService.validateEquation('(x+y)/0 = 5')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Division by zero not allowed.');

    expect(mathInteractionsService.validateEquation(
      '3*x^2 = (x+y)/(y-y)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Division by zero not allowed.');

    expect(mathInteractionsService.validateEquation('a)(b = x')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like your answer has an invalid bracket pairing.');

    expect(mathInteractionsService.validateEquation(
      '3.4.5 = 45/a')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Invalid integer.');
  });

  it('should insert missing multiplication signs', function() {
    expect(mathInteractionsService.insertMultiplicationSigns(
      'ab/2')).toBe('a*b/2');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'alpha+ax^2')).toBe('alpha+a*x^2');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'sqrt(xyz)')).toBe('sqrt(x*y*z)');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'ax^2+2*ab+b^2')).toBe('a*x^2+2*a*b+b^2');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'cos(theta/ab)+sin(xy)')).toBe('cos(theta/a*b)+sin(x*y)');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'log(alpha/pi)')).toBe('log(alpha/pi)');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'Al^2')).toBe('A*l^2');
  });

  it('should replace abs symbol with text', function() {
    expect(mathInteractionsService.replaceAbsSymbolWithText(
      '|x|')).toBe('abs(x)');
    expect(mathInteractionsService.replaceAbsSymbolWithText(
      '40alpha/|beta|')).toBe('40alpha/abs(beta)');
    expect(mathInteractionsService.replaceAbsSymbolWithText(
      'abs(xyz)')).toBe('abs(xyz)');
    expect(mathInteractionsService.replaceAbsSymbolWithText(
      '|sqrt(a+b^2)|')).toBe('abs(sqrt(a+b^2))');
    expect(mathInteractionsService.replaceAbsSymbolWithText(
      '||')).toBe('abs()');
  });
});
