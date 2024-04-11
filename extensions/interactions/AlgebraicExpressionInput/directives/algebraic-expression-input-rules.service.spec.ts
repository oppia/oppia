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

import {
  AlgebraicExpressionInputRulesService,
  // eslint-disable-next-line max-len
} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import {NumericExpressionInputRulesService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import {MathInteractionsService} from 'services/math-interactions.service';

describe('Algebraic expression input rules service', () => {
  let algebraicRulesService: AlgebraicExpressionInputRulesService;
  let inputString;

  beforeEach(() => {
    algebraicRulesService = new AlgebraicExpressionInputRulesService(
      new MathInteractionsService(),
      new NumericExpressionInputRulesService()
    );
  });

  it('should have a correct MatchesExactlyWith rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';

    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2)-x)/(z)-4*y', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2) - x)/(z) - 4*y', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2)-x)*z^(-1)-4*y', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2)-x)/(z)-(8*y)/2', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('-4*y+((x)^(2)-x)/(z)', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(x*(x-1))/(z)-4*y', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2))/(z)-x/(z)-4*y', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2))/(z)-(x/(z)+4*y)', {
        x: inputString,
      })
    ).toBeFalse();

    inputString = '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c';

    expect(
      algebraicRulesService.MatchesExactlyWith(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesExactlyWith(
        '(a)^(2) + (b)^(2) + (c)^(2) + 2*a*b + 2*b*c + 2*a*c',
        {x: inputString}
      )
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith(
        '2*a*b+2*b*c+2*a*c+(a)^(2)+(b)^(2)+(c)^(2)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith(
        'a*a+b*b+(c^3)/c+2*a*b+2*b*c+2*c*a',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*(a*b+b*c+a*c)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(a+b)^2+c^2+2*b*c+2*a*c', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(a+b+c)^2', {x: inputString})
    ).toBeFalse();

    inputString = 'x^(2*t+3)+x^4';

    expect(
      algebraicRulesService.MatchesExactlyWith('x^(2*t+3)+x^4', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesExactlyWith('x^(2*t + 3) + x^4', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith('x^(2*t)*x^3+((x)^(2))^2', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith(
        '(x^(2*t))/(x^(-3))+(x^8)/(x^4)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(x^(2*t+5))/((x)^(2))-(-x^4)', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(x)^(3*t+3)+(x)^4', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(x)^3*((x)^(2*t)+x)', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(x)^4*((x)^(2*t-1)+1)', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('((x)^(2*t+4)+(x)^5)/(x)', {
        x: inputString,
      })
    ).toBeFalse();

    inputString = '9*(x)^(2)-6*x+1';

    expect(
      algebraicRulesService.MatchesExactlyWith('9*(x)^(2)-6*x+1', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesExactlyWith('9*(x)^(2) - 6*x + 1', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith('3*(3*(x)^(2)-2*x)+1', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(3*x)^2-6*x+1', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('((3*x-1))^2', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('3*x(3*x-2)+1', {x: inputString})
    ).toBeFalse();

    inputString = '9*(x)^(2)-6*x+1';

    expect(
      algebraicRulesService.MatchesExactlyWith('9*(x)^(2)-6*x+1', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesExactlyWith('9*(x)^(2) - 6*x + 1', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith('3*(3*(x)^(2)-2*x)+1', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('(3*x)^2-6*x+1', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('((3*x-1))^2', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('3*x(3*x-2)+1', {x: inputString})
    ).toBeFalse();

    inputString = '6-(-4)';

    expect(
      algebraicRulesService.MatchesExactlyWith('6-(-4)', {x: inputString})
    ).toBeTrue();

    inputString = 'z-a-z';

    expect(
      algebraicRulesService.MatchesExactlyWith('z-a-z', {x: inputString})
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith('a', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('a+z-z', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesExactlyWith('z+(a-z)', {x: inputString})
    ).toBeFalse();

    inputString = '5*z-w';

    expect(
      algebraicRulesService.MatchesExactlyWith('5*z-w', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesExactlyWith('5z-w', {x: inputString})
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesExactlyWith('-w+5z', {x: inputString})
    ).toBeFalse();
  });

  it('should have a correct MatchesUpToTrivialManipulations rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2)-x)/(z)-4*y',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '-4*y+((x)^(2)-x)/(z)',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2)-x)*(z)^(-1)-4*y',
        {x: inputString}
      )
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2)-x)/(z)-(8*y)/(2)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x*(x-1))/(z)-4*y',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2))/(z)-(x)/(z)-4*y',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2))/(z)-((x)/(z)+4*y)',
        {x: inputString}
      )
    ).toBeFalse();

    inputString = '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c';

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '2*a*b+2*b*c+2*a*c+(a)^(2)+(b)^(2)+(c)^(2)',
        {x: inputString}
      )
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        'a*a+b*b+((c)^(3))/(c)+2*a*b+2*b*c+2*c*a',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*(a*b+b*c+a*c)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(a+b)^(2)+(c)^(2)+2*b*c+2*a*c',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('(a+b+c)^(2)', {
        x: inputString,
      })
    ).toBeFalse();

    inputString = '(x)^(2*t+3)+(x)^(4)';

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(2*t+3)+(x)^(4)',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(4) + (x)^(2*t+3)',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(4) + (x)^(3+2*t)',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(4) + (x)^(3+t*2)',
        {x: inputString}
      )
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(2*t)*(x)^(3)+((x)^(2))^(2)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2*t))/((x)^(-3))+((x)^(8))/((x)^(4))',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2*t+5))/((x)^(2))-(-(x)^(4))',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(3*t+3)+(x)^(4)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(3)*((x)^(2*t)+x)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '(x)^(4)*((x)^(2*t-1)+1)',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '((x)^(2*t+4)+(x)^(5))/(x)',
        {x: inputString}
      )
    ).toBeFalse();

    inputString = '9*(x)^(2)-6*x+1';

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('9*(x)^(2)-6*x+1', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        'x^2 * 9 - 6*x + 1',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        'x^2 * 9 + 1 - x * 6',
        {x: inputString}
      )
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations(
        '3*(3*(x)^(2)-2*x)+1',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('(3*x)^(2)-6*x+1', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('((3*x-1))^(2)', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('3*x(3*x-2)+1', {
        x: inputString,
      })
    ).toBeFalse();

    inputString = '6-(-4)';

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('6-(-4)', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('-(-4)+6', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('4+6', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.MatchesUpToTrivialManipulations('10', {
        x: inputString,
      })
    ).toBeFalse();
  });

  it('should have a correct IsEquivalentTo rule', () => {
    inputString = '((x)^(2)-x)/(z)-4*y';

    expect(
      algebraicRulesService.IsEquivalentTo('((x)^(2)-x)/(z)-4*y', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('-4*y+((x)^(2)-x)/(z)', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('((x)^(2)-x)*z^(-1)-4*y', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(x*(x-1))/(z)-4*y', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('((x)^(2))/(z)-x/(z)-4*y', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('((x)^(2))/(z)-(x/(z)+4*y)', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.IsEquivalentTo('((x)^(2)-x)/(z)-40*y', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.IsEquivalentTo('((x)^(2)+x)/(z)-4*y', {
        x: inputString,
      })
    ).toBeFalse();
    expect(
      algebraicRulesService.IsEquivalentTo('(x^(2.00000000000001)+x)/(z)+4*y', {
        x: inputString,
      })
    ).toBeFalse();

    inputString = '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c';

    expect(
      algebraicRulesService.IsEquivalentTo(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c+2*a*c',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo(
        '2*a*b+2*b*c+2*a*c+(a)^(2)+(b)^(2)+(c)^(2)',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo(
        'a*a+b*b+(c^3)/c+2*a*b+2*b*c+2*c*a',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*(a*b+b*c+a*c)',
        {x: inputString}
      )
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(a+b)^2+c^2+2*b*c+2*a*c', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(a+b+c)^2', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(((a+b+c))^3)/(a+b+c)', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.IsEquivalentTo(
        '(a)^(2)+(b)^(2)+(c)^(2)+2*a*b+2*b*c',
        {x: inputString}
      )
    ).toBeFalse();
    expect(
      algebraicRulesService.IsEquivalentTo('(a+b-c)^2', {x: inputString})
    ).toBeFalse();

    inputString = 'x^(2*t+3)+x^4';

    expect(
      algebraicRulesService.IsEquivalentTo('x^(2*t+3)+x^4', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('x^(2*t)*x^3+((x)^(2))^2', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(x^(2*t))/(x^(-3))+(x^8)/(x^4)', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(x^(2*t+5))/((x)^(2))-(-x^4)', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('x^3*(x^(2*t)+x)', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('x^4*(x^(2*t-1)+1)', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(x^(2*t+4)+x^5)/x', {
        x: inputString,
      })
    ).toBeTrue();

    expect(
      algebraicRulesService.IsEquivalentTo('x^(2*t+3)+x^3+x', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.IsEquivalentTo('x^(2*t+3)-x^4', {x: inputString})
    ).toBeFalse();

    inputString = '9*(x)^(2)-6*x+1';

    expect(
      algebraicRulesService.IsEquivalentTo('9*(x)^(2)-6*x+1', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('3*(3*(x)^(2)-2*x)+1', {
        x: inputString,
      })
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(3*x)^2-6*x+1', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('((3*x-1))^2', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('3*x(3*x-2)+1', {x: inputString})
    ).toBeTrue();
    expect(
      algebraicRulesService.IsEquivalentTo('(1-3x)^2', {x: inputString})
    ).toBeTrue();

    expect(
      algebraicRulesService.IsEquivalentTo('sqrt((3x-1)^2)', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.IsEquivalentTo('9*(x)^(2)-6*x-1', {x: inputString})
    ).toBeFalse();
    expect(
      algebraicRulesService.IsEquivalentTo('((3*x-1))^4', {x: inputString})
    ).toBeFalse();

    inputString = '6-(-4)';

    expect(
      algebraicRulesService.IsEquivalentTo('10', {x: inputString})
    ).toBeTrue();
  });
});
