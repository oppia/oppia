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

import nerdamer from 'nerdamer';

import { AlgebraicExpressionInputRulesService } from
  // eslint-disable-next-line max-len
  'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import { MathEquationAnswer } from 'interactions/answer-defs';
import {
  MathEquationRuleInputsWithSide,
  MathEquationRuleInputsWithoutSide,
  MathEquationRuleInputsWithPlaceholder
} from 'interactions/rule-input-defs';
import { MathInteractionsService } from 'services/math-interactions.service';

@Injectable({
  providedIn: 'root'
})
export class MathEquationInputRulesService {
  MatchesExactlyWith(
      answer: MathEquationAnswer,
      inputs: MathEquationRuleInputsWithSide): boolean {
    let algebraicRulesService = new AlgebraicExpressionInputRulesService();
    let mathInteractionsService = new MathInteractionsService();

    let positionOfTerms = inputs.y;

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    if (positionOfTerms === 'lhs') {
      return algebraicRulesService.MatchesExactlyWith(lhsAnswer, {x: lhsInput});
    } else if (positionOfTerms === 'rhs') {
      return algebraicRulesService.MatchesExactlyWith(rhsAnswer, {x: rhsInput});
    } else if (positionOfTerms === 'both') {
      return (
        algebraicRulesService.MatchesExactlyWith(lhsAnswer, {x: lhsInput}) && (
          algebraicRulesService.MatchesExactlyWith(rhsAnswer, {x: rhsInput})));
    } else {
      // Position of terms is irrelevant. So, we bring all terms on one side
      // and perform an exact match.

      // Replacing constants to ensure that they don't get simplified.
      rhsAnswer = mathInteractionsService.replaceConstantsWithVariables(
        rhsAnswer);
      lhsAnswer = mathInteractionsService.replaceConstantsWithVariables(
        lhsAnswer);
      rhsInput = mathInteractionsService.replaceConstantsWithVariables(
        rhsInput);
      lhsInput = mathInteractionsService.replaceConstantsWithVariables(
        lhsInput);

      let rhsAnswerModified = nerdamer(rhsAnswer).multiply('-1').text();
      let expressionAnswer = nerdamer(rhsAnswerModified).add(lhsAnswer).text();

      let rhsInputModified = nerdamer(rhsInput).multiply('-1').text();
      let expressionInput = nerdamer(rhsInputModified).add(lhsInput).text();

      return algebraicRulesService.MatchesExactlyWith(
        expressionAnswer, {x: expressionInput});
    }
  }

  MatchesUpToTrivialManipulations(
      answer: MathEquationAnswer,
      inputs: MathEquationRuleInputsWithSide): boolean {
    let algebraicRulesService = new AlgebraicExpressionInputRulesService();
    let mathInteractionsService = new MathInteractionsService();

    let positionOfTerms = inputs.y;

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    if (positionOfTerms === 'lhs') {
      return algebraicRulesService.MatchesUpToTrivialManipulations(
        lhsAnswer, {x: lhsInput});
    } else if (positionOfTerms === 'rhs') {
      return algebraicRulesService.MatchesUpToTrivialManipulations(
        rhsAnswer, {x: rhsInput});
    } else if (positionOfTerms === 'both') {
      return (
        algebraicRulesService.MatchesUpToTrivialManipulations(
          lhsAnswer, {x: lhsInput}) && (
          algebraicRulesService.MatchesUpToTrivialManipulations(
            rhsAnswer, {x: rhsInput})));
    } else {
      // Position of terms is irrelevant. So, we bring all terms on one side
      // and perform an exact match.

      // Replacing constants to ensure that they don't get simplified.
      rhsAnswer = mathInteractionsService.replaceConstantsWithVariables(
        rhsAnswer);
      lhsAnswer = mathInteractionsService.replaceConstantsWithVariables(
        lhsAnswer);
      rhsInput = mathInteractionsService.replaceConstantsWithVariables(
        rhsInput);
      lhsInput = mathInteractionsService.replaceConstantsWithVariables(
        lhsInput);

      let rhsAnswerModified = nerdamer(rhsAnswer).multiply('-1').text();
      let expressionAnswer = nerdamer(rhsAnswerModified).add(lhsAnswer).text();

      let rhsInputModified = nerdamer(rhsInput).multiply('-1').text();
      let expressionInput = nerdamer(rhsInputModified).add(lhsInput).text();

      return algebraicRulesService.MatchesUpToTrivialManipulations(
        expressionAnswer, {x: expressionInput});
    }
  }

