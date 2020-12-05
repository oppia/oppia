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
 * @fileoverview Validator service for the RatioExpressionInput interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { RatioExpressionInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { Ratio } from 'domain/objects/ratio.model';
import { RatioExpressionInputRulesService } from
  './ratio-expression-input-rules.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class RatioExpressionInputValidationService {
  constructor(
    private baseInteractionValidationServiceInstance:
      baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: RatioExpressionInputCustomizationArgs): Warning[] {
    var isNonNegativeInt = function(number) {
      return angular.isNumber(number) && number % 1 === 0 && number >= 0;
    };
    var expectedNumberOfTerms = customizationArgs.numberOfTerms.value;
    // 0 is allowed as an input, as that corresponds to having no limit.
    if (expectedNumberOfTerms === undefined ||
        !isNonNegativeInt(expectedNumberOfTerms)
    ) {
      return [
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            'The number of terms should be a non-negative integer other than 1.'
          )
        }
      ];
    } else if (expectedNumberOfTerms === 1) {
      return [
        {
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            'The number of terms in a ratio should be greater than 1.')
        }
      ];
    } else {
      return [];
    }
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: RatioExpressionInputCustomizationArgs,
      answerGroups: AnswerGroup[],
      defaultOutcome: Outcome): Warning[] {
    let warningsList = [];
    let ratioRulesService = (
      new RatioExpressionInputRulesService());
    var expectedNumberOfTerms = customizationArgs.numberOfTerms.value;
    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    // Checks whether currentInput has less number of terms than seenInput.
    let hasLessNumberOfTerms = function(
        currentRuleType: string,
        seenRuleType: string,
        currentInput: number[],
        seenInput: number
    ): boolean {
      return (
        seenRuleType === 'HasNumberOfTermsEqualTo' &&
        currentRuleType !== 'HasNumberOfTermsEqualTo' &&
        ratioRulesService.HasNumberOfTermsEqualTo(
          currentInput, {y: seenInput})
      );
    };

    // The following validations ensure that there are no redundant rules
    // present in the answer groups. In particular, an Equals rule will make
    // all of the following rules with a matching input invalid. A
    // HasNumberOfTermsEqualTo rule will make the following rules of the same
    // rule type and a matching input invalid.
    let seenRules = [];

    for (let i = 0; i < answerGroups.length; i++) {
      let rules = answerGroups[i].rules;
      for (let j = 0; j < rules.length; j++) {
        let currentRuleType = <string> rules[j].type;
        let currentInput = null;
        var ratio: Ratio = null;
        if (currentRuleType === 'HasNumberOfTermsEqualTo') {
          currentInput = <number> rules[j].inputs.y;
        } else {
          currentInput = <number[]> rules[j].inputs.x;
        }

        if (expectedNumberOfTerms >= 2) {
          if (currentRuleType === 'HasNumberOfTermsEqualTo') {
            if (currentInput !== expectedNumberOfTerms) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  `Rule ${j + 1} from answer group ${i + 1} will never be` +
                  ' matched because it has differing number of terms than ' +
                  'required.'
                )
              });
            }
          } else {
            ratio = Ratio.fromList(<number[]> currentInput);
            if (ratio.getNumberOfTerms() !== expectedNumberOfTerms) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  `Rule ${j + 1} from answer group ${i + 1} will never be` +
                  ' matched because it has differing number of terms than ' +
                  'required.'
                )
              });
            }
          }
        }
        ratio = Ratio.fromList(<number[]> currentInput);
        for (let seenRule of seenRules) {
          let seenInput = seenRule.inputs.x || seenRule.inputs.y;
          let seenRuleType = <string> seenRule.type;

          if (
            seenRuleType === 'Equals' &&
            currentRuleType !== 'IsEquivalent' &&
            currentRuleType !== 'HasNumberOfTermsEqualTo' && (
              ratioRulesService.Equals(
                seenInput, {x: currentInput}))) {
            // This rule will make all of the following matching
            // inputs obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                `Rule ${j + 1} from answer group ${i + 1} will never` +
                ' be matched because it is preceded by a \'Equals\' rule with' +
                ' a matching input.')
            });
          } else if (
            seenRuleType === 'IsEquivalent' &&
            currentRuleType !== 'HasNumberOfTermsEqualTo' && (
              ratioRulesService.IsEquivalent(
                seenInput, {x: currentInput}))) {
            // This rule will make the following inputs with
            // IsEquivalent rule obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                `Rule ${j + 1} from answer group ${i + 1} will never` +
                ' be matched because it is preceded by a \'IsEquivalent\'' +
                ' rule with a matching input.')
            });
          } else if (
            seenRuleType === 'HasNumberOfTermsEqualTo' &&
            hasLessNumberOfTerms(
              currentRuleType, seenRuleType, currentInput, seenInput
            )
          ) {
            // This rule will make the following inputs with
            // HasNumberOfTermsEqualTo rule obsolete.
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                `Rule ${j + 1} from answer group ${i + 1} will never` +
                ' be matched because the \'HasNumberOfTermsEqualTo\' ' +
                'rule is preceded by a rule with a matching input.')
            });
          } else if (
            currentRuleType === 'HasNumberOfTermsEqualTo' &&
            seenRuleType === 'HasNumberOfTermsEqualTo' && (
              currentInput === seenRule.inputs.y)) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: (
                `Rule ${j + 1} from answer group ${i + 1} will never` +
                ' be matched because it is preceded by a ' +
                '\'HasNumberOfTermsEqualTo\' rule with a matching input.')
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
  'RatioExpressionInputValidationService',
  downgradeInjectable(RatioExpressionInputValidationService));
