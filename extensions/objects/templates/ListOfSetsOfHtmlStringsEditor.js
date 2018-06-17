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
  '$compile', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'ListOfSetsOfHtmlStrings';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: {
        getInitArgs: '&',
        value: '='
      },
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        if (!$scope.value) {
          $scope.value = [];
        }
        if (!$scope.prevIndices) {
          $scope.prevIndices = [];
        }
        $scope.initArgs = $scope.getInitArgs();
        $scope.choices = $scope.initArgs.choices;

        if ($scope.selectedChoice !== '' && $scope.selectedChoice !== null) {
          $scope.prevIndices.push(parseInt($scope.selectedChoice));
        }

        $scope.allowedChoices = function() {
          var allowedList = [];
          for (var i = 1; i <= math.max($scope.prevIndices) + 1; i++) {
            allowedList.push(i);
          }
          return allowedList;
        };

        $scope.selections = function(choiceListIndex) {
          var choiceHtml = $scope.choices[choiceListIndex].id;
          var selectedChoice = parseInt($scope.selectedChoice) - 1;
          var flag = 0;
          for (var i = 0; i < $scope.value.length; i++) {
            flag = 0;
            var selectedChoicesIndex = $scope.value[i].indexOf(choiceHtml);
            if (selectedChoicesIndex > -1) {
              if (i !== selectedChoice) {
                $scope.value[i].splice(selectedChoicesIndex, 1);
                $scope.value[selectedChoice].push(choiceHtml);
                flag = 1;
                break;
              }
            }
          }
          if (flag === 0) {
            if ($scope.value[selectedChoice] === undefined) {
              $scope.value[selectedChoice] = [choiceHtml];
            } else {
              $scope.value[selectedChoice].push(choiceHtml);
            }
          }
        };
      }]
    };
  }]);
