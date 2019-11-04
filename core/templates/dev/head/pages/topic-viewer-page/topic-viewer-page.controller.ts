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
 * @fileoverview Directive for the topic viewer.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require('components/skills-mastery-list/skills-mastery-list.directive.ts');
require(
  'pages/topic-viewer-page/stories-list/' +
  'topic-viewer-stories-list.directive.ts');
require('pages/topic-viewer-page/subtopics-list/subtopics-list.directive.ts');
require('pages/topic-viewer-page/practice-tab/practice-tab.directive.ts');
require('domain/topic_viewer/topic-viewer-backend-api.service.ts');
require('services/alerts.service.ts');
require('services/page-title.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('topicViewerPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/topic-viewer-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$window', 'AlertsService',
        'PageTitleService', 'TopicViewerBackendApiService',
        'UrlService', 'WindowDimensionsService', 'FATAL_ERROR_CODES',
        function(
            $rootScope, $window, AlertsService,
            PageTitleService, TopicViewerBackendApiService,
            UrlService, WindowDimensionsService, FATAL_ERROR_CODES) {
          var ctrl = this;
          ctrl.setActiveTab = function(newActiveTabName) {
            ctrl.activeTab = newActiveTabName;
          };
          ctrl.setActiveTab('story');

          ctrl.checkMobileView = function() {
            return (WindowDimensionsService.getWidth() < 500);
          };
          ctrl.topicName = UrlService.getTopicNameFromLearnerUrl();

          PageTitleService.setPageTitle(ctrl.topicName + ' - Oppia');

          $rootScope.loadingMessage = 'Loading';
          TopicViewerBackendApiService.fetchTopicData(ctrl.topicName).then(
            function(topicDataDict) {
              ctrl.topicId = topicDataDict.topic_id;
              ctrl.canonicalStoriesList = topicDataDict.canonical_story_dicts;
              ctrl.degreesOfMastery = topicDataDict.degrees_of_mastery;
              ctrl.skillDescriptions = topicDataDict.skill_descriptions;
              ctrl.subtopics = topicDataDict.subtopics;
              $rootScope.loadingMessage = '';
              ctrl.topicId = topicDataDict.id;
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
