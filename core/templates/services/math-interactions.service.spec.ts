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
    expect(mathInteractionsService.validateAlgebraicExpression(
      'a/2', ['a'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'sqrt(alpha)', ['alpha'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'a^2 + 2*a*b + b^2', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '(a+b+c)^(-3.5)', ['a', 'b', 'c'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '(alpha - beta)^pi', ['alpha', 'beta', 'pi'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '((-3.4)^(gamma/(y^2)))/2', ['y', 'gamma'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'a/b/c/d/e/f/g', ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Numeric Expressions.
    expect(mathInteractionsService.validateNumericExpression(
      '1/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateNumericExpression(
      'sqrt(49)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateNumericExpression(
      '4^2 + 2*3*4 + 2^2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateNumericExpression(
      '(1+2+3)^(-3.5)')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateNumericExpression(
      '((-3.4)^(35/(2^2)))/2')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateNumericExpression(
      '1/2/3/4/5/6/7')).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Failure cases.
    expect(mathInteractionsService.validateAlgebraicExpression(
      '', [])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Please enter an answer before submitting.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'a/', ['a'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer seems to be missing a variable/number after the "/".');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '(x-)3', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer seems to be missing a variable/number after the "-".');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'xy+c/2', ['x', 'y', 'z'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'You have entered an invalid character: c. Please use only the ' +
      'characters x,y,z in your answer.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'aalpha/2beta', ['alpha', 'beta', 'gamma'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'You have entered an invalid character: a. Please use only the ' +
      'characters alpha,beta,gamma in your answer.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '(x^3.5)^/2', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer has two symbols next to each other: "^" and "/".');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '12+sqrt(4)', [])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered only numbers. Make sure to include' +
      ' the necessary variables mentioned in the question.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'x-y=0', ['x', 'y'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an expression instead.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'x^2 < 2.5', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an expression instead.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '5 >= 2*alpha', ['alpha'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an expression instead.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '(x+y)/0', ['x', 'y'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer includes a division by zero, which is not valid.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '(x+y)/(y-y)', ['x', 'y'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer includes a division by zero, which is not valid.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'a)(b', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like your answer has an invalid bracket pairing.');

    expect(mathInteractionsService.validateAlgebraicExpression(
      'a_2 + 3', ['a'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer contains an invalid character: "_".');

    expect(mathInteractionsService.validateAlgebraicExpression(
      '3.4.5 + 45/a', ['a'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer contains an invalid term: 3.4.5');

    expect(mathInteractionsService.validateNumericExpression(
      'a/2')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered some variables. ' +
      'Please enter numbers only.');

    expect(mathInteractionsService.validateNumericExpression(
      'sqrt(alpha/beta)')).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered some variables. ' +
      'Please enter numbers only.');
  });

  it('should validate equations correctly', function() {
    // Success cases.
    expect(mathInteractionsService.validateEquation(
      'x=y', ['x', 'y'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'sqrt(alpha) = -1', ['alpha'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'x + y - 12^3 = 0', ['x', 'y'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      '(a+b+c)^(-3.5) = (-3.5)^(a+b+c)', ['a', 'b', 'c'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'y = m*x + c', ['y', 'm', 'x', 'c'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    expect(mathInteractionsService.validateEquation(
      'T = t*(1/sqrt(1-(v^2)/(c^2)))', ['T', 't', 'v', 'c'])).toBeTrue();
    expect(mathInteractionsService.getWarningText()).toBe('');

    // Failure cases.
    expect(mathInteractionsService.validateEquation('', [])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Please enter an answer before submitting.');

    expect(mathInteractionsService.validateEquation(
      'a+b = ', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'The RHS of your equation is empty.');

    expect(mathInteractionsService.validateEquation(
      ' =(x-y)/2', ['x', 'y'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'The LHS of your equation is empty.');

    expect(mathInteractionsService.validateEquation(
      'a=b=c', ['a', 'b', 'c'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your equation contains multiple = signs.');

    expect(mathInteractionsService.validateEquation(
      'a==b', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your equation contains multiple = signs.');

    expect(mathInteractionsService.validateEquation(
      'a+b=0=0', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your equation contains multiple = signs.');

    expect(mathInteractionsService.validateEquation(
      'a/ = (-5)', ['a'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer seems to be missing a variable/number after the "/".');

    expect(mathInteractionsService.validateEquation(
      '(x-)3 = 2.5', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer seems to be missing a variable/number after the "-".');

    expect(mathInteractionsService.validateEquation(
      '(x^3.5)^/2 = 0', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer has two symbols next to each other: "^" and "/".');

    expect(mathInteractionsService.validateEquation(
      '12 = sqrt(144)', [])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'The equation must contain at least one variable.');

    expect(mathInteractionsService.validateEquation(
      'x^2 < 2.5', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an inequality. ' +
      'Please enter an equation instead.');

    expect(mathInteractionsService.validateEquation(
      '5 >= 2*alpha', ['alpha'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an inequality. ' +
      'Please enter an equation instead.');

    expect(mathInteractionsService.validateEquation(
      '2*x^2 + 3', ['x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like you have entered an expression. ' +
      'Please enter an equation instead.');

    expect(mathInteractionsService.validateEquation(
      '(x+y)/0 = 5', ['x', 'y'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer includes a division by zero, which is not valid.');

    expect(mathInteractionsService.validateEquation(
      '(x+y)/(y-y) = 3*x^2', ['x', 'y'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer includes a division by zero, which is not valid.');

    expect(mathInteractionsService.validateEquation(
      'a)(b = x', ['a', 'b', 'x'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'It looks like your answer has an invalid bracket pairing.');

    expect(mathInteractionsService.validateEquation(
      '3.4.5 = 45/a', ['a'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'Your answer contains an invalid term: 3.4.5');

    expect(mathInteractionsService.validateEquation(
      'y=mx+b', ['x', 'y', 'm', 'c'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'You have entered an invalid character: b. Please use only the ' +
      'characters x,y,m,c in your answer.');

    expect(mathInteractionsService.validateEquation(
      'alpha(x^2)=beta/2', ['alpha', 'beta', 'gamma'])).toBeFalse();
    expect(mathInteractionsService.getWarningText()).toBe(
      'You have entered an invalid character: x. Please use only the ' +
      'characters alpha,beta,gamma in your answer.');
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
    expect(mathInteractionsService.insertMultiplicationSigns(
      'a(b)/2')).toBe('a*(b)/2');
    expect(mathInteractionsService.insertMultiplicationSigns(
      '(a)b/2')).toBe('(a)*b/2');
    expect(mathInteractionsService.insertMultiplicationSigns(
      '(a)(b)/2')).toBe('(a)*(b)/2');
    expect(mathInteractionsService.insertMultiplicationSigns(
      '5sqrt(4)')).toBe('5*sqrt(4)');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'cos(theta)sin(theta)')).toBe('cos(theta)*sin(theta)');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'sqrt(4)abs(5)')).toBe('sqrt(4)*abs(5)');
    expect(mathInteractionsService.insertMultiplicationSigns(
      '(3+alpha)(3-alpha)4')).toBe('(3+alpha)*(3-alpha)*4');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'alphabeta gamma')).toBe('alpha*beta*gamma');
    expect(mathInteractionsService.insertMultiplicationSigns(
      'xalphayzgamma')).toBe('x*alpha*y*z*gamma');
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

  it('should get terms from given expression', function() {
    // Split by addition.
    expect(mathInteractionsService.getTerms('3+4*a')).toEqual(
      ['3', '4*a']);
    expect(mathInteractionsService.getTerms('4-(-beta)')).toEqual(
      ['4', '-((-beta))']);
    expect(mathInteractionsService.getTerms('3*10^(-1)')).toEqual(
      ['3*10^(-1)']);
    expect(mathInteractionsService.getTerms('a-x+4.5')).toEqual(
      ['a', '-(x)', '4.5']);
    expect(mathInteractionsService.getTerms('4----5')).toEqual(
      ['4', '-(---5)']);
    expect(mathInteractionsService.getTerms('100 + 20 + 3')).toEqual(
      ['100', '20', '3']);
    expect(mathInteractionsService.getTerms('4-sqrt(x + alpha)')).toEqual(
      ['4', '-(sqrt(x+alpha))']);
    expect(mathInteractionsService.getTerms('a^2+b^2+2*a*b')).toEqual(
      ['a^2', 'b^2', '2*a*b']);
    expect(mathInteractionsService.getTerms('pi/(4+3)')).toEqual(
      ['pi/(4+3)']);
    expect(mathInteractionsService.getTerms('tan(30)-(-cos(60))')).toEqual(
      ['tan(30)', '-((-cos(60)))']);

    // Split by multiplication.
    expect(mathInteractionsService.getTerms('4*a', false)).toEqual(
      ['4', 'a']);
    expect(mathInteractionsService.getTerms('4/beta', false)).toEqual(
      ['4', '(beta)^(-1)']);
    expect(mathInteractionsService.getTerms('3*10^(-1)', false)).toEqual(
      ['3', '10^(-1)']);
    expect(mathInteractionsService.getTerms('(a)/((x)/(3))', false)).toEqual(
      ['(a)', '(((x)/(3)))^(-1)']);
    expect(mathInteractionsService.getTerms('2*2*3*4', false)).toEqual(
      ['2', '2', '3', '4']);
    expect(mathInteractionsService.getTerms('100 + 20 + 3', false)).toEqual(
      ['100+20+3']);
    expect(mathInteractionsService.getTerms('4/sqrt(x+alpha)', false)).toEqual(
      ['4', '(sqrt(x+alpha))^(-1)']);
    expect(mathInteractionsService.getTerms('(x+y)*(x-y)', false)).toEqual(
      ['(x+y)', '(x-y)']);
    expect(mathInteractionsService.getTerms('pi/(4+3)', false)).toEqual(
      ['pi', '((4+3))^(-1)']);
  });

  it('should correctly match terms', function() {
    expect(mathInteractionsService.termsMatch('4*5', '5*4')).toBeTrue();
    expect(mathInteractionsService.termsMatch(
      '3*10^2', '3/10^(-2)')).toBeTrue();
    expect(mathInteractionsService.termsMatch('1/3', '1*3^(-1)')).toBeTrue();
    expect(mathInteractionsService.termsMatch('sqrt(4)', '2')).toBeTrue();
    expect(mathInteractionsService.termsMatch('abs(-4)', '4')).toBeTrue();
    expect(mathInteractionsService.termsMatch(
      'sqrt(x^2)', 'abs(x)')).toBeTrue();
    expect(mathInteractionsService.termsMatch('(x^2)/2', '(x*x)/2')).toBeTrue();
    expect(mathInteractionsService.termsMatch('2*pi*r', 'r*pi*2')).toBeTrue();
    expect(mathInteractionsService.termsMatch('x*(y+z)', '(y+z)*x')).toBeTrue();
    expect(mathInteractionsService.termsMatch(
      'x*(y+z)*(3-alpha)/2', '(3-alpha)/2*(z+y)*x')).toBeTrue();
    expect(mathInteractionsService.termsMatch('2*4.5', '(9/2)*2')).toBeTrue();

    expect(mathInteractionsService.termsMatch('4*5', '20')).toBeFalse();
    expect(mathInteractionsService.termsMatch('3*10^2', '300')).toBeFalse();
    expect(mathInteractionsService.termsMatch('1/3', '3^(-1)')).toBeFalse();
    expect(mathInteractionsService.termsMatch(
      'pi*r^2', '(pi*r^3)/r')).toBeFalse();
    expect(mathInteractionsService.termsMatch('1/3', '0.333')).toBeFalse();
    expect(mathInteractionsService.termsMatch('4*(5+3)', '32')).toBeFalse();
    expect(mathInteractionsService.termsMatch('sqrt(x^2)', 'x')).toBeFalse();
  });

  it('should correctly match terms with placeholders', function() {
    let expressionWithPlaceholders = 'a*x + b';
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '2x + 3', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3 + 4x', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '-3 + 4x', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3 - 4.5x', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3 + x*5/2', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3^5 + 4x', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'x + 5/2', ['a', 'b'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '0 + x', ['a', 'b'])).toBeTrue();

    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '4x', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '4x^2', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '4a + 3', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'ax + b', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3x^2 + 2', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '5x + 4 + 5', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3x + 2y + 4', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'ax + 3', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '3x + b', ['a', 'b'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '4x + 5 + b', ['a', 'b'])).toBeFalse();


    expressionWithPlaceholders = 'x/alpha + y/beta';
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'x/2 + y/3', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'y/2 + x/3', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '4x/2.5 + y', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'x + y', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'x/5 - y/2', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, '-x/2 + 3y', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'y - 8x', ['alpha', 'beta'])).toBeTrue();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders,
      'x/3 + y/(8/22)', ['alpha', 'beta'])).toBeTrue();

    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders,
      '(x^2)/4 + y/2', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'x/5', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders,
      'x/2 + y/3 - 5', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'x', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders,
      'x/alpha + y/2', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders,
      'x/2 + y/5 + 2x/2', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders, 'z/2 + y/3', ['alpha', 'beta'])).toBeFalse();
    expect(mathInteractionsService.expressionMatchWithPlaceholders(
      expressionWithPlaceholders,
      'x/(x+1) + y/8', ['alpha', 'beta'])).toBeFalse();
  });
});
