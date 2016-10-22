// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the body of the simple editor.
 */

oppia.directive('simpleEditorBody', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'simpleEditor/body',
    controller: [
      '$scope', '$timeout', 'SimpleEditorManagerService',
      function($scope, $timeout, SimpleEditorManagerService) {
        $scope.data = {};
        $scope.$on('simpleEditorLoaded', function() {
          $scope.data = SimpleEditorManagerService.getData();
        });

        $scope.saveTitle = SimpleEditorManagerService.saveTitle;
        $scope.saveIntroductionHtml = (
          SimpleEditorManagerService.saveIntroductionHtml);
        $scope.saveCustomizationArgs = (
          SimpleEditorManagerService.saveCustomizationArgs);
        $scope.saveAnswerGroups = SimpleEditorManagerService.saveAnswerGroups;
        $scope.saveDefaultOutcome = (
          SimpleEditorManagerService.saveDefaultOutcome);
        $scope.saveBridgeHtml = SimpleEditorManagerService.saveBridgeHtml;
        $scope.canAddNewQuestion = SimpleEditorManagerService.canAddNewQuestion;
        $scope.addState = SimpleEditorManagerService.addState;

        $scope.addNewQuestion = function() {
          SimpleEditorManagerService.addNewQuestion();

          // The directive for the new question needs to be loaded before this
          // broadcast can have any effect.
          $timeout(function() {
            $scope.$broadcast('newQuestionAdded', {
              targetId: $scope.data.questions[
                $scope.data.questions.length - 1].getStateName()
            });
          });
        };
      }
    ]
  };
}]);
