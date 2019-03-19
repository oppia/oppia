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
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
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

        if (!$scope.selectedRank) {
          $scope.selectedRank = '';
        }

        if (!$scope.maxPrevIndex) {
          $scope.maxPrevIndex = 1;
        }

        $scope.initValues = [];
        $scope.initArgs = $scope.getInitArgs();
        $scope.choices = $scope.initArgs.choices;

        // Initialize the default values.
        if ($scope.value[0] === undefined || $scope.value[0].length === 0) {
          $scope.value = [[]];
          for (var i = 0; i < $scope.choices.length; i++) {
            $scope.value[0].push($scope.choices[i].id);
            $scope.initValues.push(1);
          }
        } else {
          for (var i = 0; i < $scope.choices.length; i++) {
            for (var j = 0; j < $scope.value.length; j++) {
              var choice = $scope.choices[i].id;
              if ($scope.value[j].indexOf(choice) !== -1) {
                $scope.initValues.push(j + 1);
                $scope.maxPrevIndex = math.max($scope.maxPrevIndex, j + 1);
                break;
              }
            }
          }
        }

        if ($scope.selectedRank !== '') {
          $scope.maxPrevIndex = math.max(parseInt($scope.selectedRank),
            $scope.maxPrevIndex);
        }

        $scope.allowedChoices = function() {
          var allowedList = [];
          for (var i = 0; i <= math.min(
            $scope.maxPrevIndex, $scope.choices.length - 1); i++) {
            allowedList.push(i + 1);
          }
          return allowedList;
        };

        $scope.selectedItem = function(choiceListIndex, selectedRank) {
          var choiceHtml = $scope.choices[choiceListIndex].id;
          var selectedRank = parseInt(selectedRank) - 1;
          errorMessage = '';
          // Reorder the $scope.choices array to make it consistent with the
          // selected rank.
          // $scope.choices.splice(selectedRank, 0, $scope.choices.splice(
          // choiceListIndex, 1)[0]);
          var choiceHtmlHasBeenAdded = false;
          $scope.maxPrevIndex = math.max(parseInt(selectedRank + 1),
            $scope.maxPrevIndex);

          for (var i = 0; i < $scope.value.length; i++) {
            choiceHtmlHasBeenAdded = false;
            var choiceHtmlIndex = $scope.value[i].indexOf(choiceHtml);
            if (choiceHtmlIndex > -1) {
              if (i !== selectedRank) {
                $scope.value[i].splice(choiceHtmlIndex, 1);
                if ($scope.value[selectedRank] === undefined) {
                  $scope.value[selectedRank] = [choiceHtml];
                } else {
                  $scope.value[selectedRank].push(choiceHtml);
                }
              }
              choiceHtmlHasBeenAdded = true;
              break;
            }
          }
          for (var i = 0; i < $scope.value.length; i++) {
            if ($scope.value[i].length === 0) {
              if (i === $scope.value.length - 1) {
                // If it is empty list at the last, pop it out.
                $scope.value.pop();
              } else {
                // Continuity error.
                errorMessage = ('No choice(s) is assigned at position ' +
                  String(i + 1) + '. Please assign some choice at this ' +
                  'position.');
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
