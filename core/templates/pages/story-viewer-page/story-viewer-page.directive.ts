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
 * @fileoverview Directive for the main page of the story viewer.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');

require(
  'pages/story-viewer-page/navbar-breadcrumb/' +
  'story-viewer-navbar-breadcrumb.directive.ts');
require(
  'pages/story-viewer-page/navbar-pre-logo-action/' +
  'story-viewer-navbar-pre-logo-action.component.ts');

require('domain/story_viewer/StoryPlaythroughObjectFactory.ts');
require('domain/story_viewer/story-viewer-backend-api.service.ts');
require('services/alerts.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').directive('storyViewerPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-viewer-page/story-viewer-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$window', 'AlertsService',
        'PageTitleService', 'LoaderService', 'StoryPlaythroughObjectFactory',
        'StoryViewerBackendApiService', 'UrlService', 'FATAL_ERROR_CODES',
        function(
            $rootScope, $window, AlertsService,
            PageTitleService, LoaderService, StoryPlaythroughObjectFactory,
            StoryViewerBackendApiService, UrlService, FATAL_ERROR_CODES) {
          var ctrl = this;
          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          ctrl.showChapters = function() {
            if (!ctrl.storyPlaythroughObject) {
              return false;
            }
            return ctrl.storyPlaythroughObject.getStoryNodeCount() > 0;
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

            for (
              var i = 1; i < ctrl.storyPlaythroughObject.getStoryNodeCount();
              i++) {
              var thumbnailColor = null;

              if (!storyNodes[i].isCompleted() &&
                (storyNodes[i].getId() !==
                ctrl.storyPlaythroughObject.getNextPendingNodeId())) {
                let hexCode = storyNodes[i].getExplorationSummaryObject(
                ).thumbnail_bg_color;
                // Adds a 50% opacity to the color.
                // Changes the luminosity level of the faded color.
                // Signed value, negative => darker.
                let lum = 0.5;
                thumbnailColor = '#';

                let red = parseInt(hexCode.substring(1, 3), 16);
                thumbnailColor += Math.round(
                  Math.min(Math.max(0, red + (red * lum)), 255)).toString(16);

                let green = parseInt(hexCode.substring(3, 5), 16);
                thumbnailColor += Math.round(
                  Math.min(
                    Math.max(0, green + (green * lum)), 255)).toString(16);

                let blue = parseInt(hexCode.substring(5, 7), 16);
                thumbnailColor += Math.round(
                  Math.min(
                    Math.max(0, blue + (blue * lum)), 255)).toString(16);
              } else {
                thumbnailColor = storyNodes[i].getExplorationSummaryObject(
                ).thumbnail_bg_color;
              }
              iconParametersArray.push({
                thumbnailIconUrl:
                  storyNodes[i].getExplorationSummaryObject(
                  ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                thumbnailBgColor: thumbnailColor
              });
            }
            return iconParametersArray;
          };

          ctrl.getExplorationUrl = function(node) {
            var result = '/explore/' + node.getExplorationId();
            result = UrlService.addField(
              result, 'story_id', UrlService.getStoryIdFromViewerUrl());
            result = UrlService.addField(
              result, 'node_id', ctrl.currentNodeId);
            return result;
          };

          ctrl.$onInit = function() {
            ctrl.storyIsLoaded = false;
            LoaderService.showLoadingScreen('Loading');
            var storyId = UrlService.getStoryIdFromViewerUrl();
            StoryViewerBackendApiService.fetchStoryData(storyId).then(
              function(storyDataDict) {
                ctrl.storyIsLoaded = true;
                ctrl.storyPlaythroughObject =
                  StoryPlaythroughObjectFactory.createFromBackendDict(
                    storyDataDict);
                PageTitleService.setPageTitle(
                  storyDataDict.story_title + ' - Oppia');
                ctrl.storyTitle = storyDataDict.story_title;
                ctrl.storyDescription = storyDataDict.story_description;

                // Taking the characteristics of the first chapter as
                // placeholder to be displayed on the right, since all
                // explorations in the story should have the same category, and
                // hence the same characteristics.
                let firstChapterSummary =
                  ctrl.storyPlaythroughObject.getInitialNode().
                    getExplorationSummaryObject();
                ctrl.thumbnailBgColor = firstChapterSummary.thumbnail_bg_color;
                ctrl.thumbnailIconUrl = firstChapterSummary.thumbnail_icon_url;
                LoaderService.hideLoadingScreen();
                ctrl.pathIconParameters = ctrl.generatePathIconParameters();
                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the directive is migrated to angular
                $rootScope.$apply();
              },
              function(errorResponse) {
                if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                  AlertsService.addWarning('Failed to get dashboard data');
                }
              }
            );

            // The pathIconParameters is an array containing the co-ordinates,
            // background color and icon url for the icons generated on the
            // path.
            ctrl.pathIconParameters = [];
          };
        }
      ]
    };
  }]);
