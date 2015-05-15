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
 * @fileoverview Controller for the snapshots skin.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('snapshotsSkin', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'skins/Snapshots',
    controller: ['$scope', 'warningsData', 'oppiaPlayerService', 'focusService', '$timeout',
        function($scope, warningsData, oppiaPlayerService, focusService, $timeout) {

      var currentStateName = oppiaPlayerService.getCurrentStateName();
      var _labelForNextFocusTarget = '';

      $scope.initializePage = function() {
        $scope.inputTemplate = '';
        $scope.currentQuestion = '';
        oppiaPlayerService.init(function(stateName, initHtml) {
          $scope.currentQuestion = initHtml;
          _labelForNextFocusTarget = Math.random().toString(36).slice(2);
          $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(stateName, _labelForNextFocusTarget);
          $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
          $scope.gadgetPanelsContents = oppiaPlayerService.getGadgetPanelsContents();
          currentStateName = stateName;

          $timeout(function() {
            focusService.setFocus(_labelForNextFocusTarget);
          }, 50);
        });
      };

      $scope.upcomingQuestionHtml = null;
      $scope.upcomingInputTemplate = null;
      $scope.initializePage();

      $scope.nextQuestionHtml = '';
      $scope.onClickContinue = function() {
        $scope.currentQuestion = $scope.upcomingQuestionHtml;
        $scope.inputTemplate = $scope.upcomingInputTemplate;
        $scope.upcomingQuestionHtml = null;
        $scope.upcomingInputTemplate = null;
        $scope.feedbackHtml = '';
        oppiaPlayerService.applyCachedParamUpdates();
        $timeout(function() {
          focusService.setFocus(_labelForNextFocusTarget);
        }, 50);
      };

      $scope.submitAnswer = function(answer, handler) {
        oppiaPlayerService.submitAnswer(answer, handler, function(
            newStateName, refreshInteraction, feedbackHtml, questionHtml, newInteractionId) {
          if (!newStateName) {
            $scope.currentQuestion = 'Congratulations, you have finished!';
            $scope.inputTemplate = '';
            return;
          }

          _labelForNextFocusTarget = Math.random().toString(36).slice(2);

          $scope.feedbackHtml = feedbackHtml;

          if (feedbackHtml) {
            if (currentStateName === newStateName) {
              $scope.upcomingQuestionHtml = null;
              if (refreshInteraction) {
                $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
                  newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();
                $timeout(function() {
                  focusService.setFocus(_labelForNextFocusTarget);
                }, 50);
              }
            } else {
              $scope.inputTemplate = '';
              $scope.upcomingQuestionHtml = questionHtml + oppiaPlayerService.getRandomSuffix();
              if (refreshInteraction) {
                $scope.upcomingInputTemplate = oppiaPlayerService.getInteractionHtml(
                  newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();
              } else {
                $scope.upcomingInputTemplate = '';
              }
            }
          } else {
            // The randomSuffix is also needed for 'previousReaderAnswer', 'feedback'
            // and 'question', so that the aria-live attribute will read it out.
            $scope.currentQuestion = questionHtml + oppiaPlayerService.getRandomSuffix();
            if (refreshInteraction) {
              $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
                newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();
              $timeout(function() {
                focusService.setFocus(_labelForNextFocusTarget);
              }, 50);
            }
            oppiaPlayerService.applyCachedParamUpdates();
          }

          currentStateName = newStateName;
        }, true);
      };
    }]
  };
}]);
