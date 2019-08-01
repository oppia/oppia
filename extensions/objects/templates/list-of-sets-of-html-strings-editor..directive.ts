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
 * @fileoverview Directive for list of sets of html strings editor.
 */

var oppia = require('AppInit.ts').module;

oppia.directive('listOfSetsOfHtmlStringsEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/' +
        'list_of_sets_of_html_strings_editor_directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        var errorMessage = '';

        if (!ctrl.selectedRank) {
          ctrl.selectedRank = '';
        }

        if (!ctrl.maxPrevIndex) {
          ctrl.maxPrevIndex = 1;
        }

        ctrl.initValues = [];
        ctrl.initArgs = ctrl.getInitArgs();
        ctrl.choices = ctrl.initArgs.choices;

        // Initialize the default values.
        if (ctrl.value[0] === undefined || ctrl.value[0].length === 0) {
          ctrl.value = [[]];
          for (var i = 0; i < ctrl.choices.length; i++) {
            ctrl.value[0].push(ctrl.choices[i].id);
            ctrl.initValues.push(1);
          }
        } else {
          for (var i = 0; i < ctrl.choices.length; i++) {
            for (var j = 0; j < ctrl.value.length; j++) {
              var choice = ctrl.choices[i].id;
              if (ctrl.value[j].indexOf(choice) !== -1) {
                ctrl.initValues.push(j + 1);
                ctrl.maxPrevIndex = math.max(ctrl.maxPrevIndex, j + 1);
                break;
              }
            }
          }
        }

        if (ctrl.selectedRank !== '') {
          ctrl.maxPrevIndex = math.max(parseInt(ctrl.selectedRank),
            ctrl.maxPrevIndex);
        }

        ctrl.allowedChoices = function() {
          var allowedList = [];
          for (var i = 0; i <= math.min(
            ctrl.maxPrevIndex, ctrl.choices.length - 1); i++) {
            allowedList.push(i + 1);
          }
          return allowedList;
        };

        ctrl.selectedItem = function(choiceListIndex, selectedRankString) {
          var choiceHtml = ctrl.choices[choiceListIndex].id;
          var selectedRank = parseInt(selectedRankString) - 1;
          errorMessage = '';
          // Reorder the ctrl.choices array to make it consistent with the
          // selected rank.
          // ctrl.choices.splice(selectedRank, 0, ctrl.choices.splice(
          // choiceListIndex, 1)[0]);
          var choiceHtmlHasBeenAdded = false;
          ctrl.maxPrevIndex = math.max(selectedRank + 1,
            ctrl.maxPrevIndex);

          for (var i = 0; i < ctrl.value.length; i++) {
            choiceHtmlHasBeenAdded = false;
            var choiceHtmlIndex = ctrl.value[i].indexOf(choiceHtml);
            if (choiceHtmlIndex > -1) {
              if (i !== selectedRank) {
                ctrl.value[i].splice(choiceHtmlIndex, 1);
                if (ctrl.value[selectedRank] === undefined) {
                  ctrl.value[selectedRank] = [choiceHtml];
                } else {
                  ctrl.value[selectedRank].push(choiceHtml);
                }
              }
              choiceHtmlHasBeenAdded = true;
              break;
            }
          }
          for (var i = 0; i < ctrl.value.length; i++) {
            if (ctrl.value[i].length === 0) {
              if (i === ctrl.value.length - 1) {
                // If it is empty list at the last, pop it out.
                ctrl.value.pop();
              } else {
                // Continuity error.
                errorMessage = ('No choice(s) is assigned at position ' +
                  String(i + 1) + '. Please assign some choice at this ' +
                  'position.');
              }
            }
          }
          if (!choiceHtmlHasBeenAdded) {
            if (ctrl.value[selectedRank] === undefined) {
              ctrl.value[selectedRank] = [choiceHtml];
            } else {
              ctrl.value[selectedRank].push(choiceHtml);
            }
          }
        };

        ctrl.getWarningText = function() {
          return errorMessage;
        };
      }]
    };
  }]);
