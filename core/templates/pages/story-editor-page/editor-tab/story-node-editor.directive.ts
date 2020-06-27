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
 * @fileoverview Controller for the story node editor.
 */

require(
  'components/forms/custom-forms-directives/thumbnail-uploader.directive.ts');
require('components/skill-selector/select-skill-modal.controller.ts');
require(
  'components/skill-selector/skill-selector.directive.ts');
require(
  'pages/story-editor-page/modal-templates/' +
  'new-chapter-title-modal.controller.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/story/story-update.service.ts');
require('domain/exploration/exploration-id-validation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('services/alerts.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const storyNodeConstants = require('constants.ts');

angular.module('oppia').directive('storyNodeEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getId: '&nodeId',
        getOutline: '&outline',
        getDescription: '&description',
        getExplorationId: '&explorationId',
        getThumbnailFilename: '&thumbnailFilename',
        getThumbnailBgColor: '&thumbnailBgColor',
        isOutlineFinalized: '&outlineFinalized',
        getDestinationNodeIds: '&destinationNodeIds',
        getPrerequisiteSkillIds: '&prerequisiteSkillIds',
        getAcquiredSkillIds: '&acquiredSkillIds'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/editor-tab/story-node-editor.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'AlertsService',
        'StoryEditorStateService', 'ExplorationIdValidationService',
        'TopicsAndSkillsDashboardBackendApiService',
        'StoryUpdateService', 'UndoRedoService', 'EVENT_STORY_INITIALIZED',
        'EVENT_STORY_REINITIALIZED', 'EVENT_VIEW_STORY_NODE_EDITOR',
        'MAX_CHARS_IN_CHAPTER_TITLE', 'MAX_CHARS_IN_CHAPTER_DESCRIPTION',
        function(
            $scope, $rootScope, $uibModal, AlertsService,
            StoryEditorStateService, ExplorationIdValidationService,
            TopicsAndSkillsDashboardBackendApiService,
            StoryUpdateService, UndoRedoService, EVENT_STORY_INITIALIZED,
            EVENT_STORY_REINITIALIZED, EVENT_VIEW_STORY_NODE_EDITOR,
            MAX_CHARS_IN_CHAPTER_TITLE, MAX_CHARS_IN_CHAPTER_DESCRIPTION) {
          var ctrl = this;
          $scope.MAX_CHARS_IN_CHAPTER_TITLE = MAX_CHARS_IN_CHAPTER_TITLE;
          $scope.MAX_CHARS_IN_CHAPTER_DESCRIPTION = (
            MAX_CHARS_IN_CHAPTER_DESCRIPTION);
          var _recalculateAvailableNodes = function() {
            $scope.newNodeId = null;
            $scope.availableNodes = [];
            var linearNodesList =
              $scope.story.getStoryContents().getLinearNodesList();
            var linearNodeIds = linearNodesList.map(function(node) {
              return node.getId();
            });
            for (var i = 0; i < $scope.storyNodeIds.length; i++) {
              if ($scope.storyNodeIds[i] === $scope.getId()) {
                continue;
              }
              if (
                $scope.getDestinationNodeIds().indexOf(
                  $scope.storyNodeIds[i]) !== -1) {
                continue;
              }
              if (linearNodeIds.indexOf($scope.storyNodeIds[i]) === -1) {
                $scope.availableNodes.push({
                  id: $scope.storyNodeIds[i],
                  text: $scope.nodeIdToTitleMap[$scope.storyNodeIds[i]]
                });
              }
            }
          };
          var categorizedSkills = null;
          var _init = function() {
            $scope.story = StoryEditorStateService.getStory();
            $scope.storyNodeIds = $scope.story.getStoryContents().getNodeIds();
            $scope.nodeIdToTitleMap =
              $scope.story.getStoryContents().getNodeIdsToTitleMap(
                $scope.storyNodeIds);
            _recalculateAvailableNodes();
            $scope.skillIdToSummaryMap = {};
            $scope.allowedBgColors = (
              storyNodeConstants.ALLOWED_THUMBNAIL_BG_COLORS.chapter);
            var skillSummaries = StoryEditorStateService.getSkillSummaries();
            TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
              function(response) {
                categorizedSkills = response.categorized_skills_dict;
              });
            for (var idx in skillSummaries) {
              $scope.skillIdToSummaryMap[skillSummaries[idx].id] =
                skillSummaries[idx].description;
            }
            $scope.isStoryPublished = StoryEditorStateService.isStoryPublished;
            $scope.currentTitle = $scope.nodeIdToTitleMap[$scope.getId()];
            $scope.editableTitle = $scope.currentTitle;
            $scope.currentDescription = $scope.getDescription();
            $scope.editableDescription = $scope.currentDescription;
            $scope.editableThumbnailFilename = $scope.getThumbnailFilename();
            $scope.editableThumbnailBgColor = $scope.getThumbnailBgColor();
            $scope.oldOutline = $scope.getOutline();
            $scope.editableOutline = $scope.getOutline();
            $scope.explorationId = $scope.getExplorationId();
            $scope.currentExplorationId = $scope.explorationId;
            $scope.expIdIsValid = true;
            $scope.invalidExpErrorIsShown = false;
            $scope.nodeTitleEditorIsShown = false;
            $scope.OUTLINE_SCHEMA = {
              type: 'html',
              ui_config: {
                rows: 100
              }
            };
          };

          $scope.getSkillEditorUrl = function(skillId) {
            return '/skill_editor/' + skillId;
          };

          $scope.checkCanSaveExpId = function() {
            $scope.expIdCanBeSaved = $scope.explorationIdPattern.test(
              $scope.explorationId) || !$scope.explorationId;
            $scope.invalidExpErrorIsShown = false;
          };
          $scope.updateTitle = function(newTitle) {
            if (newTitle === $scope.currentTitle) {
              return;
            }
            var titleIsValid = true;
            for (var idx in $scope.story.getStoryContents().getNodes()) {
              var node = $scope.story.getStoryContents().getNodes()[idx];
              if (node.getTitle() === newTitle) {
                titleIsValid = false;
                AlertsService.addInfoMessage(
                  'A chapter already exists with given title.', 5000);
              }
            }
            if (titleIsValid) {
              StoryUpdateService.setStoryNodeTitle(
                $scope.story, $scope.getId(), newTitle);
              $scope.currentTitle = newTitle;
            }
          };

          $scope.updateDescription = function(newDescription) {
            if (newDescription === $scope.currentDescription) {
              return;
            }
            StoryUpdateService.setStoryNodeDescription(
              $scope.story, $scope.getId(), newDescription);
            $scope.currentDescription = newDescription;
          };

          $scope.updateThumbnailFilename = function(newThumbnailFilename) {
            if (newThumbnailFilename === $scope.editableThumbnailFilename) {
              return;
            }
            StoryUpdateService.setStoryNodeThumbnailFilename(
              $scope.story, $scope.getId(), newThumbnailFilename);
            $scope.editableThumbnailFilename = newThumbnailFilename;
          };

          $scope.updateThumbnailBgColor = function(newThumbnailBgColor) {
            if (newThumbnailBgColor === $scope.editableThumbnailBgColor) {
              return;
            }
            StoryUpdateService.setStoryNodeThumbnailBgColor(
              $scope.story, $scope.getId(), newThumbnailBgColor);
            $scope.editableThumbnailBgColor = newThumbnailBgColor;
          };

          $scope.viewNodeEditor = function(nodeId) {
            $rootScope.$broadcast(EVENT_VIEW_STORY_NODE_EDITOR, nodeId);
          };

          $scope.finalizeOutline = function() {
            StoryUpdateService.finalizeStoryNodeOutline(
              $scope.story, $scope.getId());
          };

          $scope.updateExplorationId = function(explorationId) {
            if (StoryEditorStateService.isStoryPublished()) {
              if (explorationId === '' || explorationId === null) {
                AlertsService.addInfoMessage(
                  'You cannot remove an exploration from a published story.',
                  5000);
                return;
              }
              ExplorationIdValidationService.isExpPublished(
                explorationId).then(function(expIdIsValid) {
                $scope.expIdIsValid = expIdIsValid;
                if ($scope.expIdIsValid) {
                  StoryUpdateService.setStoryNodeExplorationId(
                    $scope.story, $scope.getId(), explorationId);
                  $scope.currentExplorationId = explorationId;
                } else {
                  $scope.invalidExpErrorIsShown = true;
                }
              });
            } else {
              if (explorationId === '') {
                AlertsService.addInfoMessage(
                  'Please click the delete icon to remove an exploration ' +
                  'from the story.', 5000);
                return;
              }
              StoryUpdateService.setStoryNodeExplorationId(
                $scope.story, $scope.getId(), explorationId);
              $scope.currentExplorationId = explorationId;
              if (explorationId === null) {
                $scope.explorationId = null;
              }
            }
          };

          $scope.removePrerequisiteSkillId = function(skillId) {
            StoryUpdateService.removePrerequisiteSkillIdFromNode(
              $scope.story, $scope.getId(), skillId);
          };

          $scope.addPrerequisiteSkillId = function() {
            var sortedSkillSummaries = (
              StoryEditorStateService.getSkillSummaries());
            var allowSkillsFromOtherTopics = true;
            var skillsInSameTopicCount = 0;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              backdrop: true,
              resolve: {
                skillsInSameTopicCount: () => skillsInSameTopicCount,
                sortedSkillSummaries: () => sortedSkillSummaries,
                categorizedSkills: () => categorizedSkills,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics
              },
              controller: 'SelectSkillModalController',
              windowClass: 'skill-select-modal',
              size: 'xl'
            }).result.then(function(summary) {
              try {
                StoryUpdateService.addPrerequisiteSkillIdToNode(
                  $scope.story, $scope.getId(), summary.id);
              } catch (err) {
                AlertsService.addInfoMessage(
                  'Given skill is already a prerequisite skill', 5000);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.addAcquiredSkillId = function() {
            var sortedSkillSummaries = (
              StoryEditorStateService.getSkillSummaries());
            var allowSkillsFromOtherTopics = false;
            var skillsInSameTopicCount = 0;
            var topicName = StoryEditorStateService.getTopicName();
            var categorizedSkillsInTopic = {};
            categorizedSkillsInTopic[topicName] = categorizedSkills[topicName];
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/skill-selector/select-skill-modal.template.html'),
              backdrop: true,
              resolve: {
                skillsInSameTopicCount: () => skillsInSameTopicCount,
                sortedSkillSummaries: () => sortedSkillSummaries,
                categorizedSkills: () => categorizedSkillsInTopic,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics
              },
              controller: 'SelectSkillModalController',
              windowClass: 'skill-select-modal',
              size: 'xl'
            }).result.then(function(summary) {
              try {
                StoryUpdateService.addAcquiredSkillIdToNode(
                  $scope.story, $scope.getId(), summary.id);
              } catch (err) {
                AlertsService.addInfoMessage(
                  'Given skill is already an acquired skill', 5000);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.removeAcquiredSkillId = function(skillId) {
            StoryUpdateService.removeAcquiredSkillIdFromNode(
              $scope.story, $scope.getId(), skillId);
          };

          $scope.unfinalizeOutline = function() {
            StoryUpdateService.unfinalizeStoryNodeOutline(
              $scope.story, $scope.getId());
          };

          $scope.addNewDestinationNode = function() {
            var nodeTitles =
              $scope.story.getStoryContents().getNodes().map(function(node) {
                return node.getTitle();
              });
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/story-editor-page/modal-templates/' +
                'new-chapter-title-modal.template.html'),
              backdrop: true,
              resolve: {
                nodeTitles: () => nodeTitles
              },
              controller: 'NewChapterTitleModalController'
            }).result.then(function(title) {
              var nextNodeId =
                $scope.story.getStoryContents().getNextNodeId();
              StoryUpdateService.addStoryNode($scope.story, title);
              StoryUpdateService.addDestinationNodeIdToNode(
                $scope.story, $scope.getId(), nextNodeId);
              _init();
              _recalculateAvailableNodes();
              $rootScope.$broadcast(
                'storyGraphUpdated', $scope.story.getStoryContents());
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.addDestinationNode = function(nodeId) {
            if (!nodeId) {
              return;
            }
            if (nodeId === $scope.getId()) {
              AlertsService.addInfoMessage(
                'A chapter cannot lead to itself.', 3000);
              return;
            }
            var nodes = $scope.story.getStoryContents().getNodes();
            for (var i = 0; i < nodes.length; i++) {
              if (nodes[i].getDestinationNodeIds().indexOf(nodeId) !== -1) {
                StoryUpdateService.removeDestinationNodeIdFromNode(
                  $scope.story, nodes[i].getId(), nodeId);
              }
            }
            try {
              StoryUpdateService.addDestinationNodeIdToNode(
                $scope.story, $scope.getId(), nodeId);
            } catch (error) {
              AlertsService.addInfoMessage(
                'The given chapter is already a destination for current ' +
                'chapter', 3000);
              return;
            }
            $rootScope.$broadcast(
              'storyGraphUpdated', $scope.story.getStoryContents());
            _recalculateAvailableNodes();
          };

          $scope.removeDestinationNodeId = function(nodeId) {
            StoryUpdateService.removeDestinationNodeIdFromNode(
              $scope.story, $scope.getId(), nodeId);
            $rootScope.$broadcast(
              'storyGraphUpdated', $scope.story.getStoryContents());
            _recalculateAvailableNodes();
          };

          $scope.openNodeTitleEditor = function() {
            $scope.nodeTitleEditorIsShown = true;
          };

          $scope.closeNodeTitleEditor = function() {
            $scope.nodeTitleEditorIsShown = false;
          };

          $scope.isOutlineModified = function(outline) {
            return ($scope.oldOutline !== outline);
          };

          $scope.updateOutline = function(newOutline) {
            if (!$scope.isOutlineModified(newOutline)) {
              return;
            }
            StoryUpdateService.setStoryNodeOutline(
              $scope.story, $scope.getId(), newOutline);
            $scope.oldOutline = newOutline;
          };

          ctrl.$onInit = function() {
            // Regex pattern for exploration id,
            // EXPLORATION_AND_SKILL_ID_PATTERN
            // is not being used here, as the chapter of the story can be saved
            // with empty exploration id.
            $scope.explorationIdPattern = /^[a-zA-Z0-9_-]+$/;
            $scope.expIdCanBeSaved = true;
            $scope.$on(EVENT_STORY_INITIALIZED, _init);
            $scope.$on(EVENT_STORY_REINITIALIZED, _init);
            $scope.$on('recalculateAvailableNodes', _recalculateAvailableNodes);

            _init();
          };
        }
      ]
    };
  }]);
