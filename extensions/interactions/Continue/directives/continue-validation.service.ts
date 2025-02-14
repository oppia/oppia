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
import {
  Warning,
  baseInteractionValidationService,
} from 'interactions/base-interaction-validation.service';
import {ContinueCustomizationArgs} from 'interactions/customization-args-defs';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';

import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class ContinueValidationService {
  constructor(
    private baseInteractionValidationServiceInstance: baseInteractionValidationService
  ) {}

  getCustomizationArgsWarnings(
    customizationArgs: ContinueCustomizationArgs
  ): Warning[] {
    var warningsList = [];
    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs,
      ['buttonText']
    );

    if (customizationArgs.buttonText.value.unicode.trim().length === 0) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'The button text should not be empty.',
      });
    }

    if (customizationArgs.buttonText.value.unicode.length > 20) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'The button text should be at most 20 characters.',
      });
    }
    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: ContinueCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    var warningsList = this.getCustomizationArgsWarnings(customizationArgs);

    if (answerGroups.length > 0) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Only the default outcome is necessary for a continue' +
          ' interaction.',
      });
    }

    if (!defaultOutcome || defaultOutcome.isConfusing(stateName)) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'Please specify what Oppia should do after the button is clicked.',
      });
    }

    return warningsList;
  }
}
