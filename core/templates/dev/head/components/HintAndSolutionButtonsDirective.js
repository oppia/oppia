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
        'ExplorationEngineService', 'PlayerTranscriptService',
        'HintAndSolutionModalService', 'DeviceInfoService',
        'PlayerPositionService', 'EVENT_ACTIVE_CARD_CHANGED',
        'EVENT_NEW_CARD_OPENED', 'INTERACTION_SPECS',
        function(
            $scope, $rootScope, HintsAndSolutionManagerService,
            ExplorationEngineService, PlayerTranscriptService,
            HintAndSolutionModalService, DeviceInfoService,
            PlayerPositionService, EVENT_ACTIVE_CARD_CHANGED,
            EVENT_NEW_CARD_OPENED, INTERACTION_SPECS) {
          // The state name of the latest card that's open. This is the state
          // name that the current hints and solution correspond to.
          var latestStateName = null;
          $scope.hintIndexes = [];
          // Represents the index of the currently viewed hint.
          $scope.activeHintIndex = null;
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
            return HintsAndSolutionManagerService.isHintViewable(index) &&
              !INTERACTION_SPECS[ExplorationEngineService.getInteraction(
                PlayerPositionService.getCurrentStateName()).id].is_terminal &&
                !INTERACTION_SPECS[ExplorationEngineService.getInteraction(
                  PlayerPositionService.getCurrentStateName()).id].is_linear;
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
            ExplorationEngineService.recordSolutionHit(latestStateName);
            var promise = HintAndSolutionModalService.displaySolutionModal();
            promise.result.then(null, function() {
              $scope.solutionModalIsActive = false;
            });
          };

          $scope.$on(EVENT_NEW_CARD_OPENED, function(evt, data) {
            latestStateName = data.stateName;
            HintsAndSolutionManagerService.reset(
              ExplorationEngineService.getHints(data.stateName),
              ExplorationEngineService.getSolution(data.stateName)
            );
            resetLocalHintsArray();
          });

          $scope.isTooltipVisible = function() {
            return HintsAndSolutionManagerService.isHintTooltipOpen();
          };

          $scope.$on(EVENT_ACTIVE_CARD_CHANGED, function(evt) {
            var activeCardIndex = PlayerPositionService.getActiveCardIndex();
            $scope.currentlyOnLatestCard = PlayerTranscriptService.isLastCard(
              activeCardIndex);
            if ($scope.currentlyOnLatestCard) {
              resetLocalHintsArray();
            }
          });
          resetLocalHintsArray();
        }
      ]
    };
  }]);
