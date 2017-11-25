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
 * @fileoverview Directive for the hint button in the exploration player.
 */

oppia.directive('hintButton', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    var SHOW_NEED_HINT_MESSAGE_DELAY = 1000;
    var NUM_ATTEMPTS_BEFORE_SHOWING_NEED_HINT_MESSAGE = 2;

    return {
      restrict: 'E',
      scope: {
        onClickHintButton: '&',
        allHintsAreExhausted: '&',
        currentHintIsAvailable: '&',
        isSupplementalCard: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'hint_button_directive.html'),
      controller: [
        '$scope', '$rootScope', '$timeout', 'NumberAttemptsService',
        'WindowDimensionsService', 'TWO_CARD_THRESHOLD_PX',
        function($scope, $rootScope, $timeout, NumberAttemptsService,
            WindowDimensionsService, TWO_CARD_THRESHOLD_PX) {
          $scope.isShowingHintTooltip = false;

          var viewportIsNarrow =
            WindowDimensionsService.getWidth() < TWO_CARD_THRESHOLD_PX;

          $scope.getTooltipPlacement = function() {
            return (viewportIsNarrow && $scope.isSupplementalCard()) ?
              'right' : 'left';
          };

          var showNeedHintIfNecessary = function() {
            if (NumberAttemptsService.getNumberAttempts() >=
                NUM_ATTEMPTS_BEFORE_SHOWING_NEED_HINT_MESSAGE) {
              $timeout(function() {
                $scope.isShowingHintTooltip = true;
                $scope.isShowingNeedHintMessage = true;
              }, SHOW_NEED_HINT_MESSAGE_DELAY);
            }
          };

          $scope.hideNeedHintMessage = function() {
            $scope.isShowingHintTooltip = false;
            $scope.isShowingNeedHintMessage = false;
          };

          $scope.$on('oppiaFeedbackAvailable', showNeedHintIfNecessary);
        }]
    };
  }]);
