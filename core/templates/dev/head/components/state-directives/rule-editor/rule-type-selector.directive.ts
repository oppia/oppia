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

require(
  'filters/string-utility-filters/replace-inputs-with-ellipses.filter.ts');
require('filters/string-utility-filters/truncate-at-first-ellipsis.filter.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');

angular.module('oppia').directive('ruleTypeSelector', [function() {
  return {
    restrict: 'E',
    scope: {},
    bindToController: {
      localValue: '@',
      onSelectionChange: '&'
    },
    template: '<select></select>',
    controllerAs: '$ctrl',
    controller: [
      '$scope', '$element', '$rootScope', '$filter',
      'StateInteractionIdService', 'INTERACTION_SPECS',
      function(
          $scope, $element, $rootScope, $filter,
          StateInteractionIdService, INTERACTION_SPECS) {
        var ctrl = this;
        var choices = [];
        var numberOfRuleTypes = 0;

        var ruleTypesToDescriptions = INTERACTION_SPECS[
          StateInteractionIdService.savedMemento].rule_descriptions;
        for (var ruleType in ruleTypesToDescriptions) {
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
          dropdownParent: $('.rule-parent'),
          templateSelection: function(object) {
            return $filter('truncateAtFirstEllipsis')(object.text);
          }
        });

        // Select the first choice by default.
        if (!ctrl.localValue) {
          ctrl.localValue = choices[0].id;
          ctrl.onSelectionChange()(ctrl.localValue);
        }

        // Initialize the dropdown.
        $(select2Node).val(ctrl.localValue).trigger('change');

        $(select2Node).on('change', function(e) {
          ctrl.onSelectionChange()($(select2Node).val());
          // This is needed to propagate the change and display input fields
          // for parameterizing the rule. Otherwise, the input fields do not
          // get updated when the rule type is changed.
          $scope.$apply();
        });
      }
    ]
  };
}]);
