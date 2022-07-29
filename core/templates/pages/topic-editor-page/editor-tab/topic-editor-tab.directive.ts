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

import { ChangeSubtopicAssignmentModalComponent } from '../modal-templates/change-subtopic-assignment-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { Subscription } from 'rxjs';

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
import topicConstants from 'assets/constants';
import cloneDeep from 'lodash/cloneDeep';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/custom-forms-directives/thumbnail-uploader.component.ts');
require(
  'components/forms/custom-forms-directives/' +
    'edit-thumbnail-modal.component.ts');
require('components/entity-creation-services/story-creation.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-update.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/topic-editor-page/rearrange-skills-in-subtopics-modal.controller.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/entity-creation.service.ts');
require(
  'pages/topic-editor-page/editor-tab/topic-editor-stories-list.component.ts');
require(
  'pages/topic-editor-page/modal-templates/preview-thumbnail.component.ts');

require('services/context.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/image-upload-helper.service.ts');
require('services/page-title.service.ts');
require('services/stateful/focus-manager.service.ts');
require('domain/question/question-backend-api.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');
require('base-components/loading-message.component.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').directive('topicEditorTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/editor-tab/topic-editor-tab.directive.html'),
      controller: [
        '$rootScope', '$scope', '$uibModal', 'AlertsService', 'ContextService',
        'EntityCreationService', 'FocusManagerService',
        'ImageUploadHelperService', 'NgbModal',
        'PageTitleService', 'QuestionBackendApiService', 'StoryCreationService',
        'TopicEditorRoutingService', 'TopicEditorStateService',
        'TopicUpdateService', 'TopicsAndSkillsDashboardBackendApiService',
        'UndoRedoService', 'UrlInterpolationService',
        'WindowDimensionsService', 'WindowRef',
        'MAX_CHARS_IN_META_TAG_CONTENT',
        'MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB',
        'MAX_CHARS_IN_TOPIC_DESCRIPTION', 'MAX_CHARS_IN_TOPIC_NAME',
        'MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB',
        'MINIMUM_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL',
        function(
            $rootScope, $scope, $uibModal, AlertsService, ContextService,
            EntityCreationService, FocusManagerService,
            ImageUploadHelperService, NgbModal,
            PageTitleService, QuestionBackendApiService, StoryCreationService,
            TopicEditorRoutingService, TopicEditorStateService,
            TopicUpdateService, TopicsAndSkillsDashboardBackendApiService,
            UndoRedoService, UrlInterpolationService,
            WindowDimensionsService, WindowRef,
            MAX_CHARS_IN_META_TAG_CONTENT,
            MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB,
            MAX_CHARS_IN_TOPIC_DESCRIPTION, MAX_CHARS_IN_TOPIC_NAME,
            MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB,
            MINIMUM_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          $scope.MAX_CHARS_IN_TOPIC_URL_FRAGMENT = (
            topicConstants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT);
          $scope.MAX_CHARS_IN_TOPIC_NAME = MAX_CHARS_IN_TOPIC_NAME;
          $scope.MAX_CHARS_IN_TOPIC_DESCRIPTION = (
            MAX_CHARS_IN_TOPIC_DESCRIPTION);
          $scope.MAX_CHARS_IN_META_TAG_CONTENT = MAX_CHARS_IN_META_TAG_CONTENT;
          $scope.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB = (
            MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB);
          $scope.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB = (
            MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB);
          ctrl.initEditor = function() {
            $scope.skillCreationIsAllowed = (
              TopicEditorStateService.isSkillCreationAllowed());
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.skillQuestionCountDict = (
              TopicEditorStateService.getSkillQuestionCountDict());
            $scope.topicRights = TopicEditorStateService.getTopicRights();
            $scope.topicNameEditorIsShown = false;
            if (TopicEditorStateService.hasLoadedTopic()) {
              $scope.topicDataHasLoaded = true;
              $scope.$applyAsync();
              FocusManagerService.setFocus('addStoryBtn');
            }
            $scope.editableName = $scope.topic.getName();
            $scope.editableMetaTagContent = $scope.topic.getMetaTagContent();
            $scope.editablePageTitleFragmentForWeb = (
              $scope.topic.getPageTitleFragmentForWeb());
            $scope.editablePracticeIsDisplayed = (
              $scope.topic.getPracticeTabIsDisplayed());
            $scope.initialTopicName = $scope.topic.getName();
            $scope.initialTopicUrlFragment = $scope.topic.getUrlFragment();
            $scope.editableTopicUrlFragment = $scope.topic.getUrlFragment();
            $scope.editableDescription = $scope.topic.getDescription();
            $scope.allowedBgColors = (
              topicConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic);
            $scope.topicNameExists = false;
            $scope.topicUrlFragmentExists = false;
            $scope.hostname = WindowRef.nativeWindow.location.hostname;

            $scope.getEligibleSkillSummariesForDiagnosticTest = function() {
              let availableSkillSummaries = (
                $scope.topic.getAvailableSkillSummariesForDiagnosticTest());

              return availableSkillSummaries.filter(skillSummary => {
                if (
                    $scope.skillQuestionCountDict[skillSummary.getId()] >=
                    MINIMUM_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL) {
                  return true;
                } else {
                  return false;
                }
              })
            };
            $scope.availableSkillSummariesForDiagnosticTest = (
              $scope.getEligibleSkillSummariesForDiagnosticTest());
            $scope.selectedSkillSummariesForDiagnosticTest = (
              $scope.topic.getSkillSummariesForDiagnosticTest());
            $scope.diagnosticTestSkillsDropdownIsShown = false;
            $scope.selectedSkillForDiagnosticTest = null;

            $scope.presentDiagnosticTestSkillDropdown = function() {
              $scope.diagnosticTestSkillsDropdownIsShown = true;
            };

            $scope.removeDiagnosticTestSkillDropdown = function() {
              $scope.diagnosticTestSkillsDropdownIsShown = false;
            };

            $scope.addSkillForDiagnosticTest = async function() {
              let skillToAdd = $scope.selectedSkillForDiagnosticTest;
              $scope.selectedSkillForDiagnosticTest = null;
              let numberOfQuestions;

              await QuestionBackendApiService
                .fetchTotalQuestionCountForSkillIdsAsync(
                  [skillToAdd.getId()]).then((questionCount) => {
                  numberOfQuestions = questionCount;
                });

              if (numberOfQuestions < 2) {
                $scope.diagnosticTestSkillsDropdownIsShown = false;
                AlertsService.addInfoMessage(
                  'The skill should contain at least two questions for ' +
                  'getting assigned to the diagnostic test.', 5000);
                $scope.$applyAsync();
                return;
              }
              $scope.selectedSkillSummariesForDiagnosticTest.push(skillToAdd);
              let j = -1;
              for (let skill of
                $scope.availableSkillSummariesForDiagnosticTest) {
                j++;
                if (skill.getId() === skillToAdd.getId()) {
                  $scope.availableSkillSummariesForDiagnosticTest.splice(j, 1);
                  break;
                }
              }
              TopicUpdateService.updateDiagnosticTestSkills(
                $scope.topic,
                cloneDeep($scope.selectedSkillSummariesForDiagnosticTest));
              $scope.diagnosticTestSkillsDropdownIsShown = false;
              $scope.$applyAsync();
            };

            $scope.removeSkillFromDiagnosticTest = function(skillToRemove) {
              let j = -1;
              for (let skill of
                $scope.selectedSkillSummariesForDiagnosticTest) {
                j++;
                if (skill.getId() === skillToRemove.getId()) {
                  $scope.selectedSkillSummariesForDiagnosticTest.splice(j, 1);
                  break;
                }
              }
              $scope.availableSkillSummariesForDiagnosticTest.push(
                skillToRemove);

              TopicUpdateService.updateDiagnosticTestSkills(
                $scope.topic,
                cloneDeep($scope.selectedSkillSummariesForDiagnosticTest));
              $scope.$applyAsync();
            };

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

          $scope.getClassroomUrlFragment = function() {
            return TopicEditorStateService.getClassroomUrlFragment();
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
              backdrop: 'static',
              windowClass: 'rearrange-skills-modal',
              controller: 'RearrangeSkillsInSubtopicsModalController',
              controllerAs: '$ctrl',
              size: 'xl'
            }).result.then(function() {
              ctrl.initEditor();
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.createCanonicalStory = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              const modalRef = NgbModal.open(
                SavePendingChangesModalComponent, {
                  backdrop: true
                });

              modalRef.componentInstance.body = (
                'Please save all pending changes ' +
                'before exiting the topic editor.');

              modalRef.result.then(function() {}, function() {
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
              const modalRef = NgbModal.open(
                SavePendingChangesModalComponent, {
                  backdrop: true
                });

              modalRef.componentInstance.body = (
                'Please save all pending changes ' +
                'before exiting the topic editor.');

              modalRef.result.then(function() {}, function() {
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
                }, function() {
                  TopicUpdateService.setTopicUrlFragment(
                    $scope.topic, newTopicUrlFragment);
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
            $scope.$applyAsync();
          };

          $scope.updateTopicThumbnailBgColor = function(newThumbnailBgColor) {
            if (newThumbnailBgColor === $scope.topic.getThumbnailBgColor()) {
              return;
            }
            TopicUpdateService.setTopicThumbnailBgColor(
              $scope.topic, newThumbnailBgColor);
            $scope.$applyAsync();
          };

          $scope.updateTopicDescription = function(newDescription) {
            if (newDescription !== $scope.topic.getDescription()) {
              TopicUpdateService.setTopicDescription(
                $scope.topic, newDescription);
            }
          };

          $scope.updateTopicMetaTagContent = function(newMetaTagContent) {
            if (newMetaTagContent !== $scope.topic.getMetaTagContent()) {
              TopicUpdateService.setMetaTagContent(
                $scope.topic, newMetaTagContent);
            }
          };

          $scope.updateTopicPageTitleFragmentForWeb = function(
              newTopicPageTitleFragmentForWeb) {
            let currentValue = $scope.topic.getPageTitleFragmentForWeb();
            if (newTopicPageTitleFragmentForWeb !== currentValue) {
              TopicUpdateService.setPageTitleFragmentForWeb(
                $scope.topic, newTopicPageTitleFragmentForWeb);
            }
          };

          // Only update the topic if 1) the creator is turning off the
          // practice tab or 2) the creator is turning on the practice tab
          // and it has enough practice questions.
          $scope.updatePracticeTabIsDisplayed = function(
              newPracticeTabIsDisplayed) {
            if (!newPracticeTabIsDisplayed ||
              $scope.doesTopicHaveMinimumPracticeQuestions()
            ) {
              TopicUpdateService.setPracticeTabIsDisplayed(
                $scope.topic, newPracticeTabIsDisplayed);
              $scope.editablePracticeIsDisplayed = newPracticeTabIsDisplayed;
            }
          };

          $scope.doesTopicHaveMinimumPracticeQuestions = function() {
            const skillQuestionCounts = (
              Object.values($scope.skillQuestionCountDict));
            const numberOfPracticeQuestions = (
              skillQuestionCounts.reduce((a: number, b: number) => a + b, 0));
            return (
              numberOfPracticeQuestions >=
              topicConstants.TOPIC_MINIMUM_QUESTIONS_TO_PRACTICE
            );
          };

          $scope.deleteUncategorizedSkillFromTopic = function(skillSummary) {
            TopicUpdateService.removeUncategorizedSkill(
              $scope.topic, skillSummary);
            $scope.removeSkillFromDiagnosticTest(skillSummary);
            ctrl.initEditor();
          };

          $scope.removeSkillFromSubtopic = function(subtopicId, skillSummary) {
            $scope.selectedSkillEditOptionsIndex = {};
            TopicUpdateService.removeSkillFromSubtopic(
              $scope.topic, subtopicId, skillSummary);
            ctrl.initEditor();
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
            ctrl.initEditor();
          };

          $scope.navigateToSubtopic = function(subtopicId, subtopicName) {
            PageTitleService.setNavbarTitleForMobileView('Subtopic Editor');
            PageTitleService.setNavbarSubtitleForMobileView(subtopicName);
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
            if (canonicalStoriesLength === 0 || canonicalStoriesLength > 1) {
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
            const modalRef: NgbModalRef = NgbModal.open(
              ChangeSubtopicAssignmentModalComponent, {
                backdrop: 'static',
                windowClass: 'oppia-change-subtopic-assignment-modal',
                size: 'xl'
              });
            modalRef.componentInstance.subtopics = $scope.subtopics;
            modalRef.result.then(function(newSubtopicId) {
              if (oldSubtopicId === newSubtopicId) {
                return;
              }
              TopicUpdateService.moveSkillToSubtopic(
                $scope.topic, oldSubtopicId, newSubtopicId,
                skillSummary);
              ctrl.initEditor();
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
            ctrl.initEditor();
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
            FocusManagerService.setFocus('addStoryBtn');
            $scope.topicPreviewCardIsShown = false;
            $scope.SUBTOPIC_LIST = 'subtopic';
            $scope.SKILL_LIST = 'skill';
            $scope.STORY_LIST = 'story';
            $scope.topicDataHasLoaded = false;
            $scope.subtopicCardSelectedIndexes = {};
            $scope.selectedSkillEditOptionsIndex = {};
            $scope.subtopicsListIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            $scope.storiesListIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            ctrl.directiveSubscriptions.add(
              TopicEditorStateService.onTopicInitialized.subscribe(
                () => ctrl.initEditor()
              ));
            ctrl.directiveSubscriptions.add(
              TopicEditorStateService.onTopicReinitialized.subscribe(
                () => ctrl.initEditor()
              ));
            $scope.mainTopicCardIsShown = true;

            ctrl.directiveSubscriptions.add(
              TopicEditorStateService.onStorySummariesInitialized.subscribe(
                () => _initStorySummaries()
              )
            );
            ctrl.directiveSubscriptions.add(
              TopicsAndSkillsDashboardBackendApiService.
                onTopicsAndSkillsDashboardReinitialized.subscribe(
                  () => {
                    $scope.refreshTopic();
                  }
                )
            );
            ctrl.initEditor();
            _initStorySummaries();
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
