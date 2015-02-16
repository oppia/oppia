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
 * @fileoverview Controller for the conversation skin.
 *
 * @author sll@google.com (Sean Lip)
 */

// TODO(sll): delete/deprecate 'reset exploration' from the list of
// events sent to a container page.

oppia.directive('conversationSkin', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'skins/Conversation',
    controller: [
        '$scope', '$timeout', '$rootScope', '$window', '$modal', 'warningsData',
        'messengerService', 'oppiaPlayerService', 'urlService', 'focusService',
        function(
          $scope, $timeout, $rootScope, $window, $modal, warningsData,
          messengerService, oppiaPlayerService, urlService, focusService) {
      $scope.iframed = urlService.isIframed();

      $scope.showPage = !$scope.iframed;
      $scope.hasInteractedAtLeastOnce = false;

      var _labelForNextFocusTarget = null;

      var _answerIsBeingProcessed = false;
      $scope.isAnswerBeingProcessed = function() {
        return _answerIsBeingProcessed;
      };

      $rootScope.loadingMessage = 'Loading';

      // If the exploration is iframed, send data to its parent about its height so
      // that the parent can be resized as necessary.
      $scope.lastRequestedHeight = 0;
      $scope.lastRequestedScroll = false;
      $scope.adjustPageHeight = function(scroll, callback) {
        window.setTimeout(function() {
          var newHeight = document.body.scrollHeight;
          if (Math.abs($scope.lastRequestedHeight - newHeight) <= 50.5 &&
              (!scroll || $scope.lastRequestedScroll)) {
            return;
          }
          // Sometimes setting iframe height to the exact content height still
          // produces scrollbar, so adding 50 extra px.
          newHeight += 50;
          messengerService.sendMessage(messengerService.HEIGHT_CHANGE,
            {height: newHeight, scroll: scroll});
          $scope.lastRequestedHeight = newHeight;
          $scope.lastRequestedScroll = scroll;

          if (callback) {
            callback();
          }
        }, 500);
      };

      $window.addEventListener('beforeunload', function(e) {
        if ($scope.hasInteractedAtLeastOnce && !$scope.finished &&
            !oppiaPlayerService.isInPreviewMode()) {
          oppiaPlayerService.registerMaybeLeaveEvent();
          var confirmationMessage = (
            'If you navigate away from this page, your progress on the ' +
            'exploration will be lost.');
          (e || $window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        }
      });

      var _addNewCard = function(stateName, contentHtml) {
        $scope.allResponseStates.push({
          stateName: stateName,
          content: contentHtml,
          answerFeedbackPairs: []
        });
      };

      var _scrollToLastEntry = function() {
        var lastEntryEls = document.getElementsByClassName(
          'conversation-skin-last-log-entry');
        $scope.adjustPageHeight(true, function() {
          if (lastEntryEls.length > 0) {
            // TODO(sll): Try and drop this in favor of an Angular-based solution.
            $('html, body, iframe').animate(
              {'scrollTop': $(document).height()}, 300, 'swing');
          }
        });
      };

      $scope.openCardFeedbackModal = function(stateName) {
        oppiaPlayerService.openPlayerFeedbackModal(stateName);
      };

      $scope.isLoggedIn = false;
      $scope.mostRecentQuestionIndex = null;

      $scope.initializePage = function() {
        $scope.allResponseStates = [];
        $scope.inputTemplate = '';
        $scope.interactionIsInline = false;
        oppiaPlayerService.init(function(stateName, initHtml, hasEditingRights) {
          $scope.explorationId = oppiaPlayerService.getExplorationId();
          $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
          $scope.hasInteractedAtLeastOnce = false;
          $scope.finished = false;
          $scope.hasEditingRights = hasEditingRights;

          $scope.stateName = stateName;
          _labelForNextFocusTarget = Math.random().toString(36).slice(2);
          $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(stateName, _labelForNextFocusTarget);
          $scope.interactionIsInline = oppiaPlayerService.isInteractionInline(stateName);
          _addNewCard($scope.stateName, initHtml);
          $scope.mostRecentQuestionIndex = 0;

          messengerService.sendMessage(
            messengerService.EXPLORATION_LOADED, null);
          $scope.showPage = true;
          $rootScope.loadingMessage = '';
          $scope.adjustPageHeight(false, null);
          $window.scrollTo(0, 0);
          focusService.setFocus(_labelForNextFocusTarget);
        });
      };

      $scope.initializePage();

      // Temporary storage for the next card's content. This is not null iff a 'next card'
      // exists. (As soon as the feedback for the 'current card' is displayed, the user
      // gets 2 seconds to read it and then the 'next card' is shown.)
      $scope.nextCardContent = null;
      $scope.continueToNextCard = function() {
        _addNewCard($scope.stateName, $scope.nextCardContent);
        _scrollToLastEntry();
        $scope.nextCardContent = null;
        focusService.setFocus(_labelForNextFocusTarget);
      };

      $scope.submitAnswer = function(answer, handler) {
        // For some reason, answers are getting submitted twice when the submit
        // button is clicked. This guards against that.
        if (_answerIsBeingProcessed) {
          return;
        }
        _answerIsBeingProcessed = true;

        $scope.allResponseStates[$scope.allResponseStates.length - 1].answerFeedbackPairs.push({
          learnerAnswer: oppiaPlayerService.getAnswerAsHtml(answer),
          oppiaFeedback: ''
        });

        oppiaPlayerService.submitAnswer(answer, handler, function(
            newStateName, isSticky, questionHtml, feedbackHtml) {
          warningsData.clear();
          $scope.hasInteractedAtLeastOnce = true;
          var oldStateName = $scope.stateName;
          $scope.stateName = newStateName;
          $scope.finished = !Boolean(newStateName);

          if (!$scope.finished && !isSticky) {
            // The previous interaction is not sticky and should be replaced.
            _labelForNextFocusTarget = Math.random().toString(36).slice(2);
            $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
              newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();
            $scope.interactionIsInline = oppiaPlayerService.isInteractionInline(
              newStateName);
          }

          var pairs = $scope.allResponseStates[$scope.allResponseStates.length - 1].answerFeedbackPairs;
          pairs[pairs.length - 1].oppiaFeedback = feedbackHtml;

          // If there is a change in state, use a new card.
          if (oldStateName !== newStateName) {
            // If there is a feedback:
            // Store content for the next card.
            // Scroll down so that the user can see the feedback.
            // Pause for 2000ms so that the user can read the feedback.
            // Show the next card.
            if (feedbackHtml) {
              $scope.nextCardContent = questionHtml;
              _scrollToLastEntry();
              $timeout($scope.continueToNextCard, 2000);
            } else {
              _addNewCard($scope.stateName, questionHtml);
            }
          }

          if ($scope.finished) {
            messengerService.sendMessage(
              messengerService.EXPLORATION_COMPLETED, null);
          }
          _scrollToLastEntry();
          _answerIsBeingProcessed = false;
          focusService.setFocus(_labelForNextFocusTarget);
        });
      };

      $window.onresize = function() {
        $scope.adjustPageHeight(false, null);
      };
    }]
  };
}]);
