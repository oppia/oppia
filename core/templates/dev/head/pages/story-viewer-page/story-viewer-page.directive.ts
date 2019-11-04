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
  'background-banner.directive.ts');
require(
  'pages/story-viewer-page/navbar-breadcrumb/' +
  'story-viewer-navbar-breadcrumb.directive.ts');
require(
  'pages/story-viewer-page/chapters-list/' +
  'story-viewer-chapters-list.directive.ts');

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
        'PageTitleService', 'StoryPlaythroughObjectFactory',
        'StoryViewerBackendApiService', 'UrlService', 'FATAL_ERROR_CODES',
        function(
            $rootScope, $window, AlertsService,
            PageTitleService, StoryPlaythroughObjectFactory,
            StoryViewerBackendApiService, UrlService, FATAL_ERROR_CODES) {
          var ctrl = this;
          ctrl.checkMobileView = function() {
            return ($window.innerWidth < 500);
          };
          ctrl.storyIsLoaded = false;
          $rootScope.loadingMessage = 'Loading';
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
              $rootScope.loadingMessage = '';
            },
            function(errorResponse) {
              if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                AlertsService.addWarning('Failed to get dashboard data');
              }
            }
          );
        }
      ]
    };
  }]);
