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

oppia.directive('supplementalCard', [function() {
  return {
    restrict: 'E',
    scope: {
      showNextCard: '&',
      onSubmitAnswer: '&'
    },
    templateUrl: 'components/SupplementalCard',
    controller: [
      '$scope', '$window', 'oppiaPlayerService', 'UrlInterpolationService',
      'playerPositionService', 'playerTranscriptService',
      'ExplorationObjectFactory', 'windowDimensionsService',
      'CONTENT_FOCUS_LABEL_PREFIX', 'TWO_CARD_THRESHOLD_PX',
      function(
        $scope, $window, oppiaPlayerService, UrlInterpolationService,
        playerPositionService, playerTranscriptService,
        ExplorationObjectFactory, windowDimensionsService,
        CONTENT_FOCUS_LABEL_PREFIX, TWO_CARD_THRESHOLD_PX) {
        var updateActiveCard = function() {
          var index = playerPositionService.getActiveCardIndex();
          if (index === null) {
            return;
          }
          $scope.activeCard = playerTranscriptService.getCard(index);
          $scope.clearHelpCard();
        };

        $scope.OPPIA_AVATAR_IMAGE_URL = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_black_72px.png'));

        $scope.CONTINUE_BUTTON_FOCUS_LABEL = 'continueButton';

        $scope.helpCardHtml = null;
        $scope.helpCardHasContinueButton = false;

        $scope.clearHelpCard = function() {
          $scope.helpCardHtml = null;
          $scope.helpCardHasContinueButton = false;
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
          $scope.clearHelpCard();
          $scope.onSubmitAnswer({
            answer: answer,
            rulesService: interactionRulesService
          });
        };

        $scope.$on('activeCardChanged', function() {
          updateActiveCard();
        });

        $scope.$on('helpCardAvailable', function(event, helpCard) {
          $scope.helpCardHtml = helpCard.helpCardHtml;
          $scope.helpCardHasContinueButton = helpCard.hasContinueButton;
        });

        updateActiveCard();
      }]
  };
}]);
