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
 * @fileoverview Controller for the main topic editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');
require('components/entity-creation-services/skill-creation.service.ts');
require(
  'components/forms/custom-forms-directives/' +
    'edit-thumbnail-modal.controller.ts');
require('components/entity-creation-services/story-creation.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/topic-editor-page/rearrange-skills-in-subtopics-modal.controller.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
    'change-subtopic-assignment-modal.template.controller.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/entity-creation.service.ts');
require(
  'pages/topic-editor-page/editor-tab/topic-editor-stories-list.directive.ts');
require('pages/topic-editor-page/modal-templates/' +
    'preview-thumbnail.component.ts');

require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/image-upload-helper.service.ts');
require('services/page-title.service.ts');
require('domain/question/question-backend-api.service.ts');


// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const topicConstants = require('constants.ts');

angular.module('oppia').directive('topicEditorTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/editor-tab/topic-editor-tab.directive.html'),
      controller: [
        '$rootScope', '$scope', '$uibModal', 'AlertsService', 'ContextService',
        'CsrfTokenService', 'EntityCreationService', 'ImageUploadHelperService',
        'PageTitleService', 'SkillCreationService', 'StoryCreationService',
        'TopicEditorRoutingService', 'TopicEditorStateService',
        'TopicUpdateService', 'UndoRedoService', 'UrlInterpolationService',
        'WindowDimensionsService', 'MAX_CHARS_IN_TOPIC_DESCRIPTION',
        'MAX_CHARS_IN_TOPIC_NAME', 'EVENT_STORY_SUMMARIES_INITIALIZED',
        'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $rootScope, $scope, $uibModal, AlertsService, ContextService,
            CsrfTokenService, EntityCreationService, ImageUploadHelperService,
            PageTitleService, SkillCreationService, StoryCreationService,
            TopicEditorRoutingService, TopicEditorStateService,
            TopicUpdateService, UndoRedoService, UrlInterpolationService,
            WindowDimensionsService, MAX_CHARS_IN_TOPIC_DESCRIPTION,
            MAX_CHARS_IN_TOPIC_NAME, EVENT_STORY_SUMMARIES_INITIALIZED,
            EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          var ctrl = this;
          $scope.MAX_CHARS_IN_TOPIC_URL_FRAGMENT = (
            topicConstants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT);
          $scope.MAX_CHARS_IN_TOPIC_NAME = MAX_CHARS_IN_TOPIC_NAME;
          $scope.MAX_CHARS_IN_TOPIC_DESCRIPTION = (
            MAX_CHARS_IN_TOPIC_DESCRIPTION);
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.skillQuestionCountDict = (
              TopicEditorStateService.getSkillQuestionCountDict());
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.topicNameEditorIsShown = false;
            $scope.editableName = $scope.topic.getName();
            $scope.initialTopicName = $scope.topic.getName();
            $scope.initialTopicUrlFragment = $scope.topic.getUrlFragment();
            $scope.editableTopicUrlFragment = $scope.topic.getUrlFragment();
            $scope.editableDescription = $scope.topic.getDescription();
            $scope.allowedBgColors = (
              topicConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic);
            $scope.topicNameExists = false;
            $scope.topicUrlFragmentExists = false;

            $scope.editableDescriptionIsEmpty = (
              $scope.editableDescription === '');
            $scope.topicDescriptionChanged = false;
            $scope.subtopics = $scope.topic.getSubtopics();
            $scope.subtopicQuestionCountDict = {};
            $scope.subtopics.map((subtopic) => {
              const subtopicId = subtopic.getId();
              $scope.subtopicQuestionCountDict[subtopicId] = 0;
              subtopic.getSkillSummaries().map((skill) => {
                $scope.subtopicQuestionCountDict[subtopicId] += (
                  $scope.skillQuestionCountDict[skill.id]);
              });
            });
            $scope.uncategorizedSkillSummaries = (
              $scope.topic.getUncategorizedSkillSummaries());
            $scope.editableThumbnailDataUrl = (
              ImageUploadHelperService
                .getTrustedResourceUrlForThumbnailFilename(
                  $scope.topic.getThumbnailFilename(),
                  ContextService.getEntityType(),
                  ContextService.getEntityId()));
          };

          var _initStorySummaries = function() {
            $scope.canonicalStorySummaries =
              TopicEditorStateService.getCanonicalStorySummaries();
          };
          // This is added because when we create a skill from the topic
          // editor, it gets assigned to that topic, and to reflect that
          // change, we need to fetch the topic again from the backend.
          $scope.refreshTopic = function() {
            TopicEditorStateService.loadTopic($scope.topic.getId());
          };

          $scope.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };

          $scope.toggleSubtopicCard = function(index) {
            if ($scope.subtopicCardSelectedIndexes[index]) {
              $scope.subtopicCardSelectedIndexes[index] = false;
              return;
            }
            $scope.subtopicCardSelectedIndexes[index] = true;
          };

          $scope.reassignSkillsInSubtopics = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                  'rearrange-skills-in-subtopics-modal.template.html'),
              backdrop: true,
              windowClass: 'rearrange-skills-modal',
              controller: 'RearrangeSkillsInSubtopicsModalController',
              controllerAs: '$ctrl',
              size: 'xl'
            }).result.then(function() {
              _initEditor();
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.createCanonicalStory = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/topic-editor-page/modal-templates/' +
                  'topic-save-pending-changes-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {}, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            } else {
              StoryCreationService.createNewCanonicalStory();
            }
          };

          $scope.createSkill = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/topic-editor-page/modal-templates/' +
                    'topic-save-pending-changes-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {}, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            } else {
              EntityCreationService.createSkill();
            }
          };

          $scope.createSubtopic = function() {
            EntityCreationService.createSubtopic($scope.topic);
          };

          $scope.updateTopicDescriptionStatus = function(description) {
            $scope.editableDescriptionIsEmpty = (description === '');
            $scope.topicDescriptionChanged = true;
          };

          $scope.updateTopicName = function(newName) {
            if (newName === $scope.initialTopicName) {
              $scope.topicNameExists = false;
              return;
            }
            if (newName) {
              TopicEditorStateService.updateExistenceOfTopicName(
                newName, function() {
                  $scope.topicNameExists = (
                    TopicEditorStateService.getTopicWithNameExists());
                  TopicUpdateService.setTopicName($scope.topic, newName);
                  $scope.topicNameEditorIsShown = false;
                  $rootScope.$applyAsync();
                });
            } else {
              TopicUpdateService.setTopicName($scope.topic, newName);
              $scope.topicNameEditorIsShown = false;
            }
          };

          $scope.updateTopicUrlFragment = function(newTopicUrlFragment) {
            if (newTopicUrlFragment === $scope.initialTopicUrlFragment) {
              $scope.topicUrlFragmentExists = false;
              return;
            }
            if (newTopicUrlFragment) {
              TopicEditorStateService.updateExistenceOfTopicUrlFragment(
                newTopicUrlFragment, function() {
                  $scope.topicUrlFragmentExists = (
                    TopicEditorStateService.getTopicWithUrlFragmentExists());
                  TopicUpdateService.setTopicUrlFragment(
                    $scope.topic, newTopicUrlFragment);
                  $rootScope.$applyAsync();
                });
            } else {
              TopicUpdateService.setTopicUrlFragment(
                $scope.topic, newTopicUrlFragment);
            }
          };

          $scope.updateTopicThumbnailFilename = function(newThumbnailFilename) {
            if (newThumbnailFilename === $scope.topic.getThumbnailFilename()) {
              return;
            }
            TopicUpdateService.setTopicThumbnailFilename(
              $scope.topic, newThumbnailFilename);
          };

          $scope.updateTopicThumbnailBgColor = function(newThumbnailBgColor) {
            if (newThumbnailBgColor === $scope.topic.getThumbnailBgColor()) {
              return;
            }
            TopicUpdateService.setTopicThumbnailBgColor(
              $scope.topic, newThumbnailBgColor);
          };

          $scope.updateTopicDescription = function(newDescription) {
            if (newDescription !== $scope.topic.getDescription()) {
              TopicUpdateService.setTopicDescription(
                $scope.topic, newDescription);
            }
          };

          $scope.deleteUncategorizedSkillFromTopic = function(skillSummary) {
            TopicUpdateService.removeUncategorizedSkill(
              $scope.topic, skillSummary);
            _initEditor();
          };

          $scope.removeSkillFromSubtopic = function(subtopicId, skillSummary) {
            $scope.selectedSkillEditOptionsIndex = {};
            TopicUpdateService.removeSkillFromSubtopic(
              $scope.topic, subtopicId, skillSummary);
            _initEditor();
          };

          $scope.removeSkillFromTopic = function(subtopicId, skillSummary) {
            $scope.selectedSkillEditOptionsIndex = {};
            TopicUpdateService.removeSkillFromSubtopic(
              $scope.topic, subtopicId, skillSummary);
            $scope.deleteUncategorizedSkillFromTopic(skillSummary);
          };

          $scope.togglePreview = function() {
            $scope.topicPreviewCardIsShown = !($scope.topicPreviewCardIsShown);
          };

          $scope.deleteSubtopic = function(subtopicId) {
            TopicEditorStateService.deleteSubtopicPage(
              $scope.topic.getId(), subtopicId);
            TopicUpdateService.deleteSubtopic($scope.topic, subtopicId);
            _initEditor();
          };

          $scope.navigateToSubtopic = function(subtopicId, subtopicName) {
            PageTitleService.setPageTitleForMobileView('Subtopic Editor');
            PageTitleService.setPageSubtitleForMobileView(subtopicName);
            TopicEditorRoutingService.navigateToSubtopicEditorWithId(
              subtopicId);
          };

          $scope.getSkillEditorUrl = function(skillId) {
            var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
            return UrlInterpolationService.interpolateUrl(
              SKILL_EDITOR_URL_TEMPLATE, {
                skillId: skillId
              }
            );
          };

          $scope.navigateToSkill = function(skillId) {
            TopicEditorRoutingService.navigateToSkillEditorWithId(skillId);
          };

          $scope.getPreviewFooter = function() {
            var canonicalStoriesLength = (
              $scope.topic.getCanonicalStoryIds().length);
            if ( canonicalStoriesLength === 0 || canonicalStoriesLength > 1) {
              return canonicalStoriesLength + ' Stories';
            }
            return '1 Story';
          };

          $scope.togglePreviewListCards = function(listType) {
            if (!WindowDimensionsService.isWindowNarrow()) {
              return;
            }
            if (listType === $scope.SUBTOPIC_LIST) {
              $scope.subtopicsListIsShown = !$scope.subtopicsListIsShown;
            } else if (listType === $scope.STORY_LIST) {
              $scope.storiesListIsShown = !$scope.storiesListIsShown;
            } else {
              $scope.mainTopicCardIsShown = !$scope.mainTopicCardIsShown;
            }
          };

          $scope.showSubtopicEditOptions = function(index) {
            $scope.subtopicEditOptionsAreShown = (
                ($scope.subtopicEditOptionsAreShown === index) ? null : index);
          };

          $scope.toggleUncategorizedSkillOptions = function(index) {
            $scope.uncategorizedEditOptionsIndex = (
                ($scope.uncategorizedEditOptionsIndex === index) ?
                    null : index);
          };

          $scope.changeSubtopicAssignment = function(
              oldSubtopicId, skillSummary) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                      'change-subtopic-assignment-modal.template.html'),
              backdrop: true,
              resolve: {
                subtopics: () => $scope.subtopics
              },
              controller: 'ChangeSubtopicAssignmentModalController'
            }).result.then(function(newSubtopicId) {
              if (oldSubtopicId === newSubtopicId) {
                return;
              }
              TopicUpdateService.moveSkillToSubtopic(
                $scope.topic, oldSubtopicId, newSubtopicId,
                skillSummary);
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.onRearrangeSubtopicStart = function(fromIndex) {
            $scope.fromIndex = fromIndex;
          };

          $scope.onRearrangeSubtopicEnd = function(toIndex) {
            if ($scope.fromIndex === toIndex) {
              return;
            }
            TopicUpdateService.rearrangeSubtopic(
              $scope.topic, $scope.fromIndex, toIndex);
            _initEditor();
          };

          $scope.showSkillEditOptions = function(subtopicIndex, skillIndex) {
            if (Object.keys($scope.selectedSkillEditOptionsIndex).length) {
              $scope.selectedSkillEditOptionsIndex = {};
              return;
            }
            $scope.selectedSkillEditOptionsIndex[subtopicIndex] = {};
            $scope.selectedSkillEditOptionsIndex[subtopicIndex] = {
              [skillIndex]: true
            };
          };

          ctrl.$onInit = function() {
            $scope.topicPreviewCardIsShown = false;
            $scope.SUBTOPIC_LIST = 'subtopic';
            $scope.SKILL_LIST = 'skill';
            $scope.STORY_LIST = 'story';
            $scope.subtopicCardSelectedIndexes = {};
            $scope.selectedSkillEditOptionsIndex = {};
            $scope.subtopicsListIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            $scope.storiesListIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            $scope.mainTopicCardIsShown = true;
            $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
            $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);
            $scope.$on(EVENT_STORY_SUMMARIES_INITIALIZED, _initStorySummaries);
            $scope.$on(
              EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
              $scope.refreshTopic);
            _initEditor();
            _initStorySummaries();
          };
        }
      ]
    };
  }]);
