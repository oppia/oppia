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
 */

oppia.directive('select2Dropdown', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    // Directive for incorporating select2 dropdowns.
    return {
      restrict: 'E',
      scope: {
        // Whether to allow multiple choices. In order to do so, the value of
        // this attribute must be the exact string 'true'.
        allowMultipleChoices: '@',
        choices: '=',
        // An additional CSS class to add to the select2 dropdown. May be
        // undefined.
        dropdownCssClass: '@',
        // A function that formats a new selection. May be undefined.
        formatNewSelection: '=',
        // The message shown when an invalid search term is entered. May be
        // undefined, in which case this defaults to 'No matches found'.
        invalidSearchTermMessage: '@',
        item: '=',
        // The regex used to validate newly-entered choices that do not
        // already exist. If it is undefined then all new choices are rejected.
        newChoiceRegex: '@',
        onSelectionChange: '&',
        placeholder: '@',
        width: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/select2_dropdown_directive.html'),
      controller: ['$scope', '$element', function($scope, $element) {
        $scope.newChoiceValidator = new RegExp($scope.newChoiceRegex);

        var select2Options = {
          allowClear: false,
          data: $scope.choices,
          multiple: $scope.allowMultipleChoices === 'true',
          tags: $scope.newChoiceRegex !== undefined,
          placeholder: $scope.placeholder,
          width: $scope.width || '250px',
          createTag: function(params) {
            return params.term.match($scope.newChoiceValidator) ? {
              id: params.term,
              text: params.term
            } : null;
          },
          templateResult: function(queryResult) {
            var doesChoiceMatchText = function(choice) {
              return choice.id === queryResult.text;
            };

            if ($scope.choices && $scope.choices.some(doesChoiceMatchText)) {
              return queryResult.text;
            } else {
              if ($scope.formatNewSelection) {
                return $scope.formatNewSelection(queryResult.text);
              } else {
                return queryResult.text;
              }
            }
          },
          language: {
            noResults: function() {
              if ($scope.invalidSearchTermMessage) {
                return $scope.invalidSearchTermMessage;
              } else {
                return 'No matches found';
              }
            }
          }
        };

        if ($scope.dropdownCssClass) {
          select2Options.dropdownCssClass = $scope.dropdownCssClass;
        }

        var select2Node = $element[0].firstChild;

        // Initialize the dropdown.
        $(select2Node).select2(select2Options);
        $(select2Node).val($scope.item).trigger('change');

        // Update $scope.item when the selection changes.
        $(select2Node).on('change', function() {
          $scope.item = $(select2Node).val();
          $scope.$apply();
          $scope.onSelectionChange();
        });

        // Respond to external changes in $scope.item
        $scope.$watch('item', function(newValue) {
          $(select2Node).val(newValue);
        });
      }]
    };
  }
]);
