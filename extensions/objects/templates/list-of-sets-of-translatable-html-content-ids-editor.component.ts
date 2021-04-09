// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for list of sets of translatable html content id
 * editor.
 */

angular.module('oppia').component(
  'listOfSetsOfTranslatableHtmlContentIdsEditor',
  {
    bindings: {
      getInitArgs: '&',
      value: '='
    },
    template: require(
      './list-of-sets-of-translatable-html-content-ids-editor.component.html'),
    controller: [
      function() {
        const ctrl = this;
        var errorMessage = '';
        ctrl.validOrdering = true;

        ctrl.allowedChoices = function() {
          var allowedList = [];
          for (var i = 1; i <= ctrl.choices.length; i++) {
            allowedList.push(i);
          }
          return allowedList;
        };

        ctrl.selectItem = function(choiceListIndex) {
          var choiceContentId = ctrl.choices[choiceListIndex].val;
          var selectedRank = parseInt(
            ctrl.choices[choiceListIndex].selectedRank) - 1;
          errorMessage = '';
          var choiceIdHasBeenAdded = false;

          for (var i = 0; i < ctrl.value.length; i++) {
            choiceIdHasBeenAdded = false;
            var choiceIdIndex = ctrl.value[i].indexOf(choiceContentId);
            if (choiceIdIndex > -1) {
              if (i !== selectedRank) {
                ctrl.value[i].splice(choiceIdIndex, 1);
                if (ctrl.value[selectedRank] === undefined) {
                  ctrl.value[selectedRank] = [choiceContentId];
                } else {
                  ctrl.value[selectedRank].push(choiceContentId);
                }
              }
              choiceIdHasBeenAdded = true;
              break;
            }
          }
          if (!choiceIdHasBeenAdded) {
            if (ctrl.value[selectedRank] === undefined) {
              ctrl.value[selectedRank] = [choiceContentId];
            } else {
              ctrl.value[selectedRank].push(choiceContentId);
            }
          }
          // Removing any empty arrays from the end.
          for (var i = 1; i < ctrl.value.length; i++) {
            if (ctrl.value[i].length === 0) {
              // If empty array is found, all subsequent arrays must also be
              // empty since rank skipping is not allowed.
              ctrl.value = ctrl.value.slice(0, i);
              break;
            }
          }
          ctrl.validateOrdering();
        };

        ctrl.getWarningText = function() {
          return errorMessage;
        };

        ctrl.validateOrdering = function() {
          var selectedRankList = [];
          for (var i = 0; i < ctrl.choices.length; i++) {
            selectedRankList.push(ctrl.choices[i].selectedRank);
          }
          selectedRankList.sort();

          if (selectedRankList[0] !== 1) {
            errorMessage = ('Please assign some choice at position 1.');
            ctrl.validOrdering = false;
            return;
          }
          for (var i = 1; i < selectedRankList.length; i++) {
            if (selectedRankList[i] - selectedRankList[i - 1] > 1) {
              errorMessage = (
                'Please assign some choice at position ' +
                String(selectedRankList[i - 1] + 1) + '.');
              ctrl.validOrdering = false;
              return;
            }
          }
          errorMessage = '';
          ctrl.validOrdering = true;
          return;
        };

        ctrl.$onInit = function() {
          ctrl.initValues = [];
          ctrl.initArgs = ctrl.getInitArgs();
          ctrl.choices = ctrl.initArgs.choices;

          // Initialize the default values.
          if (ctrl.value[0] === undefined || ctrl.value[0].length === 0) {
            ctrl.value = [];
            for (var i = 0; i < ctrl.choices.length; i++) {
              ctrl.value.push([ctrl.choices[i].val]);
              ctrl.initValues.push(i + 1);
            }
          } else {
            for (var i = 0; i < ctrl.choices.length; i++) {
              var choice = ctrl.choices[i].val;
              for (var j = 0; j < ctrl.value.length; j++) {
                if (ctrl.value[j].indexOf(choice) !== -1) {
                  ctrl.initValues.push(j + 1);
                  break;
                }
              }
            }
          }
        };
      }
    ]
  }
);
