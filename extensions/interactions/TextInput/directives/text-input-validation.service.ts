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

import { AppConstants } from 'app.constants';
import { baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';

interface IWarning {
  type: string,
  message: string
}

@Injectable({
  providedIn: 'root'
})
export class TextInputValidationService {
  constructor(private bivs: baseInteractionValidationService) {}
  // TODO(#7165): Replace 'any' with the exact type.
  getCustomizationArgsWarnings(customizationArgs: any): Array<IWarning> {
    var warningsList = [];
    this.bivs.requireCustomizationArguments(
      customizationArgs,
      ['placeholder', 'rows']);

    var placeholder = customizationArgs.placeholder.value;
    if (!angular.isString(placeholder)) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'Placeholder text must be a string.')
      });
    }

    var isInt = function(n) {
      return angular.isNumber(n) && n % 1 === 0;
    };

    var rows = customizationArgs.rows.value;
    if (isInt(rows)) {
      var textSpecs = InteractionSpecsConstants.INTERACTION_SPECS.TextInput;
      var customizationArgSpecs = textSpecs.customization_arg_specs;
      var rowsSpecs = customizationArgSpecs[1];
      var minRows = rowsSpecs.schema.validators[0].min_value;
      var maxRows = rowsSpecs.schema.validators[1].max_value;
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
  // TODO(#7165): Replace 'any' with the exact type.
  getAllWarnings(
      stateName: any, customizationArgs: any, answerGroups: any,
      defaultOutcome: any): Array<IWarning> {
    return this.getCustomizationArgsWarnings(customizationArgs).concat(
      this.bivs.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));
  }
}

angular.module('oppia').factory(
  'TextInputValidationService',
  downgradeInjectable(TextInputValidationService));
