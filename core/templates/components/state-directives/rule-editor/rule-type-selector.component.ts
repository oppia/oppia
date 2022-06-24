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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { ReplaceInputsWithEllipsesPipe } from 'filters/string-utility-filters/replace-inputs-with-ellipses.pipe';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

@Component({
  selector: 'oppia-rule-type-selector',
  templateUrl: './rule-type-selector.component.html'
})
export class RuleTypeSelector implements OnInit {
  @Input() localValue;
  @Output() onSelectionChange = new EventEmitter();
  choices = [];

  constructor(
    private stateInteractionIdService: StateInteractionIdService,
    private replaceInputsWithEllipsesPipe: ReplaceInputsWithEllipsesPipe,
  ) {}

  selectedRule($event: Event): void {
    console.error('choices');
    console.error(this.choices);

    console.error('localValue');
    console.error(this.localValue);
  }

  ngOnInit(): void {
    let ruleTypesToDescriptions = INTERACTION_SPECS[
      this.stateInteractionIdService.savedMemento].rule_descriptions;

    let equalToIndex = null;
    let idx = 0;
    for (let ruleType in ruleTypesToDescriptions) {
      if (ruleType.includes('Equal') || ruleType.includes('Exactly')) {
        equalToIndex = idx;
      }

      this.choices.push({
        id: ruleType,
        text: this.replaceInputsWithEllipsesPipe.transform(
          ruleTypesToDescriptions[ruleType])
      });
      idx++;
    }
    // If the 'Equals' rule is not the first one, swap it with the first
    // rule, so the equals rule is always the default one selected in the
    // editor.
    if (equalToIndex) {
      [this.choices[0], this.choices[equalToIndex]] = [
        this.choices[equalToIndex], this.choices[0]];
    }
    this.localValue = this.choices[0].id;
  }
}


angular.module('oppia').directive('oppiaRuleTypeSelector',
  downgradeComponent({
    component: RuleTypeSelector
  }) as angular.IDirectiveFactory);

// Angular.module('oppia').directive('ruleTypeSelector', [function() {
//   return {
//     restrict: 'E',
//     scope: {},
//     bindToController: {
//       localValue: '@',
//       onSelectionChange: '&'
//     },
//     template: '<select></select>',
//     controllerAs: '$ctrl',
//     controller: [
//       '$element', '$filter', '$scope',
//       'StateInteractionIdService', 'INTERACTION_SPECS',
//       function(
//           $element, $filter, $scope,
//           StateInteractionIdService, INTERACTION_SPECS) {
//         let ctrl = this;
//         ctrl.$onInit = function() {
//           let choices = [];

//           let ruleTypesToDescriptions = INTERACTION_SPECS[
//             StateInteractionIdService.savedMemento].rule_descriptions;
//           let equalToIndex = null;
//           let idx = 0;
//           for (let ruleType in ruleTypesToDescriptions) {
//             if (ruleType.includes('Equal') || ruleType.includes('Exactly')) {
//               equalToIndex = idx;
//             }
//             choices.push({
//               id: ruleType,
//               text: $filter('replaceInputsWithEllipses')(
//                 ruleTypesToDescriptions[ruleType])
//             });
//             idx++;
//           }
//           // If the 'Equals' rule is not the first one, swap it with the first
//           // rule, so the equals rule is always the default one selected in the
//           // editor.
//           if (equalToIndex) {
//             [choices[0], choices[equalToIndex]] = [
//               choices[equalToIndex], choices[0]];
//           }
//           let select2Node = $element[0].firstChild;
//           $(select2Node).select2({
//             allowClear: false,
//             data: choices,
//             // Suppress the search box.
//             minimumResultsForSearch: -1,
//             width: '100%',
//             dropdownParent: $(select2Node).parent(),
//             templateSelection: function(object) {
//               return $filter('truncateAtFirstEllipsis')(object.text);
//             }
//           });

//           // Select the first choice by default.
//           if (!ctrl.localValue) {
//             ctrl.localValue = choices[0].id;
//             ctrl.onSelectionChange()(ctrl.localValue);
//           }

//           // Initialize the dropdown.
//           $(select2Node).val(ctrl.localValue).trigger('change');

//           $(select2Node).on('change', function(e) {
//             ctrl.onSelectionChange()($(select2Node).val());
//             // This is needed to propagate the change and display input fields
//             // for parameterizing the rule. Otherwise, the input fields do not
//             // get updated when the rule type is changed.
//             $scope.$apply();
//           });
//         };
//       }
//     ]
//   };
// }]);
