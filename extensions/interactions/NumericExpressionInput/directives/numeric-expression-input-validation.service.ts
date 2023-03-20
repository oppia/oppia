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
 * @fileoverview Validator service for the NumericExpressionInput interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { MathInteractionsService } from 'services/math-interactions.service';
import { NumericExpressionInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { NumericExpressionInputRulesService } from
  './numeric-expression-input-rules.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class NumericExpressionInputValidationService {
  private supportedFunctionNames = AppConstants.SUPPORTED_FUNCTION_NAMES;

  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: NumericExpressionInputCustomizationArgs): Warning[] {
    return [];
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: NumericExpressionInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): Warning[] {
    let warningsList: Warning[] = [];
    let algebraicRulesService = (
      new NumericExpressionInputRulesService());
    let mathInteractionsService = new MathInteractionsService();

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

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
        let currentInput = rules[j].inputs.x as string;
        let currentRuleType = rules[j].type as string;

        let unsupportedFunctions = (
          mathInteractionsService.checkUnsupportedFunctions(currentInput));
        if (unsupportedFunctions.length > 0) {
          warningsList.push({
            type: AppConstants.WARNING_TYPES.ERROR,
            message: (
              'Input for learner answer ' + (j + 1) + ' from Oppia ' +
              'response ' + (i + 1) + ' uses these function(s) ' +
              'that aren\'t supported: [' + unsupportedFunctions +
              '] The supported functions are: ' +
              '[' + this.supportedFunctionNames + ']'
            )
          });
        }

        for (let seenRule of seenRules) {
          let seenInput = seenRule.inputs.x as string;
          let seenRuleType = seenRule.type as string;

          if (seenRuleType === 'IsEquivalentTo' && (
            algebraicRulesService.IsEquivalentTo(
              seenInput, {x: currentInput}))) {
            // This rule will make all of the following matching
            // inputs obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Learner answer ' + (j + 1) + ' from Oppia ' +
                'response ' + (i + 1) + ' will never be matched ' +
                'because it is preceded by an \'IsEquivalentTo\' ' +
                'answer with a matching input.')
            });
          } else if (currentRuleType === 'MatchesExactlyWith' && (
            algebraicRulesService.MatchesExactlyWith(
              seenInput, {x: currentInput}))) {
            // This rule will make the following inputs with MatchesExactlyWith
            // rule obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                'Learner answer ' + (j + 1) + ' from Oppia ' +
                'response ' + (i + 1) + ' will never be matched ' +
                'because it is preceded by a \'MatchesExactlyWith\' ' +
                'answer with a matching input.')
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
  'NumericExpressionInputValidationService',
  downgradeInjectable(NumericExpressionInputValidationService));
