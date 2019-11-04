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
 * @fileoverview Directive for the subtopics list.
 */

require('components/summary-tile/subtopic-summary-tile.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('subtopicsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getSubtopics: '&subtopicsList',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/subtopics-list/' +
        'subtopics-list.directive.html'),
      controller: [
        'WindowDimensionsService', '$scope', '$timeout', 'UrlService',
        function(
            WindowDimensionsService, $scope, $timeout, UrlService) {
          var SUBTOPIC_TILE_WIDTH_PX = 310;
          $scope.leftmostCardIndices = 0;
          var MAX_NUM_TILES_PER_ROW = 4;
          $scope.tileDisplayCount = 0;
          $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
          var initCarousels = function() {
            $scope.subtopics = $scope.getSubtopics();
            if (!$scope.subtopics) {
              return;
            }

            var windowWidth = $(window).width();
            $scope.tileDisplayCount = Math.min(
              Math.floor(windowWidth / (SUBTOPIC_TILE_WIDTH_PX + 20)),
              MAX_NUM_TILES_PER_ROW);

            $('.oppia-topic-viewer-carousel').css({
              width: ($scope.tileDisplayCount * SUBTOPIC_TILE_WIDTH_PX) + 'px'
            });

            var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
            var carouselScrollPositionPx = $(
              carouselJQuerySelector).scrollLeft();

            var index = Math.ceil(
              carouselScrollPositionPx / SUBTOPIC_TILE_WIDTH_PX);
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

            if ($scope.subtopics.length <= $scope.tileDisplayCount) {
              return;
            }

            carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

            if (isLeftScroll) {
              $scope.leftmostCardIndices = Math.max(
                0, $scope.leftmostCardIndices - $scope.tileDisplayCount);
            } else {
              $scope.leftmostCardIndices = Math.min(
                $scope.subtopics.length - $scope.tileDisplayCount + 1,
                $scope.leftmostCardIndices + $scope.tileDisplayCount);
            }

            var newScrollPositionPx = carouselScrollPositionPx +
              ($scope.tileDisplayCount * SUBTOPIC_TILE_WIDTH_PX * direction);
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

          var topicViewerWindowCutoffPx = 895;
          $scope.topicViewerWindowIsNarrow = (
            WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);

          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.topicViewerWindowIsNarrow = (
              WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
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
