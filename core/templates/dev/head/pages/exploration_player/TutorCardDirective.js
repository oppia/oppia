// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
        '$scope', '$timeout', 'oppiaPlayerService', 'HintManagerService',
        'playerPositionService', 'playerTranscriptService',
        'ExplorationPlayerStateService', 'windowDimensionsService',
        'urlService', 'TWO_CARD_THRESHOLD_PX', 'CONTENT_FOCUS_LABEL_PREFIX',
        'CONTINUE_BUTTON_FOCUS_LABEL', 'EVENT_ACTIVE_CARD_CHANGED',
        'WAIT_FOR_HINT_MSEC', 'DELAY_FOR_HINT_FEEDBACK_MSEC',
        'HINT_REQUEST_STRINGS_ARRAY',
        function(
          $scope, $timeout, oppiaPlayerService, HintManagerService,
          playerPositionService, playerTranscriptService,
          ExplorationPlayerStateService, windowDimensionsService,
          urlService, TWO_CARD_THRESHOLD_PX, CONTENT_FOCUS_LABEL_PREFIX,
          CONTINUE_BUTTON_FOCUS_LABEL, EVENT_ACTIVE_CARD_CHANGED,
          WAIT_FOR_HINT_MSEC, DELAY_FOR_HINT_FEEDBACK_MSEC,
          HINT_REQUEST_STRINGS_ARRAY) {
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

            HintManagerService.activateHintAfterTimeout();

            $scope.currentInteractionHints = oppiaPlayerService.getInteraction(
              $scope.activeCard.stateName).hints;
          };

          $scope.arePreviousResponsesShown = false;

          $scope.waitingForOppiaFeedback = false;

          $scope.showHint = function() {
            var isSupplementalCard = false;
            HintManagerService.showHint(
              $scope.currentInteractionHints, isSupplementalCard);
          };

          $scope.isHintAvailable = function() {
            var hintIsAvailable = (
              HintManagerService.isCurrentHintUsable() &&
              !HintManagerService.areAllHintsExhausted(
                $scope.currentInteractionHints.length));
            return hintIsAvailable;
          };

          $scope.areAllHintsExhausted = function() {
            return HintManagerService.areAllHintsExhausted(
              $scope.currentInteractionHints.length);
          };

          $scope.isCurrentHintUsable = function() {
            return HintManagerService.isCurrentHintUsable();
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
            HintManagerService.reset();
          });

          $scope.$on('oppiaFeedbackAvailable', function() {
            $scope.waitingForOppiaFeedback = false;
            HintManagerService.clearTimeout();
          });

          updateActiveCard();
        }
      ]
    };
  }]);
