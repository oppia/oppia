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
 * @fileoverview Validation service for the interaction.
 */

import {Injectable} from '@angular/core';

import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {
  Warning,
  baseInteractionValidationService,
} from 'interactions/base-interaction-validation.service';
import {InteractiveMapCustomizationArgs} from 'interactions/customization-args-defs';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';

import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class InteractiveMapValidationService {
  constructor(
    private baseInteractionValidationServiceInstance: baseInteractionValidationService
  ) {}

  getCustomizationArgsWarnings(
    customizationArgs: InteractiveMapCustomizationArgs
  ): Warning[] {
    var warningsList = [];

    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs,
      ['latitude', 'longitude']
    );

    if (
      customizationArgs.latitude.value < -90 ||
      customizationArgs.latitude.value > 90
    ) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please pick a starting latitude between -90 and 90.',
      });
    }

    if (
      customizationArgs.longitude.value < -180 ||
      customizationArgs.longitude.value > 180
    ) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please pick a starting longitude between -180 and 180.',
      });
    }
    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: InteractiveMapCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    var warningsList: Warning[] = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs)
    );

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        if (rules[j].type === 'Within' || rules[j].type === 'NotWithin') {
          if (rules[j].inputs.d < 0) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.CRITICAL,
              message:
                'Please ensure that learner answer ' +
                String(j + 1) +
                ' in Oppia response ' +
                String(i + 1) +
                ' refers to a valid distance.',
            });
          }
        }
      }
    }

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups,
        defaultOutcome,
        stateName
      )
    );

    return warningsList;
  }
}
