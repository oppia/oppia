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
        isConceptCardPending: '&',
        isSubmitButtonShown: '&submitButtonIsShown',
        isSubmitButtonDisabled: '&submitButtonIsDisabled'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/progress_nav_directive.html'),
      controller: [
        '$scope', '$rootScope', 'PlayerPositionService', 'UrlService',
        'PlayerTranscriptService', 'ExplorationPlayerService',
        'ExplorationPlayerStateService', 'WindowDimensionsService',
        'CONTINUE_BUTTON_FOCUS_LABEL', 'INTERACTION_SPECS',
        function($scope, $rootScope, PlayerPositionService, UrlService,
            PlayerTranscriptService, ExplorationPlayerService,
            ExplorationPlayerStateService, WindowDimensionsService,
            CONTINUE_BUTTON_FOCUS_LABEL, INTERACTION_SPECS) {
          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;
          $scope.isIframed = UrlService.isIframed();

          var transcriptLength = 0;
          var interactionIsInline = true;
          var interactionHasNavSubmitButton = false;
          var updateActiveCardInfo = function() {
            transcriptLength = PlayerTranscriptService.getNumCards();
            $scope.activeCardIndex = PlayerPositionService.getActiveCardIndex();
            $scope.activeCard = PlayerTranscriptService.getCard(
              $scope.activeCardIndex);
            $scope.hasPrevious = $scope.activeCardIndex > 0;
            $scope.hasNext = !PlayerTranscriptService.isLastCard(
              $scope.activeCardIndex);
            $scope.isConceptCardShown =
              ExplorationPlayerStateService.isStateShowingConceptCard(
                $scope.activeCard.stateName);
            if (!$scope.isConceptCardShown) {
              var interaction = ExplorationPlayerService.getInteraction(
                $scope.activeCard.stateName);
              interactionIsInline = (
                ExplorationPlayerStateService.isInteractionInline(
                  $scope.activeCard.stateName));
              $scope.interactionCustomizationArgs =
                interaction.customizationArgs;
              $scope.interactionId = interaction.id;
              interactionHasNavSubmitButton = (
                Boolean(interaction.id) &&
                INTERACTION_SPECS[interaction.id].show_generic_submit_button);
            }

            $scope.helpCardHasContinueButton = false;
          };

          $scope.$watch(function() {
            return PlayerPositionService.getActiveCardIndex();
          }, updateActiveCardInfo);

          $scope.$on('helpCardAvailable', function(evt, helpCard) {
            $scope.helpCardHasContinueButton = helpCard.hasContinueButton;
          });

          $scope.changeCard = function(index) {
            if (index >= 0 && index < transcriptLength) {
              PlayerPositionService.recordNavigationButtonClick();
              PlayerPositionService.setActiveCardIndex(index);
              $rootScope.$broadcast('updateActiveStateIfInEditor',
                PlayerPositionService.getCurrentStateName());
            } else {
              throw Error('Target card index out of bounds.');
            }
          };

          $scope.shouldGenericSubmitButtonBeShown = function() {
            if ($scope.interactionId === 'ItemSelectionInput' &&
                $scope.interactionCustomizationArgs
                  .maxAllowableSelectionCount.value > 1) {
              return true;
            }

            return (interactionHasNavSubmitButton && (
              interactionIsInline ||
              !ExplorationPlayerService.canWindowShowTwoCards()
            ));
          };

          $scope.shouldContinueButtonBeShown = function() {
            if ($scope.isConceptCardShown) {
              return true;
            }
            var lastPair = $scope.activeCard.inputResponsePairs[
              $scope.activeCard.inputResponsePairs.length - 1];
            return Boolean(
              interactionIsInline &&
              ($scope.activeCard.destStateName ||
              $scope.isConceptCardPending()) &&
              lastPair.oppiaResponse);
          };
        }
      ]
    };
  }]);
