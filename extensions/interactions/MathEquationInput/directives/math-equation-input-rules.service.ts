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
 * @fileoverview Rules service for the MathEquationInput interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

const nerdamer = require('nerdamer');

import { AlgebraicExpressionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service.ts';
import { split } from 'angular-animate';

@Injectable({
  providedIn: 'root'
})
export class MathEquationInputRulesService {
  MatchesExactlyWith(answer: string, inputs: {x: string, y: string}): boolean {
    let positionOfTerms = inputs.y;

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    let aeirs = new AlgebraicExpressionInputRulesService();

    if (positionOfTerms == 'lhs') {
      return aeirs.MatchesExactlyWith(lhsAnswer, {x: lhsInput});
    } else if (positionOfTerms == 'rhs') {
      return aeirs.MatchesExactlyWith(rhsAnswer, {x: rhsInput});
    } else if (positionOfTerms == 'both') {
      return (
        aeirs.MatchesExactlyWith(lhsAnswer, {x: lhsInput}) && (
          aeirs.MatchesExactlyWith(rhsAnswer, {x: rhsInput})));
    } else {
      // Position of terms is irrelevant. So, we bring all terms on one side
      // and perform an exact match.
      let rhsAnswerModified = nerdamer(rhsAnswer).multiply('-1');
      let expressionAnswer = nerdamer(rhsAnswerModified).add(lhsAnswer);
      
      let rhsInputModified = nerdamer(rhsInput).multiply('-1');
      let expressionInput = nerdamer(rhsInputModified).add(lhsInput);

      return aeirs.MatchesExactlyWith(expressionAnswer, {x: expressionInput});
    }
  }

  IsEquivalentTo(answer: string, inputs: {x: string}): boolean {
    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    let aeirs = new AlgebraicExpressionInputRulesService();

    // Check 1: If both sides match with their counterparts in the input string.
    if (aeirs.IsEquivalentTo(lhsAnswer, {x: lhsInput}) && aeirs.IsEquivalentTo(
      rhsAnswer, {x: rhsInput})) {
      return true;
    }
    
    // Check 2: If they don't match directly, we bring all terms on both
    // equations to one side and then compare. We do this by multiplying RHS
    // with -1 and adding to LHS. This would catch equations like
    // 'x = y' and 'x - y = 0'.
    let rhsAnswerModified = nerdamer(rhsAnswer).multiply('-1');
    let expressionAnswer = nerdamer(rhsAnswerModified).add(lhsAnswer);
    
    let rhsInputModified = nerdamer(rhsInput).multiply('-1');
    let expressionInput = nerdamer(rhsInputModified).add(lhsInput);

    if (aeirs.IsEquivalentTo(expressionAnswer, {x: expressionInput})) {
      return true;
    }

    // Check 3: If they still don't match, we divide the expressions formed by
    // bringing all terms on one side and check if the result is a constant.
    // This would catch equations like 'x+y=0' and '2*x+2*y=0'.
    let expandedLearnerAnswer = nerdamer(`expand(${expressionAnswer})`);
    let simplifiedLearnerAnswer = nerdamer(
      `simplify(${expandedLearnerAnswer})`);

    let expandedCreatorAnswer = nerdamer(`expand(${expressionInput})`);
    let simplifiedCreatorAnswer = nerdamer(
      `simplify(${expandedCreatorAnswer})`);

    let divisionResult = nerdamer(
      `divide(${simplifiedLearnerAnswer}, ${simplifiedCreatorAnswer})`);
    if (nerdamer(divisionResult).variables().length === 0) {
      // This would mean that the result is a constant.
      return true;
    }
  }
}

angular.module('oppia').factory(
  'MathEquationInputRulesService',
  downgradeInjectable(MathEquationInputRulesService));
