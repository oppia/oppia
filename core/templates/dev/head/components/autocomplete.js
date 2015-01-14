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
      // The regex used to validate newly-entered choices that do not
      // already exist. Use ".^" to reject all new choices.
      newChoiceRegex: '@',
      placeholder: '@',
      width: '@',
      onSelectionChange: '&',
      // The message shown when an invalid search term is entered. May be
      // undefined, in which case this defaults to 'No matches found'.
      invalidSearchTermMessage: '@',
      // A function that formats a new selection. May be undefined.
      formatNewSelection: '=',
      // An additional CSS class to add to the select2 dropdown. May be
      // undefined.
      dropdownCssClass: '@',
      // Whether to allow multiple choices. In order to do so, the value of
      // this attribute must be the exact string 'true'.
      allowMultipleChoices: '@'
    },
    template: '<input type="hidden">',
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      $scope.newChoiceValidator = new RegExp($scope.newChoiceRegex);

      var _defaultFormatNewSelection = function(id) {
        return id;
      };

      var _convertNewSelectionToText = (
        $scope.formatNewSelection ? $scope.formatNewSelection :
        _defaultFormatNewSelection);

      var select2Options = {
        data: $scope.choices,
        placeholder: $scope.placeholder,
        allowClear: false,
        multiple: $scope.allowMultipleChoices === 'true',
        width: $scope.width || '250px',
        createSearchChoice: function(term, data) {
          if ($(data).filter(function() {
            return this.text.localeCompare(term) === 0;
          }).length === 0) {
            return term.match($scope.newChoiceValidator) ? {
              id: term,
              text: term
            } : null;
          }
        },
        formatResult: function(queryResult) {
          var _doesChoiceMatchText = function(choice) {
            return choice.id === queryResult.text;
          };

          if ($scope.choices.some(_doesChoiceMatchText)) {
            return queryResult.text;
          } else {
            return _convertNewSelectionToText(queryResult.text)
          }
        },
        formatNoMatches: function(searchTerm) {
          if ($scope.invalidSearchTermMessage && !searchTerm.match($scope.newChoiceValidator)) {
            return $scope.invalidSearchTermMessage;
          } else {
            return 'No matches found';
          }
        }
      };

      if ($scope.dropdownCssClass) {
        select2Options.dropdownCssClass = $scope.dropdownCssClass;
      }

      var select2Node = $element[0].firstChild;

      // Initialize the dropdown.
      $(select2Node).select2(select2Options);
      $(select2Node).select2('val', $scope.item);

      // Update $scope.item when the selection changes.
      $(select2Node).on('change', function(e) {
        $scope.item = e.val;
        $scope.$apply();
        $scope.onSelectionChange();
        $scope.$apply();
      });
    }]
  };
}]);
