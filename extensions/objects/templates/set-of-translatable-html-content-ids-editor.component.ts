// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for set of translatable html content id editor.
 */

angular.module('oppia').component('setOfTranslatableHtmlContentIdsEditor', {
  bindings: {
    getInitArgs: '&',
    value: '='
  },
  template: require(
    './set-of-translatable-html-content-ids-editor.component.html'),
  controller: [
    function() {
      const ctrl = this;

      // The following function is necessary to insert elements into the
      // answer groups for the Item Selection Widget.
      ctrl.toggleSelection = function(choiceListIndex) {
        const choiceContentId = ctrl.choices[choiceListIndex].val;
        const selectedChoicesIndex = ctrl.value.indexOf(choiceContentId);
        if (selectedChoicesIndex > -1) {
          ctrl.value.splice(selectedChoicesIndex, 1);
        } else {
          ctrl.value.push(ctrl.choices[choiceListIndex].val);
        }
      };
      ctrl.$onInit = function() {
        ctrl.SCHEMA = {
          type: 'list',
          items: {
            type: 'html'
          }
        };

        if (!ctrl.value) {
          ctrl.value = [];
        }
        ctrl.initArgs = ctrl.getInitArgs();
        ctrl.choices = ctrl.initArgs.choices;
        ctrl.selections = ctrl.choices.map(
          choice => ctrl.value.indexOf(choice.val) !== -1
        );
      };
    }
  ]
});
