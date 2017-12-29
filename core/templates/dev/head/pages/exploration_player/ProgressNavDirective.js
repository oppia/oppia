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
        onClickContinueButton: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'progress_nav_directive.html'),
      controller: [
        '$scope', '$rootScope', 'PlayerPositionService',
        'PlayerTranscriptService', 'ExplorationPlayerService',
        'ExplorationPlayerStateService', 'CONTINUE_BUTTON_FOCUS_LABEL',
        function($scope, $rootScope, PlayerPositionService,
          PlayerTranscriptService, ExplorationPlayerService,
          ExplorationPlayerStateService, CONTINUE_BUTTON_FOCUS_LABEL) {
          $scope.CONTINUE_BUTTON_FOCUS_LABEL = CONTINUE_BUTTON_FOCUS_LABEL;

          var transcriptLength, isInteractionInline;
          var updateActiveCardInfo = function() {
            $scope.activeCardIndex = PlayerPositionService.getActiveCardIndex();
            transcriptLength = PlayerTranscriptService.getNumCards();
            $scope.activeCard = PlayerTranscriptService.getCard(
              $scope.activeCardIndex);
            $scope.hasPrevious = $scope.activeCardIndex > 0;
            $scope.hasNext = !PlayerTranscriptService.isLastCard(
              $scope.activeCardIndex);
            $scope.interaction = ExplorationPlayerService.getInteraction(
              $scope.activeCard.stateName);
            isInteractionInline = (
              ExplorationPlayerStateService.isInteractionInline(
                $scope.activeCard.stateName));
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
              PlayerPositionService.setActiveCardIndex(index);
              $rootScope.$broadcast('updateActiveStateIfInEditor',
                PlayerPositionService.getCurrentStateName());
            }
          };

          $scope.shouldContinueButtonBeShown = function() {
            var lastPair = $scope.activeCard.inputResponsePairs[
              $scope.activeCard.inputResponsePairs.length - 1];
            return Boolean(isInteractionInline &&
              $scope.activeCard.destStateName &&
              (lastPair.oppiaResponse !== undefined));
          }
        }
      ]
    };
  }]);
