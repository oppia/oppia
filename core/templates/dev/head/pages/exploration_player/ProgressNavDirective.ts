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
 * @fileoverview Directive for navigation in the conversation skin.
 */

oppia.directive('progressNav', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&',
        onClickContinueButton: '&',
        isLearnAgainButton: '&',
        getDisplayedCard: '&displayedCard',
        isSubmitButtonShown: '&submitButtonIsShown',
        isSubmitButtonDisabled: '&submitButtonIsDisabled'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/progress_nav_directive.html'),
      controller: [
        '$scope', '$rootScope', 'PlayerPositionService', 'UrlService',
        'PlayerTranscriptService', 'ExplorationEngineService',
        'WindowDimensionsService', 'TWO_CARD_THRESHOLD_PX',
        'CONTINUE_BUTTON_FOCUS_LABEL', 'INTERACTION_SPECS',
        'ExplorationPlayerStateService',
        function($scope, $rootScope, PlayerPositionService, UrlService,
            PlayerTranscriptService, ExplorationEngineService,
            WindowDimensionsService, TWO_CARD_THRESHOLD_PX,
            CONTINUE_BUTTON_FOCUS_LABEL, INTERACTION_SPECS,
            ExplorationPlayerStateService) {
          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;
          $scope.isIframed = UrlService.isIframed();
          var transcriptLength = 0;
          var interactionIsInline = true;
          var interactionHasNavSubmitButton = false;
          var updateDisplayedCardInfo = function() {
            transcriptLength = PlayerTranscriptService.getNumCards();
            $scope.displayedCardIndex =
              PlayerPositionService.getDisplayedCardIndex();
            $scope.displayedCard = $scope.getDisplayedCard();
            $scope.hasPrevious = $scope.displayedCardIndex > 0;
            $scope.hasNext = !PlayerTranscriptService.isLastCard(
              $scope.displayedCardIndex);
            $scope.conceptCardIsBeingShown = (
              $scope.displayedCard.getStateName() === null &&
              !ExplorationPlayerStateService.isInPretestMode());
            var interaction = $scope.displayedCard.getInteraction();
            if (!$scope.conceptCardIsBeingShown) {
              interactionIsInline = (
                $scope.displayedCard.isInteractionInline());
              $scope.interactionCustomizationArgs =
                $scope.displayedCard.getInteractionCustomizationArgs();
              $scope.interactionId = $scope.displayedCard.getInteractionId();
              if ($scope.interactionId) {
                interactionHasNavSubmitButton = (
                  Boolean($scope.interactionId) &&
                  INTERACTION_SPECS[$scope.interactionId].
                    show_generic_submit_button);
              }
            }

            $scope.helpCardHasContinueButton = false;
          };

          $scope.$watch(function() {
            return PlayerPositionService.getDisplayedCardIndex();
          }, updateDisplayedCardInfo);

          $scope.$on('helpCardAvailable', function(evt, helpCard) {
            $scope.helpCardHasContinueButton = helpCard.hasContinueButton;
          });

          $scope.changeCard = function(index) {
            if (index >= 0 && index < transcriptLength) {
              PlayerPositionService.recordNavigationButtonClick();
              PlayerPositionService.setDisplayedCardIndex(index);
              $rootScope.$broadcast('updateActiveStateIfInEditor',
                PlayerPositionService.getCurrentStateName());
            } else {
              throw Error('Target card index out of bounds.');
            }
          };

          // Returns whether the screen is wide enough to fit two
          // cards (e.g., the tutor and supplemental cards) side-by-side.
          $scope.canWindowShowTwoCards = function() {
            return WindowDimensionsService.getWidth() > TWO_CARD_THRESHOLD_PX;
          };

          $scope.shouldGenericSubmitButtonBeShown = function() {
            if ($scope.interactionId === 'ItemSelectionInput' &&
                $scope.interactionCustomizationArgs
                  .maxAllowableSelectionCount.value > 1) {
              return true;
            }

            return (interactionHasNavSubmitButton && (
              interactionIsInline ||
              !$scope.canWindowShowTwoCards()
            ));
          };

          $scope.shouldContinueButtonBeShown = function() {
            if ($scope.conceptCardIsBeingShown) {
              return true;
            }
            return Boolean(
              interactionIsInline &&
              $scope.displayedCard.isCompleted() &&
              $scope.displayedCard.getLastOppiaResponse());
          };
        }
      ]
    };
  }]);
