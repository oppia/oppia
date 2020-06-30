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

import { MathInteractionsService } from 'services/math-interactions.service.ts';
import { IAlgebraicExpressionAnswer } from 'interactions/answer-defs';
import { IAlgebraicExpressionRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class AlgebraicExpressionInputRulesService {
  MatchesExactlyWith(
      answer: IAlgebraicExpressionAnswer,
      inputs: IAlgebraicExpressionRuleInputs): boolean {
    let mis = new MathInteractionsService();
    // Inserting '*' signs between variables if not present.
    answer = mis.insertMultiplicationSigns(answer);
    inputs.x = mis.insertMultiplicationSigns(inputs.x);

    return nerdamer(nerdamer(answer).text()).eq(nerdamer(inputs.x).text());
  }

  IsEquivalentTo(
      answer: IAlgebraicExpressionAnswer,
      inputs: IAlgebraicExpressionRuleInputs): boolean {
    let mis = new MathInteractionsService();
    // Inserting '*' signs between variables if not present.
    answer = mis.insertMultiplicationSigns(answer);
    inputs.x = mis.insertMultiplicationSigns(inputs.x);

    let expandedLearnerAnswer = nerdamer(answer).expand().text();
    let simplifiedLearnerAnswer = nerdamer(
      `simplify(${expandedLearnerAnswer})`).text();

    let expandedCreatorAnswer = nerdamer(inputs.x).expand().text();
    let simplifiedCreatorAnswer = nerdamer(
      `simplify(${expandedCreatorAnswer})`).text();

    return nerdamer(simplifiedLearnerAnswer).eq(simplifiedCreatorAnswer);
  }
}

angular.module('oppia').factory(
  'AlgebraicExpressionInputRulesService',
  downgradeInjectable(AlgebraicExpressionInputRulesService));
