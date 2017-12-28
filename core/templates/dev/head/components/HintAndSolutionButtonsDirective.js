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
        '$scope', '$rootScope', 'HintManagerService',
        'ExplorationPlayerService', 'SolutionManagerService',
        'PlayerTranscriptService', 'HintAndSolutionModalService',
        'DeviceInfoService', 'WindowDimensionsService',
        function(
          $scope, $rootScope, HintManagerService,
          ExplorationPlayerService, SolutionManagerService,
          PlayerTranscriptService, HintAndSolutionModalService,
          DeviceInfoService, WindowDimensionsService) {
          $scope.defaultHintUrl = UrlInterpolationService.getStaticImageUrl(
            '/icons/default_hint.svg');

          $scope.activeHintUrl = UrlInterpolationService.getStaticImageUrl(
            '/icons/active_hint.svg');

          $scope.defaultSolutionUrl = UrlInterpolationService.getStaticImageUrl(
            '/icons/default_solution.svg');

          $scope.activeSolutionUrl = UrlInterpolationService.getStaticImageUrl(
            '/icons/active_hint.svg');

          $scope.hintPositions = [];
          $scope.solutionExists = null;
          $scope.isWindowNarrow = WindowDimensionsService.isWindowNarrow();
          $scope.activeModalIndex = null;

          $rootScope.$on('hintsAndSolutionReset', function(evt, data) {
            for(var index = 0; index < data.numOfHints; index++) {
              $scope.hintPositions.push(index);
            }
            $scope.solutionExists = data.solutionExists;
          });

          $scope.isHintButtonVisibleAtIndex = function(index) {
            if (index === 0) {
              return HintManagerService.isCurrentHintAvailable() ||
                index < HintManagerService.getCurrentHintIndex();
            } else if (index === HintManagerService.getCurrentHintIndex()) {
              return HintManagerService.isCurrentHintAvailable();
            } else {
              return index < HintManagerService.getCurrentHintIndex();
            }
          };

          $scope.isSolutionButtonVisible = function() {
            return SolutionManagerService.isCurrentSolutionAvailable() &&
                HintManagerService.areAllHintsExhausted();
          };

          $scope.displayHintModalForIndex = function(index) {
            $scope.activeModalIndex = index;
            var promise = (
              HintAndSolutionModalService.displayHintModalForIndex(index));
            promise.result.then(null, function() {
              $scope.activeModalIndex = null;
            });
          };

          $scope.displaySolutionModal = function() {
            $scope.activeModalIndex = -1;
            HintAndSolutionModalService.displaySolutionModal().result.then(null,
              function() {
                $scope.activeModalIndex = null;
              });
          };
        }
      ]
    };
  }]);
