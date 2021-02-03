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
 * @fileoverview Controller for the questions list.
 */

require('directives/angular-html-bind.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/question-difficulty-selector/' +
  'question-difficulty-selector.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ajs.ts');
require(
  'components/skill-selector/' +
  'questions-list-select-skill-modal.controller.ts');
require(
  'components/skill-selector/skill-selector.directive.ts');

require(
  'components/question-directives/modal-templates/' +
  'question-editor-modal.controller.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
  'questions-list-select-skill-and-difficulty-modal.controller.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/ShortSkillSummaryObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/skill-editor-page/services/question-creation.service.ts');
require('pages/skill-editor-page/services/skill-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/image-local-storage.service.ts');
require('services/question-validation.service.ts');
require('services/contextual/window-dimensions.service.ts');

import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { Subscription } from 'rxjs';

angular.module('oppia').directive('questionsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        skillDescriptionsAreShown: '&skillDescriptionsAreShown',
        selectSkillModalIsShown: '&selectSkillModalIsShown',
        getSkillIds: '&skillIds',
        getAllSkillSummaries: '&allSkillSummaries',
        canEditQuestion: '&',
        getSkillIdToRubricsObject: '&skillIdToRubricsObject',
        getSelectedSkillId: '&selectedSkillId',
        getGroupedSkillSummaries: '=',
        getSkillsCategorizedByTopics: '=',
        getUntriagedSkillSummaries: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-directives/questions-list/' +
        'questions-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$location', '$rootScope', '$timeout', '$uibModal', 'AlertsService',
        'ContextService', 'EditableQuestionBackendApiService',
        'ImageLocalStorageService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'QuestionUndoRedoService',
        'QuestionValidationService', 'QuestionsListService',
        'ShortSkillSummaryObjectFactory', 'SkillBackendApiService',
        'SkillEditorRoutingService',
        'UtilsService', 'WindowDimensionsService',
        'INTERACTION_SPECS', 'NUM_QUESTIONS_PER_PAGE',
        function(
            $location, $rootScope, $timeout, $uibModal, AlertsService,
            ContextService, EditableQuestionBackendApiService,
            ImageLocalStorageService, MisconceptionObjectFactory,
            QuestionObjectFactory, QuestionUndoRedoService,
            QuestionValidationService, QuestionsListService,
            ShortSkillSummaryObjectFactory, SkillBackendApiService,
            SkillEditorRoutingService,
            UtilsService, WindowDimensionsService,
            INTERACTION_SPECS, NUM_QUESTIONS_PER_PAGE) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var _reInitializeSelectedSkillIds = function() {
            ctrl.selectedSkillId = ctrl.getSelectedSkillId();
          };

          var _initTab = function(resetHistoryAndFetch) {
            ctrl.skillIds = ctrl.getSkillIds();
            ctrl.questionEditorIsShown = false;
            ctrl.question = null;
            _reInitializeSelectedSkillIds();
            QuestionsListService.getQuestionSummariesAsync(
              ctrl.selectedSkillId, resetHistoryAndFetch,
              resetHistoryAndFetch
            );
            ctrl.questionIsBeingUpdated = false;
            ctrl.misconceptionsBySkill = {};
            ctrl.misconceptionIdsForSelectedSkill = [];
            if (ctrl.getSelectedSkillId()) {
              SkillBackendApiService.fetchSkill(
                ctrl.getSelectedSkillId()
              ).then(responseObject => {
                ctrl.misconceptionIdsForSelectedSkill = (
                  responseObject.skill.getMisconceptions().map(
                    misconception => misconception.getId()));
                $rootScope.$apply();
              });
            }
            if (SkillEditorRoutingService.navigateToQuestionEditor()) {
              ctrl.createQuestion();
            }
          };
          ctrl.getQuestionIndex = function(index) {
            return (
              QuestionsListService.getCurrentPageNumber() *
              NUM_QUESTIONS_PER_PAGE + index + 1);
          };

          ctrl.goToNextPage = function() {
            _reInitializeSelectedSkillIds();
            QuestionsListService.incrementPageNumber();
            QuestionsListService.getQuestionSummariesAsync(
              ctrl.selectedSkillId, true, false
            );
          };

          ctrl.goToPreviousPage = function() {
            _reInitializeSelectedSkillIds();
            QuestionsListService.decrementPageNumber();
            QuestionsListService.getQuestionSummariesAsync(
              ctrl.selectedSkillId, false, false
            );
          };

          ctrl.showUnaddressedSkillMisconceptionWarning = function(
              skillMisconceptionIds) {
            var skillId = ctrl.getSelectedSkillId();
            var expectedMisconceptionIds = (
              ctrl.misconceptionIdsForSelectedSkill);
            var actualMisconceptionIds = (
              skillMisconceptionIds.map(skillMisconceptionId => {
                if (skillMisconceptionId.startsWith(skillId)) {
                  return parseInt(skillMisconceptionId.split('-')[1]);
                }
              }));
            return UtilsService.isEquivalent(
              actualMisconceptionIds.sort(), expectedMisconceptionIds.sort());
          };

          ctrl.saveAndPublishQuestion = function(commitMessage) {
            var validationErrors = ctrl.question.getValidationErrorMessage();
            var unaddressedMisconceptions = (
              ctrl.question.getUnaddressedMisconceptionNames(
                ctrl.misconceptionsBySkill));
            var unaddressedMisconceptionsErrorString = (
              `Remaining misconceptions that need to be addressed: ${
                unaddressedMisconceptions.join(', ')}`);

            if (validationErrors || unaddressedMisconceptions.length) {
              AlertsService.addWarning(
                validationErrors || unaddressedMisconceptionsErrorString);
              return;
            }
            _reInitializeSelectedSkillIds();
            if (!ctrl.questionIsBeingUpdated) {
              var imagesData = ImageLocalStorageService.getStoredImagesData();
              ImageLocalStorageService.flushStoredImagesData();
              EditableQuestionBackendApiService.createQuestion(
                ctrl.newQuestionSkillIds, ctrl.newQuestionSkillDifficulties,
                ctrl.question.toBackendDict(true), imagesData
              ).then(function() {
                QuestionsListService.resetPageNumber();
                QuestionsListService.getQuestionSummariesAsync(
                  ctrl.selectedSkillId, true, true
                );
                ctrl.questionIsBeingSaved = false;
                ctrl.editorIsOpen = false;
                AlertsService.addSuccessMessage(
                  'Question created successfully.');
                _initTab(true);
              });
            } else {
              if (QuestionUndoRedoService.hasChanges()) {
                if (commitMessage) {
                  ctrl.questionIsBeingSaved = true;
                  EditableQuestionBackendApiService.updateQuestion(
                    ctrl.questionId, ctrl.question.getVersion(), commitMessage,
                    QuestionUndoRedoService.getCommittableChangeList()).then(
                    function() {
                      QuestionUndoRedoService.clearChanges();
                      ctrl.editorIsOpen = false;
                      ctrl.questionIsBeingSaved = false;
                      QuestionsListService.getQuestionSummariesAsync(
                        ctrl.selectedSkillId, true, true
                      );
                    }, function(error) {
                      AlertsService.addWarning(
                        error || 'There was an error saving the question.');
                      ctrl.questionIsBeingSaved = false;
                      ctrl.editorIsOpen = false;
                    });
                } else {
                  AlertsService.addWarning(
                    'Please provide a valid commit message.');
                  ctrl.questionIsBeingSaved = false;
                  ctrl.editorIsOpen = false;
                }
              }
            }
          };

          ctrl.getSkillEditorUrl = function(skillId) {
            return `/skill_editor/${skillId}`;
          };

          ctrl.isLastPage = function() {
            return QuestionsListService.isLastQuestionBatch();
          };

          ctrl.cancel = function() {
            $uibModal.open({
              templateUrl:
                  UrlInterpolationService.getDirectiveTemplateUrl(
                    '/components/question-directives' +
                      '/modal-templates/' +
                      'confirm-question-modal-exit-modal.directive.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              ContextService.resetImageSaveDestination();
              ctrl.editorIsOpen = false;
              $location.hash(null);
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is
              // clicked. No further action is needed.
            });
          };

          ctrl.initializeNewQuestionCreation = function(skillIds) {
            ctrl.question =
              QuestionObjectFactory.createDefaultQuestion(skillIds);
            ctrl.questionId = ctrl.question.getId();
            ctrl.questionStateData = ctrl.question.getStateData();
            ctrl.questionIsBeingUpdated = false;
            ctrl.newQuestionIsBeingCreated = true;
          };

          ctrl.createQuestion = function() {
            ctrl.newQuestionSkillIds = [];
            ctrl.skillIdToRubricsObject = ctrl.getSkillIdToRubricsObject();
            if (!ctrl.selectSkillModalIsShown()) {
              ctrl.newQuestionSkillIds = ctrl.skillIds;
            } else {
              ctrl.newQuestionSkillIds = [ctrl.getSelectedSkillId()];
            }
            ctrl.linkedSkillsWithDifficulty = [];
            ctrl.newQuestionSkillIds.forEach(function(skillId) {
              ctrl.linkedSkillsWithDifficulty.push(
                SkillDifficulty.create(
                  skillId, '', null));
            });
            ctrl.showDifficultyChoices = true;
            ctrl.editorIsOpen = true;
            ctrl.initiateQuestionCreation();
          };

          ctrl.changeLinkedSkillDifficulty = function() {
            if (ctrl.newQuestionSkillIds.length === 1) {
              ctrl.newQuestionSkillDifficulties = (
                [ctrl.linkedSkillsWithDifficulty[0].getDifficulty()]);
            } else {
              ctrl.linkedSkillsWithDifficulty.forEach(
                (linkedSkillWithDifficulty) => {
                  if (!ctrl.newQuestionSkillIds.includes(
                    linkedSkillWithDifficulty.getId())) {
                    ctrl.newQuestionSkillIds.push(
                      linkedSkillWithDifficulty.getId());
                    ctrl.newQuestionSkillDifficulties.push(
                      linkedSkillWithDifficulty.getDifficulty());
                  }
                });
            }
          };

          ctrl.initiateQuestionCreation = function() {
            ctrl.showDifficultyChoices = true;
            ctrl.newQuestionSkillIds = [];
            ctrl.associatedSkillSummaries = [];
            ctrl.newQuestionSkillDifficulties = [];
            ctrl.linkedSkillsWithDifficulty.forEach(
              (linkedSkillWithDifficulty) => {
                ctrl.newQuestionSkillIds.push(
                  linkedSkillWithDifficulty.getId());
                if (linkedSkillWithDifficulty.getDifficulty()) {
                  ctrl.newQuestionSkillDifficulties.push(
                    linkedSkillWithDifficulty.getDifficulty());
                }
              });
            ctrl.populateMisconceptions(ctrl.newQuestionSkillIds);
            if (AlertsService.warnings.length === 0) {
              ctrl.initializeNewQuestionCreation(
                ctrl.newQuestionSkillIds);
              ctrl.editorIsOpen = true;
            }
            ctrl.skillLinkageModificationsArray = [];
          };

          ctrl.populateMisconceptions = function(skillIds) {
            ctrl.misconceptionsBySkill = {};
            SkillBackendApiService.fetchMultiSkills(
              skillIds).then(
              function(skills) {
                skills.forEach(function(skill) {
                  ctrl.misconceptionsBySkill[skill.getId()] =
                    skill.getMisconceptions();
                });
                $rootScope.$apply();
              }, function(error) {
                AlertsService.addWarning();
              });
          };

          ctrl.editQuestion = function(
              questionSummaryForOneSkill, skillDescription, difficulty) {
            if (ctrl.editorIsOpen) {
              return;
            }
            if (!ctrl.canEditQuestion()) {
              AlertsService.addWarning(
                'User does not have enough rights to delete the question');
              return;
            }
            ctrl.newQuestionSkillIds = [];
            ctrl.skillIdToRubricsObject = ctrl.getSkillIdToRubricsObject();
            if (!ctrl.selectSkillModalIsShown()) {
              ctrl.newQuestionSkillIds = ctrl.skillIds;
            } else {
              ctrl.newQuestionSkillIds = [ctrl.getSelectedSkillId()];
            }
            ctrl.linkedSkillsWithDifficulty = [];
            ctrl.newQuestionSkillIds.forEach(function(skillId) {
              ctrl.linkedSkillsWithDifficulty.push(
                SkillDifficulty.create(
                  skillId, skillDescription, difficulty));
            });
            ctrl.difficulty = difficulty;
            ctrl.misconceptionsBySkill = {};
            ctrl.associatedSkillSummaries = [];
            EditableQuestionBackendApiService.fetchQuestion(
              questionSummaryForOneSkill.getQuestionId()).then(
              function(response) {
                if (response.associated_skill_dicts) {
                  response.associated_skill_dicts.forEach(function(skillDict) {
                    ctrl.misconceptionsBySkill[skillDict.id] =
                      skillDict.misconceptions.map(function(misconception) {
                        return MisconceptionObjectFactory.createFromBackendDict(
                          misconception);
                      });
                    ctrl.associatedSkillSummaries.push(
                      ShortSkillSummaryObjectFactory.create(
                        skillDict.id, skillDict.description));
                  });
                }
                ctrl.question = angular.copy(response.questionObject);
                ctrl.questionId = ctrl.question.getId();
                ctrl.questionStateData = ctrl.question.getStateData();
                ctrl.questionIsBeingUpdated = true;
                ctrl.newQuestionIsBeingCreated = false;
                ctrl.openQuestionEditor();
              }, function(errorResponse) {
                AlertsService.addWarning(
                  errorResponse.error || 'Failed to fetch question.');
              });
          };

          ctrl.openQuestionEditor = function() {
            QuestionUndoRedoService.clearChanges();
            ctrl.editorIsOpen = true;
            ImageLocalStorageService.flushStoredImagesData();
            if (ctrl.newQuestionIsBeingCreated) {
              ContextService.setImageSaveDestinationToLocalStorage();
            }
            $location.hash(ctrl.questionId);
          };

          ctrl.deleteQuestionFromSkill = function(
              questionId, skillDescription) {
            if (!ctrl.canEditQuestion()) {
              AlertsService.addWarning(
                'User does not have enough rights to delete the question');
              return;
            }
            _reInitializeSelectedSkillIds();
            // For the case when, it is in the skill editor.
            if (ctrl.getAllSkillSummaries().length === 0) {
              EditableQuestionBackendApiService.editQuestionSkillLinks(
                questionId, [{id: ctrl.selectedSkillId, task: 'remove'}]
              ).then(function() {
                QuestionsListService.resetPageNumber();
                QuestionsListService.getQuestionSummariesAsync(
                  ctrl.selectedSkillId, true, true
                );
                AlertsService.addSuccessMessage('Deleted Question');
              });
            } else {
              ctrl.getAllSkillSummaries().forEach(function(summary) {
                if (summary.getDescription() === skillDescription) {
                  EditableQuestionBackendApiService.editQuestionSkillLinks(
                    questionId, [{id: summary.getId(), task: 'remove'}]
                  ).then(function() {
                    QuestionsListService.resetPageNumber();
                    QuestionsListService.getQuestionSummariesAsync(
                      ctrl.selectedSkillId, true, true
                    );
                    AlertsService.addSuccessMessage('Deleted Question');
                  });
                }
              });
            }
          };

          ctrl.removeSkill = function(skillId) {
            if (ctrl.associatedSkillSummaries.length === 1) {
              AlertsService.addInfoMessage(
                'A question should be linked to at least one skill.');
              return;
            }
            ctrl.skillLinkageModificationsArray.push({
              id: skillId,
              task: 'remove'
            });
            ctrl.associatedSkillSummaries =
                ctrl.associatedSkillSummaries.filter(function(summary) {
                  return summary.getId() !== skillId;
                });
          };
          ctrl.isQuestionValid = function() {
            return Boolean(QuestionValidationService.isQuestionValid(
              ctrl.question, ctrl.misconceptionsBySkill) &&
                ctrl.newQuestionSkillDifficulties &&
                ctrl.newQuestionSkillDifficulties.length);
          };

          ctrl.showSolutionCheckpoint = function() {
            const interactionId = ctrl.question.getStateData().interaction.id;
            return (
              interactionId && INTERACTION_SPECS[
                interactionId].can_have_solution);
          };

          ctrl.addSkill = function() {
            var skillsInSameTopicCount =
                ctrl.getGroupedSkillSummaries().current.length;
            var sortedSkillSummaries =
                ctrl.getGroupedSkillSummaries().current.concat(
                  ctrl.getGroupedSkillSummaries().others);
            var allowSkillsFromOtherTopics = true;
            $uibModal.open({
              templateUrl:
                  UrlInterpolationService.getDirectiveTemplateUrl(
                    '/components/skill-selector/' +
                      'select-skill-modal.template.html'),
              backdrop: 'static',
              resolve: {
                skillsInSameTopicCount: () => skillsInSameTopicCount,
                sortedSkillSummaries: () => sortedSkillSummaries,
                categorizedSkills: () => ctrl.getSkillsCategorizedByTopics,
                allowSkillsFromOtherTopics: () => allowSkillsFromOtherTopics,
                untriagedSkillSummaries: () => ctrl.getUntriagedSkillSummaries
              },
              controller: 'SelectSkillModalController',
              windowClass: 'skill-select-modal',
              size: 'xl'
            }).result.then(function(summary) {
              for (var idx in ctrl.associatedSkillSummaries) {
                if (
                  ctrl.associatedSkillSummaries[idx].getId() ===
                    summary.id) {
                  AlertsService.addInfoMessage(
                    'Skill already linked to question');
                  return;
                }
              }

              ctrl.associatedSkillSummaries.push(
                ShortSkillSummaryObjectFactory.create(
                  summary.id, summary.description));
              ctrl.skillLinkageModificationsArray = [];
              ctrl.skillLinkageModificationsArray.push({
                id: summary.id,
                task: 'add'
              });
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is
              // clicked. No further action is needed.
            });
          };

          ctrl.updateSkillLinkage = function(commitMsg) {
            EditableQuestionBackendApiService.editQuestionSkillLinks(
              ctrl.questionId, ctrl.skillLinkageModificationsArray,
              ctrl.difficulty).then(
              data => {
                $timeout(function() {
                  QuestionsListService.resetPageNumber();
                  _reInitializeSelectedSkillIds();
                  QuestionsListService.getQuestionSummariesAsync(
                    ctrl.selectedSkillId, true, true
                  );
                  ctrl.editorIsOpen = false;
                  ctrl.saveAndPublishQuestion(commitMsg);
                }, 500);
              });
          };

          ctrl.saveQuestion = function() {
            ContextService.resetImageSaveDestination();
            $location.hash(null);
            if (ctrl.questionIsBeingUpdated) {
              $uibModal.open({
                templateUrl:
                      UrlInterpolationService.getDirectiveTemplateUrl(
                        '/components/question-directives' +
                          '/modal-templates/' +
                          'question-editor-save-modal.template.html'),
                backdrop: 'static',
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function(commitMessage) {
                if (ctrl.skillLinkageModificationsArray &&
                    ctrl.skillLinkageModificationsArray.length > 0) {
                  ctrl.updateSkillLinkage(commitMessage);
                } else {
                  ContextService.resetImageSaveDestination();
                  ctrl.saveAndPublishQuestion(commitMessage);
                }
              }, () => {
                // Note to developers:
                // This callback is triggered when the Cancel button is
                // clicked. No further action is needed.
              });
            } else {
              if (ctrl.skillLinkageModificationsArray.length > 0) {
                ctrl.updateSkillLinkage(null);
                SkillEditorRoutingService.creatingNewQuestion(false);
              } else {
                ContextService.resetImageSaveDestination();
                ctrl.saveAndPublishQuestion(null);
                SkillEditorRoutingService.creatingNewQuestion(false);
              }
            }
          };

          ctrl.getQuestionSummariesForOneSkill = function() {
            return QuestionsListService.getCachedQuestionSummaries();
          };
          ctrl.getCurrentPageNumber = function() {
            return QuestionsListService.getCurrentPageNumber();
          };

          ctrl.toggleDifficultyCard = function() {
            if (!WindowDimensionsService.isWindowNarrow()) {
              return;
            }
            ctrl.difficultyCardIsShown = !ctrl.difficultyCardIsShown;
          };

          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              QuestionsListService.onQuestionSummariesInitialized.subscribe(
                () => {
                  _initTab(false);
                  $rootScope.$apply();
                }));
            ctrl.showDifficultyChoices = false;
            ctrl.difficultyCardIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            ctrl.skillIds = [];
            ctrl.associatedSkillSummaries = [];
            ctrl.selectedSkillId = ctrl.getSelectedSkillId();
            ctrl.editorIsOpen = false;
            // The _initTab function is written separately since it is also
            // called in subscription when some external events are triggered.
            _initTab(true);
          };

          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
