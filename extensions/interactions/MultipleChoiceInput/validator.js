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

oppia.filter('oppiaInteractiveMultipleChoiceInputValidator', [
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
        message: 'Please ensure the choices are nonempty.'
      });
    }
    if (areAnyChoicesDuplicated) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are unique.'
      });
    }

    var selectedEqualsChoices = [];
    for (var i = 0; i < answerGroups.length; i++) {
      var ruleSpecs = answerGroups[i].rule_specs;
      for (var j = 0; j < ruleSpecs.length; j++) {
        if (ruleSpecs[j].rule_type === 'Equals') {
          var choicePreviouslySelected = (
            selectedEqualsChoices.indexOf(ruleSpecs[j].inputs.x) !== -1);
          if (!choicePreviouslySelected) {
            selectedEqualsChoices.push(ruleSpecs[j].inputs.x);
          } else {
            warningsList.push({
              type: WARNING_TYPES.CRITICAL,
              message: 'Please ensure rule ' + String(j + 1) + ' in group ' +
                String(i + 1) + ' is not equaling the same multiple choice ' +
                'option as another rule.'
            });
          }
          if (ruleSpecs[j].inputs.x >= numChoices) {
            warningsList.push({
              type: WARNING_TYPES.CRITICAL,
              message: 'Please ensure rule ' + String(j + 1) + ' in group ' +
                String(i + 1) + ' refers to a valid choice.'
            });
          }
        }
      }
    }

    warningsList = warningsList.concat(
      baseInteractionValidationService.getAnswerGroupWarnings(
        answerGroups, stateName));

    // Only require a default rule if some choices have not been taken care of
    // by rules.
    if (selectedEqualsChoices.length < numChoices) {
      if (!defaultOutcome ||
          $filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
        warningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'Please clarify the default outcome so it is less confusing to ' +
            'the user.')
        });
      }
    }

    return warningsList;
  };
}]);
