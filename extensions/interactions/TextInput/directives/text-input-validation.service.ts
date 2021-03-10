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
import { AppConstants } from 'app.constants';
import { baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { TextInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { TextInputRulesService } from './text-input-rules.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { TranslatableSetOfNormalizedString } from 'interactions/rule-input-defs';
import { UtilsService } from 'services/utils.service';

interface Warning {
  type: string,
  message: string
}

@Injectable({
  providedIn: 'root'
})
export class TextInputValidationService {
  constructor(private bivs: baseInteractionValidationService) {}
  getCustomizationArgsWarnings(
      customizationArgs: TextInputCustomizationArgs): Warning[] {
    let warningsList = [];
    this.bivs.requireCustomizationArguments(
      customizationArgs,
      ['placeholder', 'rows']);

    let placeholder = customizationArgs.placeholder.value;

    if (
      !(placeholder instanceof SubtitledUnicode) ||
      !angular.isString(placeholder.unicode)
    ) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'Placeholder text must be a string.')
      });
    }

    let isInt = function(n) {
      return angular.isNumber(n) && n % 1 === 0;
    };

    let rows = customizationArgs.rows.value;
    if (isInt(rows)) {
      let textSpecs = InteractionSpecsConstants.INTERACTION_SPECS.TextInput;
      let customizationArgSpecs = textSpecs.customization_arg_specs;
      let rowsSpecs = customizationArgSpecs[1];
      let minRows = rowsSpecs.schema.validators[0].min_value;
      let maxRows = rowsSpecs.schema.validators[1].max_value;
      if (rows < minRows || rows > maxRows) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: (
            'Number of rows must be between ' + minRows + ' and ' +
            maxRows + '.')
        });
      }
    } else {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'Number of rows must be integral.')
      });
    }
    return warningsList;
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: TextInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): Warning[] {
    let warningsList: Warning[] = [];
    let textInputRulesService = (
      new TextInputRulesService(
        new NormalizeWhitespacePipe(new UtilsService())));

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    let seenStringsContains: string[] = [];
    let seenStringsStartsWith: string[] = [];
    let seenStringsEquals: string[] = [];
    let seenStringsFuzzyEquals: string[] = [];
    let seenRuleTypes: Set<string>;

    for (let [answerGroupIndex, answerGroup] of answerGroups.entries()) {
      seenRuleTypes = new Set();
      for (let [ruleIndex, rule] of answerGroup.rules.entries()) {
        if (seenRuleTypes.has(rule.type)) {
          warningsList.push({
            type: AppConstants.WARNING_TYPES.ERROR,
            message: (
              `Answer group ${answerGroupIndex + 1} has multiple rules with ` +
              `the same type \'${rule.type}\' within the same group.`
            )
          });
        }
        seenRuleTypes.add(rule.type);


        let currentStrings = (
          <TranslatableSetOfNormalizedString>rule.inputs.x).normalizedStrSet;
        if (rule.type === 'Contains') {
          // Check if any of the current strings contain any of the previously
          // seen strings as a substring.
          const hasCollision = seenStringsContains.some(
            seenString => currentStrings.some(
              currentString => currentString.includes(seenString)
            )
          );

          if (hasCollision || seenStringsStartsWith.includes('')) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'Contains\' rule with a matching input.'
            });
          }

          seenStringsContains.push(...currentStrings);
        } else if (rule.type === 'StartsWith') {
          // Check if any of the current strings contain any of the previously
          // seen strings as a prefix.
          const hasCollision = (
            seenStringsStartsWith.concat(seenStringsContains).some(
              seenString => currentStrings.some(
                currentString => currentString.indexOf(seenString) === 0)
            )
          );

          if (hasCollision) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'StartsWith\' rule with a matching prefix.'
            });
          }
          seenStringsStartsWith.push(...currentStrings);
        } else if (rule.type === 'Equals') {
          if (seenStringsEquals.some(
            (seenString) => textInputRulesService.Equals(
              seenString, {x: {
                contentId: null, normalizedStrSet: currentStrings
              }}))) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'Equals\' rule with a matching input.'
            });
          } else if (seenStringsFuzzyEquals.some(
            (seenString) => textInputRulesService.FuzzyEquals(
              seenString, {x: {
                contentId: null, normalizedStrSet: currentStrings
              }}))) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'FuzzyEquals\' rule with a matching input.'
            });
          }
          seenStringsEquals.push(...currentStrings);
        } else if (rule.type === 'FuzzyEquals') {
          if (seenStringsFuzzyEquals.some(
            (seenString) => textInputRulesService.FuzzyEquals(
              seenString, {x: {
                contentId: null, normalizedStrSet: currentStrings
              }}))) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'FuzzyEquals\' rule with a matching input.'
            });
          }
          seenStringsFuzzyEquals.push(...currentStrings);
        }
      }
    }

    return warningsList.concat(this.bivs.getAllOutcomeWarnings(
      answerGroups, defaultOutcome, stateName));
  }
}

angular.module('oppia').factory(
  'TextInputValidationService',
  downgradeInjectable(TextInputValidationService));
