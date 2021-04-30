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

import { Subscription } from 'rxjs';

require(
  'pages/exploration-player-page/learner-experience/' +
  'continue-button.component.ts');

require('domain/utilities/browser-checker.service.ts');
require(
  'pages/exploration-player-page/services/exploration-player-state.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('progressNav', [
  function() {
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
      template: require('./progress-nav.directive.html'),
      controller: [
        '$scope', '$timeout', 'BrowserCheckerService',
        'ExplorationEngineService', 'ExplorationPlayerStateService',
        'FocusManagerService',
        'PlayerPositionService', 'PlayerTranscriptService', 'UrlService',
        'WindowDimensionsService', 'CONTINUE_BUTTON_FOCUS_LABEL',
        'INTERACTION_SPECS', 'TWO_CARD_THRESHOLD_PX',
        function(
            $scope, $timeout, BrowserCheckerService,
            ExplorationEngineService, ExplorationPlayerStateService,
            FocusManagerService,
            PlayerPositionService, PlayerTranscriptService, UrlService,
            WindowDimensionsService, CONTINUE_BUTTON_FOCUS_LABEL,
            INTERACTION_SPECS, TWO_CARD_THRESHOLD_PX) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var transcriptLength = 0;
          var interactionIsInline = true;
          var SHOW_SUBMIT_INTERACTIONS_ONLY_FOR_MOBILE = [
            'ItemSelectionInput', 'MultipleChoiceInput'];

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
              !ExplorationPlayerStateService.isInQuestionMode());
            if (!$scope.conceptCardIsBeingShown) {
              interactionIsInline = (
                $scope.displayedCard.isInteractionInline());
              $scope.interactionCustomizationArgs =
                $scope.displayedCard.getInteractionCustomizationArgs();
              $scope.interactionId = $scope.displayedCard.getInteractionId();
              if ($scope.interactionId === 'Continue') {
                // To ensure that focus is added after all functions
                // in main thread are completely executed.
                $timeout(() => {
                  FocusManagerService.setFocusWithoutScroll('continue-btn');
                }, 0);
              }
            }

            $scope.helpCardHasContinueButton = false;
          };

          var doesInteractionHaveNavSubmitButton = function() {
            try {
              return (
                Boolean($scope.interactionId) &&
                INTERACTION_SPECS[$scope.interactionId].
                  show_generic_submit_button);
            } catch (e) {
              var additionalInfo = (
                '\nSubmit button debug logs:\ninterationId: ' +
                $scope.interactionId);
              e.message += additionalInfo;
              throw e;
            }
          };

          var doesInteractionHaveSpecialCaseForMobile = function() {
            // The submit button should be shown:
            // 1. In mobile mode, if the current interaction is either
            //    ItemSelectionInput or MultipleChoiceInput.
            // 2. In desktop mode, if the current interaction is
            //    ItemSelectionInput with maximum selectable choices > 1.
            if (BrowserCheckerService.isMobileDevice()) {
              return (SHOW_SUBMIT_INTERACTIONS_ONLY_FOR_MOBILE.indexOf(
                $scope.interactionId) >= 0);
            } else {
              return (
                $scope.interactionId === 'ItemSelectionInput' &&
                      $scope.interactionCustomizationArgs
                        .maxAllowableSelectionCount.value > 1);
            }
          };

          $scope.changeCard = function(index) {
            if (index >= 0 && index < transcriptLength) {
              PlayerPositionService.recordNavigationButtonClick();
              PlayerPositionService.setDisplayedCardIndex(index);
              ExplorationEngineService.onUpdateActiveStateIfInEditor.emit(
                PlayerPositionService.getCurrentStateName());
              PlayerPositionService.changeCurrentQuestion(index);
            } else {
              throw new Error('Target card index out of bounds.');
            }
          };

          // Returns whether the screen is wide enough to fit two
          // cards (e.g., the tutor and supplemental cards) side-by-side.
          $scope.canWindowShowTwoCards = function() {
            return WindowDimensionsService.getWidth() > TWO_CARD_THRESHOLD_PX;
          };

          $scope.shouldGenericSubmitButtonBeShown = function() {
            if (doesInteractionHaveSpecialCaseForMobile()) {
              return true;
            }

            return (doesInteractionHaveNavSubmitButton() && (
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

          ctrl.$onInit = function() {
            $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;
            $scope.isIframed = UrlService.isIframed();
            $scope.$watch(function() {
              return PlayerPositionService.getDisplayedCardIndex();
            }, updateDisplayedCardInfo);

            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onHelpCardAvailable.subscribe(
                (helpCard) => {
                  $scope.helpCardHasContinueButton = helpCard.hasContinueButton;
                }
              )
            );
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
