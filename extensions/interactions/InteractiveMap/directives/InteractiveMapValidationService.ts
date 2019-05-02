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

oppia.factory('InteractiveMapValidationService', [
  'baseInteractionValidationService', 'WARNING_TYPES',
  function(baseInteractionValidationService, WARNING_TYPES) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        var warningsList = [];

        baseInteractionValidationService.requireCustomizationArguments(
          customizationArgs, ['latitude', 'longitude']);

        if (customizationArgs.latitude.value < -90 ||
            customizationArgs.latitude.value > 90) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: 'Please pick a starting latitude between -90 and 90.'
          });
        }

        if (customizationArgs.longitude.value < -180 ||
            customizationArgs.longitude.value > 180) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: 'Please pick a starting longitude between -180 and 180.'
          });
        }
        return warningsList;
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
        var warningsList = [];

        warningsList = warningsList.concat(
          this.getCustomizationArgsWarnings(customizationArgs));

        for (var i = 0; i < answerGroups.length; i++) {
          var rules = answerGroups[i].rules;
          for (var j = 0; j < rules.length; j++) {
            if (rules[j].type === 'Within' ||
                rules[j].type === 'NotWithin') {
              if (rules[j].inputs.d < 0) {
                warningsList.push({
                  type: WARNING_TYPES.CRITICAL,
                  message: 'Please ensure that rule ' + String(j + 1) +
                    ' in group ' + String(i + 1) +
                    ' refers to a valid distance.'
                });
              }
            }
          }
        }

        warningsList = warningsList.concat(
          baseInteractionValidationService.getAllOutcomeWarnings(
            answerGroups, defaultOutcome, stateName));

        return warningsList;
      }
    };
  }]);
