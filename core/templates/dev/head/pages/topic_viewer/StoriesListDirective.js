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
 * @fileoverview Directive for the stories.
 */
oppia.directive('storiesList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getTopicId: '&topicId',
        canonicalStories: '=canonicalStoryList',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_viewer/stories_list_directive.html'),
      controller: ['WindowDimensionsService', '$scope',
        'TopicViewerBackendApiService', '$timeout',
        function(WindowDimensionsService, $scope,
            TopicViewerBackendApiService, $timeout) {
          var LIBRARY_TILE_WIDTH_PX = 333;
          $scope.leftmostCardIndices = 0;
          var MAX_NUM_TILES_PER_ROW = 3;
          $scope.tileDisplayCount = 0;

          var initCarousels = function() {
            $scope.storyList = TopicViewerBackendApiService.fetchTopicData(
              $scope.getTopicId()).canonical_story_dicts;
            if (!$scope.storyList) {
              return;
            }

            var windowWidth = $(window).width() * 0.85;
            $scope.tileDisplayCount = Math.min(
              Math.floor(windowWidth / (LIBRARY_TILE_WIDTH_PX + 20)),
              MAX_NUM_TILES_PER_ROW);

            // $('.oppia-library-carousel').css({
            //   width: ($scope.tileDisplayCount * LIBRARY_TILE_WIDTH_PX) + 'px'
            // });

            var carouselJQuerySelector = ('.oppia-library-carousel-tiles');
            var carouselScrollPositionPx = $(
              carouselJQuerySelector).scrollLeft();

            var index = Math.ceil(
              carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
            $scope.leftmostCardIndices = index;
          };

          var isAnyCarouselCurrentlyScrolling = false;

          $scope.scroll = function(isLeftScroll) {
            if (isAnyCarouselCurrentlyScrolling) {
              return;
            }
            var carouselJQuerySelector = ('.oppia-library-carousel-tiles');

            var direction = isLeftScroll ? -1 : 1;
            var carouselScrollPositionPx = $(
              carouselJQuerySelector).scrollLeft();

            // Prevent scrolling if there more carousel pixed widths than
            // there are tile widths.

            if ($scope.storyList.length <= $scope.tileDisplayCount) {
              return;
            }

            carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

            if (isLeftScroll) {
              $scope.leftmostCardIndices = Math.max(
                0, $scope.leftmostCardIndices - $scope.tileDisplayCount);
            } else {
              $scope.leftmostCardIndices = Math.min(
                $scope.storyList.length - $scope.tileDisplayCount + 1,
                $scope.leftmostCardIndices + $scope.tileDisplayCount);
            }

            var newScrollPositionPx = carouselScrollPositionPx +
              ($scope.tileDisplayCount * LIBRARY_TILE_WIDTH_PX * direction);

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

          var libraryWindowCutoffPx = 530;
          $scope.libraryWindowIsNarrow = (
            WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.libraryWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$apply();
          });

          $scope.incrementLeftmostCardIndex = function() {
            $scope.leftmostCardIndices++;
          };
          $scope.decrementLeftmostCardIndex = function() {
            $scope.leftmostCardIndices--;
          };
          $timeout(function() {
            initCarousels();
          }, 390);

          $(window).resize(function() {
            initCarousels();
            $scope.$apply();
          });
        }
      ]
    };
  }]);
