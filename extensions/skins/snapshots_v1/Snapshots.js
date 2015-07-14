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
    controller: [
        '$scope', '$timeout', 'warningsData', 'oppiaPlayerService',
        'focusService', 'messengerService',
        function($scope, $timeout, warningsData, oppiaPlayerService,
          focusService, messengerService) {

      var currentStateName = oppiaPlayerService.getCurrentStateName();
      var _labelForNextFocusTarget = '';

      $scope.transcript = [];
      $scope.transcriptIndex = -1;
      $scope.waitingForLearner = false;
      $scope.inputTemplate = '';
      $scope.upcomingQuestionHtml = null;
      $scope.upcomingInputTemplate = null;

      $scope.goToPreviousCard = function() {
        $scope.transcriptIndex--;
        oppiaPlayerService.flipBackwards();
      };

      $scope.goToNextCard = function() {
        $scope.transcriptIndex++;
        oppiaPlayerService.flipForwards();
      };

      var _addNewElementToTranscript = function(stateName, contentHtml) {
        $scope.transcript.push({
          stateName: stateName,
          content: contentHtml,
          answerFeedbackPairs: []
        });
        $scope.transcriptIndex++;
      };

      $scope.areAnyGadgetsVisibleInActiveState = function() {
        var activeStateName = oppiaPlayerService.getActiveStateName();
        var areGadgetsVisible = false;
        for (var panelName in $scope.gadgetPanelsContents) {
          for (var i = 0; i < $scope.gadgetPanelsContents[panelName].length; i++) {
            if ($scope.gadgetPanelsContents[panelName][i].visible_in_states.indexOf(
                  activeStateName) !== -1) {
              areGadgetsVisible = true;
              break;
            }
          }
        }
        return areGadgetsVisible;
      };

      $scope.initializePage = function() {
        $scope.transcript = [];
        $scope.transcriptIndex = -1;

        oppiaPlayerService.getUserProfileImage().then(function(result) {
          // $scope.profilePicture contains a dataURI representation of the
          // user-uploaded profile image, or the path to the default image.
          $scope.profilePicture = result;
        });

        oppiaPlayerService.init(function(stateName, initHtml) {
          _labelForNextFocusTarget = Math.random().toString(36).slice(2);
          $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
            stateName, _labelForNextFocusTarget);
          $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
          $scope.gadgetPanelsContents = oppiaPlayerService.getGadgetPanelsContents();
          currentStateName = stateName;

          _addNewElementToTranscript(currentStateName, initHtml);
          $scope.waitingForLearner = true;

          messengerService.sendMessage(
            messengerService.EXPLORATION_LOADED, null);

          $timeout(function() {
            focusService.setFocus(_labelForNextFocusTarget);
          }, 50);
        });
      };

      $scope.initializePage();

      $scope.onClickContinue = function() {
        oppiaPlayerService.applyCachedParamUpdates();
        _addNewElementToTranscript(currentStateName, $scope.upcomingQuestionHtml);
        $scope.inputTemplate = $scope.upcomingInputTemplate;
        $scope.feedbackHtml = '';

        $scope.upcomingQuestionHtml = null;
        $scope.upcomingInputTemplate = null;

        $timeout(function() {
          focusService.setFocus(_labelForNextFocusTarget);
        }, 50);
      };

      $scope.submitAnswer = function(answer, handler) {
        // Prevent duplicate submissions.
        if (!$scope.waitingForLearner) {
          return;
        }

        $scope.transcript[$scope.transcript.length - 1].answerFeedbackPairs.push({
          learnerAnswer: oppiaPlayerService.getAnswerAsHtml(answer),
          oppiaFeedback: ''
        });
        $scope.waitingForLearner = false;

        oppiaPlayerService.submitAnswer(answer, handler, function(
            newStateName, refreshInteraction, feedbackHtml, questionHtml, newInteractionId) {
          if (!newStateName) {
            _addNewElementToTranscript(newStateName, 'Great job! Continue through the course by clicking on one of the buttons below.');
            $scope.inputTemplate = '';
            messengerService.sendMessage(
              messengerService.EXPLORATION_COMPLETED, null);
            return;
          }

          _labelForNextFocusTarget = Math.random().toString(36).slice(2);
          $scope.feedbackHtml = feedbackHtml;

          if (feedbackHtml) {
            var pairs = $scope.transcript[$scope.transcript.length - 1].answerFeedbackPairs;
            pairs[pairs.length - 1].oppiaFeedback = feedbackHtml;

            if (currentStateName === newStateName) {
              // Stay at the same state.
              if (refreshInteraction) {
                $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
                  newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();
                $timeout(function() {
                  focusService.setFocus(_labelForNextFocusTarget);
                }, 50);
              }
            } else {
              // Move on to a new state after giving the learner a chance to
              // read the feedback.
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
            // There is no feedback. Move to the new state.

            oppiaPlayerService.applyCachedParamUpdates();
            // The randomSuffix is also needed for 'previousReaderAnswer', 'feedback'
            // and 'question', so that the aria-live attribute will read it out.
            _addNewElementToTranscript(
              newStateName,
              questionHtml + oppiaPlayerService.getRandomSuffix());
            $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
              newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();

            $timeout(function() {
              focusService.setFocus(_labelForNextFocusTarget);
            }, 50);
          }

          currentStateName = newStateName;
          $scope.waitingForLearner = true;
        }, true);
      };
    }]
  };
}]);
