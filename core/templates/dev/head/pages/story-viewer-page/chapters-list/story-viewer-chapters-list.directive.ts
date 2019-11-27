// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the learner's view of a story.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');

require('domain/story_viewer/StoryPlaythroughObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/page-title.service.ts');
require('services/user.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').animation('.oppia-story-animate-slide', function() {
  return {
    enter: function(element) {
      element.hide().slideDown();
    },
    leave: function(element) {
      element.slideUp();
    }
  };
});

angular.module('oppia').directive('storyViewerChaptersList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getPlaythroughObject: '&playthroughObject'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-viewer-page/chapters-list' +
        '/story-viewer-chapters-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$anchorScroll', '$http', '$location', 'AlertsService',
        'PageTitleService', 'StoryPlaythroughObjectFactory',
        'UrlInterpolationService', 'UrlService', 'UserService',
        function(
            $anchorScroll, $http, $location, AlertsService,
            PageTitleService, StoryPlaythroughObjectFactory,
            UrlInterpolationService, UrlService, UserService) {
          var ctrl = this;
          ctrl.storyPlaythroughObject = ctrl.getPlaythroughObject();
          UserService.getUserInfoAsync().then(function(userInfo) {
            ctrl.isLoggedIn = userInfo.isLoggedIn();
          });
          ctrl.explorationCardIsShown = false;
          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
          // The pathIconParameters is an array containing the co-ordinates,
          // background color and icon url for the icons generated on the path.
          ctrl.pathIconParameters = [];
          ctrl.activeHighlightedIconIndex = -1;
          ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
          ctrl.ODD_SVG_HEIGHT_OFFSET_PX = 150;
          ctrl.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
          ctrl.ICON_Y_INITIAL_PX = 35;
          ctrl.ICON_Y_INCREMENT_PX = 110;
          ctrl.ICON_X_MIDDLE_PX = 225;
          ctrl.ICON_X_LEFT_PX = 55;
          ctrl.ICON_X_RIGHT_PX = 395;
          ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
          ctrl.nextExplorationId = null;

          $anchorScroll.yOffset = -80;

          ctrl.setIconHighlight = function(index) {
            ctrl.activeHighlightedIconIndex = index;
          };

          ctrl.unsetIconHighlight = function() {
            ctrl.activeHighlightedIconIndex = -1;
          };

          ctrl.togglePreviewCard = function() {
            ctrl.explorationCardIsShown = !ctrl.explorationCardIsShown;
          };

          ctrl.updateExplorationPreview = function(storyNode) {
            ctrl.explorationCardIsShown = true;
            ctrl.currentExplorationId = storyNode.getExplorationId();
            ctrl.summaryToPreview = storyNode.getExplorationSummaryObject();
            ctrl.completedNode = storyNode.isCompleted();
            ctrl.isNextPendingNode = (
              ctrl.storyPlaythroughObject.getNextPendingNodeId() ===
              storyNode.getId());
            ctrl.currentNodeId = storyNode.getId();
          };

          // Calculates the SVG parameters required to draw the curved path.
          ctrl.generatePathParameters = function() {
            // The pathSvgParameters represents the final string of SVG
            // parameters for the bezier curve to be generated. The default
            // parameters represent the first curve ie. lesson 1 to lesson 3.
            ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
            var storyNodeCount =
              ctrl.storyPlaythroughObject.getStoryNodeCount();
            // The sParameterExtension represents the co-ordinates following
            // the 'S' (smooth curve to) command in SVG.
            var sParameterExtension = '';
            ctrl.pathIconParameters = ctrl.generatePathIconParameters();
            if (storyNodeCount === 1) {
              ctrl.pathSvgParameters = '';
            } else if (storyNodeCount === 2) {
              ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
            } else {
              // The x and y here represent the co-ordinates of the control
              // points for the bezier curve (path).
              var y = 500;
              for (var i = 1; i < Math.floor(storyNodeCount / 2); i++) {
                var x = (i % 2) ? 30 : 470;
                sParameterExtension += x + ' ' + y + ', ';
                y += 20;
                sParameterExtension += 250 + ' ' + y + ', ';
                y += 200;
              }
              if (sParameterExtension !== '') {
                ctrl.pathSvgParameters += ' S ' + sParameterExtension;
              }
            }
            if (storyNodeCount % 2 === 0) {
              if (storyNodeCount === 2) {
                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
              } else {
                ctrl.svgHeight = y - ctrl.EVEN_SVG_HEIGHT_OFFSET_PX;
              }
            } else {
              if (storyNodeCount === 1) {
                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
              } else {
                ctrl.svgHeight = y - ctrl.ODD_SVG_HEIGHT_OFFSET_PX;
              }
            }
          };

          ctrl.generatePathIconParameters = function() {
            var storyNodes = ctrl.storyPlaythroughObject.getStoryNodes();
            var iconParametersArray = [];
            iconParametersArray.push({
              thumbnailIconUrl:
                storyNodes[0].getExplorationSummaryObject(
                ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
              left: '225px',
              top: '35px',
              thumbnailBgColor:
                storyNodes[0].getExplorationSummaryObject(
                ).thumbnail_bg_color
            });

            // Here x and y represent the co-ordinates for the icons in the
            // path.
            var x = ctrl.ICON_X_MIDDLE_PX;
            var y = ctrl.ICON_Y_INITIAL_PX;
            var countMiddleIcon = 1;

            for (
              var i = 1; i < ctrl.storyPlaythroughObject.getStoryNodeCount();
              i++) {
              if (countMiddleIcon === 0 && x === ctrl.ICON_X_MIDDLE_PX) {
                x = ctrl.ICON_X_LEFT_PX;
                y += ctrl.ICON_Y_INCREMENT_PX;
                countMiddleIcon = 1;
              } else if (countMiddleIcon === 1 && x === ctrl.ICON_X_MIDDLE_PX) {
                x = ctrl.ICON_X_RIGHT_PX;
                y += ctrl.ICON_Y_INCREMENT_PX;
                countMiddleIcon = 0;
              } else {
                x = ctrl.ICON_X_MIDDLE_PX;
                y += ctrl.ICON_Y_INCREMENT_PX;
              }
              iconParametersArray.push({
                thumbnailIconUrl:
                  storyNodes[i].getExplorationSummaryObject(
                  ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                left: x + 'px',
                top: y + 'px',
                thumbnailBgColor:
                  storyNodes[i].getExplorationSummaryObject(
                  ).thumbnail_bg_color
              });
            }
            return iconParametersArray;
          };

          ctrl.getExplorationUrl = function(node) {
            if (!ctrl.isNextPendingNode) {
              return null;
            }
            var result = '/explore/' + node.getExplorationId();
            result = UrlService.addField(
              result, 'story_id', UrlService.getStoryIdFromViewerUrl());
            result = UrlService.addField(
              result, 'node_id', ctrl.currentNodeId);
            return result;
          };

          ctrl.scrollToLocation = function(id) {
            $location.hash(id);
            $anchorScroll();
          };

          ctrl.closeOnClickingOutside = function() {
            ctrl.explorationCardIsShown = false;
          };

          ctrl.onClickStopPropagation = function($evt) {
            $evt.stopPropagation();
          };

          // Touching anywhere outside the mobile preview should hide it.
          document.addEventListener('touchstart', function() {
            if (ctrl.explorationCardIsShown === true) {
              ctrl.explorationCardIsShown = false;
            }
          });

          ctrl.generatePathParameters();
        }]
    };
  }
]);
