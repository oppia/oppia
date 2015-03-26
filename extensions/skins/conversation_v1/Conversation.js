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
        'ratingService',
        function(
          $scope, $timeout, $rootScope, $window, $modal, warningsData,
          messengerService, oppiaPlayerService, urlService, focusService,
          ratingService) {

      var hasInteractedAtLeastOnce = false;
      var _labelForNextFocusTarget = null;
      var _answerIsBeingProcessed = false;
      var _learnerInputIsInView = false;

      $scope.isInPreviewMode = oppiaPlayerService.isInPreviewMode();
      $scope.introCardImageUrl = null;

      $rootScope.loadingMessage = 'Loading';

      // If the exploration is iframed, send data to its parent about its height so
      // that the parent can be resized as necessary.
      $scope.lastRequestedHeight = 0;
      $scope.lastRequestedScroll = false;
      $scope.adjustPageHeight = function(scroll, callback) {
        $timeout(function() {
          var newHeight = document.body.scrollHeight;
          if (Math.abs($scope.lastRequestedHeight - newHeight) > 50.5 ||
              (scroll && !$scope.lastRequestedScroll)) {
            // Sometimes setting iframe height to the exact content height still
            // produces scrollbar, so adding 50 extra px.
            newHeight += 50;
            messengerService.sendMessage(messengerService.HEIGHT_CHANGE,
              {height: newHeight, scroll: scroll});
            $scope.lastRequestedHeight = newHeight;
            $scope.lastRequestedScroll = scroll;
          }

          if (callback) {
            callback();
          }
        }, 100);
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

      var _scrollToBottom = function(postScrollCallback) {
        $scope.adjustPageHeight(true, function() {
          var oppiaLastContentHeight = $('.conversation-skin-oppia-output:last')
            .offset().top;
          var newScrollTop = null;
          if ($(document).height() - oppiaLastContentHeight - 60 <=
              $(window).height() * 0.4) {
            // The -60 prevents the attribution guide from being scrolled into view.
            newScrollTop = $(document).height() - $(window).height() - 60;
            _learnerInputIsInView = true;
          } else {
            newScrollTop = oppiaLastContentHeight - $(window).height() * 0.4;
            _learnerInputIsInView = false;
          }

          // Do not scroll up.
          // This occurs if Oppia gives no feedback for (e.g.) a supplemental
          // interaction. This leads to a scroll *up* to Oppia's last output,
          // which is rather disconcerting.
          if ($(document).scrollTop() >= newScrollTop) {
            newScrollTop = $(document).scrollTop();
          }

          $('html, body, iframe').animate({
            'scrollTop': newScrollTop
          }, 1000, 'easeOutQuad').promise().done(postScrollCallback);
        });
      };

      var _addNewCard = function(stateName, contentHtml) {
        $scope.allResponseStates.push({
          stateName: stateName,
          content: contentHtml,
          answerFeedbackPairs: []
        });
      };

      var MIN_CARD_LOADING_DELAY_MILLISECS = 1000;

      $scope.initializePage = function() {
        $scope.allResponseStates = [];
        $scope.inputTemplate = '';
        $scope.interactionIsInline = false;
        $scope.waitingForOppiaFeedback = false;
        $scope.waitingForNewCard = false;

        // This is measured in milliseconds since the epoch.
        var timeAtServerCall = new Date().getTime();

        oppiaPlayerService.init(function(stateName, initHtml, hasEditingRights, introCardImageUrl) {
          $scope.explorationId = oppiaPlayerService.getExplorationId();
          $scope.explorationTitle = oppiaPlayerService.getExplorationTitle();
          $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
          $scope.introCardImageUrl = introCardImageUrl;
          oppiaPlayerService.getUserProfileImage().then(function(result) {
            // $scope.profilePicture contains a dataURI representation of the
            // user-uploaded profile image, or the path to the default image.
            $scope.profilePicture = result;
          });
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

          $scope.waitingForNewCard = true;

          var millisecsLeftToWait = Math.max(
            MIN_CARD_LOADING_DELAY_MILLISECS - (new Date().getTime() - timeAtServerCall),
            1.0);
          $timeout(function() {
            _addNewCard($scope.stateName, initHtml);
            $scope.waitingForNewCard = false;
            _scrollToBottom(function() {
              if (_learnerInputIsInView) {
                focusService.setFocus(_labelForNextFocusTarget);
              }
            });
          }, millisecsLeftToWait);
        });

        ratingService.init(function(userRating) {
          $scope.userRating = userRating;
        });
      };

      $scope.submitUserRating = function(ratingValue) {
        ratingService.submitUserRating(ratingValue);
      };
      $scope.$on('ratingUpdated', function() {
        $scope.userRating = ratingService.getUserRating();
      });

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

        $scope.waitingForOppiaFeedback = true;

        // This is measured in milliseconds since the epoch.
        var timeAtServerCall = new Date().getTime();

        oppiaPlayerService.submitAnswer(answer, handler, function(
            newStateName, refreshInteraction, feedbackHtml, questionHtml, newInteractionId) {

          var millisecsLeftToWait = Math.max(
            MIN_CARD_LOADING_DELAY_MILLISECS - (new Date().getTime() - timeAtServerCall),
            1.0);

          $timeout(function() {
            var oldStateName = $scope.stateName;
            $scope.stateName = newStateName;

            $scope.finished = oppiaPlayerService.isStateTerminal(newStateName);
            if ($scope.finished) {
              messengerService.sendMessage(
                messengerService.EXPLORATION_COMPLETED, null);
            }

            if (!newStateName) {
              $scope.inputTemplate = '';
            } else if (newStateName && refreshInteraction) {
              // The previous interaction should be replaced.
              _labelForNextFocusTarget = Math.random().toString(36).slice(2);
              $scope.inputTemplate = oppiaPlayerService.getInteractionHtml(
                newStateName, _labelForNextFocusTarget) + oppiaPlayerService.getRandomSuffix();
              $scope.interactionIsInline = oppiaPlayerService.isInteractionInline(
                newStateName);
            }

            var pairs = $scope.allResponseStates[$scope.allResponseStates.length - 1].answerFeedbackPairs;
            pairs[pairs.length - 1].oppiaFeedback = feedbackHtml;

            if (oldStateName === newStateName) {
              $scope.waitingForOppiaFeedback = false;
              _scrollToBottom(function() {
                if (_learnerInputIsInView) {
                  focusService.setFocus(_labelForNextFocusTarget);
                }
                _answerIsBeingProcessed = false;
              });
            } else {
              if (feedbackHtml) {
                $scope.waitingForOppiaFeedback = false;
                $scope.waitingForNewCard = true;
                _scrollToBottom(function() {
                  $timeout(function() {
                    $scope.waitingForNewCard = false;
                    _addNewCard($scope.stateName, questionHtml);
                    _scrollToBottom(function() {
                      if (_learnerInputIsInView) {
                        focusService.setFocus(_labelForNextFocusTarget);
                      }
                      _answerIsBeingProcessed = false;
                    });
                  }, 1000);
                });
              } else {
                $scope.waitingForOppiaFeedback = false;
                _addNewCard($scope.stateName, questionHtml);
                _scrollToBottom(function() {
                  if (_learnerInputIsInView) {
                    focusService.setFocus(_labelForNextFocusTarget);
                  }
                  _answerIsBeingProcessed = false;
                });
              }
            }
          }, millisecsLeftToWait);
        });
      };

      $window.onresize = function() {
        $scope.adjustPageHeight(false, null);
      };
    }]
  };
}]);
