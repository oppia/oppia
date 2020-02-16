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
 * @fileoverview Directive for the DragAndDropSortInput interaction.
 */

require(
  'interactions/DragAndDropSortInput/directives/' +
  'drag-and-drop-sort-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');

require('services/html-escaper.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').directive('oppiaInteractiveDragAndDropSortInput', [
  'DragAndDropSortInputRulesService', 'HtmlEscaperService',
  function(DragAndDropSortInputRulesService, HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require(
        './drag-and-drop-sort-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'UrlService', 'CurrentInteractionService',
        function(
            $attrs, UrlService, CurrentInteractionService) {
          var ctrl = this;
          var answers = [];
          ctrl.submitAnswer = function() {
            // Converting list of dicts to list of lists to make it consistent
            // with the ListOfSetsOfHtmlStrings object.
            answers = [];
            for (var i = 0; i < ctrl.list.length; i++) {
              answers.push([ctrl.list[i].title]);
              for (var j = 0; j < ctrl.list[i].items.length; j++) {
                answers[i].push(ctrl.list[i].items[j].title);
              }
            }

            CurrentInteractionService.onSubmit(
              answers, DragAndDropSortInputRulesService);
          };
          ctrl.$onInit = function() {
            ctrl.choices = HtmlEscaperService.escapedJsonToObj(
              $attrs.choicesWithValue);

            ctrl.list = [];
            ctrl.dataMaxDepth = 1;

            ctrl.allowMultipleItemsInSamePosition = (
              $attrs.allowMultipleItemsInSamePositionWithValue === 'true');

            if (ctrl.allowMultipleItemsInSamePosition) {
              ctrl.dataMaxDepth = 2;
            } else {
              ctrl.dataMaxDepth = 1;
            }

            // Make list of dicts from the list of choices.
            for (var i = 0; i < ctrl.choices.length; i++) {
              ctrl.list.push({title: ctrl.choices[i], items: []});
            }

            ctrl.treeOptions = {
              dragMove: function(e) {
                // Change the color of the placeholder based on the position of
                // the dragged item.
                if (e.dest.nodesScope.$childNodesScope !== undefined) {
                  e.elements.placeholder[0].style.borderColor = '#add8e6';
                } else {
                  e.elements.placeholder[0].style.borderColor = '#000000';
                }
              }
            };

            CurrentInteractionService.registerCurrentInteraction(
              ctrl.submitAnswer, null);
          };
        }
      ]
    };
  }
]);
