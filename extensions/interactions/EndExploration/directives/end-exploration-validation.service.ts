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
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { EndExplorationCustomizationArgs } from
  'interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class EndExplorationValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  getCustomizationArgsWarnings(
      customizationArgs: EndExplorationCustomizationArgs): Warning[] {
    var warningsList = [];
    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs, ['recommendedExplorationIds']);

    var recommendedExplorationIds = (
      customizationArgs.recommendedExplorationIds.value);

    if (!Array.isArray(recommendedExplorationIds)) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Set of recommended exploration IDs must be list.'
      });
    }
    for (var i = 0; i < recommendedExplorationIds.length; i++) {
      if (!(typeof recommendedExplorationIds[i] === 'string')) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: 'Recommended exploration ID must be a string.'
        });
        break;
      }
      if (recommendedExplorationIds[i].trim().length === 0) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: 'Recommended exploration ID must be non-empty.'
        });
        break;
      }
    }

    return warningsList;
  }

  getAllWarnings(
      stateName: string, customizationArgs: EndExplorationCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome | null): Warning[] {
    var warningsList: Warning[] = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    if (answerGroups.length !== 0) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Please make sure end exploration interactions do not ' +
          'have any Oppia responses.'
      });
    }
    if (defaultOutcome) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Please make sure end exploration interactions do not ' +
        'have a default outcome.'
      });
    }

    return warningsList;
  }
}

angular.module('oppia').factory(
  'EndExplorationValidationService',
  downgradeInjectable(EndExplorationValidationService));
