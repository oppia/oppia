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


oppia.directive('listOfSetsOfHtmlStringsEditor', [
  'OBJECT_EDITOR_URL_PREFIX', 'UrlInterpolationService',
  function(OBJECT_EDITOR_URL_PREFIX, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/' +
        'list_of_sets_of_html_strings_editor_directive.html'),
      controller: ['$scope', function($scope) {
        var errorMessage = '';
        $scope.selectedRank = '';

        if (!$scope.value) {
          $scope.value = [];
        }
        if (!$scope.maxPrevIndex) {
          $scope.maxPrevIndex = 0;
        }
        $scope.initArgs = $scope.getInitArgs();
        $scope.choices = $scope.initArgs.choices;

        if ($scope.selectedRank !== '') {
          $scope.maxPrevIndex = math.max(parseInt($scope.selectedRank),
            $scope.maxPrevIndex);
        }

        $scope.allowedChoices = function() {
          var allowedList = [];
          for (var i = 0; i <= $scope.maxPrevIndex; i++) {
            allowedList.push(i + 1);
          }
          return allowedList;
        };

        $scope.selectedItem = function(choiceListIndex) {
          var choiceHtml = $scope.choices[choiceListIndex].id;
          var selectedRank = parseInt($scope.selectedRank) - 1;
          // Reorder the $scope.choices array to make it consistent with the
          // selected rank.
          $scope.choices.splice(selectedRank, 0, $scope.choices.splice(
            choiceListIndex, 1)[0]);
          var choiceHtmlHasBeenAdded = false;
          $scope.maxPrevIndex = math.max(parseInt($scope.selectedRank),
            $scope.maxPrevIndex);

          for (var i = 0; i < $scope.value.length; i++) {
            choiceHtmlHasBeenAdded = false;
            errorMessage = '';
            var choiceHtmlIndex = $scope.value[i].indexOf(choiceHtml);
            if (choiceHtmlIndex > -1) {
              if (i !== selectedRank) {
                $scope.value[i].splice(choiceHtmlIndex, 1);
                if ($scope.value[selectedRank] === undefined) {
                  $scope.value[selectedRank] = [choiceHtml];
                } else {
                  $scope.value[selectedRank].push(choiceHtml);
                }

                if ($scope.value[i] === []) {
                  // Continuity error.
                  errorMessage = ('No item(s) is assigned at position ' +
                    String(i + 1) + '. Please assign some item at this ' +
                    'position.');
                }
                choiceHtmlHasBeenAdded = true;
                break;
              }
            }
          }
          if (!choiceHtmlHasBeenAdded) {
            if ($scope.value[selectedRank] === undefined) {
              $scope.value[selectedRank] = [choiceHtml];
            } else {
              $scope.value[selectedRank].push(choiceHtml);
            }
          }
        };

        $scope.getWarningText = function() {
          return errorMessage;
        };
      }]
    };
  }]);
