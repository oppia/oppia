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
 * Directive for the DragAndDropSort interaction.
 */

oppia.directive('oppiaInteractiveDragAndDropSort', [
  'dragAndDropSortRulesService', 'HtmlEscaperService',
  'UrlInterpolationService',
  function(
      dragAndDropSortRulesService, HtmlEscaperService,
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&',
        // This should be called whenever the answer changes.
        setAnswerValidity: '&'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/DragAndDropSort/directives/' +
        'drag_and_drop_sort_interaction_directive.html'),
      controller: [
        '$scope', '$attrs', 'UrlService', 'EVENT_PROGRESS_NAV_SUBMITTED',
        function(
            $scope, $attrs, UrlService, EVENT_PROGRESS_NAV_SUBMITTED) {
          $scope.choices = HtmlEscaperService.escapedJsonToObj(
            $attrs.choicesWithValue);

          var answers = [];
          $scope.list = [];
          // Make list of dicts from the list of choices.
          for (var i = 0; i < $scope.choices.length; i++) {
            $scope.list.push({title: $scope.choices[i], items: []});
          }

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

            $scope.onSubmit({
              answer: answers,
              rulesService: dragAndDropSortRulesService
            });
          };

          $scope.$on(EVENT_PROGRESS_NAV_SUBMITTED, $scope.submitAnswer);
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseDragAndDropSort', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/DragAndDropSort/directives/' +
        'drag_and_drop_sort_response_directive.html'),
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

oppia.directive('oppiaShortResponseDragAndDropSort', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/DragAndDropSort/directives/' +
        'drag_and_drop_sort_short_response_directive.html'),
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

// Rules Service for DragAndDropSort interaction.
oppia.factory('dragAndDropSortRulesService', [function() {
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
    for (var i = 0; i < answer.length; i++) {
      for (var j = 0; j < answer[i].length; j++) {
        if (inputs.x[i].indexOf(answer[i][j]) === -1) {
          noOfMismatches += 1;
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
    }
  };
}]);
