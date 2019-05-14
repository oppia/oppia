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
      scope: {},
      bindToController: {
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
      controllerAs: 'select2DropdownCtrl',
      controller: ['$scope', '$element', function($scope, $element) {
        var ctrl = this;
        ctrl.newChoiceValidator = new RegExp(ctrl.newChoiceRegex);

        var select2Options = {
          allowClear: false,
          data: ctrl.choices,
          multiple: ctrl.allowMultipleChoices === 'true',
          tags: ctrl.newChoiceRegex !== undefined,
          placeholder: ctrl.placeholder,
          width: ctrl.width || '250px',
          dropdownCssClass: null,
          createTag: function(params) {
            return params.term.match(ctrl.newChoiceValidator) ? {
              id: params.term,
              text: params.term
            } : null;
          },
          templateResult: function(queryResult) {
            var doesChoiceMatchText = function(choice) {
              return choice.id === queryResult.text;
            };

            if (ctrl.choices && ctrl.choices.some(doesChoiceMatchText)) {
              return queryResult.text;
            } else {
              if (ctrl.formatNewSelection) {
                return ctrl.formatNewSelection(queryResult.text);
              } else {
                return queryResult.text;
              }
            }
          },
          language: {
            noResults: function() {
              if (ctrl.invalidSearchTermMessage) {
                return ctrl.invalidSearchTermMessage;
              } else {
                return 'No matches found';
              }
            }
          }
        };

        if (ctrl.dropdownCssClass) {
          select2Options.dropdownCssClass = ctrl.dropdownCssClass;
        }

        var select2Node = $element[0].firstChild;

        // Initialize the dropdown.
        $(select2Node).select2(select2Options);
        $(select2Node).val(ctrl.item).trigger('change');

        // Update ctrl.item when the selection changes.
        $(select2Node).on('change', function() {
          ctrl.item = $(select2Node).val();
          $scope.$apply();
          ctrl.onSelectionChange();
        });

        // Respond to external changes in ctrl.item
        $scope.$watch('select2DropdownCtrl.item', function(newValue) {
          $(select2Node).val(newValue);
        });
      }]
    };
  }
]);
