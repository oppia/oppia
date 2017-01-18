// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the sidebar of the simple editor.
 */

oppia.directive('simpleEditorSidebar', [function() {
  return {
    restrict: 'E',
    templateUrl: 'simpleEditor/sidebar',
    controller: [
       '$scope', 'EditorModeService', 'SimpleEditorManagerService',
        'ScrollSyncService', 'QuestionHashService',
        function($scope, EditorModeService, SimpleEditorManagerService,
                 ScrollSyncService, QuestionHashService) {
      $scope.SUBFIELD_LABELS = [
        'Multiple choice', 'Correct answer', 'Hints', 'Bridge text'];
      $scope.setEditorModeToFull = EditorModeService.setModeToFull;
      $scope.questionList = SimpleEditorManagerService.getQuestionList();
      $scope.getSidebarItemHash = function(question, subfieldLabel) {
        return QuestionHashService.getSidebarItemHash(
          question.getStateName(), subfieldLabel
        );
      };
      $scope.scrollToField = function(question, subfieldLabel) {
        ScrollSyncService.scrollTo(
          QuestionHashService.getSubfieldHash(
            question.getStateName(), subfieldLabel
          )
        );
      };
      $scope.scrollToHeader = ScrollSyncService.scrollTo;
      $scope.toggleCollapse = function(question) {
        question.collapsed = !question.collapsed;
      };
      $scope.$on('SimpleEditorSidebarToggleCollapse', function(evt, question) {
        $scope.toggleCollapse(question);
        $scope.$apply();
      });
      $scope.isCollapsed = function(question) {
        return question.collapsed;
      };
    }]
  };
}]);
