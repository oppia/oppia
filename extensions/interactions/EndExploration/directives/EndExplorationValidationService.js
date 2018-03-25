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

oppia.factory('EndExplorationValidationService', [
  'WARNING_TYPES', 'baseInteractionValidationService',
  function(WARNING_TYPES, baseInteractionValidationService) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        var warningsList = [];
        baseInteractionValidationService.requireCustomizationArguments(
          customizationArgs, ['recommendedExplorationIds']);

        var recommendedExplorationIds = (
            customizationArgs.recommendedExplorationIds.value);

        if(!angular.isArray(recommendedExplorationIds)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'Set of recommended exploration IDs must be in list ' +
              'format.'
          });
        }
        for (var i = 0; i < recommendedExplorationIds.length; i++) {
          if (!angular.isString(recommendedExplorationIds[i])) {
            warningsList.push({
              type: WARNING_TYPES.ERROR,
              message: 'Recommended exploration ID must be a string.'
            });
          }
        }
        return warningsList;
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
        var warningsList = [];

        warningsList = warningsList.concat(
          this.getCustomizationArgsWarnings(customizationArgs));

        if (answerGroups.length !== 0) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'Please make sure end exploration interactions do not ' +
              'have any answer groups.'
          });
        }
        if (defaultOutcome) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'Please make sure end exploration interactions do not ' +
            'have a default outcome.'
          });
        }

        return warningsList;
      }
    };
  }
]);
