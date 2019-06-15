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
 * @fileoverview Controllers for the story viewer.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'pages/story-viewer-page/navbar-breadcrumb/' +
  'story-viewer-navbar-breadcrumb.directive.ts');

require('domain/story_viewer/StoryViewerBackendApiService.ts');
require('services/AlertsService.ts');
require('services/PageTitleService.ts');
require('services/contextual/UrlService.ts');

oppia.controller('StoryViewer', [
  '$rootScope', '$scope', '$window', 'AlertsService',
  'PageTitleService', 'StoryViewerBackendApiService',
  'UrlService', 'FATAL_ERROR_CODES',
  function(
      $rootScope, $scope, $window, AlertsService,
      PageTitleService, StoryViewerBackendApiService,
      UrlService, FATAL_ERROR_CODES) {
    $scope.checkMobileView = function() {
      return ($window.innerWidth < 500);
    };

    $rootScope.loadingMessage = 'Loading';
    var storyId = UrlService.getStoryIdFromViewerUrl();
    StoryViewerBackendApiService.fetchStoryData(storyId).then(
      function(storyDataDict) {
        PageTitleService.setPageTitle(storyDataDict.story_title + ' - Oppia');
        $scope.completedNodes = storyDataDict.completed_nodes;
        $scope.pendingNodes = storyDataDict.pending_nodes;
        $scope.storyTitle = storyDataDict.story_title;
        $rootScope.loadingMessage = '';
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          AlertsService.addWarning('Failed to get dashboard data');
        }
      }
    );
  }
]);
