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

  MatchesUpToTrivialManipulations(
      answer: NumericExpressionAnswer,
      inputs: NumericExpressionRuleInputs
  ): boolean {
    let mis = new MathInteractionsService();

    // The expression is first split into terms by addition and subtraction.
    let answerTerms = mis.getTerms(answer);
    let inputTerms = mis.getTerms(inputs.x);

    // Now, we try to match all terms between the answer and input.
    // NOTE: We only need to iterate from the top in the answerTerms list since
    // in the inputTerms list, we will break the loop each time an element is
    // removed from it, thus, indexing errors would only arise in the outer
    // loop.
    for (let i = answerTerms.length - 1; i >= 0; i--) {
      for (let j = 0; j < inputTerms.length; j++) {
        if (mis.doTermsMatch(answerTerms[i], inputTerms[j])) {
          answerTerms.splice(i, 1);
          inputTerms.splice(j, 1);
          break;
        }
      }
    }

    // The two expressions are considered an exact match if both lists are empty
    // implying that each term in the answer got uniquely matched with a term
    // in the input.
    return answerTerms.length === 0 && inputTerms.length === 0;
  }

  IsEquivalentTo(
      answer: NumericExpressionAnswer, inputs: NumericExpressionRuleInputs
  ): boolean {
    return nerdamer(answer).eq(
      nerdamer(inputs.x).toString()
    );
  }
}

angular.module('oppia').factory(
  'NumericExpressionInputRulesService',
  downgradeInjectable(NumericExpressionInputRulesService));
