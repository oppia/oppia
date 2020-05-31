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
 * @fileoverview Component for the topic viewer.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/skills-mastery-list/skills-mastery-list.directive.ts');
require(
  'pages/topic-viewer-page/stories-list/' +
  'topic-viewer-stories-list.directive.ts');
require('pages/topic-viewer-page/subtopics-list/subtopics-list.directive.ts');
require('pages/topic-viewer-page/practice-tab/practice-tab.directive.ts');

angular.module('oppia').component('topicViewerPage', {
  template: require('./topic-viewer-page.component.html'),
  controller: [
    '$rootScope', 'AlertsService', 'LoaderService',
    'PageTitleService', 'TopicViewerBackendApiService',
    'UrlService', 'WindowDimensionsService', 'FATAL_ERROR_CODES',
    function(
        $rootScope, AlertsService, LoaderService,
        PageTitleService, TopicViewerBackendApiService,
        UrlService, WindowDimensionsService, FATAL_ERROR_CODES) {
      var ctrl = this;
      ctrl.setActiveTab = function(newActiveTabName) {
        ctrl.activeTab = newActiveTabName;
      };
      ctrl.checkMobileView = function() {
        return (WindowDimensionsService.getWidth() < 500);
      };
      ctrl.$onInit = function() {
        ctrl.canonicalStoriesList = [];
        ctrl.setActiveTab('story');
        ctrl.topicName = UrlService.getTopicNameFromLearnerUrl();

        PageTitleService.setPageTitle(ctrl.topicName + ' - Oppia');

        LoaderService.showLoadingScreen('Loading');
        TopicViewerBackendApiService.fetchTopicData(ctrl.topicName).then(
          function(readOnlyTopic) {
            ctrl.topicId = readOnlyTopic.getTopicId();
            ctrl.canonicalStoriesList = (
              readOnlyTopic.getCanonicalStorySummaries());
            ctrl.degreesOfMastery = readOnlyTopic.getDegreesOfMastery();
            ctrl.subtopics = readOnlyTopic.getSubtopics();
            ctrl.skillDescriptions = readOnlyTopic.getSkillDescriptions();
            LoaderService.hideLoadingScreen();
            ctrl.trainTabShouldBeDisplayed = (
              readOnlyTopic.getTrainTabShouldBeDisplayed());
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$apply();
          },
          function(errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
              AlertsService.addWarning('Failed to get dashboard data');
            }
          }
        );
      };
    }
  ]
});
