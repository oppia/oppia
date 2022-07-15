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
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require('third-party-imports/select2.import.ts');

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
      '$element', '$filter', '$scope',
      'StateInteractionIdService', 'INTERACTION_SPECS',
      function(
          $element, $filter, $scope,
          StateInteractionIdService, INTERACTION_SPECS) {
        var ctrl = this;
        ctrl.$onInit = function() {
          var choices = [];

          var ruleTypesToDescriptions = INTERACTION_SPECS[
            StateInteractionIdService.savedMemento].rule_descriptions;
          var equalToIndex = null;
          var idx = 0;
          for (var ruleType in ruleTypesToDescriptions) {
            if (ruleType.includes('Equal') || ruleType.includes('Exactly')) {
              equalToIndex = idx;
            }
            choices.push({
              id: ruleType,
              text: $filter('replaceInputsWithEllipses')(
                ruleTypesToDescriptions[ruleType])
            });
            idx++;
          }
          // If the 'Equals' rule is not the first one, swap it with the first
          // rule, so the equals rule is always the default one selected in the
          // editor.
          if (equalToIndex) {
            [choices[0], choices[equalToIndex]] = [
              choices[equalToIndex], choices[0]];
          }
          var select2Node = $element[0].firstChild;
          $(select2Node).select2({
            allowClear: false,
            data: choices,
            // Suppress the search box.
            minimumResultsForSearch: -1,
            width: '100%',
            dropdownParent: $(select2Node).parent(),
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
        };
      }
    ]
  };
}]);
