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
 * @fileoverview Directive for hint and solution buttons.
 */

oppia.directive('hintAndSolutionButtons', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/hint_and_solution_buttons_directive.html'),
      controller: [
        '$scope', '$rootScope', 'HintsAndSolutionManagerService',
        'PlayerTranscriptService', 'ExplorationPlayerStateService',
        'HintAndSolutionModalService', 'DeviceInfoService', 'ContextService',
        'PlayerPositionService', 'EVENT_ACTIVE_CARD_CHANGED',
        'EVENT_NEW_CARD_OPENED', 'INTERACTION_SPECS', 'StatsReportingService',
        function(
            $scope, $rootScope, HintsAndSolutionManagerService,
            PlayerTranscriptService, ExplorationPlayerStateService,
            HintAndSolutionModalService, DeviceInfoService, ContextService,
            PlayerPositionService, EVENT_ACTIVE_CARD_CHANGED,
            EVENT_NEW_CARD_OPENED, INTERACTION_SPECS, StatsReportingService) {
          $scope.hintIndexes = [];
          var _editorPreviewMode = ContextService.isInExplorationEditorPage();
          // Represents the index of the currently viewed hint.
          $scope.activeHintIndex = null;
          $scope.displayedCard = null;
          $scope.solutionModalIsActive = false;
          $scope.currentlyOnLatestCard = true;
          $scope.isHintConsumed = HintsAndSolutionManagerService.isHintConsumed;
          $scope.isSolutionConsumed = (
            HintsAndSolutionManagerService.isSolutionConsumed);

          var resetLocalHintsArray = function() {
            $scope.hintIndexes = [];
            var numHints = HintsAndSolutionManagerService.getNumHints();
            for (var index = 0; index < numHints; index++) {
              $scope.hintIndexes.push(index);
            }
          };

          $scope.isHintButtonVisible = function(index) {
            return (
              HintsAndSolutionManagerService.isHintViewable(index) &&
              $scope.displayedCard.doesInteractionSupportHints());
          };

          $scope.isSolutionButtonVisible = function() {
            return HintsAndSolutionManagerService.isSolutionViewable();
          };

          $scope.displayHintModal = function(index) {
            $scope.activeHintIndex = index;
            var promise = (
              HintAndSolutionModalService.displayHintModal(index));
            promise.result.then(null, function() {
              $scope.activeHintIndex = null;
            });
          };

          $scope.onClickSolutionButton = function() {
            $scope.solutionModalIsActive = true;
            if (HintsAndSolutionManagerService.isSolutionConsumed()) {
              $scope.displaySolutionModal();
            } else {
              var interstitialModalPromise = (
                HintAndSolutionModalService.displaySolutionInterstitialModal());
              interstitialModalPromise.result.then(function() {
                $scope.displaySolutionModal();
              }, function() {
                $scope.solutionModalIsActive = false;
              });
            }
          };

          $scope.displaySolutionModal = function() {
            $scope.solutionModalIsActive = true;
            var inPretestMode = ExplorationPlayerStateService.isInPretestMode();
            if (!_editorPreviewMode && !inPretestMode) {
              StatsReportingService.recordSolutionHit(
                PlayerPositionService.getCurrentStateName());
            }
            var promise = HintAndSolutionModalService.displaySolutionModal();
            promise.result.then(null, function() {
              $scope.solutionModalIsActive = false;
            });
          };

          $scope.$on(EVENT_NEW_CARD_OPENED, function(evt, newCard) {
            $scope.displayedCard = newCard;
            HintsAndSolutionManagerService.reset(
              newCard.getHints(), newCard.getSolution()
            );
            resetLocalHintsArray();
          });

          $scope.isTooltipVisible = function() {
            return HintsAndSolutionManagerService.isHintTooltipOpen();
          };

          $scope.$on(EVENT_ACTIVE_CARD_CHANGED, function(evt) {
            var displayedCardIndex =
              PlayerPositionService.getDisplayedCardIndex();
            $scope.currentlyOnLatestCard = PlayerTranscriptService.isLastCard(
              displayedCardIndex);
            if ($scope.currentlyOnLatestCard) {
              resetLocalHintsArray();
            }
          });
          resetLocalHintsArray();
        }
      ]
    };
  }]);