  IsEquivalentTo(
      answer: MathEquationAnswer,
      inputs: MathEquationRuleInputsWithoutSide): boolean {
    let algebraicRulesService = new AlgebraicExpressionInputRulesService();

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    // We bring all terms in both equations to one side and then compare.

    // Check 1: Move terms by subtracting one side with from the other.
    let expressionAnswer = nerdamer(lhsAnswer).subtract(rhsAnswer).text();

    // We need to cover two cases: When terms are shifted from RHS to LHS and
    // when they are shifted from LHS to RHS.
    let expressionInput1 = nerdamer(lhsInput).subtract(rhsInput).text();
    let expressionInput2 = nerdamer(rhsInput).subtract(lhsInput).text();

    if (algebraicRulesService.IsEquivalentTo(
      expressionAnswer, {x: expressionInput1}) ||
      algebraicRulesService.IsEquivalentTo(
        expressionAnswer, {x: expressionInput2})) {
      return true;
    }

    // Check 2: Move terms by dividing one side with from the other.
    if (nerdamer(rhsAnswer).eq('0')) {
      expressionAnswer = nerdamer(lhsAnswer).text();
    } else {
      expressionAnswer = nerdamer(lhsAnswer).divide(rhsAnswer).text();
    }

    // We need to cover two cases: When terms are shifted from RHS to LHS and
    // when they are shifted from LHS to RHS.
    // This check will never pass if either sides is equal to 0.
    if (!nerdamer(lhsInput).eq('0') && !nerdamer(rhsInput).eq('0')) {
      expressionInput1 = nerdamer(lhsInput).divide(rhsInput).text();
      expressionInput2 = nerdamer(rhsInput).divide(lhsInput).text();

      if (algebraicRulesService.IsEquivalentTo(
        expressionAnswer, {x: expressionInput1}) ||
        algebraicRulesService.IsEquivalentTo(
          expressionAnswer, {x: expressionInput2})) {
        return true;
      }
    }
    // If none of the checks pass, the answer is not equivalent.
    return false;
  }

  ContainsSomeOf(
      answer: MathEquationAnswer,
      inputs: MathEquationRuleInputsWithSide): boolean {
    let algebraicRulesService = new AlgebraicExpressionInputRulesService();

    let positionOfTerms = inputs.y;

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    if (positionOfTerms === 'lhs') {
      return algebraicRulesService.ContainsSomeOf(lhsAnswer, {x: lhsInput});
    } else if (positionOfTerms === 'rhs') {
      return algebraicRulesService.ContainsSomeOf(rhsAnswer, {x: rhsInput});
    } else if (positionOfTerms === 'both') {
      return (
        algebraicRulesService.ContainsSomeOf(lhsAnswer, {x: lhsInput}) && (
          algebraicRulesService.ContainsSomeOf(rhsAnswer, {x: rhsInput})));
    } else {
      // Position of terms is irrelevant. So, we bring all terms on one side
      // and perform an exact match.
      let rhsAnswerModified = nerdamer(rhsAnswer).multiply('-1').text();
      let expressionAnswer = nerdamer(rhsAnswerModified).add(lhsAnswer).text();

      let rhsInputModified = nerdamer(rhsInput).multiply('-1').text();
      let expressionInput = nerdamer(rhsInputModified).add(lhsInput).text();

      return algebraicRulesService.ContainsSomeOf(
        expressionAnswer, {x: expressionInput});
    }
  }

  OmitsSomeOf(
      answer: MathEquationAnswer,
      inputs: MathEquationRuleInputsWithSide): boolean {
    let algebraicRulesService = new AlgebraicExpressionInputRulesService();

    let positionOfTerms = inputs.y;

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    if (positionOfTerms === 'lhs') {
      return algebraicRulesService.OmitsSomeOf(lhsAnswer, {x: lhsInput});
    } else if (positionOfTerms === 'rhs') {
      return algebraicRulesService.OmitsSomeOf(rhsAnswer, {x: rhsInput});
    } else if (positionOfTerms === 'both') {
      return (
        algebraicRulesService.OmitsSomeOf(lhsAnswer, {x: lhsInput}) && (
          algebraicRulesService.OmitsSomeOf(rhsAnswer, {x: rhsInput})));
    } else {
      // Position of terms is irrelevant. So, we bring all terms on one side
      // and perform an exact match.
      let rhsAnswerModified = nerdamer(rhsAnswer).multiply('-1').text();
      let expressionAnswer = nerdamer(rhsAnswerModified).add(lhsAnswer).text();

      let rhsInputModified = nerdamer(rhsInput).multiply('-1').text();
      let expressionInput = nerdamer(rhsInputModified).add(lhsInput).text();

      return algebraicRulesService.OmitsSomeOf(
        expressionAnswer, {x: expressionInput});
    }
  }

  MatchesWithGeneralForm(
      answer: MathEquationAnswer,
      inputs: MathEquationRuleInputsWithPlaceholder): boolean {
    let algebraicRulesService = new AlgebraicExpressionInputRulesService();

    let splitAnswer = answer.split('=');
    let lhsAnswer = splitAnswer[0], rhsAnswer = splitAnswer[1];

    let splitInput = inputs.x.split('=');
    let lhsInput = splitInput[0], rhsInput = splitInput[1];

    let placeholders = inputs.y;

    return algebraicRulesService.MatchesWithGeneralForm(
      lhsAnswer, {x: lhsInput, y: placeholders}) && (
      algebraicRulesService.MatchesWithGeneralForm(
        rhsAnswer, {x: rhsInput, y: placeholders}));
  }
}

angular.module('oppia').factory(
  'MathEquationInputRulesService',
  downgradeInjectable(MathEquationInputRulesService));
