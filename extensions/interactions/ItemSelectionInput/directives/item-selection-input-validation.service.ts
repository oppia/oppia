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

import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {
  Warning,
  BaseInteractionValidationService,
} from 'interactions/base-interaction-validation.service';
import {ItemSelectionInputCustomizationArgs} from 'interactions/customization-args-defs';
import {Outcome} from 'domain/exploration/outcome.model';
import {Rule} from 'domain/exploration/rule.model';

import {AppConstants} from 'app.constants';
import {ItemSelectionRuleInputs} from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root',
})
export class ItemSelectionInputValidationService {
  constructor(
    private baseInteractionValidationServiceInstance: BaseInteractionValidationService
  ) {}

  rulesSet = new Set<string>();

  getCustomizationArgsWarnings(
    customizationArgs: ItemSelectionInputCustomizationArgs
  ): Warning[] {
    var warningsList = [];

    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs,
      ['choices']
    );

    var areAnyChoicesEmpty = false;
    var areAnyChoicesDuplicated = false;
    var seenChoices = [];
    var handledAnswers = [];
    var numChoices = customizationArgs.choices.value.length;

    for (var i = 0; i < numChoices; i++) {
      var choice = customizationArgs.choices.value[i].html;
      if (this.baseInteractionValidationServiceInstance.isHTMLEmpty(choice)) {
        areAnyChoicesEmpty = true;
      }
      if (seenChoices.indexOf(choice) !== -1) {
        areAnyChoicesDuplicated = true;
      }
      seenChoices.push(choice);
      handledAnswers.push(false);
    }

