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
 * @fileoverview Rules service for the AlgebraicExpressionInput interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import nerdamer from 'nerdamer';

import { MathInteractionsService } from 'services/math-interactions.service';
import { AlgebraicExpressionAnswer } from 'interactions/answer-defs';
import {
  AlgebraicExpressionRuleInputs
} from 'interactions/rule-input-defs';
import { NumericExpressionInputRulesService } from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';

@Injectable({
  providedIn: 'root'
})
export class AlgebraicExpressionInputRulesService {
  constructor(
    private mathInteractionsService: MathInteractionsService,
    private numericExpressionRuleService: NumericExpressionInputRulesService) {}

  MatchesExactlyWith(
      answer: AlgebraicExpressionAnswer,
      inputs: AlgebraicExpressionRuleInputs): boolean {
    // If the answer and the inputs are both purely numeric, we use the numeric
    // expression input's rule functions.
    if (
      !this.mathInteractionsService.containsAtLeastOneVariable(answer) &&
      !this.mathInteractionsService.containsAtLeastOneVariable(inputs.x)
    ) {
      return this.numericExpressionRuleService.MatchesExactlyWith(
        answer, inputs);
    }

    // Inserting '*' signs between variables if not present.
    answer = this.mathInteractionsService.insertMultiplicationSigns(answer);
    inputs.x = this.mathInteractionsService.insertMultiplicationSigns(inputs.x);
    return answer === inputs.x;
  }

  MatchesUpToTrivialManipulations(
      answer: AlgebraicExpressionAnswer,
      inputs: AlgebraicExpressionRuleInputs
  ): boolean {
    // Inserting '*' signs between variables if not present.
    answer = this.mathInteractionsService.insertMultiplicationSigns(answer);
    inputs.x = this.mathInteractionsService.insertMultiplicationSigns(inputs.x);
    return this.numericExpressionRuleService.MatchesUpToTrivialManipulations(
      answer, inputs);
  }

  IsEquivalentTo(
      answer: AlgebraicExpressionAnswer,
      inputs: AlgebraicExpressionRuleInputs): boolean {
    // If the answer and the inputs are both purely numeric, we use the numeric
    // expression input's rule functions.
    if (
      !this.mathInteractionsService.containsAtLeastOneVariable(answer) &&
      !this.mathInteractionsService.containsAtLeastOneVariable(inputs.x)
    ) {
      return this.numericExpressionRuleService.IsEquivalentTo(answer, inputs);
    }

    // Inserting '*' signs between variables if not present.
    answer = this.mathInteractionsService.insertMultiplicationSigns(answer);
    inputs.x = this.mathInteractionsService.insertMultiplicationSigns(inputs.x);

    let expandedLearnerAnswer = nerdamer(answer).expand().text();
    let simplifiedLearnerAnswer = nerdamer(
      `simplify(${expandedLearnerAnswer})`).text();

    let expandedCreatorAnswer = nerdamer(inputs.x).expand().text();
    let simplifiedCreatorAnswer = nerdamer(
      `simplify(${expandedCreatorAnswer})`).text();
    return nerdamer(
      simplifiedLearnerAnswer
    ).eq(simplifiedCreatorAnswer);
  }
}

angular.module('oppia').factory(
  'AlgebraicExpressionInputRulesService',
  downgradeInjectable(AlgebraicExpressionInputRulesService));
