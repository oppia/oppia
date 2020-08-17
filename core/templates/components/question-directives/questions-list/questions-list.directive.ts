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
  'change-question-difficulty-modal.controller.ts');
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
require('domain/skill/SkillDifficultyObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/skill-editor-page/services/question-creation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/image-local-storage.service.ts');
require('services/question-validation.service.ts');

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
        getQuestionSummariesAsync: '=',
        isLastPage: '=isLastQuestionBatch',
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
        '$scope', '$filter', '$http', '$q', '$timeout', '$uibModal', '$window',
        '$location', 'AlertsService', 'ContextService',
        'EditableQuestionBackendApiService', 'ImageLocalStorageService',
        'MisconceptionObjectFactory', 'QuestionCreationService',
        'QuestionObjectFactory', 'QuestionsListService',
        'QuestionUndoRedoService', 'QuestionValidationService',
        'SkillBackendApiService',
        'SkillDifficultyObjectFactory', 'ShortSkillSummaryObjectFactory',
        'StateEditorService', 'UndoRedoService',
        'UrlService', 'DEFAULT_SKILL_DIFFICULTY',
        'MODE_SELECT_DIFFICULTY',
        'MODE_SELECT_SKILL', 'NUM_QUESTIONS_PER_PAGE',
        function(
            $scope, $filter, $http, $q, $timeout, $uibModal, $window,
            $location, AlertsService, ContextService,
            EditableQuestionBackendApiService, ImageLocalStorageService,
            MisconceptionObjectFactory, QuestionCreationService,
            QuestionObjectFactory, QuestionsListService,
            QuestionUndoRedoService, QuestionValidationService,
            SkillBackendApiService,
            SkillDifficultyObjectFactory, ShortSkillSummaryObjectFactory,
            StateEditorService, UndoRedoService,
            UrlService, DEFAULT_SKILL_DIFFICULTY,
            MODE_SELECT_DIFFICULTY,
            MODE_SELECT_SKILL, NUM_QUESTIONS_PER_PAGE) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var _reInitializeSelectedSkillIds = function() {
            ctrl.selectedSkillId = ctrl.getSelectedSkillId();
            if (ctrl.selectedSkillId !== null) {
              ctrl.selectedSkillIds = [ctrl.selectedSkillId];
            } else {
              ctrl.selectedSkillIds = [];
            }
          };

          var _initTab = function(resetHistoryAndFetch) {
            ctrl.skillIds = ctrl.getSkillIds();
            ctrl.questionEditorIsShown = false;
            ctrl.question = null;
            _reInitializeSelectedSkillIds();
            ctrl.getQuestionSummariesAsync(
              ctrl.selectedSkillIds, resetHistoryAndFetch,
              resetHistoryAndFetch
            );
            ctrl.questionIsBeingUpdated = false;
            ctrl.misconceptionsBySkill = {};
          };

          ctrl.getQuestionIndex = function(index) {
            return (
              QuestionsListService.getCurrentPageNumber() *
              NUM_QUESTIONS_PER_PAGE + index + 1);
          };

          ctrl.goToNextPage = function() {
            _reInitializeSelectedSkillIds();
            QuestionsListService.incrementPageNumber();
            ctrl.getQuestionSummariesAsync(
              ctrl.selectedSkillIds, true, false
            );
          };

          ctrl.goToPreviousPage = function() {
            _reInitializeSelectedSkillIds();
            QuestionsListService.decrementPageNumber();
            ctrl.getQuestionSummariesAsync(
              ctrl.selectedSkillIds, false, false
            );
          };

          ctrl.getDifficultyString = (
            QuestionCreationService.getDifficultyString);

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
                ctrl.getQuestionSummariesAsync(
                  ctrl.selectedSkillIds, true, true
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
                      ctrl.getQuestionSummariesAsync(
                        ctrl.selectedSkillIds, true, true
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
            return '/skill_editor/' + skillId;
          };

          ctrl.cancel = function() {
            ContextService.resetImageSaveDestination();
            ctrl.editorIsOpen = false;
            $location.hash(null);
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
            var currentMode = MODE_SELECT_SKILL;
            ctrl.skillIdToRubricsObject = ctrl.getSkillIdToRubricsObject();
            if (!ctrl.selectSkillModalIsShown()) {
              ctrl.newQuestionSkillIds = ctrl.skillIds;
              currentMode = MODE_SELECT_DIFFICULTY;
            } else {
              ctrl.newQuestionSkillIds = [ctrl.getSelectedSkillId()];
            }

            ctrl.linkedSkillsWithDifficulty = [];
            ctrl.newQuestionSkillIds.forEach(function(skillId) {
              ctrl.linkedSkillsWithDifficulty.push(
                SkillDifficultyObjectFactory.create(
                  skillId, '', DEFAULT_SKILL_DIFFICULTY));
            });
            ctrl.showDifficultyChoices = true;
          };

          ctrl.initiateQuestionCreation = function(linkedSkillsWithDifficulty) {
            ctrl.showDifficultyChoices = false;
            ctrl.newQuestionSkillIds = [];
            ctrl.associatedSkillSummaries = [];
            ctrl.newQuestionSkillDifficulties = [];
            linkedSkillsWithDifficulty.forEach((linkedSkillWithDifficulty) => {
              ctrl.newQuestionSkillIds.push(
                linkedSkillWithDifficulty.getId());
              ctrl.newQuestionSkillDifficulties.push(
                linkedSkillWithDifficulty.getDifficulty());
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
              function(skillDicts) {
                skillDicts.forEach(function(skillDict) {
                  ctrl.misconceptionsBySkill[skillDict.id] =
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

          ctrl.editQuestion = function(questionSummaryForOneSkill, difficulty) {
            if (ctrl.editorIsOpen) {
              return;
            }
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
                ctrl.openQuestionEditor(difficulty);
              }, function(errorResponse) {
                AlertsService.addWarning(
                  errorResponse.error || 'Failed to fetch question.');
              });
          };

          ctrl.deleteQuestionFromSkill = function(
              questionId, skillDescription) {
            if (!ctrl.canEditQuestion()) {
              AlertsService.addWarning(
                'User does not have enough rights to delete the question');
              return;
            }
            _reInitializeSelectedSkillIds();
            var skillId = null;
            // For the case when, it is in the skill editor.
            if (ctrl.getAllSkillSummaries().length === 0) {
              EditableQuestionBackendApiService.editQuestionSkillLinks(
                questionId, [{id: ctrl.selectedSkillId, task: 'remove'}]
              ).then(function() {
                QuestionsListService.resetPageNumber();
                ctrl.getQuestionSummariesAsync(
                  ctrl.selectedSkillIds, true, true
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
                    ctrl.getQuestionSummariesAsync(
                      ctrl.selectedSkillIds, true, true
                    );
                    AlertsService.addSuccessMessage('Deleted Question');
                  });
                }
              });
            }
          };

          ctrl.changeDifficulty = function(
              questionId, skillDescription, skillDifficulty) {
            if (!ctrl.canEditQuestion()) {
              AlertsService.addWarning(
                'User does not have enough rights to edit the question');
              return;
            }
            var linkedSkillsWithDifficulty = [];
            if (ctrl.getAllSkillSummaries().length === 0) {
              linkedSkillsWithDifficulty.push(
                SkillDifficultyObjectFactory.create(
                  ctrl.selectedSkillId, skillDescription,
                  skillDifficulty)
              );
            } else {
              var allSkillSummaries = ctrl.getAllSkillSummaries().filter(
                function(summary) {
                  return skillDescription === summary.getDescription();
                });
              for (var idx in allSkillSummaries) {
                linkedSkillsWithDifficulty.push(
                  SkillDifficultyObjectFactory.create(
                    allSkillSummaries[idx].getId(),
                    allSkillSummaries[idx].getDescription(),
                    skillDifficulty));
              }
            }
            var oldLinkedSkillWithDifficulty = angular.copy(
              linkedSkillsWithDifficulty);
            var skillIdToRubricsObject = ctrl.getSkillIdToRubricsObject();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/question-directives/modal-templates/' +
                'change-question-difficulty-modal.template.html'),
              backdrop: true,
              resolve: {
                linkedSkillsWithDifficulty: () => linkedSkillsWithDifficulty,
                skillIdToRubricsObject: () => skillIdToRubricsObject
              },
              controller: 'ChangeQuestionDifficultyModalController'
            }).result.then(function(linkedSkillsWithDifficulty) {
              var changedDifficultyCount = 0, count = 0;
              _reInitializeSelectedSkillIds();
              for (var idx in linkedSkillsWithDifficulty) {
                var object = linkedSkillsWithDifficulty[idx];
                if (
                  object.getDifficulty() !==
                  oldLinkedSkillWithDifficulty[idx].getDifficulty()) {
                  changedDifficultyCount++;
                }
              }
              for (var idx in linkedSkillsWithDifficulty) {
                var object = linkedSkillsWithDifficulty[idx];
                if (
                  object.getDifficulty() !==
                  oldLinkedSkillWithDifficulty[idx].getDifficulty()) {
                  EditableQuestionBackendApiService.changeDifficulty(
                    questionId, object.getId(), object.getDifficulty()).then(
                    function() {
                      count++;
                      if (count === changedDifficultyCount) {
                        $timeout(function() {
                          QuestionsListService.resetPageNumber();
                          ctrl.getQuestionSummariesAsync(
                            ctrl.selectedSkillIds, true, true
                          );
                          AlertsService.addSuccessMessage('Updated Difficulty');
                        }, 100 * count);
                      }
                    });
                }
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
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
            return QuestionValidationService.isQuestionValid(
              ctrl.question, ctrl.misconceptionsBySkill);
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
              backdrop: true,
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
                  ctrl.getQuestionSummariesAsync(
                    ctrl.selectedSkillIds, true, true
                  );
                  ctrl.editorIsOpen = false;
                  ctrl.saveAndPublishQuestion(commitMsg);
                }, 500);
              });
          };

          ctrl.saveQuestion = function() {
            ContextService.resetImageSaveDestination();
            $location.hash(null);
            var commitMessage = null;
            if (ctrl.questionIsBeingUpdated) {
              $uibModal.open({
                templateUrl:
                      UrlInterpolationService.getDirectiveTemplateUrl(
                        '/components/question-directives' +
                          '/modal-templates/' +
                          'question-editor-save-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function(commitMsg) {
                commitMessage = commitMsg;
                if (ctrl.skillLinkageModificationsArray.length > 0) {
                  ctrl.updateSkillLinkage(commitMessage);
                } else {
                  ContextService.resetImageSaveDestination();
                  ctrl.saveAndPublishQuestion(commitMessage);
                }
              });
            } else {
              if (ctrl.skillLinkageModificationsArray.length > 0) {
                ctrl.updateSkillLinkage(null);
              } else {
                ContextService.resetImageSaveDestination();
                ctrl.saveAndPublishQuestion(null);
              }
            }
          };

          ctrl.getQuestionSummariesForOneSkill = function() {
            return QuestionsListService.getCachedQuestionSummaries();
          };
          ctrl.getCurrentPageNumber = function() {
            return QuestionsListService.getCurrentPageNumber();
          };

          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              QuestionsListService.onQuestionSummariesInitialized.subscribe(
                () => _initTab(false)));
            ctrl.showDifficultyChoices = false;
            ctrl.skillIds = [];
            ctrl.selectedSkillIds = [];
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
