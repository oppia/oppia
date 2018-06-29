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
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.subtopics = $scope.topic.getSubtopics();
            $scope.subtopicEditorIsShown = false;
            $scope.uncategorizedSkillIds =
              $scope.topic.getUncategorizedSkillIds();
            $scope.uncategorizedSkillDescriptions =
              $scope.topic.getUncategorizedSkillDescriptions();
          };

          $scope.editSubtopic = function(subtopic) {
            var editableTitle = subtopic.getTitle();
            TopicEditorStateService.loadSubtopicPage(
              $scope.topic.getId(), subtopic.getId());
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/subtopics_editor/' +
                'subtopic_editor_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.subtopicId = subtopic.getId();
                  $scope.editableTitle = editableTitle;
                  $scope.subtopicPage =
                    TopicEditorStateService.getSubtopicPage();
                  $scope.htmlData = $scope.subtopicPage.getHtmlData();
                  $scope.$on(EVENT_SUBTOPIC_PAGE_LOADED, function() {
                    $scope.subtopicPage =
                      TopicEditorStateService.getSubtopicPage();
                    $scope.htmlData = $scope.subtopicPage.getHtmlData();
                  });
                  $scope.SUBTOPIC_PAGE_SCHEMA = {
                    type: 'html',
                    ui_config: {
                      rows: 100
                    }
                  };

                  $scope.updateSubtopicTitle = function(title) {
                    $scope.editableTitle = title;
                    $scope.closeSubtopicTitleEditor();
                  };

                  $scope.updateHtmlData = function(htmlData) {
                    $scope.htmlData = htmlData;
                    $scope.openPreviewSubtopicPage(htmlData);
                  };

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
                    $scope.htmlData = previewHtmlData;
                  };

                  $scope.save = function() {
                    $uibModalInstance.close({
                      newTitle: $scope.editableTitle,
                      newHtmlData: $scope.htmlData
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(newValues) {
              $scope.subtopicPage = TopicEditorStateService.getSubtopicPage();
              var newTitle = newValues.newTitle;
              var newHtmlData = newValues.newHtmlData;

              if ((newTitle !== subtopic.getTitle()) && (newTitle !== '')) {
                TopicUpdateService.setSubtopicTitle(
                  $scope.topic, subtopic.getId(), newTitle);
              }
              if (newHtmlData !== $scope.subtopicPage.getHtmlData()) {
                TopicUpdateService.setSubtopicPageHtmlData(
                  $scope.subtopicPage, subtopic.getId(), newHtmlData);
                TopicEditorStateService.setSubtopicPage($scope.subtopicPage);
              }
            });
          };

          $scope.startMoveSkill = function(oldSubtopicIndex, index) {
            if (oldSubtopicIndex === null) {
              $scope.skillIdToMove = $scope.uncategorizedSkillIds[index];
              $scope.skillDescriptionToMove =
                $scope.uncategorizedSkillDescriptions[index];
              $scope.oldSubtopicId = null;
            } else {
              $scope.skillIdToMove =
                $scope.subtopics[oldSubtopicIndex].getSkillIds()[index];
              $scope.skillDescriptionToMove =
                $scope.subtopics[
                  oldSubtopicIndex].getSkillDescriptions()[index];
              $scope.oldSubtopicId = $scope.subtopics[oldSubtopicIndex].getId();
            }
          };

          $scope.endMoveSkill = function(newSubtopicId) {
            if (newSubtopicId === $scope.oldSubtopicId) {
              return;
            }

            if (newSubtopicId === null) {
              TopicUpdateService.removeSkillFromSubtopic(
                $scope.topic, $scope.oldSubtopicId, $scope.skillIdToMove,
                $scope.skillDescriptionToMove);
            } else {
              TopicUpdateService.moveSkillToSubtopic(
                $scope.topic, $scope.oldSubtopicId, newSubtopicId,
                $scope.skillIdToMove, $scope.skillDescriptionToMove);
            }
            _initEditor();
          };

          $scope.deleteSubtopic = function(subtopic) {
            TopicEditorStateService.deleteSubtopicPage(
              $scope.topic.getId(), subtopic.getId());
            TopicUpdateService.deleteSubtopic($scope.topic, subtopic.getId());
            _initEditor();
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
            });
          };

          $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);

          _initEditor();
        }
      ]
    };
  }]);
