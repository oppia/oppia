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
 * Directive for the DragAndDropSortInput interaction.
 */

oppia.directive('oppiaInteractiveDragAndDropSortInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  'dragAndDropSortInputRulesService',
  function(
      HtmlEscaperService, UrlInterpolationService,
      dragAndDropSortInputRulesService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/DragAndDropSortInput/directives/' +
        'drag_and_drop_sort_input_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', 'UrlService', 'CurrentInteractionService',
        function(
            $scope, $attrs, UrlService, CurrentInteractionService) {
          $scope.choices = HtmlEscaperService.escapedJsonToObj(
            $attrs.choicesWithValue);

          var answers = [];
          $scope.list = [];
          $scope.dataMaxDepth = 1;

          $scope.allowMultipleItemsInSamePosition = (
            $attrs.allowMultipleItemsInSamePositionWithValue === 'true');

          if ($scope.allowMultipleItemsInSamePosition) {
            $scope.dataMaxDepth = 2;
          } else {
            $scope.dataMaxDepth = 1;
          }

          // Make list of dicts from the list of choices.
          for (var i = 0; i < $scope.choices.length; i++) {
            $scope.list.push({title: $scope.choices[i], items: []});
          }

          $scope.treeOptions = {
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

          $scope.submitAnswer = function() {
            // Converting list of dicts to list of lists to make it consistent
            // with the ListOfSetsOfHtmlStrings object.
            answers = [];
            for (var i = 0; i < $scope.list.length; i++) {
              answers.push([$scope.list[i].title]);
              for (var j = 0; j < $scope.list[i].items.length; j++) {
                answers[i].push($scope.list[i].items[j].title);
              }
            }

            CurrentInteractionService.onSubmit(
              answers, DragAndDropSortInputRulesService);
          };

          CurrentInteractionService.registerCurrentInteraction(
            $scope.submitAnswer, null);
        }
      ]
    };
  }
]);
