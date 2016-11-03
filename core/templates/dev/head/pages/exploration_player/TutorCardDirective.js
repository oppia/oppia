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

oppia.animation('.conversation-skin-animate-tutor-card-content', function() {
  var animateCardChange = function(element, className, done) {
    if (className !== 'animate-card-change') {
      return;
    }

    var currentHeight = element.height();
    var expectedNextHeight = $(
      '.conversation-skin-future-tutor-card ' +
      '.conversation-skin-tutor-card-content'
    ).height();

    // Fix the current card height, so that it does not change during the
    // animation, even though its contents might.
    element.css('height', currentHeight);

    jQuery(element).animate({
      opacity: 0
    }, TIME_FADEOUT_MSEC).animate({
      height: expectedNextHeight
    }, TIME_HEIGHT_CHANGE_MSEC).animate({
      opacity: 1
    }, TIME_FADEIN_MSEC, function() {
      element.css('height', '');
      done();
    });

    return function(cancel) {
      if (cancel) {
        element.css('opacity', '1.0');
        element.css('height', '');
        element.stop();
      }
    };
  };

  return {
    addClass: animateCardChange
  };
});

oppia.directive('tutorCard', [function() {
  return {
    restrict: 'E',
    scope: {
      startCardChangeAnimation: '=',
      showNextCard: '&',
      showSupplementalCard: '&',
      onSubmitAnswer: '&'
    },
    templateUrl: 'components/TutorCard',
    controller: [
      '$scope', 'oppiaPlayerService', 'UrlInterpolationService',
      'playerPositionService', 'playerTranscriptService',
      'ExplorationPlayerStateService', 'windowDimensionsService',
      'urlService', 'TWO_CARD_THRESHOLD_PX', 'CONTENT_FOCUS_LABEL_PREFIX',
      function(
        $scope, oppiaPlayerService, UrlInterpolationService,
        playerPositionService, playerTranscriptService,
        ExplorationPlayerStateService, windowDimensionsService,
        urlService, TWO_CARD_THRESHOLD_PX, CONTENT_FOCUS_LABEL_PREFIX) {
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
        };

        $scope.arePreviousResponsesShown = false;

        $scope.waitingForOppiaFeedback = false;

        $scope.isIframed = urlService.isIframed();

        $scope.OPPIA_AVATAR_IMAGE_URL = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_black_72px.png'));

        $scope.profilePicture = (UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_blue_72px.png'));

        oppiaPlayerService.getUserProfileImage().then(function(result) {
          $scope.profilePicture = result;
        });

        $scope.getContentFocusLabel = function(index) {
          return CONTENT_FOCUS_LABEL_PREFIX + index;
        };

        $scope.toggleShowPreviousResponses = function() {
          $scope.arePreviousResponsesShown = !$scope.arePreviousResponsesShown;
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

        $scope.$on('activeCardChanged', function() {
          updateActiveCard();
        });

        $scope.$on('destinationCardAvailable', function(event, card) {
          $scope.upcomingContentHtml = card.upcomingContentHtml;
          $scope.upcomingParams = card.upcomingParams;
          $scope.upcomingStateName = card.upcomingStateName;
          $scope.upcomingInlineInteractionHtml = (
            card.upcomingInlineInteractionHtml);
        });

        $scope.$on('oppiaFeedbackAvailable', function() {
          $scope.waitingForOppiaFeedback = false;
        });

        updateActiveCard();
      }]
  };
}]);
