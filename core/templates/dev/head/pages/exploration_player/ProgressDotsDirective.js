// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the progress dots in the conversation skin.
 */

oppia.directive('progressDots', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getNumDots: '&numDots'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'progress_dots_directive.html'),
      controller: [
        '$scope', '$rootScope', 'PlayerPositionService', 'UrlService',
        function($scope, $rootScope, PlayerPositionService, UrlService) {
          var isIframed = UrlService.isIframed();
          $scope.MAX_DOTS = isIframed ? 6 : 18;
          $scope.dots = [];
          $scope.currentDotIndex = PlayerPositionService.getActiveCardIndex();
          var initialDotCount = $scope.getNumDots();
          for (var i = 0; i < initialDotCount; i++) {
            $scope.dots.push({});
          }

          $scope.$watch(function() {
            return $scope.getNumDots();
          }, function(newValue) {
            var oldValue = $scope.dots.length;

            if (newValue === oldValue) {
              return;
            } else if (newValue === oldValue + 1) {
              $scope.dots.push({});
              $scope.currentDotIndex = $scope.dots.length - 1;
              $scope.rightmostVisibleDotIndex = $scope.dots.length - 1;
              if ($scope.dots.length > $scope.MAX_DOTS) {
                $scope.leftmostVisibleDotIndex = (
                  $scope.rightmostVisibleDotIndex - $scope.MAX_DOTS + 1);
              } else {
                $scope.leftmostVisibleDotIndex = 0;
              }
            } else {
              throw Error(
                'Unexpected change to number of dots from ' + oldValue +
                ' to ' + newValue);
            }
          });

          $scope.changeActiveDot = function(index) {
            PlayerPositionService.setActiveCardIndex(index);
            $rootScope.$broadcast('updateActiveStateIfInEditor',
              PlayerPositionService.getCurrentStateName());
            $scope.currentDotIndex = index;
          };

          $scope.decrementCurrentDotIndex = function() {
            if ($scope.currentDotIndex > 0) {
              if ($scope.currentDotIndex === $scope.leftmostVisibleDotIndex) {
                $scope.leftmostVisibleDotIndex = (
                  $scope.leftmostVisibleDotIndex - 1);
                $scope.rightmostVisibleDotIndex = (
                  $scope.rightmostVisibleDotIndex - 1);
              }
              $scope.changeActiveDot($scope.currentDotIndex - 1);
            }
          };

          $scope.incrementCurrentDotIndex = function() {
            if ($scope.currentDotIndex < $scope.dots.length - 1) {
              if ($scope.currentDotIndex === $scope.rightmostVisibleDotIndex) {
                $scope.rightmostVisibleDotIndex = (
                  $scope.rightmostVisibleDotIndex + 1);
                $scope.leftmostVisibleDotIndex = (
                  $scope.leftmostVisibleDotIndex + 1);
              }
              $scope.changeActiveDot($scope.currentDotIndex + 1);
            }
          };
        }
      ]
    };
  }]);
