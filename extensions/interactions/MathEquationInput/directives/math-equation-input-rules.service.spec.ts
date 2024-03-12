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

import {AlgebraicExpressionInputRulesService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import {
  MathEquationInputRulesService,
  // eslint-disable-next-line max-len
} from 'interactions/MathEquationInput/directives/math-equation-input-rules.service';
import {NumericExpressionInputRulesService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import {MathInteractionsService} from 'services/math-interactions.service';

describe('Math equation input rules service', () => {
  let meirs: MathEquationInputRulesService;
  let inputString, positionOfTerms;

  beforeEach(() => {
    meirs = new MathEquationInputRulesService(
      new AlgebraicExpressionInputRulesService(
        new MathInteractionsService(),
        new NumericExpressionInputRulesService()
      )
    );
  });

  it('should have a correct MatchesExactlyWith rule', () => {
    inputString = 'y=m*x+c';

    positionOfTerms = 'lhs';
    // Accepted cases.
    expect(
      meirs.MatchesExactlyWith('y=m*x+c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y=m*x^2+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y=0', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y=m*x-c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesExactlyWith('(y^2)/y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y-m*x=c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('m*x+c=y', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('x=m*y+c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();

    positionOfTerms = 'rhs';
    // Accepted cases.
    expect(
      meirs.MatchesExactlyWith('y=m*x+c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('0=m*x+c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesExactlyWith('0=c+m*x', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y-m*x=c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('m*x+c=y', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('x=m*y+c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();

    positionOfTerms = 'both';
    // Accepted cases.
    expect(
      meirs.MatchesExactlyWith('y=m*x+c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y = m*x + c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesExactlyWith('y=c+m*x', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('(y^2)/y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y-m*x=c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('m*x+c=y', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y=m*x', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('x=m*y+c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();

    positionOfTerms = 'irrelevant';
    // Accepted cases.
    expect(
      meirs.MatchesExactlyWith('y=m*x+c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y=c+m*x', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    expect(
      meirs.MatchesExactlyWith('y-m*x=c', {x: inputString, y: positionOfTerms})
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesExactlyWith('y-m*x-2*c=-c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2-m*x=c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('m*x-c=y', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y=m*x', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('x=m*y+c', {x: inputString, y: positionOfTerms})
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesExactlyWith('(y^2)/y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
  });

  it('should have a correct MatchesUpToTrivialManipulations rule', () => {
    inputString = 'y=m*x+c';

    positionOfTerms = 'lhs';
    // Accepted cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x^2+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=0', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x-c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('(y^2)/y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y-m*x=c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('m*x+c=y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('x=m*y+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();

    positionOfTerms = 'rhs';
    // Accepted cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('0=x*m+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('0=c+m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('y-m*x=c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('m*x+c=y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('x=m*y+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();

    positionOfTerms = 'both';
    // Accepted cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=c+m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('(y^2)/y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y-m*x=c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('m*x+c=y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('x=m*y+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();

    positionOfTerms = 'irrelevant';
    // Accepted cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=c+m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    expect(
      meirs.MatchesUpToTrivialManipulations('y-m*x=c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeTrue();
    // Rejected cases.
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2-m*x=c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('m*x-c=y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y=m*x', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('x=m*y+c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y/(m*x+c)=1', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y^2=m*x*y+c*y', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
    expect(
      meirs.MatchesUpToTrivialManipulations('y-m*x-2*c=-c', {
        x: inputString,
        y: positionOfTerms,
      })
    ).toBeFalse();
  });

  it('should have a correct IsEquivalentTo rule', () => {
    inputString = '(2*x+1)*(x-3)=0';

    // Accepted cases.
    expect(
      meirs.IsEquivalentTo('0=(2*x+1)*(x-3)', {x: inputString})
    ).toBeTrue();
    expect(
      meirs.IsEquivalentTo('2*x^2-6*x+x-3=0', {x: inputString})
    ).toBeTrue();
    expect(meirs.IsEquivalentTo('2*x^2-6*x=3-x', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo('-2*x^2+5*x+3=0', {x: inputString})).toBeTrue();
    expect(
      meirs.IsEquivalentTo('(2*x+1)*(-x+3)=0', {x: inputString})
    ).toBeTrue();

    // Rejected cases.
    expect(meirs.IsEquivalentTo('x-y=x-y', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo('x=3', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo('2*x+1=0', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo('x-3=0', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo('x=-1/2', {x: inputString})).toBeFalse();

    inputString = '13 + 2*w = 34';

    // Accepted cases.
    expect(meirs.IsEquivalentTo('13 + 2*w = 34', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo('26 + 4*w = 68', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo('6.5 + w = 17', {x: inputString})).toBeTrue();
    expect(
      meirs.IsEquivalentTo('13 + 2*w - 34 = 0', {x: inputString})
    ).toBeTrue();
    expect(meirs.IsEquivalentTo('2*w = 21', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo('21 = 2*w', {x: inputString})).toBeTrue();
    expect(
      meirs.IsEquivalentTo('(13 + 2*w)/34 = 1', {x: inputString})
    ).toBeTrue();

    // Rejected cases.
    expect(meirs.IsEquivalentTo('13 + 2*w = 0', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo('13 - 2*w = 34', {x: inputString})).toBeFalse();
    expect(
      meirs.IsEquivalentTo('(13 + 2*w)^2 = 1156', {x: inputString})
    ).toBeFalse();
  });
});
