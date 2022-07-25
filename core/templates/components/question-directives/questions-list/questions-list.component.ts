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
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

require('directives/angular-html-bind.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/question-difficulty-selector/' +
  'question-difficulty-selector.component.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.component.ts');
require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ajs.ts');
require(
  'components/skill-selector/' +
  'questions-list-select-skill-modal.controller.ts');
require(
  'components/skill-selector/skill-selector.component.ts');

require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/skill-editor-page/services/skill-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/image-local-storage.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/ngb-modal.service.ts');
require('services/stateful/focus-manager.service.ts');

import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { Subscription } from 'rxjs';
import { ConfirmQuestionExitModalComponent } from '../modal-templates/confirm-question-exit-modal.component';
import { QuestionEditorSaveModalComponent } from '../modal-templates/question-editor-save-modal.component';
import { AssignedSkill } from 'domain/skill/assigned-skill.model';

angular.module('oppia').component('questionsList', {
  bindings: {
    skillDescriptionsAreShown: '&skillDescriptionsAreShown',
    selectSkillModalIsShown: '&selectSkillModalIsShown',
    getSkillIds: '&skillIds',
    getAllSkillSummaries: '&allSkillSummaries',
    canEditQuestion: '&',
    getSkillIdToRubricsObject: '&skillIdToRubricsObject',
    getSelectedSkillId: '&selectedSkillId',
    getGroupedSkillSummaries: '&groupedSkillSummaries',
    getSkillsCategorizedByTopics: '=',
    getUntriagedSkillSummaries: '='
  },
  template: require('./questions-list.component.html'),
  controller: [
    '$location', '$rootScope', '$timeout', 'AlertsService',
    'ContextService', 'EditableQuestionBackendApiService',
    'FocusManagerService', 'ImageLocalStorageService',
    'MisconceptionObjectFactory', 'NgbModal',
    'QuestionObjectFactory', 'QuestionUndoRedoService',
    'QuestionValidationService', 'QuestionsListService',
    'SkillBackendApiService', 'SkillEditorRoutingService',
    'TopicsAndSkillsDashboardBackendApiService', 'UtilsService',
    'WindowDimensionsService', 'DEFAULT_SKILL_DIFFICULTY', 'INTERACTION_SPECS',
    'MINIMUM_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL',
    'NUM_QUESTIONS_PER_PAGE',
    function(
        $location, $rootScope, $timeout, AlertsService,
        ContextService, EditableQuestionBackendApiService,
        FocusManagerService, ImageLocalStorageService,
        MisconceptionObjectFactory, NgbModal,
        QuestionObjectFactory, QuestionUndoRedoService,
        QuestionValidationService, QuestionsListService,
        SkillBackendApiService, SkillEditorRoutingService,
        TopicsAndSkillsDashboardBackendApiService, UtilsService,
        WindowDimensionsService, DEFAULT_SKILL_DIFFICULTY, INTERACTION_SPECS,
        MINIMUM_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL,
        NUM_QUESTIONS_PER_PAGE) {
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
        ctrl.questionIsBeingUpdated = false;
        ctrl.misconceptionsBySkill = {};
        ctrl.misconceptionIdsForSelectedSkill = [];
        if (ctrl.getSelectedSkillId()) {
          SkillBackendApiService.fetchSkillAsync(
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
        } else {
          QuestionsListService.getQuestionSummariesAsync(
            ctrl.selectedSkillId, resetHistoryAndFetch,
            resetHistoryAndFetch
          );
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
          EditableQuestionBackendApiService.createQuestionAsync(
            ctrl.newQuestionSkillIds, ctrl.newQuestionSkillDifficulties,
            ctrl.question.toBackendDict(true), imagesData
          ).then(function(response) {
            if (ctrl.skillLinkageModificationsArray &&
                ctrl.skillLinkageModificationsArray.length > 0) {
              EditableQuestionBackendApiService.editQuestionSkillLinksAsync(
                response.questionId, ctrl.skillLinkageModificationsArray
              );
            }
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
              EditableQuestionBackendApiService.updateQuestionAsync(
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
        NgbModal.open(ConfirmQuestionExitModalComponent, {
          backdrop: true,
        }).result.then(function() {
          ContextService.resetImageSaveDestination();
          ctrl.editorIsOpen = false;
          $location.hash(null);
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
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
        ctrl.questionStateData = ctrl.question?.getStateData();
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
        ctrl.initiateQuestionCreation();
      };

      ctrl.updateSkillWithDifficulty = function($event, $index) {
        this.linkedSkillsWithDifficulty[$index] = $event;
        ctrl.changeLinkedSkillDifficulty();
      };

      ctrl.changeLinkedSkillDifficulty = function() {
        ctrl.isSkillDifficultyChanged = true;
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
        ctrl.linkedSkillsWithDifficulty.forEach(
          (linkedSkillWithDifficulty) => {
            ctrl.skillLinkageModificationsArray.push({
              id: linkedSkillWithDifficulty.getId(),
              task: 'update_difficulty',
              difficulty: linkedSkillWithDifficulty.getDifficulty()
            });
          });
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
            FocusManagerService.setFocus('difficultySelectionDiv');
          });
        ctrl.populateMisconceptions(ctrl.newQuestionSkillIds);
        if (AlertsService.warnings.length === 0) {
          ImageLocalStorageService.flushStoredImagesData();
          ContextService.setImageSaveDestinationToLocalStorage();
          ctrl.initializeNewQuestionCreation(
            ctrl.newQuestionSkillIds);
          ctrl.editorIsOpen = true;
        }
        ctrl.skillLinkageModificationsArray = [];
        ctrl.isSkillDifficultyChanged = false;
      };

      ctrl.populateMisconceptions = function(skillIds) {
        ctrl.misconceptionsBySkill = {};
        SkillBackendApiService.fetchMultiSkillsAsync(
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
        ctrl.skillLinkageModificationsArray = [];
        ctrl.isSkillDifficultyChanged = false;
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
        EditableQuestionBackendApiService.fetchQuestionAsync(
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
                  ShortSkillSummary.create(
                    skillDict.id, skillDict.description));
              });
            }
            ctrl.question = angular.copy(response.questionObject);
            ctrl.questionId = ctrl.question.getId();
            ctrl.questionStateData = ctrl.question?.getStateData();
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

      ctrl.deleteQuestionFromSkill = async function(
          questionId, skillDescription) {
        if (!ctrl.canEditQuestion()) {
          AlertsService.addWarning(
            'User does not have enough rights to delete the question');
          return;
        }

        let skillIsAssginedForDiagnosticTest = false;
        await TopicsAndSkillsDashboardBackendApiService
          .fetchTopicAssignmentsForSkillAsync(
            ctrl.selectedSkillId).then((response: AssignedSkill[]) => {
            response.map((topic) => {
              if (topic.skillIdsForDiagnosticTest.includes(
                ctrl.selectedSkillId)) {
                skillIsAssginedForDiagnosticTest = true;
              }
            });
          });

        // Should not allow question deletion if the current skill is attached
        // to the diagnostic test, and has the minimum number of questions for
        // the diagnostic test.
        if (skillIsAssginedForDiagnosticTest &&
            ctrl.getQuestionSummariesForOneSkill().length <=
            MINIMUM_QUESTION_COUNT_FOR_A_DIAGNOSTIC_TEST_SKILL) {
          AlertsService.addInfoMessage(
            'The skill must be removed from the diagnostic test first.');
          return;
        }
        ctrl.deletedQuestionIds.push(questionId);
        _reInitializeSelectedSkillIds();
        // For the case when, it is in the skill editor.
        if (ctrl.getAllSkillSummaries().length === 0) {
          EditableQuestionBackendApiService.editQuestionSkillLinksAsync(
            questionId, [{id: ctrl.selectedSkillId, task: 'remove'}]
          ).then(function() {
            QuestionsListService.resetPageNumber();
            QuestionsListService.getQuestionSummariesAsync(
              ctrl.selectedSkillId, true, true);
            AlertsService.addSuccessMessage('Deleted Question');
            _removeArrayElement(questionId);
          });
        } else {
          ctrl.getAllSkillSummaries().forEach(function(summary) {
            if (summary.getDescription() === skillDescription) {
              EditableQuestionBackendApiService.editQuestionSkillLinksAsync(
                questionId, [{id: summary.getId(), task: 'remove'}]
              ).then(function() {
                QuestionsListService.resetPageNumber();
                QuestionsListService.getQuestionSummariesAsync(
                  ctrl.selectedSkillId, true, true);
                AlertsService.addSuccessMessage('Deleted Question');
                _removeArrayElement(questionId);
              });
            }
          });
        }
      };

      var _removeArrayElement = function(questionId) {
        var index = ctrl.deletedQuestionIds.indexOf(questionId);
        if (index > -1) {
          ctrl.deletedQuestionIds.splice(index, 1);
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
        ctrl.updateSkillLinkage();
      };
      ctrl.isQuestionSavable = function() {
        // Not savable if there are no changes.
        if (!QuestionUndoRedoService.hasChanges() && (
          ctrl.skillLinkageModificationsArray &&
          ctrl.skillLinkageModificationsArray.length === 0
        ) && !ctrl.isSkillDifficultyChanged) {
          return false;
        }
        let questionIdValid = QuestionValidationService.isQuestionValid(
          ctrl.question, ctrl.misconceptionsBySkill);
        if (!ctrl.questionIsBeingUpdated) {
          return Boolean(
            questionIdValid &&
            ctrl.newQuestionSkillDifficulties &&
            ctrl.newQuestionSkillDifficulties.length);
        }
        return questionIdValid;
      };

      ctrl.showSolutionCheckpoint = function() {
        const interactionId = ctrl.question?.getStateData().interaction.id;
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
        let modalRef: NgbModalRef = NgbModal.open(
          SelectSkillModalComponent, {
            backdrop: 'static',
            windowClass: 'skill-select-modal',
            size: 'xl'
          });
        modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
        modalRef.componentInstance.skillsInSameTopicCount = (
          skillsInSameTopicCount);
        modalRef.componentInstance.categorizedSkills = (
          ctrl.getSkillsCategorizedByTopics);
        modalRef.componentInstance.allowSkillsFromOtherTopics = (
          allowSkillsFromOtherTopics);
        modalRef.componentInstance.untriagedSkillSummaries = (
          ctrl.getUntriagedSkillSummaries);
        modalRef.result.then(function(summary) {
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
            ShortSkillSummary.create(
              summary.id, summary.description));
          ctrl.skillLinkageModificationsArray = [];
          ctrl.skillLinkageModificationsArray.push({
            id: summary.id,
            task: 'add',
            difficulty: DEFAULT_SKILL_DIFFICULTY
          });
          ctrl.updateSkillLinkage();
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      };

      ctrl.updateSkillLinkageAndQuestions = function(commitMsg) {
        EditableQuestionBackendApiService.editQuestionSkillLinksAsync(
          ctrl.questionId, ctrl.skillLinkageModificationsArray
        ).then(
          data => {
            ctrl.skillLinkageModificationsArray = [];
            $timeout(function() {
              QuestionsListService.resetPageNumber();
              _reInitializeSelectedSkillIds();
              QuestionsListService.getQuestionSummariesAsync(
                ctrl.selectedSkillId, true, true
              );
              ctrl.editorIsOpen = false;
              ctrl.saveAndPublishQuestion(commitMsg);
            }, 500);
            $rootScope.$apply();
          });
      };

      ctrl.updateSkillLinkage = function() {
        EditableQuestionBackendApiService.editQuestionSkillLinksAsync(
          ctrl.questionId, ctrl.skillLinkageModificationsArray
        ).then(
          data => {
            ctrl.skillLinkageModificationsArray = [];
            $rootScope.$apply();
          });
      };

      ctrl.saveQuestion = function() {
        ContextService.resetImageSaveDestination();
        $location.hash(null);
        if (ctrl.questionIsBeingUpdated) {
          NgbModal.open(QuestionEditorSaveModalComponent, {
            backdrop: 'static',
          }).result.then(function(commitMessage) {
            if (ctrl.skillLinkageModificationsArray &&
                ctrl.skillLinkageModificationsArray.length > 0) {
              ctrl.updateSkillLinkageAndQuestions(commitMessage);
            } else {
              ContextService.resetImageSaveDestination();
              ctrl.saveAndPublishQuestion(commitMessage);
            }
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$apply();
          }, () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is
            // clicked. No further action is needed.
          });
        } else {
          ContextService.resetImageSaveDestination();
          ctrl.saveAndPublishQuestion(null);
          SkillEditorRoutingService.creatingNewQuestion(false);
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
              FocusManagerService.setFocus('newQuestionBtn');
              $rootScope.$apply();
            }));
        ctrl.showDifficultyChoices = false;
        ctrl.difficultyCardIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        ctrl.skillIds = [];
        ctrl.associatedSkillSummaries = [];
        ctrl.selectedSkillId = ctrl.getSelectedSkillId();
        ctrl.editorIsOpen = false;
        ctrl.deletedQuestionIds = [];
        // The _initTab function is written separately since it is also
        // called in subscription when some external events are triggered.
        _initTab(true);
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
