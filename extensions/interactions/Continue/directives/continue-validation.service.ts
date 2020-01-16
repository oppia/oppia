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
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';

@Injectable({
  providedIn: 'root'
})
export class ContinueValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with possible underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getCustomizationArgsWarnings(customizationArgs: any): IWarning[] {
    var warningsList = [];
    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs, ['buttonText']);

    var textSpecs = InteractionSpecsConstants.INTERACTION_SPECS.Continue;
    var customizationArgSpecs = textSpecs.customization_arg_specs;
    var buttonTextMaxLength = (
      customizationArgSpecs[0].schema.validators[0].max_value);

    if (customizationArgs.buttonText.value.length === 0) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'The button text should not be empty.'
      });
    }

    if (customizationArgs.buttonText.value.length > buttonTextMaxLength) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'The button text should not be too long.'
      });
    }

    return warningsList;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with possible underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getAllWarnings(
      stateName: string, customizationArgs: any, answerGroups: AnswerGroup[],
      defaultOutcome: Outcome): IWarning[] {
    var warningsList = this.getCustomizationArgsWarnings(customizationArgs);

    if (answerGroups.length > 0) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: ('Only the default outcome is necessary for a continue' +
          ' interaction.')
      });
    }

    if (!defaultOutcome || defaultOutcome.isConfusing(stateName)) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: ('Please specify what Oppia should do after the button' +
          ' is clicked.')
      });
    }

    return warningsList;
  }
}

angular.module('oppia').factory(
  'ContinueValidationService', downgradeInjectable(ContinueValidationService));
