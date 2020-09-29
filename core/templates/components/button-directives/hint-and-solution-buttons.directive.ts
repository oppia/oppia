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

require(
  'pages/exploration-player-page/services/exploration-player-state.service.ts');
require(
  'pages/exploration-player-page/services/' +
  'hints-and-solution-manager.service.ts');
require(
  'pages/exploration-player-page/services/hint-and-solution-modal.service.ts');
require(
  'pages/exploration-player-page/services/learner-answer-info.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require('pages/exploration-player-page/services/stats-reporting.service.ts');
require('services/context.service.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('hintAndSolutionButtons', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/button-directives/' +
        'hint-and-solution-buttons.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'ContextService', 'ExplorationPlayerStateService',
        'HintAndSolutionModalService', 'HintsAndSolutionManagerService',
        'PlayerPositionService', 'PlayerTranscriptService',
        'StatsReportingService',
        function(
            ContextService, ExplorationPlayerStateService,
            HintAndSolutionModalService, HintsAndSolutionManagerService,
            PlayerPositionService, PlayerTranscriptService,
            StatsReportingService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var _editorPreviewMode = ContextService.isInExplorationEditorPage();
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
              ctrl.displayedCard !== null &&
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
                HintAndSolutionModalService
                  .displaySolutionInterstitialModal());
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

          ctrl.isTooltipVisible = function() {
            return HintsAndSolutionManagerService.isHintTooltipOpen();
          };

          ctrl.isHintConsumed = function(hintIndex) {
            return HintsAndSolutionManagerService.isHintConsumed(hintIndex);
          };

          ctrl.isSolutionConsumed = function() {
            return HintsAndSolutionManagerService.isSolutionConsumed();
          };

          ctrl.$onInit = function() {
            ctrl.hintIndexes = [];
            // Represents the index of the currently viewed hint.
            ctrl.activeHintIndex = null;
            ctrl.displayedCard = null;
            ctrl.solutionModalIsActive = false;
            ctrl.currentlyOnLatestCard = true;
            resetLocalHintsArray();
            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onNewCardOpened.subscribe(
                (newCard) => {
                  ctrl.displayedCard = newCard;
                  HintsAndSolutionManagerService.reset(
                    newCard.getHints(), newCard.getSolution()
                  );
                  resetLocalHintsArray();
                }
              )
            );
            ctrl.directiveSubscriptions.add(
              PlayerPositionService.onActiveCardChanged.subscribe(
                () => {
                  var displayedCardIndex =
                    (PlayerPositionService.getDisplayedCardIndex());
                  ctrl.currentlyOnLatestCard =
                    (PlayerTranscriptService.isLastCard(displayedCardIndex));
                  if (ctrl.currentlyOnLatestCard) {
                    resetLocalHintsArray();
                  }
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
