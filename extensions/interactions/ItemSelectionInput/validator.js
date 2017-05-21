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
    return function(
        stateName, customizationArgs, answerGroups, defaultOutcome) {
      var warningsList = [];

      baseInteractionValidationService.requireCustomizationArguments(
        customizationArgs, ['choices']);

      var areAnyChoicesEmpty = false;
      var areAnyChoicesDuplicated = false;
      var seenChoices = [];
      var handledAnswers = [];
      var numChoices = customizationArgs.choices.value.length;
      var areAllChoicesCovered = false;

      for (var i = 0; i < numChoices; i++) {
        var choice = customizationArgs.choices.value[i];
        if (choice.trim().length === 0) {
          areAnyChoicesEmpty = true;
        }
        if (seenChoices.indexOf(choice) !== -1) {
          areAnyChoicesDuplicated = true;
        }
        seenChoices.push(choice);
        handledAnswers.push(false);
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

      var minAllowedCount = customizationArgs.minAllowableSelectionCount.value;
      var maxAllowedCount = customizationArgs.maxAllowableSelectionCount.value;

      if (minAllowedCount > maxAllowedCount) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: (
            'Please ensure that the max allowed count is not less than the ' +
            'min count.')
        });
      }

      if (numChoices < minAllowedCount) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: (
            'Please ensure that you have enough choices to reach the min ' +
            'count.')
        });
      } else if (numChoices < maxAllowedCount) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: (
            'Please ensure that you have enough choices to reach the max ' +
            'count.')
        });
      }

      warningsList = warningsList.concat(
        baseInteractionValidationService.getAnswerGroupWarnings(
          answerGroups, stateName));

      var selectedChoices = [];
      if (maxAllowedCount === 1) {
        var answerChoiceToIndex = {};
        seenChoices.forEach(function(seenChoice, choiceIndex) {
          answerChoiceToIndex[seenChoice] = choiceIndex;
        });

        answerGroups.forEach(function(answerGroup, answerIndex) {
          var rules = answerGroup.rules;
          rules.forEach(function(rule, ruleIndex) {
            var ruleInputs = rule.inputs.x;
            ruleInputs.forEach(function(ruleInput) {
              var choiceIndex = answerChoiceToIndex[ruleInput];
              if (rule.type === 'Equals') {
                handledAnswers[choiceIndex] = true;
                if (ruleInputs.length > 1) {
                  warningsList.push({
                    type: WARNING_TYPES.ERROR,
                    message: (
                      'In answer group ' + (answerIndex + 1) + ', ' +
                      'rule ' + (ruleIndex + 1) + ', ' +
                      'please select only one answer choice.')
                  });
                }
              } else if (rule.type === 'ContainsAtLeastOneOf') {
                handledAnswers[choiceIndex] = true;
              } else if (rule.type ===
                'DoesNotContainAtLeastOneOf') {
                for (var i = 0; i < handledAnswers.length; i++) {
                  if (i !== choiceIndex) {
                    handledAnswers[i] = true;
                  }
                }
              }
            });
          });
        });
        areAllChoicesCovered = handledAnswers.every(function(handledAnswer) {
          return handledAnswer;
        });
      }

      if (!areAllChoicesCovered) {
        if (!defaultOutcome ||
            $filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'Please add something for Oppia to say in the ' +
              '\"All other answers\" response.')
          });
        }
      }

      return warningsList;
    };
  }
]);
