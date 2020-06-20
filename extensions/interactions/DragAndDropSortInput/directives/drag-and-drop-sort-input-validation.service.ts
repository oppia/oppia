// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator service for the drag and drop sorting interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IWarning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { IDragAndDropSortInputCustomizationArgs } from
  'extensions/interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class DragAndDropSortInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: IDragAndDropSortInputCustomizationArgs): IWarning[] {
    var warningsList = [];

    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs, ['choices']);

    var areAnyChoicesEmpty = false;
    var areAnyChoicesDuplicated = false;
    var seenChoices = [];
    var numChoices = customizationArgs.choices.value.length;

    if (numChoices < 2) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please enter at least two choices.'
      });
    }

    for (var i = 0; i < numChoices; i++) {
      var choice = customizationArgs.choices.value[i];
      if (choice.trim().length === 0) {
        areAnyChoicesEmpty = true;
      }
      if (seenChoices.indexOf(choice) !== -1) {
        areAnyChoicesDuplicated = true;
      }
      seenChoices.push(choice);
    }

    if (areAnyChoicesEmpty) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please ensure that the choices are nonempty.'
      });
    }

    if (areAnyChoicesDuplicated) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please ensure that the choices are unique.'
      });
    }

    return warningsList;
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: IDragAndDropSortInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): IWarning[] {
    var warningsList = [];
    var seenItems = [];
    var ranges = [];
    var areAnyItemsEmpty = false;
    var areAnyItemsDuplicated = false;

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    var checkRedundancy = function(earlierRule, laterRule) {
      var noOfMismatches = 0;
      var inputs = earlierRule.inputs.x;
      var answer = laterRule.inputs.x;
      for (var i = 0; i < Math.min(inputs.length, answer.length); i++) {
        for (var j = 0; j < Math.max(answer[i].length, inputs[i].length);
          j++) {
          if (inputs[i].length > answer[i].length) {
            if (answer[i].indexOf(inputs[i][j]) === -1) {
              noOfMismatches += 1;
            }
          } else {
            if (inputs[i].indexOf(answer[i][j]) === -1) {
              noOfMismatches += 1;
            }
          }
        }
      }
      return noOfMismatches === 1;
    };

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var inputs = rules[j].inputs;
        var rule = rules[j];
        if (!customizationArgs.allowMultipleItemsInSamePosition.value) {
          var xInputs = <string[][]>inputs.x;
          for (var k = 0; k < xInputs.length; k++) {
            if (xInputs[k].length > 1) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: 'Multiple items in a single position are not allowed.'
              });
              break;
            }
          }
        }
        var range = {
          answerGroupIndex: i + 1,
          ruleIndex: j + 1
        };
        seenItems = [];
        areAnyItemsEmpty = false;
        areAnyItemsDuplicated = false;

        switch (rule.type) {
          case 'HasElementXBeforeElementY':
            if (inputs.x === inputs.y) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) + ' will never be matched because both the ' +
                  'selected elements are same.')
              });
            }
            break;
          case 'IsEqualToOrdering':
          case 'IsEqualToOrderingWithOneItemAtIncorrectPosition':
            var xInputs = <string[][]>inputs.x;
            for (var k = 0; k < xInputs.length; k++) {
              if (inputs.x[k].length === 0) {
                areAnyItemsEmpty = true;
              } else {
                for (var l = 0; l < xInputs[k].length; l++) {
                  var item = xInputs[k][l];
                  if (item.trim().length === 0) {
                    areAnyItemsEmpty = true;
                  }
                  if (seenItems.indexOf(item) !== -1) {
                    areAnyItemsDuplicated = true;
                  }
                  seenItems.push(item);
                }
              }
            }

            if (areAnyItemsEmpty) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: 'Please ensure the items are nonempty.'
              });
            }

            if (areAnyItemsDuplicated) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: 'Please ensure the items are unique.'
              });
            }

            if (!customizationArgs.allowMultipleItemsInSamePosition.value &&
                rule.type === (
                  'IsEqualToOrderingWithOneItemAtIncorrectPosition')) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) + ' will never be matched because there will be ' +
                  'at least 2 elements at incorrect positions if multiple ' +
                  'elements cannot occupy the same position.')
              });
            }
            break;
          default:
        }

        for (var k = 0; k < ranges.length; k++) {
          var earlierRule = answerGroups[ranges[k].answerGroupIndex - 1].
            rules[ranges[k].ruleIndex - 1];
          if (earlierRule.type ===
            'IsEqualToOrderingWithOneItemAtIncorrectPosition' &&
            rule.type === 'IsEqualToOrdering') {
            if (checkRedundancy(earlierRule, rule)) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Rule ' + (j + 1) + ' from answer group ' +
                  (i + 1) + ' will never be matched because it ' +
                  'is made redundant by rule ' + ranges[k].ruleIndex +
                  ' from answer group ' + ranges[k].answerGroupIndex +
                  '.')
              });
            }
          }
        }
        ranges.push(range);
      }
    }

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    return warningsList;
  }
}

angular.module('oppia').factory(
  'DragAndDropSortInputValidationService',
  downgradeInjectable(DragAndDropSortInputValidationService));
