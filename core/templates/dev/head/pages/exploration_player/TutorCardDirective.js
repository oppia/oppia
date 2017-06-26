// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the Tutor Card.
 */

oppia.animation('.conversation-skin-responses-animate-slide', function() {
  return {
    removeClass: function(element, className, done) {
      if (className !== 'ng-hide') {
        done();
        return;
      }
      element.hide().slideDown(400, done);
    },
    addClass: function(element, className, done) {
      if (className !== 'ng-hide') {
        done();
        return;
      }
      element.slideUp(400, done);
    }
  };
});

oppia.directive('tutorCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onClickContinueButton: '&',
        onSubmitAnswer: '&',
        onDismiss: '&',
        startCardChangeAnimation: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'tutor_card_directive.html'),
      controller: [
        '$scope', '$timeout', 'oppiaPlayerService',
        'playerPositionService', 'playerTranscriptService',
        'ExplorationPlayerStateService', 'windowDimensionsService',
        'urlService', 'TWO_CARD_THRESHOLD_PX', 'CONTENT_FOCUS_LABEL_PREFIX',
        'CONTINUE_BUTTON_FOCUS_LABEL', 'EVENT_ACTIVE_CARD_CHANGED',
        'WAIT_FOR_HINT_MSEC',
        function(
          $scope, $timeout, oppiaPlayerService,
          playerPositionService, playerTranscriptService,
          ExplorationPlayerStateService, windowDimensionsService,
          urlService, TWO_CARD_THRESHOLD_PX, CONTENT_FOCUS_LABEL_PREFIX,
          CONTINUE_BUTTON_FOCUS_LABEL, EVENT_ACTIVE_CARD_CHANGED,
          WAIT_FOR_HINT_MSEC) {
          var updateActiveCard = function() {
            var index = playerPositionService.getActiveCardIndex();
            if (index === null) {
              return;
            }

            $scope.arePreviousResponsesShown = false;
            $scope.activeCard = playerTranscriptService.getCard(index);

            $scope.isInteractionInline = (
              ExplorationPlayerStateService.isInteractionInline(
                $scope.activeCard.stateName));

            $scope.interactionInstructions = (
              ExplorationPlayerStateService.getInteractionInstructions(
                $scope.activeCard.stateName));
            $scope.isCurrentHintUsable = false;
            $scope.promiseForHint = $timeout(function () {
              $scope.isCurrentHintUsable = true;
            }, WAIT_FOR_HINT_MSEC);

            $scope.currentInteractionHints = oppiaPlayerService.getInteraction(
              $scope.activeCard.stateName).hints;
          };

          $scope.arePreviousResponsesShown = false;

          $scope.waitingForOppiaFeedback = false;

          $scope.isCurrentHintUsable = false;

          $scope.allHintsExhausted = false;

          $scope.promiseForHint = null;

          $scope.hintButtonClicks = 0;

          $scope.tooltipText = '';

          $scope.showHint = function() {
            var hints = $scope.currentInteractionHints;
            if ($scope.hintButtonClicks < hints.length) {
              var currentHint = hints[$scope.hintButtonClicks].hintText;
              playerTranscriptService.addNewAnswer('I would like a hint.');
              $timeout(function() {
                $scope.waitingForOppiaFeedback = false;
                playerTranscriptService.addNewFeedback(currentHint);
              }, 600);
              $scope.isCurrentHintUsable = false;
              $scope.promiseForHint = $timeout(function() {
                $scope.isCurrentHintUsable = true;
              }, WAIT_FOR_HINT_MSEC);

              if ($scope.hintButtonClicks === hints.length - 1) {
                $scope.isCurrentHintUsable = false;
                $scope.allHintsExhausted = true;
                $scope.hintButtonClicks = 0;
              } else {
                $scope.hintButtonClicks += 1;
              }
            }
          };

          $scope.isHintAvailable = function() {
            var hintIsAvailable = (
              $scope.isCurrentHintUsable && !$scope.allHintsExhausted);
            if ($scope.allHintsExhausted) {
              $scope.tooltipText = 'Sorry, I am out of hints!';
            } else if (!hintIsAvailable) {
              $scope.tooltipText = (
                'Try thinking a bit more before asking for another hint!');
            } else {
              $scope.tooltipText = 'Click here for a Hint!';
            }
            return hintIsAvailable;
          };

          $scope.isIframed = urlService.isIframed();

          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;

          $scope.OPPIA_AVATAR_IMAGE_URL = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/oppia_avatar_100px.svg'));
          $scope.profilePicture = UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_blue_72px.png');

          oppiaPlayerService.getUserProfileImage().then(function(result) {
            $scope.profilePicture = result;
          });

          $scope.getContentFocusLabel = function(index) {
            return CONTENT_FOCUS_LABEL_PREFIX + index;
          };

          $scope.toggleShowPreviousResponses = function() {
            $scope.arePreviousResponsesShown =
             !$scope.arePreviousResponsesShown;
          };

          $scope.isViewportNarrow = function() {
            return windowDimensionsService.getWidth() < TWO_CARD_THRESHOLD_PX;
          };

          $scope.submitAnswer = function(answer, interactionRulesService) {
            $scope.waitingForOppiaFeedback = true;
            $scope.onSubmitAnswer({
              answer: answer,
              rulesService: interactionRulesService
            });
          };

          $scope.isCurrentCardAtEndOfTranscript = function() {
            return playerTranscriptService.isLastCard(
              playerPositionService.getActiveCardIndex());
          };

          $scope.isOnTerminalCard = function() {
            return $scope.activeCard &&
              ExplorationPlayerStateService.isStateTerminal(
                $scope.activeCard.stateName);
          };

          $scope.$on(EVENT_ACTIVE_CARD_CHANGED, function() {
            updateActiveCard();
            $scope.allHintsExhausted = false;
          });

          $scope.$on('oppiaFeedbackAvailable', function() {
            $scope.waitingForOppiaFeedback = false;
          });

          $scope.$on('stayOnSameCard', function() {
            $timeout.cancel($scope.promiseForHint);
            $scope.isCurrentHintUsable = true;
          });

          updateActiveCard();
        }
      ]
    };
  }]);
