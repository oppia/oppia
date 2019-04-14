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

oppia.factory('TopicEditorRoutingService', [
  '$interval', '$location', '$rootScope', '$timeout', '$window',
  function(
      $interval, $location, $rootScope, $timeout, $window) {
    var MAIN_TAB = 'main';
    var SUBTOPICS_TAB = 'subtopics';
    var QUESTIONS_TAB = 'questions';

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
      } else if (newPath === '/subtopics') {
        activeTabName = SUBTOPICS_TAB;
      } else if (newPath === '/questions') {
        activeTabName = QUESTIONS_TAB;
      }
    });

    var TopicEditorRouterService = {
      getActiveTabName: function() {
        return activeTabName;
      },
      navigateToMainTab: function() {
        $location.path('');
      },
      navigateToSubtopicsTab: function() {
        $location.path('/subtopics');
      },
      navigateToQuestionsTab: function() {
        $location.path('/questions');
      }
    };

    return TopicEditorRouterService;
  }
]);
