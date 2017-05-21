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
 * @fileoverview Directive for the rule type selector.
 */

oppia.directive('ruleTypeSelector', [function() {
  return {
    restrict: 'E',
    scope: {
      localValue: '@',
      onSelectionChange: '&'
    },
    template: '<input type="hidden">',
    controller: [
      '$scope', '$element', '$rootScope', '$filter',
      'stateInteractionIdService', 'INTERACTION_SPECS',
      'RULE_TYPE_CLASSIFIER',
      function(
          $scope, $element, $rootScope, $filter,
          stateInteractionIdService, INTERACTION_SPECS,
          RULE_TYPE_CLASSIFIER) {
        var choices = [];
        var numberOfRuleTypes = 0;

        var ruleTypesToDescriptions = INTERACTION_SPECS[
          stateInteractionIdService.savedMemento].rule_descriptions;
        for (var ruleType in ruleTypesToDescriptions) {
          if (ruleType === RULE_TYPE_CLASSIFIER) {
            continue;
          }
          numberOfRuleTypes++;
          choices.push({
            id: ruleType,
            text: $filter('replaceInputsWithEllipses')(
              ruleTypesToDescriptions[ruleType])
          });
        }

        // TODO(bhenning): The order of choices should be meaningful. E.g.,
        // having "is equal to" for most interactions first makes sense. They
        // should ideally be ordered based on likelihood of being used.
        choices.sort(function(a, b) {
          if (a.text < b.text) {
            return -1;
          } else if (a.text > b.text) {
            return 1;
          } else {
            return 0;
          }
        });

        var select2Node = $element[0].firstChild;
        $(select2Node).select2({
          allowClear: false,
          data: choices,
          // Suppress the search box.
          minimumResultsForSearch: -1,
          width: '350px',
          formatSelection: function(object) {
            return $filter('truncateAtFirstEllipsis')(object.text);
          }
        });

        // Select the first choice by default.
        if (!$scope.localValue) {
          $scope.localValue = choices[0].id;
          $scope.onSelectionChange()($scope.localValue);
        }

        // Initialize the dropdown.
        $(select2Node).select2('val', $scope.localValue);

        $(select2Node).on('change', function(e) {
          $scope.onSelectionChange()(e.val);
          // This is needed to propagate the change and display input fields
          // for parameterizing the rule. Otherwise, the input fields do not
          // get updated when the rule type is changed.
          $scope.$apply();
        });
      }
    ]
  };
}]);
