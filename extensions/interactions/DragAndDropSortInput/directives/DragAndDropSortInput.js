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
  'dragAndDropSortInputRulesService', 'HtmlEscaperService',
  'UrlInterpolationService',
  function(
      dragAndDropSortInputRulesService, HtmlEscaperService,
      UrlInterpolationService) {
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
              answers, dragAndDropSortInputRulesService);
          };

          CurrentInteractionService.registerCurrentInteraction(
            $scope.submitAnswer, null);
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseDragAndDropSortInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/DragAndDropSortInput/directives/' +
        'drag_and_drop_sort_input_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.chooseItemType = function(index) {
          if (index === 0) {
            $scope.itemtype = 'drag-and-drop-response-item';
          } else {
            $scope.itemtype = 'drag-and-drop-response-subitem';
          }
          return true;
        };

        $scope.answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.isAnswerLengthGreaterThanZero = ($scope.answer.length > 0);
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseDragAndDropSortInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/DragAndDropSortInput/directives/' +
        'drag_and_drop_sort_input_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.chooseItemType = function(index) {
          if (index === 0) {
            $scope.itemtype = 'drag-and-drop-response-item';
          } else {
            $scope.itemtype = 'drag-and-drop-response-subitem';
          }
          return true;
        };

        $scope.answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.isAnswerLengthGreaterThanZero = ($scope.answer.length > 0);
      }]
    };
  }
]);

// Rules Service for DragAndDropSortInput interaction.
oppia.factory('dragAndDropSortInputRulesService', [function() {
  var checkEquality = function(answer, inputs) {
    for (var i = 0; i < answer.length; i++) {
      if (answer[i].length === inputs.x[i].length) {
        for (var j = 0; j < answer[i].length; j++) {
          if (inputs.x[i].indexOf(answer[i][j]) === -1) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    return true;
  };
  var checkEqualityWithIncorrectPositions = function(answer, inputs) {
    var noOfMismatches = 0;
    for (var i = 0; i < math.min(inputs.x.length, answer.length); i++) {
      for (var j = 0; j < math.max(answer[i].length, inputs.x[i].length); j++) {
        if (inputs.x[i].length > answer[i].length) {
          if (answer[i].indexOf(inputs.x[i][j]) === -1) {
            noOfMismatches += 1;
          }
        } else {
          if (inputs.x[i].indexOf(answer[i][j]) === -1) {
            noOfMismatches += 1;
          }
        }
      }
    }
    return noOfMismatches === 1;
  };
  return {
    IsEqualToOrdering: function(answer, inputs) {
      return answer.length === inputs.x.length && checkEquality(answer, inputs);
    },
    IsEqualToOrderingWithOneItemAtIncorrectPosition: function(answer, inputs) {
      return checkEqualityWithIncorrectPositions(answer, inputs);
    },
    HasElementXAtPositionY: function(answer, inputs) {
      for (var i = 0; i < answer.length; i++) {
        var index = answer[i].indexOf(inputs.x);
        if (index !== -1) {
          return ((i + 1) === inputs.y);
        }
      }
    },
    HasElementXBeforeElementY: function(answer, inputs) {
      var indX = -1;
      var indY = -1;
      for (var i = 0; i < answer.length; i++) {
        var index = answer[i].indexOf(inputs.x);
        if (index !== -1) {
          indX = i;
        }
        index = answer[i].indexOf(inputs.y);
        if (index !== -1) {
          indY = i;
        }
      }
      return indX < indY;
    }
  };
}]);
