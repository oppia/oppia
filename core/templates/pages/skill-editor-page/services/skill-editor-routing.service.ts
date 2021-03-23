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
 * @fileoverview Service that handles routing for the skill editor page.
 */

angular.module('oppia').factory('SkillEditorRoutingService', [
  '$location', '$rootScope',
  function(
      $location, $rootScope) {
    var MAIN_TAB = 'main';
    var QUESTIONS_TAB = 'questions';
    var PREVIEW_TAB = 'preview';
    var activeTab = MAIN_TAB;
    var ctrl = this;
    ctrl.questionIsBeingCreated = false;
    // When the URL path changes, reroute to the appropriate tab in the
    // skill editor page.
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
        activeTab = MAIN_TAB;
      } else if (newPath === '/questions') {
        activeTab = QUESTIONS_TAB;
      } else if (newPath === '/preview') {
        activeTab = PREVIEW_TAB;
      }
    });

    var SkillEditorRouterService = {
      getActiveTabName: function() {
        return activeTab;
      },
      getTabStatuses: function() {
        return activeTab;
      },
      navigateToMainTab: function() {
        $location.path('');
      },
      navigateToQuestionsTab: function() {
        $location.path('/questions');
      },
      navigateToPreviewTab: function() {
        $location.path('/preview');
      },
      // To navigate directly to question-editor interface
      // from skill editor page.
      creatingNewQuestion: function(editorIsOpen: boolean) {
        if (editorIsOpen) {
          ctrl.questionIsBeingCreated = true;
        } else {
          ctrl.questionIsBeingCreated = false;
        }
      },
      navigateToQuestionEditor: function() {
        return ctrl.questionIsBeingCreated;
      },
    };

    return SkillEditorRouterService;
  }
]);
