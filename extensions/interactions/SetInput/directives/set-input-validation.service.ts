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

import {Injectable} from '@angular/core';

import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {AppConstants} from 'app.constants';
import {
  Warning,
  baseInteractionValidationService,
} from 'interactions/base-interaction-validation.service';
import {SetInputCustomizationArgs} from 'interactions/customization-args-defs';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {Rule} from 'domain/exploration/rule.model';
import {TranslatableSetOfUnicodeString} from 'interactions/rule-input-defs';

interface PreviousRule {
  answerGroupIndex: number;
  ruleIndex: number;
  rule: Rule;
}

@Injectable({
  providedIn: 'root',
})
export class SetInputValidationService {
  constructor(
    private baseInteractionValidationServiceInstance: baseInteractionValidationService
  ) {}

  /**
   * Checks if the two sets are identical.
   *
   * @param {string[]} inputA first set.
   * @param {string[]} inputB second set.
   * @return {boolean} True if the two sets are identical.
   */
  private areSameSet(inputA: string[], inputB: string[]): boolean {
    let setA = new Set(inputA);
    let setB = new Set(inputB);
    if (setA.size !== setB.size) {
      return false;
    }
    return this.isSubset(inputA, inputB);
  }

  /**
   * Checks if the first set is a subset of the second set.
   *
   * @param {string[]} inputA first set.
   * @param {string[]} inputB second set.
   * @return {boolean} True if the first set is a subset of the second set.
   */
  private isSubset(inputA: string[], inputB: string[]): boolean {
    let setB = new Set(inputB);
    return inputA.every(val => setB.has(val));
  }

  /**
   * Checks if the two rules are identical.
   *
   * @param {Rule} ruleA first rule.
   * @param {Rule} ruleB second rule.
   * @return {boolean} True if the two rules are identical.
   */
  private areSameRule(ruleA: Rule, ruleB: Rule): boolean {
    return (
      ruleA.type === ruleB.type &&
      this.areSameSet(
        (ruleA.inputs.x as TranslatableSetOfUnicodeString).unicodeStrSet,
        (ruleB.inputs.x as TranslatableSetOfUnicodeString).unicodeStrSet
      )
    );
  }

  getCustomizationArgsWarnings(
    customizationArgs: SetInputCustomizationArgs
  ): Warning[] {
    let warningsList = [];

    let buttonText =
      customizationArgs.buttonText && customizationArgs.buttonText.value;
    if (!buttonText || !angular.isString(buttonText.unicode)) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Button text must be a string.',
      });
    } else if (buttonText.unicode.length === 0) {
      warningsList.push({
        message: 'Label for this button should not be empty.',
        type: AppConstants.WARNING_TYPES.ERROR,
      });
    }

    return warningsList;
  }

  /**
   * Generate warnings for redundant rules in answer groups.
   * A rule is considered redundant if it will never be matched.
   *
   * @param {AnswerGroup[]} answerGroups answer groups created from user input.
   * @return {Warning[]} Array of warnings.
   */
  getRedundantRuleWarnings(answerGroups: AnswerGroup[]): Warning[] {
    let warningsList: Warning[] = [];

    let previousRules: PreviousRule[] = [];

    for (let [answerGroupIndex, answerGroup] of answerGroups.entries()) {
      for (let [ruleIndex, rule] of answerGroup.rules.entries()) {
        for (let prevRule of previousRules) {
          if (this.areSameRule(prevRule.rule, rule)) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                `Learner answer ${ruleIndex + 1} from Oppia response ` +
                `${answerGroupIndex + 1} is the same as ` +
                `answer ${prevRule.ruleIndex + 1} from ` +
                `Oppia response ${prevRule.answerGroupIndex + 1}`,
            });
          } else if (prevRule.rule.type === rule.type) {
            /*
            For setInput, a rule A is made redundant by rule B only when:
              - rule B appears before rule A, and
              - they are of the same type, and
              - they are not 'Equals' rules, and
              - A's input is the subset of B's input or vice versa,
                depending on their rule types.
            */
            let isRuleCoveredByAnyPrevRule = false;
            let ruleInput = rule.inputs.x as TranslatableSetOfUnicodeString;
            let prevRuleInput = prevRule.rule.inputs
              .x as TranslatableSetOfUnicodeString;
            switch (rule.type) {
              case 'Equals':
                // An 'Equals' rule is made redundant by another only when
                // they are the same, which has been checked in the code above,
                // using areSameRule method.
                break;
              case 'IsSubsetOf':
              case 'HasElementsIn':
              case 'IsDisjointFrom':
                isRuleCoveredByAnyPrevRule = this.isSubset(
                  ruleInput.unicodeStrSet,
                  prevRuleInput.unicodeStrSet
                );
                break;
              case 'IsSupersetOf':
              case 'HasElementsNotIn':
              case 'OmitsElementsIn':
                isRuleCoveredByAnyPrevRule = this.isSubset(
                  prevRuleInput.unicodeStrSet,
                  ruleInput.unicodeStrSet
                );
                break;
              default:
            }

            if (isRuleCoveredByAnyPrevRule) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message:
                  `Learner answer ${ruleIndex + 1} from Oppia response ` +
                  `${answerGroupIndex + 1} will never be matched because it ` +
                  `is made redundant by answer ${prevRule.ruleIndex + 1} ` +
                  `from Oppia response ${prevRule.answerGroupIndex + 1}.`,
              });
            }
          }
        }

        previousRules.push({
          rule,
          ruleIndex,
          answerGroupIndex,
        });
      }
    }

    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: SetInputCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    return [
      ...this.getCustomizationArgsWarnings(customizationArgs),
      ...this.getRedundantRuleWarnings(answerGroups),
      ...this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups,
        defaultOutcome,
        stateName
      ),
    ];
  }
}
