// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */

oppia.factory('ItemSelectionInputRulesService', ['$filter', function($filter) {
  return {
    Equals: function(answer, inputs) {
      var normalizedAnswer = $filter('removeDuplicatesInArray')(answer);
      var normalizedInput = $filter('removeDuplicatesInArray')(inputs.x);
      return normalizedAnswer.length === normalizedInput.length &&
          normalizedAnswer.every(function(val) {
            return normalizedInput.indexOf(val) !== -1;
          });
    },
    ContainsAtLeastOneOf: function(answer, inputs) {
      var normalizedAnswer = $filter('removeDuplicatesInArray')(answer);
      var normalizedInput = $filter('removeDuplicatesInArray')(inputs.x);
      return normalizedAnswer.some(function(val) {
        return normalizedInput.indexOf(val) !== -1;
      });
    },
    // TODO(wxy): migrate the name of this rule to OmitsAtLeastOneOf, keeping in
    // sync with the backend migration of the same rule.
    DoesNotContainAtLeastOneOf: function(answer, inputs) {
      var normalizedAnswer = $filter('removeDuplicatesInArray')(answer);
      var normalizedInput = $filter('removeDuplicatesInArray')(inputs.x);
      return normalizedInput.some(function(val) {
        return normalizedAnswer.indexOf(val) === -1;
      });
    },
    // This function checks if the answer
    // given by the user is a subset of the correct answers.
    IsProperSubsetOf: function(answer, inputs) {
      var normalizedAnswer = $filter('removeDuplicatesInArray')(answer);
      var normalizedInput = $filter('removeDuplicatesInArray')(inputs.x);
      return normalizedAnswer.length < normalizedInput.length &&
          normalizedAnswer.every(function(val) {
            return normalizedInput.indexOf(val) !== -1;
          });
    }
  };
}]);
