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
 * @fileoverview Base validation service for interactions.
 */

oppia.factory('baseInteractionValidationService', [
    '$filter', 'WARNING_TYPES', function($filter, WARNING_TYPES) {
  return {
    // 'argNames' is an array of top-level customization argument names (such as
    // 'chocies') used to verify the basic structure of the input customization
    // arguments object.
    requireCustomizationArguments: function(customizationArguments, argNames) {
      var missingArgs = [];
      for (var i = 0; i < argNames.length; i++) {
        if (!customizationArguments.hasOwnProperty(argNames[i])) {
          missingArgs.push(argNames[i]);
        }
      }
      if (missingArgs.length > 0) {
        if (missingArgs.length === 1) {
          throw 'Expected customization arguments to have property: ' +
            missingArgs[0];
        } else {
          throw 'Expected customization arguments to have properties: ' +
            missingArgs.join(', ');
        }
      }
    },
    getAnswerGroupWarnings: function(answerGroups, stateName) {
      var partialWarningsList = [];

      // This does not check the default outcome.
      for (var i = 0; i < answerGroups.length; i++) {
        if ($filter('isOutcomeConfusing')(answerGroups[i].outcome, stateName)) {
          partialWarningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'Please specify what Oppia should do in answer group ' +
              String(i + 1) + '.')
          });
        }
      }
      return partialWarningsList;
    },
    getDefaultOutcomeWarnings: function(defaultOutcome, stateName) {
      var partialWarningsList = [];
      if (defaultOutcome &&
          $filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
        partialWarningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'Please add feedback for the user if they are to return to the ' +
            'same state again.')
        });
      }
      return partialWarningsList;
    },
    getAllOutcomeWarnings: function(answerGroups, defaultOutcome, stateName) {
      return (
        this.getAnswerGroupWarnings(answerGroups, stateName).concat(
          this.getDefaultOutcomeWarnings(defaultOutcome, stateName)));
    }
  };
}]);
