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
 * @fileoverview Validator service for the number with units interaction.
 */


import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { unit } from 'mathjs';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AppConstants } from 'app.constants';
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { NumberWithUnitsCustomizationArgs } from
  'interactions/customization-args-defs';
import { Rule } from 'domain/exploration/rule.model';
import { NumberWithUnitsAnswer } from 'interactions/answer-defs';

@Injectable({
  providedIn: 'root'
})
export class NumberWithUnitsValidationService {
  constructor(
    private unitObjectFactory: NumberWithUnitsObjectFactory,
    private baseInteraction: baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: NumberWithUnitsCustomizationArgs): Warning[] {
    return [];
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: NumberWithUnitsCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): Warning[] {
    var warningsList: Warning[] = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    try {
      this.unitObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}

    var checkEquality = (earlierRule: Rule, laterRule: Rule) => {
      var answer = this.unitObjectFactory.fromDict(
         earlierRule.inputs.f as NumberWithUnitsAnswer);
      var inputs = this.unitObjectFactory.fromDict(
         laterRule.inputs.f as NumberWithUnitsAnswer);

      var answerString = answer.toMathjsCompatibleString();
      var inputsString = inputs.toMathjsCompatibleString();

      var answerList = this.unitObjectFactory.fromRawInputString(
        answerString).toDict();
      var inputsList = this.unitObjectFactory.fromRawInputString(
        inputsString).toDict();
      return JSON.stringify(answerList).toLowerCase() === JSON.stringify(
        inputsList).toLowerCase();
    };

    var checkEquivalency = (earlierRule: Rule, laterRule: Rule) => {
      var earlierInput = this.unitObjectFactory.fromDict(
        earlierRule.inputs.f as NumberWithUnitsAnswer);
      var laterInput = this.unitObjectFactory.fromDict(
         laterRule.inputs.f as NumberWithUnitsAnswer);
      if (earlierInput.type === 'fraction') {
        earlierInput.type = 'real';
        earlierInput.real = earlierInput.fraction.toFloat();
      }
      if (laterInput.type === 'fraction') {
        laterInput.type = 'real';
        laterInput.real = laterInput.fraction.toFloat();
      }
      var earlierInputString = earlierInput.toMathjsCompatibleString();
      var laterInputString = laterInput.toMathjsCompatibleString();
      try {
        return unit(laterInputString).equals(unit(earlierInputString));
      // Unknown type is used because we don't know which type of error
      // is thrown.
      } catch (e: unknown) {
        var additionalInfo = (
          '\nlaterInput: ' + JSON.stringify(laterInput.toDict()) +
          '\nearlierInput: ' + JSON.stringify(earlierInput.toDict())
        );
        (e as Error).message += additionalInfo;
        throw e;
      }
    };

    var ranges = [];

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        var range = {
          answerGroupIndex: i,
          ruleIndex: j,
        };

        for (var k = 0; k < ranges.length; k++) {
          var earlierRule = answerGroups[ranges[k].answerGroupIndex].
            rules[ranges[k].ruleIndex];
          if (earlierRule.type === 'IsEqualTo' &&
            rule.type === 'IsEqualTo') {
            if (checkEquality.call(this, earlierRule, rule)) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) + ' will never be matched because it ' +
                  'is made redundant by answer ' + (ranges[k].ruleIndex + 1) +
                  ' from response ' + (ranges[k].answerGroupIndex + 1) +
                  '.')
              });
            }
          }

          if (earlierRule.type === 'IsEquivalentTo') {
            if (checkEquivalency.call(this, earlierRule, rule)) {
              warningsList.push({
                type: AppConstants.WARNING_TYPES.ERROR,
                message: (
                  'Learner answer ' + (j + 1) + ' from Oppia response ' +
                  (i + 1) + ' will never be matched because it ' +
                  'is made redundant by answer ' + (ranges[k].ruleIndex + 1) +
                  ' from response ' + (ranges[k].answerGroupIndex + 1) +
                  '.')
              });
            }
          }
        }

        ranges.push(range);
      }
    }

    warningsList = warningsList.concat(
      this.baseInteraction.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    return warningsList;
  }
}

angular.module('oppia').factory(
  'NumberWithUnitsValidationService', downgradeInjectable(
    NumberWithUnitsValidationService));
