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

@Injectable({
  providedIn: 'root'
})
export class CodeReplValidationService {
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
      customizationArgs, [
        'language',
        'placeholder',
        'preCode',
        'postCode']);

    var language = customizationArgs.language.value;
    if (!(typeof language === 'string')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Programming language name must be a string.'
      });
    }

    var placeholder = customizationArgs.placeholder.value;
    if (!(typeof placeholder === 'string')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Placeholder text must be a string.'
      });
    }

    var preCode = customizationArgs.preCode.value;
    if (!(typeof preCode === 'string')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The pre-code text must be a string.'
      });
    }

    var postCode = customizationArgs.postCode.value;
    if (!(typeof postCode === 'string')) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The post-code text must be a string.'
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
    return this.getCustomizationArgsWarnings(customizationArgs).concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));
  }
}

angular.module('oppia').factory(
  'CodeReplValidationService', downgradeInjectable(CodeReplValidationService));
