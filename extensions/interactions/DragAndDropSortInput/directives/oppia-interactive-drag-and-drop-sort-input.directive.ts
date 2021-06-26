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

require(
  'interactions/interaction-attributes-extractor.service.ts');

angular.module('oppia').directive('oppiaInteractiveDragAndDropSortInput', [
  'DragAndDropSortInputRulesService',
  'InteractionAttributesExtractorService',
  function(
      DragAndDropSortInputRulesService,
      InteractionAttributesExtractorService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        savedSolution: '<'
      },
      template: require(
        './drag-and-drop-sort-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'CurrentInteractionService',
        function(
            $attrs, CurrentInteractionService) {
          var ctrl = this;
          var answers = [];

          const getContentIdOfHtml = function(html) {
            const {
              choices
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'DragAndDropSortInput',
              $attrs
            );

            return choices[ctrl.choices.indexOf(html)].contentId;
          };

          const getHtmlOfContentId = function(contentId) {
            const {
              choices
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'DragAndDropSortInput',
              $attrs
            );
            for (let choice of choices) {
              if (choice.contentId === contentId) {
                return choice.html;
              }
            }
          };

          ctrl.submitAnswer = function() {
            // Converting list of dicts to list of lists to make it consistent
            // with the ListOfSetsOfTranslatableHtmlContentIds object.
            answers = [];
            for (var i = 0; i < ctrl.list.length; i++) {
              answers.push([getContentIdOfHtml(ctrl.list[i].title)]);
              for (var j = 0; j < ctrl.list[i].items.length; j++) {
                answers[i].push(
                  getContentIdOfHtml(ctrl.list[i].items[j].title));
              }
            }

            CurrentInteractionService.onSubmit(
              answers, DragAndDropSortInputRulesService);
          };
          ctrl.$onInit = function() {
            const {
              choices,
              allowMultipleItemsInSamePosition
            } = InteractionAttributesExtractorService.getValuesFromAttributes(
              'DragAndDropSortInput',
              $attrs
            );
            ctrl.choices = choices.map(choice => choice.html);

            ctrl.list = [];
            ctrl.dataMaxDepth = 1;

            ctrl.allowMultipleItemsInSamePosition = (
              allowMultipleItemsInSamePosition);

            if (ctrl.allowMultipleItemsInSamePosition) {
              ctrl.dataMaxDepth = 2;
            } else {
              ctrl.dataMaxDepth = 1;
            }

            let savedSolution = (
              ctrl.savedSolution !== undefined ? ctrl.savedSolution : []
            );

            if (savedSolution.length) {
              // Pre populate with the saved solution, if present.
              for (let contentIds of savedSolution) {
                let item = {
                  title: getHtmlOfContentId(contentIds[0]),
                  items: []
                };
                for (let i = 1; i < contentIds.length; i++) {
                  item.items.push({
                    title: getHtmlOfContentId(contentIds[i]),
                    items: []
                  });
                }
                ctrl.list.push(item);
              }
            } else {
              // Make list of dicts from the list of choices.
              for (let choice of ctrl.choices) {
                ctrl.list.push({title: choice, items: []});
              }
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
