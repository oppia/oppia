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
      !angular.isString(placeholder.getUnicode())
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

    for (let [answerGroupIndex, answerGroup] of answerGroups.entries()) {
      for (let [ruleIndex, rule] of answerGroup.rules.entries()) {
        let currentString = <string> rule.inputs.x;
        if (rule.type === 'Contains') {
          // Check if the current string contains any of the previously seen
          // strings as a substring.
          if (seenStringsContains.some(
            (seenString) => currentString.includes(seenString)) ||
            seenStringsStartsWith.includes('')) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'Contains\' rule with a matching input.'
            });
          }
          seenStringsContains.push(currentString);
        } else if (rule.type === 'StartsWith') {
          // Check if the current string contains any of the previously seen
          // strings as a prefix.
          if (seenStringsStartsWith.concat(seenStringsContains).some(
            (seenString) => currentString.indexOf(seenString) === 0)) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'StartsWith\' rule with a matching prefix.'
            });
          }
          seenStringsStartsWith.push(currentString);
        } else if (rule.type === 'Equals') {
          if (seenStringsEquals.some(
            (seenString) => textInputRulesService.Equals(
              currentString, {x: seenString}))) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'Equals\' rule with a matching input.'
            });
          } else if (seenStringsFuzzyEquals.some(
            (seenString) => textInputRulesService.FuzzyEquals(
              currentString, {x: seenString}))) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'FuzzyEquals\' rule with a matching input.'
            });
          }
          seenStringsEquals.push(currentString);
        } else if (rule.type === 'FuzzyEquals') {
          if (seenStringsFuzzyEquals.some(
            (seenString) => textInputRulesService.FuzzyEquals(
              currentString, {x: seenString}))) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.ERROR,
              message: `Rule ${ruleIndex + 1} from answer group ` +
                `${answerGroupIndex + 1} will never be matched because it ` +
                'is preceded by a \'FuzzyEquals\' rule with a matching input.'
            });
          }
          seenStringsFuzzyEquals.push(currentString);
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
