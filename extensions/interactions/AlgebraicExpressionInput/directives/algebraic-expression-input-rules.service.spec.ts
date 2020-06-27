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
 * @fileoverview Unit tests for algebraic expression input interaction rules.
 */

import { AlgebraicExpressionInputRulesService } from
// eslint-disable-next-line max-len
  'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';

describe('Algebraic expression input rules service', () => {
  let aeirs: AlgebraicExpressionInputRulesService = null;
  let inputString;

  beforeEach(() => {
    aeirs = new AlgebraicExpressionInputRulesService();
  });

  it('should have a correct MatchesExactlyWith rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';

    expect(aeirs.MatchesExactlyWith('((x)^(2)-x)/(z)-4*y',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('((x)^(2)-x)/(z)-(8*y)/(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('-4*y+((x)^(2)-x)/(z)',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('((x)^(2)-x)*(z)^(-1)-4*y',
      {x: inputString})).toBeTrue();

    expect(aeirs.MatchesExactlyWith('(x*(x-1))/(z)-4*y',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('((x)^(2))/(z)-(x)/(z)-4*y',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('((x)^(2))/(z)-((x)/(z)+4*y)',
      {x: inputString})).toBeFalse();


    inputString = '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c';

    expect(aeirs.MatchesExactlyWith('(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('2*a*b+2*b*c+2*a*c+(a)^(2)+(b)^(2)+(c)^(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('a*a+b*b+((c)^(3))/(c)+2*a*b+2*b*c+2*c*a',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('(a)^(2)+(b)^(2)+(c)^(2)+2*(a*b+b*c+a*c)',
      {x: inputString})).toBeTrue();

    expect(aeirs.MatchesExactlyWith('(a+b)^(2)+(c)^(2)+2*b*c+2*a*c',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('(a+b+c)^(2)',
      {x: inputString})).toBeFalse();


    inputString = '(x)^(2*t+3)+(x)^(4)';

    expect(aeirs.MatchesExactlyWith('(x)^(2*t+3)+(x)^(4)',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('(x)^(2*t)*(x)^(3)+((x)^(2))^(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith(
      '((x)^(2*t))/((x)^(-3))+((x)^(8))/((x)^(4))',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('((x)^(2*t+5))/((x)^(2))-(-(x)^(4))',
      {x: inputString})).toBeTrue();

    expect(aeirs.MatchesExactlyWith('(x)^(3*t+3)+(x)^(4)',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('(x)^(3)*((x)^(2*t)+x)',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('(x)^(4)*((x)^(2*t-1)+1)',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('((x)^(2*t+4)+(x)^(5))/(x)',
      {x: inputString})).toBeFalse();


    inputString = '9*(x)^(2)-6*x+1';

    expect(aeirs.MatchesExactlyWith('9*(x)^(2)-6*x+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('3*(3*(x)^(2)-2*x)+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('(3*x)^(2)-6*x+1',
      {x: inputString})).toBeTrue();

    expect(aeirs.MatchesExactlyWith('((3*x-1))^(2)',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('3*x(3*x-2)+1',
      {x: inputString})).toBeFalse();


    inputString = '9*(x)^(2)-6*x+1';

    expect(aeirs.MatchesExactlyWith('9*(x)^(2)-6*x+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('3*(3*(x)^(2)-2*x)+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.MatchesExactlyWith('(3*x)^(2)-6*x+1',
      {x: inputString})).toBeTrue();

    expect(aeirs.MatchesExactlyWith('((3*x-1))^(2)',
      {x: inputString})).toBeFalse();
    expect(aeirs.MatchesExactlyWith('3*x(3*x-2)+1',
      {x: inputString})).toBeFalse();
  });

  it('should have a correct IsEquivalentTo rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';

    expect(aeirs.IsEquivalentTo('((x)^(2)-x)/(z)-4*y',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('-4*y+((x)^(2)-x)/(z)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((x)^(2)-x)*(z)^(-1)-4*y',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(x*(x-1))/(z)-4*y',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((x)^(2))/(z)-(x)/(z)-4*y',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((x)^(2))/(z)-((x)/(z)+4*y)',
      {x: inputString})).toBeTrue();

    expect(aeirs.IsEquivalentTo('((x)^(2)-x)/(z)-40*y',
      {x: inputString})).toBeFalse();
    expect(aeirs.IsEquivalentTo('((x)^(2)+x)/(z)-4*y',
      {x: inputString})).toBeFalse();
    expect(aeirs.IsEquivalentTo('((x)^(2.00000000000001)+x)/(z)+4*y',
      {x: inputString})).toBeFalse();


    inputString = '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c';

    expect(aeirs.IsEquivalentTo('(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('2*a*b+2*b*c+2*a*c+(a)^(2)+(b)^(2)+(c)^(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('a*a+b*b+((c)^(3))/(c)+2*a*b+2*b*c+2*c*a',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(a)^(2)+(b)^(2)+(c)^(2)+2*(a*b+b*c+a*c)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(a+b)^(2)+(c)^(2)+2*b*c+2*a*c',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(a+b+c)^(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(((a+b+c))^(3))/(a+b+c)',
      {x: inputString})).toBeTrue();

    expect(aeirs.IsEquivalentTo('(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c',
      {x: inputString})).toBeFalse();
    expect(aeirs.IsEquivalentTo('(a+b-c)^(2)',
      {x: inputString})).toBeFalse();


    inputString = '(x)^(2*t+3)+(x)^(4)';

    expect(aeirs.IsEquivalentTo('(x)^(2*t+3)+(x)^(4)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(x)^(2*t)*(x)^(3)+((x)^(2))^(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((x)^(2*t))/((x)^(-3))+((x)^(8))/((x)^(4))',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((x)^(2*t+5))/((x)^(2))-(-(x)^(4))',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(x)^(3)*((x)^(2*t)+x)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(x)^(4)*((x)^(2*t-1)+1)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((x)^(2*t+4)+(x)^(5))/(x)',
      {x: inputString})).toBeTrue();

    expect(aeirs.IsEquivalentTo('(x)^(2*t+3)+(x)^(3)+x',
      {x: inputString})).toBeFalse();
    expect(aeirs.IsEquivalentTo('(x)^(2*t+3)-(x)^(4)',
      {x: inputString})).toBeFalse();


    inputString = '9*(x)^(2)-6*x+1';

    expect(aeirs.IsEquivalentTo('9*(x)^(2)-6*x+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('3*(3*(x)^(2)-2*x)+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(3*x)^(2)-6*x+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('((3*x-1))^(2)',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('3*x(3*x-2)+1',
      {x: inputString})).toBeTrue();
    expect(aeirs.IsEquivalentTo('(1-3x)^(2)',
      {x: inputString})).toBeTrue();

    expect(aeirs.IsEquivalentTo('sqrt((3x-1)^(2))',
      {x: inputString})).toBeFalse();
    expect(aeirs.IsEquivalentTo('9*(x)^(2)-6*x-1',
      {x: inputString})).toBeFalse();
    expect(aeirs.IsEquivalentTo('((3*x-1))^(4)',
      {x: inputString})).toBeFalse();
  });
});
