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
    getNonDefaultRuleSpecsWarnings: function(ruleSpecs, stateName) {
      var partialWarningsList = [];

      // This does not check the last ('default') rule.
      for (var i = 0; i < ruleSpecs.length - 1; i++) {
        if ($filter('isRuleSpecConfusing')(ruleSpecs[i], stateName)) {
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
    getDefaultRuleSpecsWarnings: function(ruleSpecs, stateName) {
      var partialWarningsList = [];
      if ($filter('isRuleSpecConfusing')(ruleSpecs[ruleSpecs.length - 1], stateName)) {
        partialWarningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'please add a rule to cover what should happen in the general case.')
        });
      }
      return partialWarningsList;
    },
    getAllRuleSpecsWarnings: function(ruleSpecs, stateName) {
      return (
        this.getNonDefaultRuleSpecsWarnings(ruleSpecs, stateName).concat(
          this.getDefaultRuleSpecsWarnings(ruleSpecs, stateName)));
    }
  }
}]);
