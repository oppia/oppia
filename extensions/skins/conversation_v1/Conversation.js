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

oppia.directive('conversationSkin', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'skins/Conversation',
    controller: ['$scope', '$timeout', '$window', 'warningsData', 'messengerService', 'oppiaPlayerService', 'urlService',
        function($scope, $timeout, $window, warningsData, messengerService, oppiaPlayerService, urlService) {
      $scope.iframed = urlService.isIframed();

      $scope.showPage = !$scope.iframed;
      $scope.hasInteractedAtLeastOnce = false;
      $scope.showFeedbackModal = oppiaPlayerService.showFeedbackModal;
      $scope.openExplorationEditorPage = oppiaPlayerService.openExplorationEditorPage;

      $window.addEventListener('beforeunload', function(e) {
        if ($scope.hasInteractedAtLeastOnce && !$scope.finished &&
            oppiaPlayerService.isInPreviewMode == false) {
          var confirmationMessage = (
            'If you navigate away from this page, your progress on the ' +
            'exploration will be lost.');
          (e || $window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        }
      });

      $scope.getStyle = function() {
        return $scope.showPage ? {} : {opacity: 0};
      };

      $scope.resetPage = function() {
        if ($scope.hasInteractedAtLeastOnce && !$scope.finished &&
            oppiaPlayerService.isInPreviewMode == false) {
          var confirmationMessage = (
            'Are you sure you want to restart this exploration? Your progress ' +
            'will be lost.');
          if (!$window.confirm(confirmationMessage)) {
            return;
          };
        }

        messengerService.sendMessage(
          messengerService.EXPLORATION_RESET, $scope.stateName);
        $scope.initializePage();
      };

      $scope.isLoggedIn = false;
      $scope.mostRecentQuestionIndex = null;

      $scope.initializePage = function() {
        $scope.responseLog = [];
        $scope.inputTemplate = '';
        oppiaPlayerService.init(function(data) {
          $scope.explorationId = oppiaPlayerService.getExplorationId();
          $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
          $scope.hasInteractedAtLeastOnce = false;

          $scope.finished = data.finished;
          $scope.stateName = data.state_name;
          $scope.inputTemplate = oppiaPlayerService.getInteractiveWidgetHtml(
            $scope.stateName);

          $scope.responseLog = [{
            previousReaderAnswer: '',
            feedback: '',
            question: data.init_html,
          }];
          $scope.mostRecentQuestionIndex = 0;

          messengerService.sendMessage(
            messengerService.EXPLORATION_LOADED, null);
          $scope.showPage = true;
          $scope.adjustPageHeight(false, null);

          $window.scrollTo(0, 0);
        });
      };

      $scope.initializePage();

      $scope.submitAnswer = function(answer, handler) {
        oppiaPlayerService.submitAnswer(answer, handler, function(
            newStateName, isSticky, questionHtml, readerResponseHtml, feedbackHtml) {
          warningsData.clear();
          $scope.hasInteractedAtLeastOnce = true;

          $scope.stateName = newStateName;
          $scope.finished = (newStateName === 'END');

          if (!$scope.finished && !isSticky) {
            // The previous widget is not sticky and should be replaced.
            $scope.inputTemplate = oppiaPlayerService.getInteractiveWidgetHtml(
              newStateName) + oppiaPlayerService.getRandomSuffix();
          }

          // TODO(sll): Check the state change instead of question_html so that it
          // works correctly when the new state doesn't have a question string.
          var isQuestion = !!questionHtml;
          if (isQuestion) {
            $scope.mostRecentQuestionIndex = $scope.responseLog.length;
          }

          // The randomSuffix is also needed for 'previousReaderAnswer', 'feedback'
          // and 'question', so that the aria-live attribute will read it out.
          // Note that we have to explicitly check for the 'Continue' widget
          // (which has no corresopnding learner response text), otherwise a
          // thin sliver of blue will appear.
          $scope.responseLog.push({
            previousReaderAnswer: (
              readerResponseHtml.indexOf('oppia-response-continue') === -1 ?
              readerResponseHtml + oppiaPlayerService.getRandomSuffix() : ''),
            feedback: feedbackHtml + oppiaPlayerService.getRandomSuffix(),
            question: questionHtml + (isQuestion ? oppiaPlayerService.getRandomSuffix() : '')
          });

          var lastEntryEls = document.getElementsByClassName(
            'conversation-skin-last-log-entry');
          $scope.adjustPageHeight(true, function() {
            if (lastEntryEls.length > 0) {
              // TODO(sll): Try and drop this in favor of an Angular-based solution.
              $('html, body, iframe').animate(
                {'scrollTop': lastEntryEls[0].offsetTop}, 'slow', 'swing');
            }
          });

          if ($scope.finished) {
            messengerService.sendMessage(
              messengerService.EXPLORATION_COMPLETED, null);
          }
        });
      };

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

      $window.onresize = function() {
        $scope.adjustPageHeight(false, null);
      };
    }]
  };
}]);
