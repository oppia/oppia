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
  'components/question-directives/modal-templates/' +
    'change-question-difficulty-modal.controller.ts');
require(
  'components/question-directives/modal-templates/' +
    'question-editor-modal.controller.ts');
require('directives/angular-html-bind.directive.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/ShortSkillSummaryObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/skill/skill-creation-backend-api.service.ts');
require('domain/skill/SkillDifficultyObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
    'state-editor.service.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
    'questions-list-select-skill-and-difficulty-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
    'topics-and-skills-dashboard-page.constants.ajs.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/image-local-storage.service.ts');
require('services/question-validation.service.ts');


angular.module('oppia').factory('QuestionCreationService', [
  '$location', '$uibModal', 'AlertsService',
  'EditableQuestionBackendApiService', 'ImageLocalStorageService',
  'MisconceptionObjectFactory', 'QuestionObjectFactory',
  'QuestionUndoRedoService', 'SkillBackendApiService',
  'SkillDifficultyObjectFactory', 'SkillEditorStateService',
  'UrlInterpolationService', 'DEFAULT_SKILL_DIFFICULTY',
  'MODE_SELECT_DIFFICULTY', 'SKILL_DIFFICULTIES',
  function(
      $location, $uibModal, AlertsService,
      EditableQuestionBackendApiService, ImageLocalStorageService,
      MisconceptionObjectFactory, QuestionObjectFactory,
      QuestionUndoRedoService, SkillBackendApiService,
      SkillDifficultyObjectFactory, SkillEditorStateService,
      UrlInterpolationService, DEFAULT_SKILL_DIFFICULTY,
      MODE_SELECT_DIFFICULTY, SKILL_DIFFICULTIES) {
    var newQuestionSkillDifficulties = [];
    var question = null;
    var skill = null;
    var skillId = null;
    var questionId = null;
    var questionStateData = null;
    var questionIsBeingUpdated = null;
    var newQuestionIsBeingCreated = null;
    var skillIdToRubricsObject = {};
    var misconceptionsBySkill = {};
    var groupedSkillSummaries = null;
    var newQuestionSkillIds = [];

    var populateMisconceptions = function() {
      SkillBackendApiService.fetchMultiSkills(
        newQuestionSkillIds).then(
        function(skillDicts) {
          skillDicts.forEach(function(skillDict) {
            misconceptionsBySkill[skillDict.id] =
                  skillDict.misconceptions.map(
                    function(misconceptionsBackendDict) {
                      return MisconceptionObjectFactory
                        .createFromBackendDict(misconceptionsBackendDict);
                    });
          });
        }, function(error) {
          AlertsService.addWarning();
        });
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
          SkillDifficultyObjectFactory.create(
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
          summary.isSelected = false;
          return summary;
        });
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/topic-editor-page/modal-templates/' +
            'select-skill-and-difficulty-modal.template.html'),
        backdrop: true,
        resolve: {
          allSkillSummaries: () => allSkillSummaries,
          countOfSkillsToPrioritize: () => countOfSkillsToPrioritize,
          currentMode: () => currentMode,
          linkedSkillsWithDifficulty: () => linkedSkillsWithDifficulty,
          skillIdToRubricsObject: () => skillIdToRubricsObject
        },
        controller: 'QuestionsListSelectSkillAndDifficultyModalController'
      }).result.then(function(linkedSkillsWithDifficulty) {
        newQuestionSkillIds = [];
        newQuestionSkillDifficulties = [];
        linkedSkillsWithDifficulty.forEach(
          function(linkedSkillWithDifficulty) {
            newQuestionSkillIds.push(
              linkedSkillWithDifficulty.getId());
            newQuestionSkillDifficulties.push(
              linkedSkillWithDifficulty.getDifficulty());
          });

        populateMisconceptions();
        if (AlertsService.warnings.length === 0) {
          initializeNewQuestionCreation();
        }
      }, function() {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    var initializeNewQuestionCreation = function() {
      question =
          QuestionObjectFactory.createDefaultQuestion(newQuestionSkillIds);
      questionId = question.getId();
      questionStateData = question.getStateData();
      questionIsBeingUpdated = false;
      newQuestionIsBeingCreated = true;
      openQuestionEditor(newQuestionSkillDifficulties[0]);
    };

    var getDifficultyString = function(difficulty) {
      if (difficulty === 0.3) {
        return SKILL_DIFFICULTIES[0];
      } else if (difficulty === 0.6) {
        return SKILL_DIFFICULTIES[1];
      } else {
        return SKILL_DIFFICULTIES[2];
      }
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
      EditableQuestionBackendApiService.createQuestion(
        newQuestionSkillIds, newQuestionSkillDifficulties,
        question.toBackendDict(true), imagesData);
    };

    var openQuestionEditor = function(questionDifficulty) {
      var canEditQuestion = true;
      var newQuestionIsBeingCreated = true;

      QuestionUndoRedoService.clearChanges();
      var editorIsOpen = true;
      var selectedSkillId = SkillEditorStateService.getSkill().getId();
      $location.hash(questionId);
      var skillIdToNameMapping = (
        [].reduce((obj, skill) => (
          obj[skill.getId()] = skill.getDescription(), obj), {}));
      var skillNames = [];
      var rubrics = [];
      skillNames = [skillIdToNameMapping[selectedSkillId]];
      rubrics = [skillIdToRubricsObject[selectedSkillId].find(
        rubric => rubric.getDifficulty() === getDifficultyString(
          parseFloat(questionDifficulty)))];
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/components/question-directives/modal-templates/' +
            'question-editor-modal.directive.html'),
        backdrop: 'static',
        keyboard: false,
        resolve: {
          associatedSkillSummaries: () => [],
          canEditQuestion: () => canEditQuestion,
          categorizedSkills: () => [],
          groupedSkillSummaries: () => groupedSkillSummaries,
          misconceptionsBySkill: () => misconceptionsBySkill,
          newQuestionIsBeingCreated: () => newQuestionIsBeingCreated,
          question: () => question,
          questionId: () => questionId,
          questionStateData: () => questionStateData,
          rubrics: () => rubrics,
          skillNames: () => skillNames
        },
        controller: 'QuestionEditorModalController',
      }).result.then(function() {
        $location.hash(null);
        editorIsOpen = false;
        saveAndPublishQuestion();
      });
    };
    return {
      createQuestion: createQuestion,
      initializeNewQuestionCreation: initializeNewQuestionCreation,
      openQuestionEditor: openQuestionEditor,
      saveAndPublishQuestion: saveAndPublishQuestion,
      getDifficultyString: getDifficultyString,
      populateMisconceptions: populateMisconceptions,
    };
  }
]);
