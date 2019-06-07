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

require('pages/exploration_player/ExplorationPlayerStateService.ts');
require('pages/exploration_player/HintsAndSolutionManagerService.ts');
require('pages/exploration_player/HintAndSolutionModalService.ts');
require('pages/exploration_player/PlayerConstants.ts');
require('pages/exploration_player/PlayerPositionService.ts');
require('pages/exploration_player/PlayerTranscriptService.ts');
require('pages/exploration_player/StatsReportingService.ts');
require('services/ContextService.ts');
require('services/contextual/DeviceInfoService.ts');

oppia.directive('hintAndSolutionButtons', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/hint_and_solution_buttons_directive.html'),
      controllerAs: '$ctrl',
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
          var ctrl = this;
          ctrl.hintIndexes = [];
          var _editorPreviewMode = ContextService.isInExplorationEditorPage();
          // Represents the index of the currently viewed hint.
          ctrl.activeHintIndex = null;
          ctrl.displayedCard = null;
          ctrl.solutionModalIsActive = false;
          ctrl.currentlyOnLatestCard = true;
          ctrl.isHintConsumed = HintsAndSolutionManagerService.isHintConsumed;
          ctrl.isSolutionConsumed = (
            HintsAndSolutionManagerService.isSolutionConsumed);

          var resetLocalHintsArray = function() {
            ctrl.hintIndexes = [];
            var numHints = HintsAndSolutionManagerService.getNumHints();
            for (var index = 0; index < numHints; index++) {
              ctrl.hintIndexes.push(index);
            }
          };

          ctrl.isHintButtonVisible = function(index) {
            return (
              HintsAndSolutionManagerService.isHintViewable(index) &&
              ctrl.displayedCard.doesInteractionSupportHints());
          };

          ctrl.isSolutionButtonVisible = function() {
            return HintsAndSolutionManagerService.isSolutionViewable();
          };

          ctrl.displayHintModal = function(index) {
            ctrl.activeHintIndex = index;
            var promise = (
              HintAndSolutionModalService.displayHintModal(index));
            promise.result.then(null, function() {
              ctrl.activeHintIndex = null;
            });
          };

          ctrl.onClickSolutionButton = function() {
            ctrl.solutionModalIsActive = true;
            if (HintsAndSolutionManagerService.isSolutionConsumed()) {
              ctrl.displaySolutionModal();
            } else {
              var interstitialModalPromise = (
                HintAndSolutionModalService.displaySolutionInterstitialModal());
              interstitialModalPromise.result.then(function() {
                ctrl.displaySolutionModal();
              }, function() {
                ctrl.solutionModalIsActive = false;
              });
            }
          };

          ctrl.displaySolutionModal = function() {
            ctrl.solutionModalIsActive = true;
            var inQuestionMode = (
              ExplorationPlayerStateService.isInQuestionMode());
            if (!_editorPreviewMode && !inQuestionMode) {
              StatsReportingService.recordSolutionHit(
                PlayerPositionService.getCurrentStateName());
            }
            var promise = HintAndSolutionModalService.displaySolutionModal();
            promise.result.then(null, function() {
              ctrl.solutionModalIsActive = false;
            });
          };

          $scope.$on(EVENT_NEW_CARD_OPENED, function(evt, newCard) {
            ctrl.displayedCard = newCard;
            HintsAndSolutionManagerService.reset(
              newCard.getHints(), newCard.getSolution()
            );
            resetLocalHintsArray();
          });

          ctrl.isTooltipVisible = function() {
            return HintsAndSolutionManagerService.isHintTooltipOpen();
          };

          $scope.$on(EVENT_ACTIVE_CARD_CHANGED, function(evt) {
            var displayedCardIndex =
              PlayerPositionService.getDisplayedCardIndex();
            ctrl.currentlyOnLatestCard = PlayerTranscriptService.isLastCard(
              displayedCardIndex);
            if (ctrl.currentlyOnLatestCard) {
              resetLocalHintsArray();
            }
          });
          resetLocalHintsArray();
        }
      ]
    };
  }]);
