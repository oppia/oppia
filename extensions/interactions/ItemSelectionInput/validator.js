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
 * @fileoverview Frontend validator for customization args and rules of
 * the interaction.
 */

oppia.filter('oppiaInteractiveItemSelectionInputValidator', [
    '$filter', 'WARNING_TYPES', 'baseInteractionValidationService',
    function($filter, WARNING_TYPES, baseInteractionValidationService) {
      // Returns a list of warnings.
      return function(stateName, customizationArgs, answerGroups, defaultOutcome) {
    var warningsList = [];

    baseInteractionValidationService.requireCustomizationArguments(
      customizationArgs, ['choices']);

    var areAnyChoicesEmpty = false;
    var areAnyChoicesDuplicated = false;
    var seenChoices = [];
    var numChoices = customizationArgs.choices.value.length;
    for (var i = 0; i < customizationArgs.choices.value.length; i++) {
      var choice = customizationArgs.choices.value[i];
      if (choice.trim().length === 0) {
        areAnyChoicesEmpty = true;
      }
      if (seenChoices.indexOf(choice) !== -1) {
        areAnyChoicesDuplicated = true;
      }
      seenChoices.push(choice);
    }

    if (areAnyChoicesEmpty) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure the choices are nonempty.'
      });
    }

    if (areAnyChoicesDuplicated) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure the choices are unique.'
      });
    }

    var minAllowedCount = customizationArgs.minAllowableSelectionCount.value;
    var maxAllowedCount = customizationArgs.maxAllowableSelectionCount.value;

    if (minAllowedCount > maxAllowedCount) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure that the max allowed count is not less than the min count.'
      });
    }

    if (numChoices < minAllowedCount) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure that you have enough choices to reach the min count.'
      });
    } else if (numChoices < maxAllowedCount) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure that you have enough choices to reach the max count.'
      });
    }

    warningsList = warningsList.concat(
      baseInteractionValidationService.getAnswerGroupWarnings(
        answerGroups, stateName));


    if (!defaultOutcome || $filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
      warningsList.push({
        type: WARNING_TYPES.ERROR,
        message: (
          'please clarify the default outcome so it is less confusing to ' +
          'the user.')
      });
    }

    return warningsList;
  };
}]);
