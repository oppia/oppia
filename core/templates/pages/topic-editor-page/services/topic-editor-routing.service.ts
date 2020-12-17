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
 * @fileoverview Service that handles routing for the topic editor page.
 */
require('domain/utilities/url-interpolation.service.ts');
require('services/page-title.service.ts');


angular.module('oppia').factory('TopicEditorRoutingService', [
  '$location', '$rootScope', '$window', 'PageTitleService',
  'UrlInterpolationService',
  function(
      $location, $rootScope, $window, PageTitleService,
      UrlInterpolationService) {
    var MAIN_TAB = 'main';
    var SUBTOPIC_EDITOR_TAB = 'subtopic_editor';
    var SUBTOPIC_PREVIEW_TAB = 'subtopic_preview';
    var TOPIC_PREVIEW_TAB = 'topic_preview';
    var QUESTIONS_TAB = 'questions';
    var lastTabVisited = 'main';
    var lastSubtopicId = null;

    var activeTabName = MAIN_TAB;

    // When the URL path changes, reroute to the appropriate tab in the
    // topic editor page.
    $rootScope.$watch(function() {
      return $location.path();
    }, function(newPath, oldPath) {
      if (newPath === '') {
        $location.path(oldPath);
        return;
      }
      if (!oldPath) {
        // This can happen when clicking on links whose href is "#".
        return;
      }

      if (newPath === '/') {
        activeTabName = MAIN_TAB;
      } else if (newPath === '/questions') {
        activeTabName = QUESTIONS_TAB;
      } else if (newPath.startsWith('/subtopic_editor')) {
        activeTabName = SUBTOPIC_EDITOR_TAB;
      } else if (newPath.startsWith('/subtopic_preview')) {
        activeTabName = SUBTOPIC_PREVIEW_TAB;
      } else if (newPath.startsWith('/topic_preview')) {
        activeTabName = TOPIC_PREVIEW_TAB;
      }
    });

    var TopicEditorRouterService = {
      getActiveTabName: function() {
        return activeTabName;
      },
      getLastTabVisited: function() {
        return lastTabVisited;
      },
      getLastSubtopicIdVisited: function() {
        return lastSubtopicId;
      },
      navigateToMainTab: function() {
        lastTabVisited = 'topic';
        PageTitleService.setPageTitleForMobileView('Topic Editor');
        $location.path('');
      },
      navigateToSubtopicPreviewTab: function(subtopicId) {
        lastTabVisited = 'subtopic';
        PageTitleService.setPageTitleForMobileView('Subtopic Preview');
        $location.path('/subtopic_preview/' + subtopicId);
      },
      navigateToTopicPreviewTab: function() {
        lastTabVisited = 'topic';
        PageTitleService.setPageTitleForMobileView('Topic Preview');
        $location.path('/topic_preview/');
      },
      navigateToSubtopicEditorWithId: function(subtopicId) {
        lastTabVisited = 'subtopic';
        PageTitleService.setPageTitleForMobileView('Subtopic Editor');
        $location.path('/subtopic_editor/' + subtopicId);
      },
      navigateToQuestionsTab: function() {
        lastSubtopicId = this.getSubtopicIdFromUrl();
        PageTitleService.setPageTitleForMobileView('Question Editor');
        $location.path('/questions');
      },
      getSubtopicIdFromUrl: function() {
        return parseInt($location.path().split('/')[2]);
      },
      navigateToSkillEditorWithId: function(skillId) {
        var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skill_id>';

        var skillEditorUrl = UrlInterpolationService.interpolateUrl(
          SKILL_EDITOR_URL_TEMPLATE, {
            skill_id: skillId
          });
        $window.open(skillEditorUrl);
      }
    };

    return TopicEditorRouterService;
  }
]);
