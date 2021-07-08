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

import { MathEquationInputRulesService } from
// eslint-disable-next-line max-len
  'interactions/MathEquationInput/directives/math-equation-input-rules.service';

describe('Math equation input rules service', () => {
  let meirs: MathEquationInputRulesService;
  let inputString, positionOfTerms;

  beforeEach(() => {
    meirs = new MathEquationInputRulesService();
  });

  it('should have a correct MatchesExactlyWith rule', () => {
    inputString = 'y=m*x+c';

    positionOfTerms = 'lhs';
    // Accepted cases.
    expect(meirs.MatchesExactlyWith(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y=m*x^2+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      '(y^2)/y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y=0', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y=m*x-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.MatchesExactlyWith(
      'y-m*x=c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'm*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'x=m*y+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'rhs';
    // Accepted cases.
    expect(meirs.MatchesExactlyWith(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      '0=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      '0=c+m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.MatchesExactlyWith(
      'y-m*x=c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'm*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'x=m*y+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'both';
    // Accepted cases.
    expect(meirs.MatchesExactlyWith(
      'y=m*x+c',
      {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y=c+m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      '(y^2)/y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.MatchesExactlyWith(
      'y-m*x=c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'm*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y=m*x', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'x=m*y+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'irrelevant';
    // Accepted cases.
    expect(meirs.MatchesExactlyWith(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y=c+m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      '(y^2)/y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y-m*x=c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.MatchesExactlyWith(
      'y-m*x-2*c=-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.MatchesExactlyWith(
      'y^2-m*x=c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'm*x-c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y=m*x', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'x=m*y+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.MatchesExactlyWith(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();
  });

  it('should have a correct IsEquivalentTo rule', () => {
    inputString = '(2*x+1)*(x-3)=0';

    // Accepted cases.
    expect(meirs.IsEquivalentTo(
      '0=(2*x+1)*(x-3)', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '2*x^2-6*x+x-3=0', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '2*x^2-6*x=3-x', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '-2*x^2+5*x+3=0', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '(2*x+1)*(-x+3)=0', {x: inputString})).toBeTrue();

    // Rejected cases.
    expect(meirs.IsEquivalentTo(
      'x-y=x-y', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo(
      'x=3', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo(
      '2*x+1=0', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo(
      'x-3=0', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo(
      'x=-1/2', {x: inputString})).toBeFalse();


    inputString = '13 + 2*w = 34';

    // Accepted cases.
    expect(meirs.IsEquivalentTo(
      '13 + 2*w = 34', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '26 + 4*w = 68', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '6.5 + w = 17', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '13 + 2*w - 34 = 0', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '2*w = 21', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '21 = 2*w', {x: inputString})).toBeTrue();
    expect(meirs.IsEquivalentTo(
      '(13 + 2*w)/34 = 1', {x: inputString})).toBeTrue();

    // Rejected cases.
    expect(meirs.IsEquivalentTo(
      '13 + 2*w = 0', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo(
      '13 - 2*w = 34', {x: inputString})).toBeFalse();
    expect(meirs.IsEquivalentTo(
      '(13 + 2*w)^2 = 1156', {x: inputString})).toBeFalse();
  });

  it('should have a correct ContainsSomeOf rule', () => {
    inputString = 'y=m*x+c';

    positionOfTerms = 'lhs';
    // Accepted cases.
    expect(meirs.ContainsSomeOf(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y=m*x^2+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y=0', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y=m*x-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.ContainsSomeOf(
      '-y-m*x=c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'm*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'x=m*y+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'rhs';
    // Accepted cases.
    expect(meirs.ContainsSomeOf(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      '0=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      '0=c-m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.ContainsSomeOf(
      'c-m*x=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'm*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x^2', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'x=m*y-c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'both';
    // Accepted cases.
    expect(meirs.ContainsSomeOf(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y+x=c+m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y-y^2=m*x^2+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.ContainsSomeOf(
      '-y-m*x=c^2', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'm*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'x=m*y-c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'irrelevant';
    // Accepted cases.
    expect(meirs.ContainsSomeOf(
      'y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y=c+m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y-mx-c=0', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      '0=-y+mx+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y-m*x=c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.ContainsSomeOf(
      'y-m*x-2*c=-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.ContainsSomeOf(
      'y^2+m*x=-c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'm*x^2+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y/2=m*c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'x=m*y-c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y/(m*x+c)=1', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.ContainsSomeOf(
      'y^2=m*x*y+c*y', {x: inputString, y: positionOfTerms})).toBeFalse();
  });

  it('should have a correct OmitsSomeOf rule', () => {
    inputString = 'y=m*x+c';

    positionOfTerms = 'lhs';
    // Accepted cases.
    expect(meirs.OmitsSomeOf(
      '0=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y^2=m*x^2+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      '-y=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y/2=0', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y*y=m*x-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.OmitsSomeOf(
      'y-m*x=c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y+m*x+c=y', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y=m*x', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'x+y=m*y+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y=1', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'rhs';
    // Accepted cases.
    expect(meirs.OmitsSomeOf(
      'y=m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y^2=m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      '0=c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      '0=c-m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.OmitsSomeOf(
      'c-m*x=mx+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y^2=m*x+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y^2=m*x^2+mx+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'x=m*x+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y^2=m*x+c', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'both';
    // Accepted cases.
    expect(meirs.OmitsSomeOf(
      '0=m*x-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      '-y+x=-c+m*x', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'mx+c=y', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.OmitsSomeOf(
      'y=mx+c', {x: inputString, y: positionOfTerms})).toBeFalse();
    expect(meirs.OmitsSomeOf(
      'y+y^2=mx+b+c', {x: inputString, y: positionOfTerms})).toBeFalse();

    positionOfTerms = 'irrelevant';
    // Accepted cases.
    expect(meirs.OmitsSomeOf(
      'y=m*x-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y=c+m*x^2', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y^2=m*x+c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y-m*x=-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    expect(meirs.OmitsSomeOf(
      'y-m*x+2*c=-c', {x: inputString, y: positionOfTerms})).toBeTrue();
    // Rejected cases.
    expect(meirs.OmitsSomeOf(
      'y-mx=c', {x: inputString, y: positionOfTerms})).toBeFalse();
  });

  it('should have a correct MatchesWithGeneralForm rule', () => {
    inputString = 'y = mx + c';

    expect(meirs.MatchesWithGeneralForm(
      'y = 3x + 5', {x: 'y = mx + c', y: ['m', 'c']})).toBeTrue();
    expect(meirs.MatchesWithGeneralForm(
      '3x + 5 = y', {x: 'y = mx + c', y: ['m', 'c']})).toBeFalse();
  });
});
