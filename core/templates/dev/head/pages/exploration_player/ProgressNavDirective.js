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
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'progress_nav_directive.html'),
      controller: [
        '$scope', '$rootScope', 'PlayerPositionService',
        'PlayerTranscriptService',
        function($scope, $rootScope, PlayerPositionService,
          PlayerTranscriptService) {
          $scope.currentCardIndex = PlayerPositionService.getActiveCardIndex();
          $scope.transcriptLength = PlayerTranscriptService.getNumCards();

          $scope.$watch(function() {
            return PlayerPositionService.getActiveCardIndex();
          }, function() {
            $scope.currentCardIndex = (
              PlayerPositionService.getActiveCardIndex());
            $scope.transcriptLength = PlayerTranscriptService.getNumCards();
          });

          $scope.changeCard = function(index) {
            if (index >= 0 && index < $scope.transcriptLength) {
              PlayerPositionService.setActiveCardIndex(index);
              $rootScope.$broadcast('updateActiveStateIfInEditor',
                PlayerPositionService.getCurrentStateName());
            }
          };

          $scope.hasPrevious = function() {
            return $scope.currentCardIndex > 0;
          };

          $scope.hasNext = function() {
            return $scope.currentCardIndex < $scope.transcriptLength - 1;
          };
        }
      ]
    };
  }]);
