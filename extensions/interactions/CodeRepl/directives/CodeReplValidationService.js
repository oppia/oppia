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

oppia.factory('CodeReplValidationService', [
  'WARNING_TYPES', 'baseInteractionValidationService',
  function(WARNING_TYPES, baseInteractionValidationService) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        var warningsList = [];
        baseInteractionValidationService.requireCustomizationArguments(
          customizationArgs, ['language', 'placeholder', 'preCode',
            'postCode']);

        var language = customizationArgs.language.value;
        if (!angular.isString(language)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'Programming language name must be a string.'
          });
        }

        var placeholder = customizationArgs.placeholder.value;
        if (!angular.isString(placeholder)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'Placeholder text must be a string.'
          });
        }

        var preCode = customizationArgs.preCode.value;
        if (!angular.isString(preCode)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'The pre-code text must be a string.'
          });
        }

        var postCode = customizationArgs.postCode.value;
        if (!angular.isString(postCode)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'The post-code text must be a string.'
          });
        }
        return warningsList;
      },
      getAllWarnings: function(stateName, customizationArgs, answerGroups,
          defaultOutcome) {
        return this.getCustomizationArgsWarnings(customizationArgs).concat(
          baseInteractionValidationService.getAllOutcomeWarnings(
            answerGroups, defaultOutcome, stateName));
      }
    };
  }]);
