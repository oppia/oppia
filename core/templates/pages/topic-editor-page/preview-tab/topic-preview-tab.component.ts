// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the topic preview tab.
 */

require('components/summary-tile/subtopic-summary-tile.directive.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-viewer-page/subtopics-list/subtopics-list.component.ts');
require(
  'pages/topic-viewer-page/stories-list/' +
    'topic-viewer-stories-list.component.ts');
require('pages/topic-viewer-page/practice-tab/practice-tab.component.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'components/common-layout-directives/common-elements/' +
    'background-banner.component.ts');

angular.module('oppia').component('topicPreviewTab', {
  template: require('./topic-preview-tab.component.html'),
  controllerAs: '$ctrl',
  controller: ['TopicEditorStateService', 'UrlInterpolationService',
    function(TopicEditorStateService, UrlInterpolationService) {
      var ctrl = this;
      var TAB_STORY = 'story';
      var TAB_SUBTOPIC = 'subtopic';
      var TAB_PRACTICE = 'practice';
      ctrl.$onInit = function() {
        ctrl.topic = TopicEditorStateService.getTopic();
        ctrl.topicName = ctrl.topic.getName();
        ctrl.subtopics = ctrl.topic.getSubtopics();
        ctrl.activeTab = TAB_STORY;
        ctrl.canonicalStorySummaries = (
          TopicEditorStateService.getCanonicalStorySummaries());
        ctrl.chapterCount = 0;
        for (var idx in ctrl.canonicalStorySummaries) {
          ctrl.chapterCount += (
            ctrl.canonicalStorySummaries[idx].getNodeTitles().length);
        }
      };
      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };
      ctrl.changePreviewTab = function(tabName) {
        switch (tabName) {
          case TAB_STORY: ctrl.activeTab = TAB_STORY; break;
          case TAB_SUBTOPIC: ctrl.activeTab = TAB_SUBTOPIC; break;
          case TAB_PRACTICE: ctrl.activeTab = TAB_PRACTICE; break;
        }
      };
    }
  ]
});
