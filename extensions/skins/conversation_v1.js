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

function ConversationSkin(
    $scope, $timeout, $window, $log, warningsData, messengerService,
    oppiaPlayerService) {

  var urlParams = $scope.getUrlParams();
  $scope.iframed = (urlParams.hasOwnProperty('iframed') && urlParams['iframed']);

  $scope.showPage = !$scope.iframed;

  $scope.hasInteractedAtLeastOnce = false;

  $window.addEventListener('beforeunload', function(e) {
    if ($scope.hasInteractedAtLeastOnce && !$scope.finished) {
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
    if ($scope.hasInteractedAtLeastOnce && !$scope.finished) {
      var confirmationMessage = 'Are you sure you want to restart this ' +
                                'exploration? Your progress will be lost.';
      if (!$window.confirm(confirmationMessage)) {
        return;
      };
    }

    messengerService.sendMessage(
      messengerService.EXPLORATION_RESET, $scope.stateName);
    $scope.initializePage();
  };

  $scope.isLoggedIn = false;

  $scope.initializePage = function() {
    $scope.responseLog = [];
    $scope.inputTemplate = '';
    oppiaPlayerService.loadInitialState(function(data) {
      $scope.explorationTitle = data.title;
      $scope.loadPage(data);
      $window.scrollTo(0, 0);
    }, function(data) {
      warningsData.addWarning(
        data.error || 'There was an error loading the exploration.');
    });
  };

  $scope.initializePage();

  $scope.showFeedbackModal = function() {
    oppiaPlayerService.showFeedbackModal();
  };

  $scope.loadPage = function(data) {
    $scope.hasInteractedAtLeastOnce = false;

    $scope.categories = data.categories;
    $scope.finished = data.finished;
    $scope.inputTemplate = data.interactive_html;
    $scope.responseLog = [{
      previousReaderAnswer: '',
      feedback: '',
      question: data.init_html,
      isMostRecentQuestion: true
    }];
    $scope.stateName = data.state_name;
    $scope.title = data.title;

    messengerService.sendMessage(messengerService.EXPLORATION_LOADED, null);
    $scope.showPage = true;
    $scope.adjustPageHeight(false, null);
  };

  $scope.submitAnswer = function(answer, handler) {
    oppiaPlayerService.submitAnswer(answer, handler, function(data) {
      warningsData.clear();
      $scope.hasInteractedAtLeastOnce = true;

      $scope.categories = data.categories;

      // This is a bit of a hack. When a refresh happens, AngularJS compares
      // $scope.inputTemplate to the previous value of $scope.inputTemplate.
      // If they are the same, then $scope.inputTemplate is not updated, and
      // the reader's previous answers still remain present. The random suffix
      // makes the new template different from the previous one, and thus
      // indirectly forces a refresh.
      var randomSuffix = '';
      var N = Math.round(Math.random() * 1000);
      for (var i = 0; i < N; i++) {
        randomSuffix += ' ';
      }

      if (data.interactive_html) {
        // A non-empty interactive_html means that the previous widget
        // is not sticky and should be replaced.
        $scope.inputTemplate = data.interactive_html + randomSuffix;
      }

      $scope.stateName = data.state_name;
      $scope.finished = data.finished;

      $scope.responseLog = $scope.responseLog || [];

      // TODO(sll): Check the state change instead of question_html so that it
      // works correctly when the new state doesn't have a question string.
      var isQuestion = !!data.question_html;
      if (isQuestion) {
        // Clean up the previous isMostRecentQuestion marker.
        $scope.responseLog.forEach(function(log) {
          log.isMostRecentQuestion = false;
        });
      }

      // The randomSuffix is also needed for 'previousReaderAnswer', 'feedback'
      // and 'question', so that the aria-live attribute will read it out.
      $scope.responseLog.push({
        previousReaderAnswer: data.reader_response_html + randomSuffix,
        feedback: data.feedback_html + randomSuffix,
        question: data.question_html + (isQuestion ? randomSuffix : ''),
        isMostRecentQuestion: isQuestion
      });

      var lastEntryEls = document.getElementsByClassName('oppia-last-log-entry');
      $scope.adjustPageHeight(true, function() {
        if (lastEntryEls.length > 0) {
          $('html, body, iframe').animate(
              {'scrollTop': lastEntryEls[0].offsetTop}, 'slow', 'swing');
        }
      });

      if ($scope.finished) {
        messengerService.sendMessage(
          messengerService.EXPLORATION_COMPLETED, null);
      }
    }, function(data) {
      warningsData.addWarning(
        data.error || 'There was an error processing your input.');
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
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ConversationSkin.$inject = [
  '$scope', '$timeout', '$window', '$log', 'warningsData', 'messengerService',
  'oppiaPlayerService'
];
