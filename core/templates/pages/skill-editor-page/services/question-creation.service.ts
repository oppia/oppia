// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for creating a new question.
 */
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { QuestionsListSelectSkillAndDifficultyModalComponent } from 'pages/topic-editor-page/modal-templates/questions-list-select-skill-and-difficulty-modal.component';

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
  'components/question-directives/modal-templates/' +
    'question-editor-modal.controller.ts');
require('directives/angular-html-bind.directive.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/skill/skill-creation-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
    'state-editor.service.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
    'topics-and-skills-dashboard-page.constants.ajs.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').factory('QuestionCreationService', [
  '$location', '$rootScope', '$uibModal', 'AlertsService',
  'EditableQuestionBackendApiService', 'ImageLocalStorageService',
  'NgbModal', 'QuestionObjectFactory',
  'QuestionUndoRedoService', 'SkillBackendApiService',
  'SkillEditorStateService', 'UrlInterpolationService',
  'DEFAULT_SKILL_DIFFICULTY', 'MODE_SELECT_DIFFICULTY',
  'SKILL_DIFFICULTY_LABEL_TO_FLOAT',
  function(
      $location, $rootScope, $uibModal, AlertsService,
      EditableQuestionBackendApiService, ImageLocalStorageService,
      NgbModal, QuestionObjectFactory,
      QuestionUndoRedoService, SkillBackendApiService,
      SkillEditorStateService, UrlInterpolationService,
      DEFAULT_SKILL_DIFFICULTY, MODE_SELECT_DIFFICULTY,
      SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
    var newQuestionSkillDifficulties = [];
    var question = null;
    var skill = null;
    var skillId = null;
    var questionId = null;
    var questionStateData = null;
    var skillIdToRubricsObject = {};
    var misconceptionsBySkill = {};
    var groupedSkillSummaries = null;
    var newQuestionSkillIds = [];

    var populateMisconceptions = function() {
      SkillBackendApiService.fetchMultiSkillsAsync(
        newQuestionSkillIds).then(
        function(skills) {
          skills.forEach(function(skill) {
            misconceptionsBySkill[skill.getId()] =
              skill.getMisconceptions();
          });
          $rootScope.$apply();
        }, function(error) {
          AlertsService.addWarning();
        });
    };

    var continueQuestionEditing = function(linkedSkillsWithDifficulty) {
      newQuestionSkillIds = [];
      newQuestionSkillDifficulties = [];
      linkedSkillsWithDifficulty.forEach(function(linkedSkillWithDifficulty) {
        newQuestionSkillIds.push(linkedSkillWithDifficulty.getId());
        newQuestionSkillDifficulties.push(
          linkedSkillWithDifficulty.getDifficulty());
      });

      populateMisconceptions();
      if (AlertsService.warnings.length === 0) {
        initializeNewQuestionCreation();
      }
    };

    var createQuestion = function() {
      newQuestionSkillIds = [];
      skill = SkillEditorStateService.getSkill();
      skillId = SkillEditorStateService.getSkill().getId();
      skillIdToRubricsObject[skillId] = skill.getRubrics();

      newQuestionSkillIds = [skillId];
      var currentMode = MODE_SELECT_DIFFICULTY;

      var linkedSkillsWithDifficulty = [];
      newQuestionSkillIds.forEach(function(skillId) {
        linkedSkillsWithDifficulty.push(
          SkillDifficulty.create(
            skillId, '', DEFAULT_SKILL_DIFFICULTY));
      });
      groupedSkillSummaries = (
        SkillEditorStateService.getGroupedSkillSummaries());
      var sortedSkillSummaries =
          groupedSkillSummaries.current.concat(
            groupedSkillSummaries.others);
      var countOfSkillsToPrioritize =
          groupedSkillSummaries.current.length;
      var allSkillSummaries = sortedSkillSummaries.map(
        function(summary) {
          return summary;
        });

      var noOfRubricsWithExplanation = 0;
      for (var rubric of skillIdToRubricsObject[skillId]) {
        if (rubric.getExplanations().length > 0) {
          noOfRubricsWithExplanation++;
        }
      }

      if (noOfRubricsWithExplanation > 1) {
        let modalRef: NgbModalRef = NgbModal.open(
          QuestionsListSelectSkillAndDifficultyModalComponent, {
            backdrop: 'static'
          });
        modalRef.componentInstance.allSkillSummaries = (
          allSkillSummaries);
        modalRef.componentInstance.countOfSkillsToPrioritize = (
          countOfSkillsToPrioritize);
        modalRef.componentInstance.currentMode = currentMode;
        modalRef.componentInstance.linkedSkillsWithDifficulty = (
          linkedSkillsWithDifficulty);
        modalRef.componentInstance.skillIdToRubricsObject = (
          skillIdToRubricsObject);
        modalRef.result.then(function(linkedSkillsWithDifficulty) {
          continueQuestionEditing(linkedSkillsWithDifficulty);
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      } else {
        for (var rubric of skillIdToRubricsObject[skillId]) {
          if (rubric.getExplanations().length > 0) {
            var rubricDifficulty = SKILL_DIFFICULTY_LABEL_TO_FLOAT[
              rubric.getDifficulty()];
            linkedSkillsWithDifficulty[0].setDifficulty(rubricDifficulty);
            break;
          }
        }
        continueQuestionEditing(linkedSkillsWithDifficulty);
      }
    };

    var initializeNewQuestionCreation = function() {
      question =
          QuestionObjectFactory.createDefaultQuestion(newQuestionSkillIds);
      questionId = question.getId();
      questionStateData = question.getStateData();
      openQuestionEditor(newQuestionSkillDifficulties[0]);
    };

    var saveAndPublishQuestion = function() {
      var validationErrors = question.getValidationErrorMessage();
      var unaddressedMisconceptions = (
        question.getUnaddressedMisconceptionNames(
          misconceptionsBySkill));
      var unaddressedMisconceptionsErrorString = (
        `Remaining misconceptions that need to be addressed: ${
          unaddressedMisconceptions.join(', ')}`);

      if (validationErrors || unaddressedMisconceptions.length) {
        AlertsService.addWarning(
          validationErrors || unaddressedMisconceptionsErrorString);
        return;
      }
      var imagesData = ImageLocalStorageService.getStoredImagesData();
      ImageLocalStorageService.flushStoredImagesData();
      EditableQuestionBackendApiService.createQuestionAsync(
        newQuestionSkillIds, newQuestionSkillDifficulties,
        question.toBackendDict(true), imagesData);
    };

    var openQuestionEditor = function(questionDifficulty) {
      var canEditQuestion = true;
      var newQuestionIsBeingCreated = true;

      QuestionUndoRedoService.clearChanges();
      var selectedSkillId = SkillEditorStateService.getSkill().getId();
      $location.hash(questionId);
      var skillName = SkillEditorStateService.getSkill().getDescription();
      var skillDifficultyMapping = SKILL_DIFFICULTY_LABEL_TO_FLOAT;
      var rubric = skillIdToRubricsObject[selectedSkillId].find(
        rubric => skillDifficultyMapping[rubric.getDifficulty()] === parseFloat(
          questionDifficulty));

      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/components/question-directives/modal-templates/' +
            'question-editor-modal.directive.html'),
        backdrop: 'static',
        keyboard: false,
        resolve: {
          associatedSkillSummaries: () => [],
          untriagedSkillSummaries: () => [],
          canEditQuestion: () => canEditQuestion,
          categorizedSkills: () => [],
          groupedSkillSummaries: () => groupedSkillSummaries,
          misconceptionsBySkill: () => misconceptionsBySkill,
          newQuestionIsBeingCreated: () => newQuestionIsBeingCreated,
          question: () => question,
          questionId: () => questionId,
          questionStateData: () => questionStateData,
          rubric: () => rubric,
          skillName: () => skillName
        },
        controller: 'QuestionEditorModalController',
      }).result.then(function() {
        $location.hash(null);
        saveAndPublishQuestion();
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };
    return {
      createQuestion: createQuestion,
      initializeNewQuestionCreation: initializeNewQuestionCreation,
      openQuestionEditor: openQuestionEditor,
      saveAndPublishQuestion: saveAndPublishQuestion,
      populateMisconceptions: populateMisconceptions,
    };
  }
]);
