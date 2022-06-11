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
 * @fileoverview Unit tests for numeric expression input interaction rules.
 */

import { NumericExpressionInputRulesService } from
// eslint-disable-next-line max-len
  'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';

describe('Numeric expression input rules service', () => {
  let neirs: NumericExpressionInputRulesService;
  let inputString;

  beforeEach(() => {
    neirs = new NumericExpressionInputRulesService();
  });

  it('should have a correct MatchesExactlyWith rule', () => {
    inputString = '6-(-4)';

    expect(neirs.MatchesExactlyWith('6-(-4)', {x: inputString})).toBeTrue();
    expect(neirs.MatchesExactlyWith('6 - (-4)', {x: inputString})).toBeTrue();

    expect(neirs.MatchesExactlyWith('-(-4)+6', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('6+4', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('10', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('3*2-(-4)', {x: inputString})).toBeFalse();


    inputString = '3*10^(-5)';

    expect(neirs.MatchesExactlyWith('3*10^(-5)', {x: inputString})).toBeTrue();

    expect(neirs.MatchesExactlyWith('3/10^5', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith(
      '(10^(-5))*3', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith(
      '30*10^(-6)', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('0.00003', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith(
      '3*10^(-1)*10^(-4)', {x: inputString})).toBeFalse();


    inputString = '1000 + 200 + 30 + 4 + 0.5 + 0.06';

    expect(neirs.MatchesExactlyWith(
      '1000 + 200 + 30 + 4 + 0.5 + 0.06', {x: inputString})).toBeTrue();

    expect(neirs.MatchesExactlyWith(
      '0.06 + 0.5 + 4 + 30 + 200 + 1000', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('1234.56', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith(
      '1234 + 56/10', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith(
      '1230 + 4.56', {x: inputString})).toBeFalse();


    inputString = '2*2*3*3';

    expect(neirs.MatchesExactlyWith('2*2*3*3', {x: inputString})).toBeTrue();

    expect(neirs.MatchesExactlyWith('2*3*2*3', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('2*2*3*2*1', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('2*2*9', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('4*3^2', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('8/2 * 3*3', {x: inputString})).toBeFalse();
    expect(neirs.MatchesExactlyWith('36', {x: inputString})).toBeFalse();
  });

  it('should have a correct MatchesUpToTrivialManipulations rule', () => {
    inputString = '6-(-4)';

    expect(neirs.MatchesUpToTrivialManipulations(
      '6-(-4)', {x: inputString})).toBeTrue();
    expect(neirs.MatchesUpToTrivialManipulations(
      '-(-4)+6', {x: inputString})).toBeTrue();
    expect(neirs.MatchesUpToTrivialManipulations(
      '6+4', {x: inputString})).toBeTrue();

    expect(neirs.MatchesUpToTrivialManipulations(
      '10', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '3*2-(-4)', {x: inputString})).toBeFalse();


    inputString = '3*10^(-5)';

    expect(neirs.MatchesUpToTrivialManipulations(
      '3*10^(-5)', {x: inputString})).toBeTrue();
    expect(neirs.MatchesUpToTrivialManipulations(
      '(10^(-5))*3', {x: inputString})).toBeTrue();

    expect(neirs.MatchesUpToTrivialManipulations(
      '30*10^(-6)', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '0.00003', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '3*10^(-1)*10^(-4)', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '3/10^5', {x: inputString})).toBeFalse();


    inputString = '1000 + 200 + 30 + 4 + 0.5 + 0.06';

    expect(neirs.MatchesUpToTrivialManipulations(
      '1000 + 200 + 30 + 4 + 0.5 + 0.06', {x: inputString})).toBeTrue();
    expect(neirs.MatchesUpToTrivialManipulations(
      '0.06 + 0.5 + 4 + 30 + 200 + 1000', {x: inputString})).toBeTrue();

    expect(neirs.MatchesUpToTrivialManipulations(
      '1234.56', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '1234 + 56/10', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '1230 + 4.56', {x: inputString})).toBeFalse();


    inputString = '2*2*3*3';

    expect(neirs.MatchesUpToTrivialManipulations(
      '2*2*3*3', {x: inputString})).toBeTrue();
    expect(neirs.MatchesUpToTrivialManipulations(
      '2*3*2*3', {x: inputString})).toBeTrue();

    expect(neirs.MatchesUpToTrivialManipulations(
      '2*2*3*2*1', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '2*2*9', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '4*3^2', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '8/2 * 3*3', {x: inputString})).toBeFalse();
    expect(neirs.MatchesUpToTrivialManipulations(
      '36', {x: inputString})).toBeFalse();
  });

  it('should have a correct IsEquivalentTo rule', () => {
    inputString = '6-(-4)';

    expect(neirs.IsEquivalentTo('6-(-4)', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('10', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('6+2^2', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('100/10', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('3*2 - (-4)', {x: inputString})).toBeTrue();

    expect(neirs.IsEquivalentTo('6-4', {x: inputString})).toBeFalse();
    expect(neirs.IsEquivalentTo('6+(-4)', {x: inputString})).toBeFalse();
    expect(neirs.IsEquivalentTo('100', {x: inputString})).toBeFalse();


    inputString = '3*10^(-5)';

    expect(neirs.IsEquivalentTo('3*10^(-5)', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('0.00003', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo(
      '3*10^(-1)*10^(-4)', {x: inputString})).toBeTrue();

    expect(neirs.IsEquivalentTo('3*10^5', {x: inputString})).toBeFalse();
    expect(neirs.IsEquivalentTo('2*10^(-5)', {x: inputString})).toBeFalse();
    expect(neirs.IsEquivalentTo('5*10^(-3)', {x: inputString})).toBeFalse();


    inputString = '1000 + 200 + 30 + 4 + 0.5 + 0.06';

    expect(neirs.IsEquivalentTo(
      '1000 + 200 + 30 + 4 + 0.5 + 0.06', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('1234.56', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('123456/100', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('61728/50', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo(
      '1234 + 56/100', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo(
      '1230 + 4.56', {x: inputString})).toBeTrue();

    expect(neirs.IsEquivalentTo('123456', {x: inputString})).toBeFalse();
    expect(neirs.IsEquivalentTo(
      '1000 + 200 + 30', {x: inputString})).toBeFalse();


    inputString = '2*2*3*3';

    expect(neirs.IsEquivalentTo('2*2*3*3*1', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('2*2*9', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('4*9', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('4*3^2', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('8/2 * 3*3', {x: inputString})).toBeTrue();
    expect(neirs.IsEquivalentTo('36', {x: inputString})).toBeTrue();

    expect(neirs.IsEquivalentTo('2*2*3', {x: inputString})).toBeFalse();
    expect(neirs.IsEquivalentTo('2*3*3*3', {x: inputString})).toBeFalse();
  });
});
