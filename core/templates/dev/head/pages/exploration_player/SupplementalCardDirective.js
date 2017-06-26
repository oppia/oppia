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
 * @fileoverview Controller for the supplemental card.
 */

oppia.directive('supplementalCard', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onClickContinueButton: '&',
        onSubmitAnswer: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'supplemental_card_directive.html'),
      controller: [
        '$scope', '$timeout', '$window', 'oppiaPlayerService',
        'playerPositionService', 'playerTranscriptService',
        'ExplorationObjectFactory', 'windowDimensionsService',
        'CONTENT_FOCUS_LABEL_PREFIX', 'TWO_CARD_THRESHOLD_PX',
        'EVENT_ACTIVE_CARD_CHANGED', 'CONTINUE_BUTTON_FOCUS_LABEL',
        'WAIT_FOR_HINT_MSEC',
        function(
          $scope, $timeout, $window, oppiaPlayerService,
          playerPositionService, playerTranscriptService,
          ExplorationObjectFactory, windowDimensionsService,
          CONTENT_FOCUS_LABEL_PREFIX, TWO_CARD_THRESHOLD_PX,
          EVENT_ACTIVE_CARD_CHANGED, CONTINUE_BUTTON_FOCUS_LABEL,
          WAIT_FOR_HINT_MSEC) {
          var updateActiveCard = function() {
            var index = playerPositionService.getActiveCardIndex();
            if (index === null) {
              return;
            }
            $scope.activeCard = playerTranscriptService.getCard(index);
            $scope.clearHelpCard();
            $scope.isCurrentHintUsable = false;
            $scope.promiseForHint = $timeout(function () {
              $scope.isCurrentHintUsable = true;
            }, WAIT_FOR_HINT_MSEC);

            $scope.currentInteractionHints = oppiaPlayerService.getInteraction(
              $scope.activeCard.stateName).hints;
          };

          $scope.OPPIA_AVATAR_IMAGE_URL = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/oppia_avatar_100px.svg'));

          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;

          $scope.helpCardHtml = null;
          $scope.helpCardHasContinueButton = false;

          $scope.clearHelpCard = function() {
            $scope.helpCardHtml = null;
            $scope.helpCardHasContinueButton = false;
          };

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
              playerTranscriptService.addNewFeedback(currentHint);
              $scope.helpCardHtml = currentHint;
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

          $scope.isViewportNarrow = function() {
            return windowDimensionsService.getWidth() < TWO_CARD_THRESHOLD_PX;
          };

          $scope.isWindowTall = function() {
            var supplemental = $('.conversation-skin-supplemental-card');
            var scrollBottom = $(window).scrollTop() + $(window).height();
            var supplementalBottom = supplemental.offset().top +
                                     supplemental.height();
            return scrollBottom - supplementalBottom > 50;
          };

          $scope.submitAnswer = function(answer, interactionRulesService) {
            // Do not clear the help card or submit an answer if there is an
            // upcoming card.
            if ($scope.activeCard.destStateName) {
              return;
            }

            $scope.clearHelpCard();
            $scope.onSubmitAnswer({
              answer: answer,
              rulesService: interactionRulesService
            });
          };

          $scope.$on(EVENT_ACTIVE_CARD_CHANGED, function() {
            updateActiveCard();
            $scope.allHintsExhausted = false;
          });

          $scope.$on('helpCardAvailable', function(event, helpCard) {
            $scope.helpCardHtml = helpCard.helpCardHtml;
            $scope.helpCardHasContinueButton = helpCard.hasContinueButton;
          });

          $scope.$on('stayOnSameCard', function() {
            $timeout.cancel($scope.promiseForHint);
            $scope.isCurrentHintUsable = true;
          });

          updateActiveCard();
        }]
    };
  }]);
