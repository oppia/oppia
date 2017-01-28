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
        'ScrollSyncService', 'QuestionIdService',
        function($scope, EditorModeService, SimpleEditorManagerService,
                 ScrollSyncService, QuestionIdService) {
      $scope.SUBFIELD_LABELS = [
        'Multiple choice', 'Correct answer', 'Hints', 'Bridge text'];
      $scope.setEditorModeToFull = EditorModeService.setModeToFull;
      $scope.questionList = SimpleEditorManagerService.getQuestionList();
      $scope.ID_PREFIX = QuestionIdService.SIDEBAR_PREFIX;
      $scope.getSidebarItemId = function(question, subfieldLabel) {
        return QuestionIdService.getSidebarItemId(
          question.getId(), subfieldLabel
        );
      };
      $scope.scrollToField = function(question, subfieldLabel) {
        ScrollSyncService.scrollTo(
          QuestionIdService.getSubfieldId(
            question.getId(), subfieldLabel
          )
        );
      };
      $scope.scrollToHeader = ScrollSyncService.scrollTo;
      $scope.scrollToQuestion = function(question) {
        ScrollSyncService.scrollTo(question.getId());
      };
      $scope.$on('SimpleEditorSidebarToggleCollapse', function() {
        $scope.$apply();
      });
    }]
  };
}]);
