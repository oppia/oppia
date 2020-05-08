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
  'components/question-difficulty-selector/' +
  'question-difficulty-selector.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ajs.ts');
require(
  'components/skill-selector/skill-selector.directive.ts');

require('components/entity-creation-services/question-creation.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/skill/SkillDifficultyObjectFactory.ts');
require('domain/skill/SkillSummaryObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');

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
        getGroupedSkillSummaries: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-directives/questions-list/' +
        'questions-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$http', '$q', '$timeout', '$uibModal', '$window',
        '$location', 'AlertsService', 'QuestionCreationService', 'UrlService',
        'NUM_QUESTIONS_PER_PAGE', 'EditableQuestionBackendApiService',
        'SkillBackendApiService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'SkillDifficultyObjectFactory',
        'SkillSummaryObjectFactory', 'DEFAULT_SKILL_DIFFICULTY',
        'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'MODE_SELECT_DIFFICULTY',
        'MODE_SELECT_SKILL', 'SKILL_DIFFICULTIES', 'StateEditorService',
        'QuestionUndoRedoService', 'UndoRedoService', 'QuestionsListService',
        function(
            $scope, $filter, $http, $q, $timeout, $uibModal, $window,
            $location, AlertsService, QuestionCreationService, UrlService,
            NUM_QUESTIONS_PER_PAGE, EditableQuestionBackendApiService,
            SkillBackendApiService, MisconceptionObjectFactory,
            QuestionObjectFactory, SkillDifficultyObjectFactory,
            SkillSummaryObjectFactory, DEFAULT_SKILL_DIFFICULTY,
            EVENT_QUESTION_SUMMARIES_INITIALIZED, MODE_SELECT_DIFFICULTY,
            MODE_SELECT_SKILL, SKILL_DIFFICULTIES, StateEditorService,
            QuestionUndoRedoService, UndoRedoService, QuestionsListService) {
          var ctrl = this;
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

          ctrl.getDifficultyString = function(difficulty) {
            if (difficulty === 0.3) {
              return SKILL_DIFFICULTIES[0];
            } else if (difficulty === 0.6) {
              return SKILL_DIFFICULTIES[1];
            } else {
              return SKILL_DIFFICULTIES[2];
            }
          };

          ctrl.saveAndPublishQuestion = function(commitMessage) {
            var validationErrors = ctrl.question.validate(
              ctrl.misconceptionsBySkill);

            if (validationErrors) {
              AlertsService.addWarning(validationErrors);
              return;
            }
            _reInitializeSelectedSkillIds();
            if (!ctrl.questionIsBeingUpdated) {
              EditableQuestionBackendApiService.createQuestion(
                ctrl.newQuestionSkillIds, ctrl.newQuestionSkillDifficulties,
                ctrl.question.toBackendDict(true)
              ).then(function() {
                QuestionsListService.resetPageNumber();
                ctrl.getQuestionSummariesAsync(
                  ctrl.selectedSkillIds, true, true
                );
                ctrl.questionIsBeingSaved = false;
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
                      ctrl.questionIsBeingSaved = false;
                      ctrl.getQuestionSummariesAsync(
                        ctrl.selectedSkillIds, true, true
                      );
                    }, function(error) {
                      AlertsService.addWarning(
                        error || 'There was an error saving the question.');
                      ctrl.questionIsBeingSaved = false;
                    });
                } else {
                  AlertsService.addWarning(
                    'Please provide a valid commit message.');
                  ctrl.questionIsBeingSaved = false;
                }
              }
            }
          };

          ctrl.initializeNewQuestionCreation = function(skillIds) {
            ctrl.question =
              QuestionObjectFactory.createDefaultQuestion(skillIds);
            ctrl.questionId = ctrl.question.getId();
            ctrl.questionStateData = ctrl.question.getStateData();
            ctrl.questionIsBeingUpdated = false;
            ctrl.newQuestionIsBeingCreated = true;
            ctrl.openQuestionEditor();
          };

          ctrl.createQuestion = function() {
            ctrl.newQuestionSkillIds = [];
            var currentMode = MODE_SELECT_SKILL;
            var skillIdToRubricsObject = ctrl.getSkillIdToRubricsObject();
            if (!ctrl.selectSkillModalIsShown()) {
              ctrl.newQuestionSkillIds = ctrl.skillIds;
              currentMode = MODE_SELECT_DIFFICULTY;
            }
            var linkedSkillsWithDifficulty = [];
            ctrl.newQuestionSkillIds.forEach(function(skillId) {
              linkedSkillsWithDifficulty.push(
                SkillDifficultyObjectFactory.create(
                  skillId, '', DEFAULT_SKILL_DIFFICULTY));
            });
            var sortedSkillSummaries =
              ctrl.getGroupedSkillSummaries().current.concat(
                ctrl.getGroupedSkillSummaries().others);
            var countOfSkillsToPrioritize =
              ctrl.getGroupedSkillSummaries().current.length;
            var allSkillSummaries = sortedSkillSummaries.map(
              function(summary) {
                summary.isSelected = false;
                return summary;
              });
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'select-skill-and-difficulty-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  var init = function() {
                    $scope.countOfSkillsToPrioritize =
                      countOfSkillsToPrioritize;
                    $scope.instructionMessage = (
                      'Select the skill(s) to link the question to:');
                    $scope.currentMode = currentMode;
                    $scope.linkedSkillsWithDifficulty =
                      linkedSkillsWithDifficulty;
                    $scope.skillSummaries = allSkillSummaries;
                    $scope.skillSummariesInitial = [];
                    $scope.skillSummariesFinal = [];

                    for (var idx in allSkillSummaries) {
                      if (idx < countOfSkillsToPrioritize) {
                        $scope.skillSummariesInitial.push(
                          allSkillSummaries[idx]);
                      } else {
                        $scope.skillSummariesFinal.push(
                          allSkillSummaries[idx]);
                      }
                    }
                    $scope.skillIdToRubricsObject = skillIdToRubricsObject;
                  };

                  $scope.selectOrDeselectSkill = function(summary) {
                    if (!summary.isSelected) {
                      $scope.linkedSkillsWithDifficulty.push(
                        SkillDifficultyObjectFactory.create(
                          summary.id, summary.description,
                          DEFAULT_SKILL_DIFFICULTY));
                      summary.isSelected = true;
                    } else {
                      var idIndex = $scope.linkedSkillsWithDifficulty.map(
                        function(linkedSkillWithDifficulty) {
                          return linkedSkillWithDifficulty.getId();
                        }).indexOf(summary.id);
                      $scope.linkedSkillsWithDifficulty.splice(idIndex, 1);
                      summary.isSelected = false;
                    }
                  };

                  $scope.goToSelectSkillView = function() {
                    $scope.currentMode = MODE_SELECT_SKILL;
                  };

                  $scope.goToNextStep = function() {
                    $scope.currentMode = MODE_SELECT_DIFFICULTY;
                  };

                  $scope.startQuestionCreation = function() {
                    $uibModalInstance.close($scope.linkedSkillsWithDifficulty);
                  };

                  $scope.cancelModal = function() {
                    $uibModalInstance.dismiss('cancel');
                  };

                  $scope.closeModal = function() {
                    $uibModalInstance.dismiss('ok');
                  };

                  init();
                }
              ]
            });

            modalInstance.result.then(function(linkedSkillsWithDifficulty) {
              ctrl.newQuestionSkillIds = [];
              ctrl.newQuestionSkillDifficulties = [];
              linkedSkillsWithDifficulty.forEach(
                function(linkedSkillWithDifficulty) {
                  ctrl.newQuestionSkillIds.push(
                    linkedSkillWithDifficulty.getId());
                  ctrl.newQuestionSkillDifficulties.push(
                    linkedSkillWithDifficulty.getDifficulty());
                }
              );
              ctrl.populateMisconceptions(ctrl.newQuestionSkillIds);
              if (AlertsService.warnings.length === 0) {
                ctrl.initializeNewQuestionCreation(
                  ctrl.newQuestionSkillIds);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
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
                      SkillSummaryObjectFactory.create(
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
                  summary.isSelected = false;
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
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/question-directives/modal-templates/' +
                'change-question-difficulty-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  var init = function() {
                    $scope.linkedSkillsWithDifficulty =
                      linkedSkillsWithDifficulty;
                    $scope.skillIdToRubricsObject = skillIdToRubricsObject;
                  };

                  $scope.cancelModal = function() {
                    $uibModalInstance.dismiss('cancel');
                  };

                  $scope.done = function() {
                    $uibModalInstance.close($scope.linkedSkillsWithDifficulty);
                  };

                  init();
                }
              ]
            });

            modalInstance.result.then(function(linkedSkillsWithDifficulty) {
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

          ctrl.openQuestionEditor = function(questionDifficulty) {
            var question = ctrl.question;
            var questionStateData = ctrl.questionStateData;
            var questionId = ctrl.questionId;
            var canEditQuestion = ctrl.canEditQuestion();
            var misconceptionsBySkill = ctrl.misconceptionsBySkill;
            var associatedSkillSummaries = ctrl.associatedSkillSummaries;
            var newQuestionIsBeingCreated = ctrl.newQuestionIsBeingCreated;
            QuestionUndoRedoService.clearChanges();
            ctrl.editorIsOpen = true;
            var groupedSkillSummaries = ctrl.getGroupedSkillSummaries();
            var selectedSkillId = ctrl.selectedSkillId;
            $location.hash(questionId);
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/question-directives/modal-templates/' +
                'question-editor-modal.directive.html'),
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$uibModalInstance', 'StateEditorService',
                'UndoRedoService',
                function(
                    $scope, $uibModalInstance, StateEditorService,
                    UndoRedoService) {
                  var returnModalObject = {
                    skillLinkageModificationsArray: [],
                    commitMessage: ''
                  };
                  $scope.question = question;
                  $scope.questionStateData = questionStateData;
                  $scope.associatedSkillSummaries =
                    angular.copy(associatedSkillSummaries);
                  $scope.questionId = questionId;
                  $scope.misconceptionsBySkill = misconceptionsBySkill;
                  $scope.canEditQuestion = canEditQuestion;
                  $scope.newQuestionIsBeingCreated = newQuestionIsBeingCreated;

                  if (!newQuestionIsBeingCreated) {
                    $scope.validationError = $scope.question.validate(
                      $scope.misconceptionsBySkill);
                  }

                  $scope.removeErrors = function() {
                    $scope.validationError = null;
                  };
                  $scope.getSkillEditorUrl = function(skillId) {
                    return '/skill_editor/' + skillId;
                  };
                  $scope.questionChanged = function() {
                    $scope.removeErrors();
                  };
                  $scope.removeSkill = function(skillId) {
                    if ($scope.associatedSkillSummaries.length === 1) {
                      AlertsService.addInfoMessage(
                        'A question should be linked to at least one skill.');
                      return;
                    }
                    returnModalObject.skillLinkageModificationsArray.push({
                      id: skillId,
                      task: 'remove'
                    });
                    $scope.associatedSkillSummaries =
                      $scope.associatedSkillSummaries.filter(function(summary) {
                        return summary.getId() !== skillId;
                      });
                  };
                  $scope.undo = function() {
                    $scope.associatedSkillSummaries = associatedSkillSummaries;
                    returnModalObject.skillLinkageModificationsArray = [];
                  };
                  $scope.addSkill = function() {
                    var skillsInSameTopicCount =
                      groupedSkillSummaries.current.length;
                    var sortedSkillSummaries =
                      groupedSkillSummaries.current.concat(
                        groupedSkillSummaries.others);
                    var modalInstance = $uibModal.open({
                      templateUrl:
                        UrlInterpolationService.getDirectiveTemplateUrl(
                          '/components/skill-selector/' +
                          'select-skill-modal.template.html'),
                      backdrop: true,
                      controller: [
                        '$scope', '$uibModalInstance',
                        function($scope, $uibModalInstance) {
                          $scope.skillSummaries = sortedSkillSummaries;
                          $scope.selectedSkillId = null;
                          $scope.countOfSkillsToPrioritize =
                            skillsInSameTopicCount;
                          $scope.save = function() {
                            for (var idx in sortedSkillSummaries) {
                              if (
                                $scope.selectedSkillId ===
                                sortedSkillSummaries[idx].id) {
                                $uibModalInstance.close(
                                  sortedSkillSummaries[idx]);
                              }
                            }
                          };
                          $scope.cancel = function() {
                            $uibModalInstance.dismiss('cancel');
                          };
                        }
                      ]
                    });

                    modalInstance.result.then(function(summary) {
                      for (var idx in $scope.associatedSkillSummaries) {
                        if (
                          $scope.associatedSkillSummaries[idx].getId() ===
                          summary.id) {
                          AlertsService.addInfoMessage(
                            'Skill already linked to question');
                          return;
                        }
                      }
                      $scope.associatedSkillSummaries.push(
                        SkillSummaryObjectFactory.create(
                          summary.id, summary.description));
                      returnModalObject.skillLinkageModificationsArray.push({
                        id: summary.id,
                        task: 'add'
                      });
                    }, function() {
                      // Note to developers:
                      // This callback is triggered when the Cancel button is
                      // clicked. No further action is needed.
                    });
                  };

                  // The saveAndCommit function is called when the contents of
                  // a question is changed or the skill linkages are modified.
                  // The user has to enter a commit message if the contents of
                  // the question is edited but, if only the skill linkages are
                  // modified then no commit message is required from the user
                  // as there is already a default commit message present in the
                  // backend for modification of skill linkages.
                  $scope.saveAndCommit = function() {
                    $scope.validationError = $scope.question.validate(
                      $scope.misconceptionsBySkill);
                    if ($scope.validationError) {
                      return;
                    }
                    if (!StateEditorService.isCurrentSolutionValid()) {
                      $scope.validationError =
                        'The solution is invalid and does not ' +
                        'correspond to a correct answer';
                      return;
                    }

                    if (QuestionUndoRedoService.hasChanges()) {
                      var modalInstance = $uibModal.open({
                        templateUrl:
                               UrlInterpolationService.getDirectiveTemplateUrl(
                                 '/components/question-directives' +
                                 '/modal-templates/' +
                                 'question-editor-save-modal.template.html'),
                        backdrop: true,
                        controller: [
                          '$scope', '$uibModalInstance',
                          function($scope, $uibModalInstance) {
                            $scope.save = function(commitMessage) {
                              $uibModalInstance.close(commitMessage);
                            };
                            $scope.cancel = function() {
                              $uibModalInstance.dismiss('cancel');
                            };
                          }
                        ]
                      });
                      modalInstance.result.then(function(commitMessage) {
                        returnModalObject.commitMessage = commitMessage;
                        $uibModalInstance.close(returnModalObject);
                      }, function() {
                        // Note to developers:
                        // This callback is triggered when the Cancel button is
                        // clicked. No further action is needed.
                      });
                    } else {
                      $uibModalInstance.close(returnModalObject);
                    }
                  };
                  $scope.isSaveAndCommitButtonDisabled = function() {
                    return !(QuestionUndoRedoService.hasChanges() ||
                        (returnModalObject.skillLinkageModificationsArray.length
                        ) > 0);
                  };


                  $scope.done = function() {
                    $scope.validationError = $scope.question.validate(
                      $scope.misconceptionsBySkill);
                    if ($scope.validationError) {
                      return;
                    }
                    if (!StateEditorService.isCurrentSolutionValid()) {
                      $scope.validationError =
                        'The solution is invalid and does not ' +
                        'correspond to a correct answer';
                      return;
                    }
                    $uibModalInstance.close(returnModalObject);
                  };
                  // Checking if Question contains all requirement to enable
                  // Save and Publish Question
                  $scope.isSaveButtonDisabled = function() {
                    return $scope.question.validate(
                      $scope.misconceptionsBySkill);
                  };

                  $scope.cancel = function() {
                    if (QuestionUndoRedoService.hasChanges()) {
                      var modalInstance = $uibModal.open({
                        templateUrl:
                          UrlInterpolationService.getDirectiveTemplateUrl(
                            '/components/question-directives/modal-templates/' +
                            'confirm-question-modal-exit-modal.directive.html'),
                        backdrop: true,
                        controller: [
                          '$scope', '$uibModalInstance',
                          function($scope, $uibModalInstance) {
                            $scope.cancel = function() {
                              $uibModalInstance.dismiss('cancel');
                            };

                            $scope.close = function() {
                              $uibModalInstance.close();
                            };
                          }
                        ]
                      });
                      modalInstance.result.then(function() {
                        $uibModalInstance.dismiss('cancel');
                      }, function() {
                        // Note to developers:
                        // This callback is triggered when the Cancel button is
                        // clicked. No further action is needed.
                      });
                    } else {
                      $uibModalInstance.dismiss('cancel');
                    }
                  };
                }
              ]
            });

            modalInstance.result.then(function(modalObject) {
              $location.hash(null);
              ctrl.editorIsOpen = false;
              if (modalObject.skillLinkageModificationsArray.length > 0) {
                EditableQuestionBackendApiService.editQuestionSkillLinks(
                  questionId, modalObject.skillLinkageModificationsArray,
                  questionDifficulty).then(
                  data => {
                    $timeout(function() {
                      QuestionsListService.resetPageNumber();
                      _reInitializeSelectedSkillIds();
                      ctrl.getQuestionSummariesAsync(
                        ctrl.selectedSkillIds, true, true
                      );
                      ctrl.saveAndPublishQuestion(modalObject.commitMessage);
                    }, 500);
                  });
              } else {
                ctrl.saveAndPublishQuestion(modalObject.commitMessage);
              }
            }, function() {
              ctrl.editorIsOpen = false;
              $location.hash(null);
            });
          };

          ctrl.getQuestionSummariesForOneSkill = function() {
            return QuestionsListService.getCachedQuestionSummaries();
          };
          ctrl.getCurrentPageNumber = function() {
            return QuestionsListService.getCurrentPageNumber();
          };

          ctrl.$onInit = function() {
            $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, function(ev) {
              _initTab(false);
            });
            ctrl.skillIds = [];
            ctrl.selectedSkillIds = [];
            ctrl.associatedSkillSummaries = [];
            ctrl.selectedSkillId = ctrl.getSelectedSkillId();
            ctrl.editorIsOpen = false;
            // The _initTab function is written separately since it is also
            // called in $scope.$on when some external events are triggered.
            _initTab(true);
          };
        }
      ]
    };
  }]);
