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
 * @fileoverview Validator service for the AlgebraicExpressionInput interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IWarning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { IAlgebraicExpressionInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { AlgebraicExpressionInputRulesService } from
  './algebraic-expression-input-rules.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class AlgebraicExpressionInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getAllWarnings(
      stateName: string,
      customizationArgs: IAlgebraicExpressionInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): IWarning[] {
    var warningsList = [];
    var aeirs = (
      new AlgebraicExpressionInputRulesService());

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));


    // The following checks if an answer group with MatchesExactlyWith rule is
    // preceded by a IsEquivalentTo rule with a matching input. If so, the
    // MatchesExactlyRule will never be matched.
    var seenIsEquivalentToInputs = [];

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var currentInput = <string> rules[j].inputs.x;
        if (rules[j].type === 'IsEquivalentTo') {
          // Adding all inputs with rule type IsEquivalentTo to the seen array.
          seenIsEquivalentToInputs.push(currentInput);
        } else {
          // For an input with rule type MatchesExactlyWith, it is compared with
          // all of the preceding inputs that have rule type IsEquivalentTo and
          // it is checked if the current input matches with any of the
          // previously seen inputs.
          var matched = false;
          for (var seenInput of seenIsEquivalentToInputs) {
            if (aeirs.IsEquivalentTo(seenInput, {x: currentInput})) {
              matched = true;
              break;
            }
          }
          if (matched) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Rule ' + (j + 1) + ' from answer group ' + (i + 1) +
                ' will never be matched because it is preceded ' +
                'by an \'IsEquivalentToRule\' with a matching input.')
            });
          }
        }
      }
    }

    return warningsList;
  }
}

angular.module('oppia').factory(
  'AlgebraicExpressionInputValidationService',
  downgradeInjectable(AlgebraicExpressionInputValidationService));
