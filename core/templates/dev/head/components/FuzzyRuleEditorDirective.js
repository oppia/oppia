// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the fuzzy rule training data editor.
 */

oppia.directive('fuzzyRuleEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        rule: '=',
        onDeleteTrainingDataEntry: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/fuzzy_rule_editor_directive.html'),
      controller: ['$scope', '$element', function($scope, $element) {
        $scope.selectedTrainingInput = 0;

        $scope.removeEntry = function() {
          $scope.onDeleteTrainingDataEntry($scope.selectedTrainingInput);
          $scope.$apply();
        };

        var choices = [];
        var count = 0;
        for (var input in $scope.rule.inputs.training_data) {
          choices.push({
            id: count,
            text: $scope.rule.inputs.training_data[count]
          });
          count++;
        }

        var select2Node = $element[0].firstChild;
        $(select2Node).select2({
          allowClear: false,
          data: choices,
          minimumResultsForSearch: 1,
          width: '250px',
        });

        // Initialize the dropdown.
        $(select2Node).select2('val', choices[$scope.selectedTrainingInput].id);

        $(select2Node).on('change', function(e) {
          $scope.selectedTrainingInput = e.val;
        });
      }]
    };
  }
]);
