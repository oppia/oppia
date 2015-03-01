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

oppia.filter('oppiaInteractiveSetInputValidator', ['$filter', 'WARNING_TYPES', function($filter, WARNING_TYPES) {
  // Returns a list of warnings.
  return function(stateName, customizationArgs, ruleSpecs) {
    var warningsList = [];

    var numRuleSpecs = ruleSpecs.length;

    for (var i = 0; i < numRuleSpecs - 1; i++) {
      if ($filter('isRuleSpecConfusing')(ruleSpecs[i], stateName)) {
        warningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'please specify what Oppia should do in rules ' +
            String(i + 1) + '.')
        });
      }
    }

    var lastRuleSpec = ruleSpecs[ruleSpecs.length - 1];
    if ($filter('isRuleSpecConfusing')(lastRuleSpec, stateName)) {
      warningsList.push({
        type: WARNING_TYPES.ERROR,
        message: (
          'please add a rule to cover what should happen in the general case.')
      });
    }

    return warningsList;
  };
}]);
