// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Directive for the select2 autocomplete component.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('select2Dropdown', [function() {
  // Directive for incorporating select2 dropdowns.
  return {
    restrict: 'E',
    scope: {
      choices: '=',
      item: '=',
      newChoiceRegex: '@',
      placeholder: '@',
      width: '@'
    },
    template: '<input type="hidden">',
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      $scope.newChoiceValidator = new RegExp($scope.newChoiceRegex);

      $scope.makeUnique = function(arr) {
        var hashMap = {};
        var result = [];
        for (var i = 0; i < arr.length; i++) {
          if (!hashMap.hasOwnProperty(arr[i])) {
            result.push(arr[i]);
            hashMap[arr[i]] = 1;
          }
        }
        return result;
      };

      $scope.uniqueChoices = $scope.makeUnique($scope.choices);
      $scope.select2Choices = [];
      for (var i = 0; i < $scope.uniqueChoices.length; i++) {
        $scope.select2Choices.push({
          id: $scope.uniqueChoices[i],
          text: $scope.uniqueChoices[i]
        });
      }

      var select2Node = $element[0].firstChild;
      $(select2Node).select2({
        data: $scope.select2Choices,
        placeholder: $scope.placeholder,
        width: $scope.width || '250px',
        createSearchChoice: function(term, data) {
          if ($(data).filter(function() {
            return this.text.localeCompare(term) === 0;
          }).length === 0) {
            return (
              term.match($scope.newChoiceValidator) ?
                  {id: term, text: term} : null
            );
          }
        }
      });

      // Initialize the dropdown.
      $(select2Node).select2('val', $scope.item);

      // Update $scope.item when the selection changes.
      $(select2Node).on('change', function(e) {
        $scope.item = e.val;
        $scope.$apply();
      });
    }]
  };
}]);
