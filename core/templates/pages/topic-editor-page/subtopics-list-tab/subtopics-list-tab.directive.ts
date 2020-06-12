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
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
  'new-subtopic-title-modal.controller.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
  'subtopic-editor-modal.controller.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/SubtopicPageObjectFactory.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');

angular.module('oppia').directive('subtopicsListTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/subtopics-list-tab/' +
        'subtopics-list-tab.directive.html'),
      controller: [
        '$scope', '$uibModal', 'TopicEditorStateService', 'TopicUpdateService',
        'UndoRedoService', 'SubtopicPageObjectFactory',
        'UrlInterpolationService', 'EVENT_TOPIC_REINITIALIZED',
        'EVENT_TOPIC_INITIALIZED', 'EVENT_SUBTOPIC_PAGE_LOADED',
        'MAX_CHARS_IN_SUBTOPIC_TITLE',
        function(
            $scope, $uibModal, TopicEditorStateService, TopicUpdateService,
            UndoRedoService, SubtopicPageObjectFactory,
            UrlInterpolationService, EVENT_TOPIC_REINITIALIZED,
            EVENT_TOPIC_INITIALIZED, EVENT_SUBTOPIC_PAGE_LOADED,
            MAX_CHARS_IN_SUBTOPIC_TITLE) {
          var ctrl = this;
          var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.subtopics = $scope.topic.getSubtopics();
            $scope.subtopicTitles = [];
            $scope.subtopics.forEach(
              function(subtopic) {
                return $scope.subtopicTitles.push(subtopic.getTitle());
              });
            $scope.uncategorizedSkillSummaries =
              $scope.topic.getUncategorizedSkillSummaries();
          };

          $scope.editSubtopic = function(subtopic) {
            var editableTitle = subtopic.getTitle();
            var editableThumbnailFilename = subtopic.getThumbnailFilename();
            var editableThumbnailBgColor = subtopic.getThumbnailBgColor();
            TopicEditorStateService.loadSubtopicPage(
              $scope.topic.getId(), subtopic.getId());
            var subtopicTitles = $scope.subtopicTitles;
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'subtopic-editor-modal.template.html'),
              backdrop: true,
              resolve: {
                editableThumbnailBgColor: () => editableThumbnailBgColor,
                editableThumbnailFilename: () => editableThumbnailFilename,
                editableTitle: () => editableTitle,
                subtopic: () => subtopic,
                subtopicTitles: () => subtopicTitles,
              },
              controller: 'SubtopicEditorModalController'
            });

            modalInstance.result.then(function(newValues) {
              $scope.subtopicPage = TopicEditorStateService.getSubtopicPage();
              var newTitle = newValues.newTitle;
              var newHtmlData = newValues.newHtmlData;
              var newThumbnailFilename = newValues.newThumbnailFilename;
              var newThumbnailBgColor = newValues.newThumbnailBgColor;

              if (newTitle !== subtopic.getTitle()) {
                TopicUpdateService.setSubtopicTitle(
                  $scope.topic, subtopic.getId(), newTitle);
              }
              if (newHtmlData !==
                    $scope.subtopicPage.getPageContents().getHtml()) {
                var subtitledHtml = angular.copy(
                  $scope.subtopicPage.getPageContents().getSubtitledHtml());
                subtitledHtml.setHtml(newHtmlData);
                TopicUpdateService.setSubtopicPageContentsHtml(
                  $scope.subtopicPage, subtopic.getId(), subtitledHtml);
                TopicEditorStateService.setSubtopicPage($scope.subtopicPage);
              }
              if (newThumbnailFilename !== subtopic.getThumbnailFilename()) {
                TopicUpdateService.setSubtopicThumbnailFilename(
                  $scope.topic, subtopic.getId(), newThumbnailFilename);
              }
              if (newThumbnailBgColor !== subtopic.getThumbnailBgColor()) {
                TopicUpdateService.setSubtopicThumbnailBgColor(
                  $scope.topic, subtopic.getId(), newThumbnailBgColor);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.isSkillDeleted = function(skillSummary) {
            return skillSummary.getDescription() === null;
          };

          $scope.getSkillEditorUrl = function(skillId) {
            return UrlInterpolationService.interpolateUrl(
              SKILL_EDITOR_URL_TEMPLATE, {
                skillId: skillId
              }
            );
          };

          /**
           * @param {string|null} oldSubtopicId - The id of the subtopic from
           *    which the skill is to be moved, or null if the origin is the
           *    uncategorized section.
           * @param {SkillSummary} skillSummary - The summary of the skill that
           *    is to be moved.
           */
          $scope.startMoveSkill = function(oldSubtopicId, skillSummary) {
            $scope.skillSummaryToMove = skillSummary;
            $scope.oldSubtopicId = oldSubtopicId ? oldSubtopicId : null;
          };

          /**
           * @param {string|null} newSubtopicId - The subtopic to which the
           *    skill is to be moved, or null if the destination is the
           *    uncategorized section.
           */
          $scope.endMoveSkill = function(newSubtopicId) {
            if (newSubtopicId === $scope.oldSubtopicId) {
              return;
            }

            if (newSubtopicId === null) {
              TopicUpdateService.removeSkillFromSubtopic(
                $scope.topic, $scope.oldSubtopicId, $scope.skillSummaryToMove);
            } else {
              TopicUpdateService.moveSkillToSubtopic(
                $scope.topic, $scope.oldSubtopicId, newSubtopicId,
                $scope.skillSummaryToMove);
            }
            _initEditor();
          };

          $scope.deleteSubtopic = function(subtopic) {
            TopicEditorStateService.deleteSubtopicPage(
              $scope.topic.getId(), subtopic.getId());
            TopicUpdateService.deleteSubtopic($scope.topic, subtopic.getId());
            _initEditor();
          };

          $scope.deleteUncategorizedSkillFromTopic = function(skillSummary) {
            TopicUpdateService.removeUncategorizedSkill(
              $scope.topic, skillSummary);
            _initEditor();
          };

          $scope.createSubtopic = function() {
            var subtopicTitles = $scope.subtopicTitles;
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'new-subtopic-title-modal.template.html'),
              backdrop: true,
              resolve: {
                subtopicTitles: () => subtopicTitles
              },
              controller: 'NewSubtopicTitleModalController'
            });

            modalInstance.result.then(function(title) {
              var subtopicPage = SubtopicPageObjectFactory.createDefault(
                $scope.topic.getId(), $scope.topic.getNextSubtopicId());
              TopicEditorStateService.setSubtopicPage(subtopicPage);
              TopicUpdateService.addSubtopic($scope.topic, title);
              _initEditor();
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
            $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);
            _initEditor();
          };
        }
      ]
    };
  }]);