    if (areAnyChoicesEmpty) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are nonempty.',
      });
    }

    if (areAnyChoicesDuplicated) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are unique.',
      });
    }

    var minAllowedCount = customizationArgs.minAllowableSelectionCount.value;
    var maxAllowedCount = customizationArgs.maxAllowableSelectionCount.value;

    if (minAllowedCount > maxAllowedCount) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please ensure that the max allowed count is not less than the ' +
          'min count.',
      });
    }

    if (numChoices < minAllowedCount) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please ensure that you have enough choices to reach the min ' +
          'count.',
      });
    } else if (numChoices < maxAllowedCount) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please ensure that you have enough choices to reach the max ' +
          'count.',
      });
    }
    return warningsList;
  }

  private calculateHandledAnswers(
    ruleInputs: string[],
    answerChoiceToIndex: Record<string, number>,
    rule: Rule,
    handledAnswers: boolean[]
  ) {
    ruleInputs.forEach(ruleInput => {
      const choiceIndex = answerChoiceToIndex[ruleInput];
      if (rule.type === 'Equals') {
        handledAnswers[choiceIndex] = true;
      } else if (rule.type === 'IsProperSubsetOf') {
        handledAnswers[choiceIndex] = true;
      } else if (rule.type === 'ContainsAtLeastOneOf') {
        handledAnswers[choiceIndex] = true;
      } else if (rule.type === 'DoesNotContainAtLeastOneOf') {
        for (let i = 0; i < handledAnswers.length; i++) {
          if (i !== choiceIndex) {
            handledAnswers[i] = true;
          }
        }
      }
    });
  }

  private getWarningsWithSingleSelectionAllowedMax(
    stateName: string,
    customizationArgs: ItemSelectionInputCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    const warningsList: Warning[] = [];

    let areAllChoicesCovered = false;
    const seenChoices = customizationArgs.choices.value;
    const handledAnswers = Array(seenChoices.length).fill(false);

    const answerChoiceToIndex: Record<string, number> = {};
    seenChoices.forEach((seenChoice, choiceIndex) => {
      const contentId = seenChoice.contentId;
      if (contentId === null) {
        throw new Error('ContentId of choice does not exist');
      }
      answerChoiceToIndex[contentId] = choiceIndex;
    });

    answerGroups.forEach((answerGroup, answerIndex) => {
      const rules = answerGroup.rules;
      rules.forEach((rule, ruleIndex) => {
        const ruleInputs = rule.inputs.x as string[];
        if (rule.type === 'Equals' && ruleInputs.length > 1) {
          warningsList.push({
            type: AppConstants.WARNING_TYPES.ERROR,
            message:
              'In Oppia Response ' +
              (answerIndex + 1) +
              ', ' +
              'Learner answer ' +
              (ruleIndex + 1) +
              ', ' +
              'please select only one answer choice',
          });
        }

        this.calculateHandledAnswers(
          ruleInputs,
          answerChoiceToIndex,
          rule,
          handledAnswers
        );
      });
    });
    areAllChoicesCovered = handledAnswers.every(handledAnswer => {
      return handledAnswer;
    });
    if (!areAllChoicesCovered) {
      if (!defaultOutcome || defaultOutcome.isConfusing(stateName)) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            'Please add something for Oppia to say in the ' +
            '"All other answers" response',
        });
      }
    }

    return warningsList;
  }

  private getWarningsForRulesInputs(
    rule: Rule,
    choicesContentIds: Set<string | null>,
    ruleIndex: number,
    answerIndex: number
  ) {
    const warningsList: Warning[] = [];
    const ruleInputs = rule.inputs.x as string[];
    ruleInputs.forEach(ruleInput => {
      if (!choicesContentIds.has(ruleInput)) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message:
            `Learner answer ${ruleIndex + 1} from Oppia response ` +
            `${answerIndex + 1} options do not match customization ` +
            'argument choices',
        });
      }
    });
    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: ItemSelectionInputCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    let warningsList: Warning[] = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs)
    );

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAnswerGroupWarnings(
        answerGroups,
        stateName
      )
    );

    const minAllowedCount = customizationArgs.minAllowableSelectionCount.value;
    const maxAllowedCount = customizationArgs.maxAllowableSelectionCount.value;

    if (maxAllowedCount === 1) {
      const warnings = this.getWarningsWithSingleSelectionAllowedMax(
        stateName,
        customizationArgs,
        answerGroups,
        defaultOutcome
      );

      warningsList.push(...warnings);
    }

    const choicesContentIds = new Set(
      customizationArgs.choices.value.map(choice => choice.contentId)
    );
    this.rulesSet.clear();
    answerGroups.forEach((answerGroup, answerIndex) => {
      var rules = answerGroup.rules;
      rules.forEach((rule, ruleIndex) => {
        const ruleInputs = rule.inputs.x as string[];
        warningsList = warningsList.concat(
          this.getWarningsForRulesInputs(
            rule,
            choicesContentIds,
            ruleIndex,
            answerIndex
          )
        );

        if (rule.type === 'IsProperSubsetOf') {
          if (ruleInputs.length < 2) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                'In Oppia response ' +
                (answerIndex + 1) +
                ', ' +
                'learner answer ' +
                (ruleIndex + 1) +
                ', the "proper ' +
                'subset" learner answer must include at least 2 options',
            });
          }
        } else if (rule.type === 'Equals') {
          if (
            minAllowedCount > ruleInputs.length ||
            maxAllowedCount < ruleInputs.length
          ) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                'In Oppia response ' +
                (answerIndex + 1) +
                ', ' +
                'Learner answer ' +
                (ruleIndex + 1) +
                ', the number of ' +
                'correct options in the "Equals" learner answer should be ' +
                'between ' +
                minAllowedCount +
                ' and ' +
                maxAllowedCount +
                ' (the minimum and maximum allowed selection counts)',
            });
          }
        }
        if (ruleInputs.length === 0) {
          if (rule.type === 'ContainsAtLeastOneOf') {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message:
                'In Oppia response ' +
                (answerIndex + 1) +
                ', learner answer ' +
                (ruleIndex + 1) +
                ', the "ContainsAtLeastOneOf" learner ' +
                'answer should have at least one option',
            });
          }
        }
      });
    });
    // Map serialized rule + input to answer group index.
    const rulesToAnswerGroupIndex: {[key: string]: number} = {};
    for (let [answerGroupIndex, group] of answerGroups.entries()) {
      for (let [ruleIndex, rule] of group.rules.entries()) {
        const itemSelectionInputs =
          rule.inputs as unknown as ItemSelectionRuleInputs;
        // Serialize all rule inputs in a general and reversible way,
        // Supporting multiple input keys (not just 'x') and ensuring consistent ordering.
        const inputs = Object.fromEntries(
          Object.entries(itemSelectionInputs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => {
              // If array, sort for consistent ordering.
              if (Array.isArray(value)) {
                return [key, [...value].sort()];
              }
              // For other types (numbers, strings, booleans, etc.), keep as it is.
              return [key, value];
            })
        );
        const stringifiedInputs = JSON.stringify(inputs);
        const ruleKey = `${rule.type}:${stringifiedInputs}`;
        if (rulesToAnswerGroupIndex.hasOwnProperty(ruleKey)) {
          const ag = rulesToAnswerGroupIndex[ruleKey];
          warningsList.push({
            type: AppConstants.WARNING_TYPES.ERROR,
            message: `Rule ${ruleIndex + 1} of answer group ${answerGroupIndex + 1} is already present in answer group ${ag} -- please remove or edit the rule in the answer group to avoid duplicate rules`,
          });
        } else {
          rulesToAnswerGroupIndex[ruleKey] = answerGroupIndex + 1;
        }
      }
    }
    return warningsList;
  }
}
