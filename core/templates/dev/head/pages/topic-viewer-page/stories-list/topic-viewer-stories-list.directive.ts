// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the stories list.
 */

require('components/summary-tile/story-summary-tile.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('storiesList', [
  '$timeout', 'UrlInterpolationService',
  function($timeout, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getCanonicalStories: '&canonicalStoriesList',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/stories-list/' +
        'topic-viewer-stories-list.directive.html'),
      controller: ['WindowDimensionsService', '$scope',
        function(WindowDimensionsService, $scope) {
          var ctrl = this;
          var STORY_TILE_WIDTH_PX = 360;
          var MAX_NUM_TILES_PER_ROW = 4;

          var initCarousels = function() {
            $scope.canonicalStories = $scope.getCanonicalStories();
            if (!$scope.canonicalStories) {
              return;
            }

            var windowWidth = $(window).width();
            $scope.tileDisplayCount = Math.min(
              Math.floor(windowWidth / (STORY_TILE_WIDTH_PX + 20)),
              MAX_NUM_TILES_PER_ROW);

            $('.oppia-topic-viewer-carousel').css({
              width: ($scope.tileDisplayCount * STORY_TILE_WIDTH_PX) + 'px'
            });

            var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
            var carouselScrollPositionPx = $(
              carouselJQuerySelector).scrollLeft();

            var index = Math.ceil(
              carouselScrollPositionPx / STORY_TILE_WIDTH_PX);
            $scope.leftmostCardIndices = index;
          };

          var isAnyCarouselCurrentlyScrolling = false;

          $scope.scroll = function(isLeftScroll) {
            if (isAnyCarouselCurrentlyScrolling) {
              return;
            }
            var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');

            var direction = isLeftScroll ? -1 : 1;
            var carouselScrollPositionPx = $(
              carouselJQuerySelector).scrollLeft();

            // Prevent scrolling if there more carousel pixed widths than
            // there are tile widths.

            if ($scope.canonicalStories.length <= $scope.tileDisplayCount) {
              return;
            }

            carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

            if (isLeftScroll) {
              $scope.leftmostCardIndices = Math.max(
                0, $scope.leftmostCardIndices - $scope.tileDisplayCount);
            } else {
              $scope.leftmostCardIndices = Math.min(
                $scope.canonicalStories.length - $scope.tileDisplayCount + 1,
                $scope.leftmostCardIndices + $scope.tileDisplayCount);
            }

            var newScrollPositionPx = carouselScrollPositionPx +
              ($scope.tileDisplayCount * STORY_TILE_WIDTH_PX * direction);
            $(carouselJQuerySelector).animate({
              scrollLeft: newScrollPositionPx
            }, {
              duration: 800,
              queue: false,
              start: function() {
                isAnyCarouselCurrentlyScrolling = true;
              },
              complete: function() {
                isAnyCarouselCurrentlyScrolling = false;
              }
            });
          };

          $scope.incrementLeftmostCardIndex = function() {
            $scope.leftmostCardIndices++;
          };
          $scope.decrementLeftmostCardIndex = function() {
            $scope.leftmostCardIndices--;
          };

          ctrl.$onInit = function() {
            $scope.leftmostCardIndices = 0;
            $scope.tileDisplayCount = 0;
            $scope.canonicalStories = $scope.getCanonicalStories();
            var topicViewerWindowCutoffPx = 895;
            $scope.topicViewerWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
            WindowDimensionsService.registerOnResizeHook(function() {
              $scope.topicViewerWindowIsNarrow = (
                WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx
              );
              $scope.$apply();
            });
            $timeout(function() {
              initCarousels();
            }, 390);
            $(window).resize(function() {
              initCarousels();
              $scope.$apply();
            });
          };
        }
      ]
    };
  }]);
