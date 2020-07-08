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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

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
    let warningsList = [];
    let algebraicRulesService = (
      new AlgebraicExpressionInputRulesService());

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));


    // This validations ensures that there are no redundant rules present in the
    // answer groups.
    // An IsEquivalentTo rule will make all of the following rules with a
    // matching input, invalid.
    // A MatchesExactlyWith rule will make the following rules of the same rule
    // type and a matching input, invalid.
    let seenRules = [];

    for (let i = 0; i < answerGroups.length; i++) {
      let rules = answerGroups[i].rules;
      for (let j = 0; j < rules.length; j++) {
        let currentInput = <string> rules[j].inputs.x;
        let currentRuleType = <string> rules[j].type;

        for (let seenRule of seenRules) {
          let seenInput = <string> seenRule.inputs.x;
          let seenRuleType = <string> seenRule.type;

          if (seenRuleType === 'IsEquivalentTo' && (
            algebraicRulesService.IsEquivalentTo(
            seenInput, {x: currentInput}))) {
            // This rule will make all of the following matching
            // inputs obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Rule ' + (j + 1) + ' from answer group ' + (i + 1) +
                ' will never be matched because it is preceded ' +
                'by an \'IsEquivalentTo\' rule with a matching input.')
            });
          } else if (currentRuleType === 'MatchesExactlyWith' && (
            algebraicRulesService.MatchesExactlyWith(
            seenInput, {x: currentInput}))) {
            // This rule will make the following inputs with MatchesExactlyWith
            // rule obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Rule ' + (j + 1) + ' from answer group ' + (i + 1) +
                ' will never be matched because it is preceded ' +
                'by a \'MatchesExactlyWith\' rule with a matching input.')
            });
          }
        }
        seenRules.push(rules[j]);
      }
    }

    return warningsList;
  }
}

angular.module('oppia').factory(
  'AlgebraicExpressionInputValidationService',
  downgradeInjectable(AlgebraicExpressionInputValidationService));
