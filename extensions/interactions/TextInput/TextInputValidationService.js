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

oppia.factory('TextInputValidationService', [
  'WARNING_TYPES', 'baseInteractionValidationService',
  function(WARNING_TYPES, baseInteractionValidationService) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        var warningsList = [];
        baseInteractionValidationService.requireCustomizationArguments(
          customizationArgs,
          ['placeholder', 'rows']);

        var rows = customizationArgs.rows.value;
        var placeholder = customizationArgs.placeholder.value;
        if (typeof placeholder != 'string') {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'Placeholder text must be a string.')
          });
        }
        // Can we get these values dynamically?
        var MIN_ROWS = 1;
        var MAX_ROWS = 200;
        if (rows < MIN_ROWS || rows > MAX_ROWS) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'Number of rows must be between ' + MIN_ROWS + ' and ' +
              MAX_ROWS + '.')
          });
        }
        return warningsList;
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
        return this.getCustomizationArgsWarnings(customizationArgs).concat(
          baseInteractionValidationService.getAllOutcomeWarnings(
            answerGroups, defaultOutcome, stateName));
      }
    };
  }
]);
