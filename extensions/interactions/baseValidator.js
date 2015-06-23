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
    getNonDefaultRuleSpecsWarnings: function(answerGroups, defaultOutcome, stateName) {
      var partialWarningsList = [];

      // This does not check the default outcome.
      for (var i = 0; i < answerGroups.length; i++) {
        if ($filter('isOutcomeConfusing')(answerGroups[i].outcome, stateName)) {
          partialWarningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'please specify what Oppia should do in rule ' +
              String(i + 1) + '.')
          });
        }
      }
      return partialWarningsList;
    },
    getDefaultRuleSpecsWarnings: function(answerGroups, defaultOutcome, stateName) {
      var partialWarningsList = [];
      if ($filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
        partialWarningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'please add a rule to cover what should happen in the general case.')
        });
      }
      return partialWarningsList;
    },
    getAllRuleSpecsWarnings: function(answerGroups, defaultOutcome, stateName) {
      return (
        this.getNonDefaultRuleSpecsWarnings(answerGroups, defaultOutcome, stateName).concat(
          this.getDefaultRuleSpecsWarnings(answerGroups, defaultOutcome, stateName)));
    }
  }
}]);
