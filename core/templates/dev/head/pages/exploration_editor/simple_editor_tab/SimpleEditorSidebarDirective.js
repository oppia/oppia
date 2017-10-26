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

oppia.directive('simpleEditorSidebar', [
  '$document', 'QuestionIdService', 'UrlInterpolationService',
  function($document, QuestionIdService, UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/simple_editor_tab/' +
        'simple_editor_sidebar_directive.html'),
      controller: [
        '$scope', 'EditorModeService', 'QuestionIdService',
        'ScrollSyncService', 'SimpleEditorManagerService',
        'SimpleEditorSidebarModeService', 'StatesToQuestionsService',
        function(
          $scope, EditorModeService, QuestionIdService,
          ScrollSyncService, SimpleEditorManagerService,
          SimpleEditorSidebarModeService, StatesToQuestionsService) {
          /* This initializes Perfect Scrollbar on the simple editor sidebar.
           Perfect scrollbar is needed to show scrollbar on all major browsers.
           */

          $scope.getHumanReadableQuestionType = (
            StatesToQuestionsService.getHumanReadableQuestionType);
          var container = document.querySelector('simple-editor-sidebar');
          Ps.initialize(container);
          $scope.SUBFIELD_LABELS = [
            'Correct answer', 'Hints', 'Bridge text'];
          $scope.questionList = SimpleEditorManagerService.getQuestionList();
          $scope.ID_PREFIX = QuestionIdService.SIDEBAR_PREFIX;
          $scope.sidebarModeService = SimpleEditorSidebarModeService;

          $scope.canAddNewQuestion = (
            SimpleEditorManagerService.canAddNewQuestion);

          $scope.getSubfieldId = function(question, label) {
            return QuestionIdService.getSubfieldId(question.getId(), label);
          };

          $scope.addNewQuestion = function() {
            if (!SimpleEditorManagerService.canAddNewQuestion()) {
              return;
            }
            $scope.sidebarModeService.setModeToReadonly();
            var secondLastQuestion = $scope.questionList.getLastQuestion();
            SimpleEditorManagerService.addNewQuestion();
            $timeout(function() {
              ScrollSyncService.scrollTo(
                $scope.getSubfieldId(secondLastQuestion, 'Bridge text'));
              container.scrollTop = container.scrollHeight;
              Ps.update(container);
            }, 0);
          };

          $scope.getSidebarItemId = function(question, subfieldLabel) {
            return QuestionIdService.getSidebarItemId(
              question.getId(), subfieldLabel
            );
          };
          $scope._questions = $scope.questionList.getBindableQuestions();
          $scope.SIDEBAR_SORTABLE_OPTIONS = {
            axis: 'y',
            cursor: 'move',
            containment: 'parent',
            tolerance: 'pointer',
            revert: 100,
            start: function(e, ui) {
              ui.placeholder.height(ui.item.height());
              // This class is to be added, but it is giving strange behaviour.
              // ui.item.addClass('selected');
            },
            update: function(e, ui) {
              SimpleEditorManagerService.sortQuestions(
                ui.item.sortable.index, ui.item.sortable.dropindex);
            },
            stop: function() {
              // ui.item.removeClass('selected');
            }
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

          $scope.deleteQuestion = function(question) {
            var lastQuestionBeforeDel = $scope.questionList.getLastQuestion();
            SimpleEditorManagerService.deleteQuestion(question);
            if (question.getId() === lastQuestionBeforeDel.getId()) {
              var end = $scope.questionList.isEmpty() ?
                'intro' : $scope.questionList.getLastQuestion().getId();
              ScrollSyncService.scrollTo(end);
            }
          };
        }
      ]
    };
  }
]);
