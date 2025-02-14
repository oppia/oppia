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
  baseInteractionValidationService,
  Warning,
} from 'interactions/base-interaction-validation.service';
import {PencilCodeEditorCustomizationArgs} from 'extensions/interactions/customization-args-defs';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';

import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class PencilCodeEditorValidationService {
  constructor(
    private baseInteractionValidationServiceInstance: baseInteractionValidationService
  ) {}

  getCustomizationArgsWarnings(
    customizationArgs: PencilCodeEditorCustomizationArgs
  ): Warning[] {
    var warningsList = [];
    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs,
      ['initialCode']
    );

    var initialCode = customizationArgs.initialCode.value;
    if (!(typeof initialCode === 'string')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The initialCode must be a string.',
      });
    }
    return warningsList;
  }

  getAllWarnings(
    stateName: string,
    customizationArgs: PencilCodeEditorCustomizationArgs,
    answerGroups: AnswerGroup[],
    defaultOutcome: Outcome
  ): Warning[] {
    return this.getCustomizationArgsWarnings(customizationArgs).concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups,
        defaultOutcome,
        stateName
      )
    );
  }
}
