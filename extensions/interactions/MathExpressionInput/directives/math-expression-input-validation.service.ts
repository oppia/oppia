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
import { IMathExpressionCustomizationArgs } from
  'interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class MathExpressionInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: IMathExpressionCustomizationArgs): IWarning[] {
    // TODO(juansaba): Implement customization args validations.
    return [];
  }

  getAllWarnings(
      stateName: string,
      customizationArgs: IMathExpressionCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): IWarning[] {
    var warningsList = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    // Check that each rule has a valid math expression.
    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        try {
          MathExpression.fromLatex((<string>rules[j].inputs.x));
        } catch (e) {
          warningsList.push({
            type: AppConstants.WARNING_TYPES.CRITICAL,
            message: (
              'The math expression used in rule ' + String(j + 1) +
              ' in group ' + String(i + 1) + ' is invalid.')
          });
        }
      }
    }
    return warningsList;
  }
}

angular.module('oppia').factory(
  'MathExpressionInputValidationService',
  downgradeInjectable(MathExpressionInputValidationService));
