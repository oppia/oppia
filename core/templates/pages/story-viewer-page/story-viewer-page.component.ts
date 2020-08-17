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

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

/**
 * @fileoverview Component for the main page of the story viewer.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');

require(
  'pages/story-viewer-page/navbar-breadcrumb/' +
  'story-viewer-navbar-breadcrumb.directive.ts');
require(
  'pages/story-viewer-page/navbar-pre-logo-action/' +
  'story-viewer-navbar-pre-logo-action.component.ts');

require('domain/story_viewer/StoryPlaythroughObjectFactory.ts');
require('domain/story_viewer/story-viewer-backend-api.service.ts');
require('services/alerts.service.ts');
require('services/assets-backend-api.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').component('storyViewerPage', {
  template: require('./story-viewer-page.component.html'),
  controller: [
    '$rootScope', 'AlertsService', 'AssetsBackendApiService',
    'PageTitleService', 'LoaderService',
    'UrlInterpolationService', 'UrlService', 'ENTITY_TYPE',
    'FATAL_ERROR_CODES',
    function(
        $rootScope, AlertsService, AssetsBackendApiService,
        PageTitleService, LoaderService,
        UrlInterpolationService, UrlService, ENTITY_TYPE,
        FATAL_ERROR_CODES) {
      var ctrl = this;

      ctrl.storyViewerBackendApiService = (
        OppiaAngularRootComponent.storyViewerBackendApiService);

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
          thumbnailIconUrl: (
            AssetsBackendApiService.getThumbnailUrlForPreview(
              ENTITY_TYPE.STORY, ctrl.storyId,
              storyNodes[0].getThumbnailFilename())),
          left: '225px',
          top: '35px',
          thumbnailBgColor: storyNodes[0].getThumbnailBgColor()
        });

        for (
          var i = 1; i < ctrl.storyPlaythroughObject.getStoryNodeCount();
          i++) {
          iconParametersArray.push({
            thumbnailIconUrl: (
              AssetsBackendApiService.getThumbnailUrlForPreview(
                ENTITY_TYPE.STORY, ctrl.storyId,
                storyNodes[i].getThumbnailFilename())),
            thumbnailBgColor: storyNodes[i].getThumbnailBgColor()
          });
        }
        return iconParametersArray;
      };

      ctrl.isChapterLocked = function(node) {
        if (
          node.isCompleted() || (
            node.getId() ===
            ctrl.storyPlaythroughObject.getNextPendingNodeId())) {
          return false;
        }
        return true;
      };

      ctrl.getExplorationUrl = function(node) {
        var result = '/explore/' + node.getExplorationId();
        result = UrlService.addField(
          result, 'topic_url_fragment',
          UrlService.getTopicUrlFragmentFromLearnerUrl());
        result = UrlService.addField(
          result, 'classroom_url_fragment',
          UrlService.getClassroomUrlFragmentFromLearnerUrl());
        result = UrlService.addField(
          result, 'story_url_fragment',
          UrlService.getStoryUrlFragmentFromLearnerUrl());
        result = UrlService.addField(
          result, 'node_id', node.getId());
        return result;
      };

      ctrl.$onInit = function() {
        ctrl.storyIsLoaded = false;
        LoaderService.showLoadingScreen('Loading');
        var topicUrlFragment = (
          UrlService.getTopicUrlFragmentFromLearnerUrl());
        var classroomUrlFragment = (
          UrlService.getClassroomUrlFragmentFromLearnerUrl());
        var storyUrlFragment = (
          UrlService.getStoryUrlFragmentFromLearnerUrl());
        ctrl.storyViewerBackendApiService.fetchStoryData(
          topicUrlFragment,
          classroomUrlFragment,
          storyUrlFragment).then(
          function(storyDataDict) {
            ctrl.storyIsLoaded = true;
            ctrl.storyPlaythroughObject = storyDataDict;
            ctrl.storyId = ctrl.storyPlaythroughObject.getStoryId();
            PageTitleService.setPageTitle(
              storyDataDict.title + ' - Oppia');
            ctrl.storyTitle = storyDataDict.title;
            ctrl.storyDescription = storyDataDict.description;

            $rootScope.$broadcast('storyData', {
              topicName: ctrl.storyPlaythroughObject.topicName,
              storyTitle: ctrl.storyTitle
            });

            LoaderService.hideLoadingScreen();
            ctrl.pathIconParameters = ctrl.generatePathIconParameters();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the directive is migrated to angular.
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
});
