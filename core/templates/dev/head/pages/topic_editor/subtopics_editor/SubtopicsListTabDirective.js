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
 * @fileoverview Controller for the subtopics list editor.
 */

oppia.directive('subtopicsListTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/subtopics_editor/' +
        'subtopics_list_tab_directive.html'),
      controller: [
        '$scope', '$uibModal', 'TopicEditorStateService', 'TopicUpdateService',
        'UndoRedoService', 'SubtopicPageObjectFactory',
        'EVENT_TOPIC_REINITIALIZED', 'EVENT_TOPIC_INITIALIZED',
        'EVENT_SUBTOPIC_PAGE_LOADED',
        function(
            $scope, $uibModal, TopicEditorStateService, TopicUpdateService,
            UndoRedoService, SubtopicPageObjectFactory,
            EVENT_TOPIC_REINITIALIZED, EVENT_TOPIC_INITIALIZED,
            EVENT_SUBTOPIC_PAGE_LOADED) {
          // The subtopic preview/editor would be hidden until a subtopic is
          // clicked.
          $scope.subtopicDisplayed = false;
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.subtopics = $scope.topic.getSubtopics();
            $scope.subtopicEditorIsShown = false;
          };

          $scope.SUBTOPIC_PAGE_SCHEMA = {
            type: 'html',
            ui_config: {
              rows: 100
            }
          };

          $scope.SUBTOPIC_HEADINGS = ['title', 'skills'];

          $scope.isSubtopicEditorDisplayed = function(subtopic) {
            return (
              $scope.subtopicIndexToDisplay ===
              $scope.subtopics.indexOf(subtopic));
          };

          $scope.setSubtopic = function(subtopic) {
            $scope.subtopicIndexToDisplay = $scope.subtopics.indexOf(subtopic);
            $scope.editableTitle = subtopic.getTitle();
            TopicEditorStateService.loadSubtopicPage(
              $scope.topic.getId(), subtopic.getId());
          };

          $scope.$on(EVENT_SUBTOPIC_PAGE_LOADED, function() {
            $scope.subtopicPage = TopicEditorStateService.getSubtopicPage();
            $scope.subtopicDisplayed = true;
            $scope.subtopicEditorIsShown = false;
            $scope.htmlData = $scope.subtopicPage.getHtmlData();
          });

          $scope.openSubtopicTitleEditor = function() {
            $scope.subtopicTitleEditorIsShown = true;
          };

          $scope.closeSubtopicTitleEditor = function() {
            $scope.subtopicTitleEditorIsShown = false;
          };

          $scope.openPreviewSubtopicPage = function(htmlData) {
            $scope.subtopicEditorIsShown = false;
            $scope.htmlData = htmlData;
          };

          $scope.closePreviewSubtopicPage = function(previewHtmlData) {
            $scope.subtopicEditorIsShown = true;
            $scope.editableHtmlData = previewHtmlData;
          };

          $scope.deleteSubtopic = function(subtopic) {
            if ($scope.subtopicIndexToDisplay ===
                $scope.subtopics.indexOf(subtopic)) {
              $scope.subtopicDisplayed = false;
            }
            TopicEditorStateService.deleteSubtopicPage(
              $scope.topic.getId(), subtopic.getId());
            TopicUpdateService.deleteSubtopic($scope.topic, subtopic.getId());
            _initEditor();
          };

          $scope.updateSubtopicTitle = function(subtopic, newTitle) {
            TopicUpdateService.setSubtopicTitle(
              $scope.topic, subtopic.getId(), newTitle);
            $scope.closeSubtopicTitleEditor();
            _initEditor();
          };

          $scope.updateHtmlData = function(subtopicId, newHtmlData) {
            if (newHtmlData === $scope.subtopicPage.getHtmlData()) {
              return;
            }
            TopicUpdateService.setSubtopicPageHtmlData(
              $scope.subtopicPage, subtopicId, newHtmlData);
            TopicEditorStateService.setSubtopicPage($scope.subtopicPage);
            $scope.openPreviewSubtopicPage(newHtmlData);
          };

          $scope.createSubtopic = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/subtopics_editor/' +
                'new_subtopic_title_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.subtopicTitle = '';
                  $scope.isSubtopicTitleEmpty = function(subtopicTitle) {
                    return (subtopicTitle === '');
                  };
                  $scope.save = function(title) {
                    $uibModalInstance.close(title);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(title) {
              var subtopicPage = SubtopicPageObjectFactory.createDefault(
                $scope.topic.getId(), $scope.topic.getNextSubtopicId());
              TopicEditorStateService.setSubtopicPage(subtopicPage);
              TopicUpdateService.addSubtopic($scope.topic, title);
              _initEditor();
              // Open the editor for the newly created subtopic page.
              $scope.setSubtopic($scope.topic.getSubtopics().slice(-1)[0]);
            });
          };

          $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);

          _initEditor();
        }
      ]
    };
  }]);
