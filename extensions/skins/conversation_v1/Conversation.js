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

      var hasInteractedAtLeastOnce = false;
      var _labelForNextFocusTarget = null;
      var _answerIsBeingProcessed = false;
      $scope.isAnswerBeingProcessed = function() {
        return _answerIsBeingProcessed;
      };

      $scope.isInPreviewMode = oppiaPlayerService.isInPreviewMode();

      $rootScope.loadingMessage = 'Loading';

      // If the exploration is iframed, send data to its parent about its height so
      // that the parent can be resized as necessary.
      $scope.lastRequestedHeight = 0;
      $scope.lastRequestedScroll = false;
      $scope.adjustPageHeight = function(scroll, callback) {
        $timeout(function() {
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
        if (hasInteractedAtLeastOnce && !$scope.finished &&
            !$scope.isInPreviewMode) {
          oppiaPlayerService.registerMaybeLeaveEvent();
          var confirmationMessage = (
            'If you navigate away from this page, your progress on the ' +
            'exploration will be lost.');
          (e || $window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        }
      });

      $scope.openCardFeedbackModal = function(stateName) {
        if ($scope.isInPreviewMode) {
          warningsData.addWarning('This functionality is not available in preview mode.');
        } else {
          oppiaPlayerService.openPlayerFeedbackModal(stateName);
        }
      };

      var _scrollToLastEntry = function(postScrollCallback) {
        var lastEntryEls = document.getElementsByClassName(
          'conversation-skin-last-log-entry');
        $scope.adjustPageHeight(true, function() {
          if (lastEntryEls.length > 0) {
            // TODO(sll): Try and drop this in favor of an Angular-based solution.
            $('html, body, iframe').animate(
              {'scrollTop': $(document).height() - $(window).height() - 60}, 1000, 'easeOutQuad',
              postScrollCallback);
          }
        });
      };

      var _addNewCard = function(stateName, contentHtml) {
        $scope.allResponseStates.push({
          stateName: stateName,
          content: contentHtml,
          answerFeedbackPairs: []
        });
      };

      $scope.initializePage = function() {
        $scope.allResponseStates = [];
        $scope.inputTemplate = '';
        $scope.interactionIsInline = false;
        // Temporary storage for the next card's content. This is not null iff a 'next card'
        // exists. (As soon as the feedback for the 'current card' is displayed, the user
        // gets 2 seconds to read it and then the 'next card' is shown.)
        $scope.contentToDisplayNext = null;

        oppiaPlayerService.init(function(stateName, initHtml, hasEditingRights) {
          $scope.explorationId = oppiaPlayerService.getExplorationId();
          $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
          hasInteractedAtLeastOnce = false;
          $scope.finished = false;
          $scope.hasEditingRights = hasEditingRights;
          messengerService.sendMessage(
            messengerService.EXPLORATION_LOADED, null);

          $scope.stateName = stateName;
          _labelForNextFocusTarget = Math.random().toString(36).slice(2);
          $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(stateName, _labelForNextFocusTarget);
          $scope.interactionIsInline = oppiaPlayerService.isInteractionInline(stateName);

          // This $timeout prevents a 'flash of unstyled content' when the preview tab is loaded from
          // the editor tab.
          $timeout(function() {
            $rootScope.loadingMessage = '';
          }, 500);

          $scope.adjustPageHeight(false, null);
          $window.scrollTo(0, 0);

          $scope.contentToDisplayNext = initHtml;
          $timeout(function() {
            _addNewCard($scope.stateName, $scope.contentToDisplayNext);
            $scope.contentToDisplayNext = null;
            _scrollToLastEntry(function() {
              focusService.setFocus(_labelForNextFocusTarget);
            });
          }, 1000);
        });
      };

      $scope.initializePage();

      $scope.submitAnswer = function(answer, handler) {
        // For some reason, answers are getting submitted twice when the submit
        // button is clicked. This guards against that.
        if (_answerIsBeingProcessed) {
          return;
        }
        _answerIsBeingProcessed = true;
        hasInteractedAtLeastOnce = true;

        $scope.allResponseStates[$scope.allResponseStates.length - 1].answerFeedbackPairs.push({
          learnerAnswer: oppiaPlayerService.getAnswerAsHtml(answer),
          oppiaFeedback: ''
        });

        oppiaPlayerService.submitAnswer(answer, handler, function(
            newStateName, isSticky, feedbackHtml, questionHtml, newInteractionId) {
          $timeout(function() {
            var oldStateName = $scope.stateName;
            $scope.stateName = newStateName;
            $scope.finished = oppiaPlayerService.isStateTerminal(newStateName);

            if ($scope.stateName && !isSticky) {
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
              // Scroll down so that the user can see the feedback, then pause for 2000ms
              // (so that the user can read the feedback) before showing the next card.
              if (feedbackHtml) {
                $scope.contentToDisplayNext = questionHtml;
                _scrollToLastEntry();

                $timeout(function() {
                  _addNewCard($scope.stateName, $scope.contentToDisplayNext);
                  _scrollToLastEntry(function() {
                    focusService.setFocus(_labelForNextFocusTarget);
                  });
                  $scope.contentToDisplayNext = null;
                }, 2000);
              } else {
                _addNewCard($scope.stateName, questionHtml);
                _scrollToLastEntry();
              }
            }

            if ($scope.finished) {
              messengerService.sendMessage(
                messengerService.EXPLORATION_COMPLETED, null);
            }
            _answerIsBeingProcessed = false;
            _scrollToLastEntry(function() {
              focusService.setFocus(_labelForNextFocusTarget);
            });
          }, 1000);
        });
      };

      $window.onresize = function() {
        $scope.adjustPageHeight(false, null);
      };
    }]
  };
}]);
