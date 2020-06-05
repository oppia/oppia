// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator service for the interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IWarning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule } from
  'domain/exploration/RuleObjectFactory';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class SetInputValidationService {
  constructor(
    private baseInteractionValidationServiceInstance:
      baseInteractionValidationService) {}

  private isSameSet(inputA: string[], inputB: string[]): boolean {
    let setA = new Set(inputA);
    let setB = new Set(inputB);
    if (setA.size !== setB.size) {
      return false;
    }
    for (let element of setA.values()) {
      if (!setB.has(element)) {
        return false;
      }
    }
    return true;
  }

  private isSubset(inputA: string[], inputB: string[]): boolean {
    // Checks if set inputA is a subset of inputB.
    let setB = new Set(inputB);
    return inputA.every(val => setB.has(val));
  }

  private isSameRule(ruleA: Rule, ruleB: Rule): boolean {
    return ruleA.type === ruleB.type &&
      this.isSameSet(<string[]>ruleA.inputs.x, <string[]>ruleB.inputs.x);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with possible underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getCustomizationArgsWarnings(customizationArgs: any): any[] {
    let warningsList = [];

    let buttonText = customizationArgs.buttonText &&
      customizationArgs.buttonText.value;
    if (!angular.isString(buttonText)) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Button text must be a string.'
      });
    } else {
      if (buttonText.length === 0) {
        warningsList.push({
          message: 'Label for this button should not be empty.',
          type: AppConstants.WARNING_TYPES.ERROR
        });
      }
    }

    return warningsList;
  }

  getRuleAvailabilityWarnings(answerGroups: AnswerGroup[]): IWarning[] {
    let warningsList: IWarning[] = [];

    let previousRules: Array<{
      answerGroupIndex: number,
      ruleIndex: number,
      rule: Rule
    }> = [];

    for (let [answerGroupIndex, answerGroup] of answerGroups.entries()) {
      for (let [ruleIndex, rule] of answerGroup.rules.entries()) {
        for (let prevRule of previousRules) {
          if (this.isSameRule(prevRule.rule, rule)) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} is the same as ` +
                `rule ${prevRule.ruleIndex + 1} from ` +
                `answer group ${prevRule.answerGroupIndex + 1}`
            });
          } else if (prevRule.rule.type === rule.type) {
            // Only consider rules of the same type as the previous rule
            // of the same tyle might 'cover' the following one.
            let isRuleCoveredByAnyPrevRule = false;
            let ruleInput = <string[]>rule.inputs.x;
            let prevRuleInput = <string[]>prevRule.rule.inputs.x;
            switch (rule.type) {
              case 'Equals':
                break;
              case 'IsSubsetOf':
              case 'HasElementsIn':
              case 'IsDisjointFrom':
                isRuleCoveredByAnyPrevRule = this.isSubset(
                  ruleInput, prevRuleInput
                );
                break;
              case 'IsSupersetOf':
              case 'HasElementsNotIn':
              case 'OmitsElementsIn':
                isRuleCoveredByAnyPrevRule = this.isSubset(
                  prevRuleInput, ruleInput
                );
                break;
              default:
            }

            if (isRuleCoveredByAnyPrevRule) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: `Rule ${ruleIndex + 1} from answer group ` +
                  `${answerGroupIndex + 1} will never be matched because it ` +
                  `is made redundant by rule ${prevRule.ruleIndex + 1}` +
                  ` from answer group ${prevRule.answerGroupIndex + 1}.`
              });
            }
          }
        }

        previousRules.push({
          rule,
          ruleIndex,
          answerGroupIndex
        });
      }
    }

    return warningsList;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with possible underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getAllWarnings(
      stateName: string, customizationArgs: any, answerGroups: AnswerGroup[],
      defaultOutcome: Outcome): IWarning[] {
    return [
      ...this.getCustomizationArgsWarnings(customizationArgs),
      ...this.getRuleAvailabilityWarnings(answerGroups),
      ...this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName)
    ];
  }
}

angular.module('oppia').factory(
  'SetInputValidationService', downgradeInjectable(SetInputValidationService));
