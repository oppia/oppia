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
 * @fileoverview Rules service for the NumericExpressionInput interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import nerdamer from 'nerdamer';

import { MathInteractionsService } from 'services/math-interactions.service';
import { NumericExpressionAnswer } from 'interactions/answer-defs';
import { NumericExpressionRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class NumericExpressionInputRulesService {
  MatchesExactlyWith(
      answer: NumericExpressionAnswer,
      inputs: NumericExpressionRuleInputs): boolean {
    answer = answer.replace(/\s/g, '');
    inputs.x = inputs.x.replace(/\s/g, '');

    return answer === inputs.x;
  }

  IsEquivalentTo(
      answer: NumericExpressionAnswer, inputs: NumericExpressionRuleInputs
  ): boolean {
    return nerdamer(answer).eq(
      nerdamer(inputs.x).toString()
    );
  }

  ContainsSomeOf(
      answer: NumericExpressionAnswer,
      inputs: NumericExpressionRuleInputs): boolean {
    // At least one term should match between answer and input.
    let mis = new MathInteractionsService();

    // The expression is first split into terms by addition and subtraction.
    let answerTerms = mis.getTerms(answer);
    let inputTerms = mis.getTerms(inputs.x);

    for (let answerTerm of answerTerms) {
      for (let inputTerm of inputTerms) {
        if (mis.termsMatch(answerTerm, inputTerm)) {
          return true;
        }
      }
    }
    return false;
  }

  OmitsSomeOf(
      answer: NumericExpressionAnswer,
      inputs: NumericExpressionRuleInputs): boolean {
    // There must be at least one term in the input that is not present in the
    // answer.
    let mis = new MathInteractionsService();

    // The expression is first split into terms by addition and subtraction.
    let answerTerms = mis.getTerms(answer);
    let inputTerms = mis.getTerms(inputs.x);

    for (let inputTerm of inputTerms) {
      let matched = false;
      for (let answerTerm of answerTerms) {
        if (mis.termsMatch(answerTerm, inputTerm)) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        return true;
      }
    }
    return false;
  }
}

angular.module('oppia').factory(
  'NumericExpressionInputRulesService',
  downgradeInjectable(NumericExpressionInputRulesService));
