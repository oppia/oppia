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
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ajs.ts');

require('components/entity-creation-services/question-creation.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/editable-skill-backend-api.service.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/SkillDifficultyObjectFactory.ts');
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
        getSelectedSkillId: '&selectedSkillId'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/question-directives/questions-list/' +
        'questions-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$http', '$q', '$timeout', '$uibModal', '$window',
        'AlertsService', 'QuestionCreationService', 'UrlService',
        'NUM_QUESTIONS_PER_PAGE', 'EditableQuestionBackendApiService',
        'EditableSkillBackendApiService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'SkillDifficultyObjectFactory',
        'DEFAULT_SKILL_DIFFICULTY', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'MODE_SELECT_DIFFICULTY', 'MODE_SELECT_SKILL', 'SKILL_DIFFICULTIES',
        'StateEditorService', 'QuestionUndoRedoService', 'UndoRedoService',
        'QuestionsListService',
        function(
            $scope, $filter, $http, $q, $timeout, $uibModal, $window,
            AlertsService, QuestionCreationService, UrlService,
            NUM_QUESTIONS_PER_PAGE, EditableQuestionBackendApiService,
            EditableSkillBackendApiService, MisconceptionObjectFactory,
            QuestionObjectFactory, SkillDifficultyObjectFactory,
            DEFAULT_SKILL_DIFFICULTY, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            MODE_SELECT_DIFFICULTY, MODE_SELECT_SKILL, SKILL_DIFFICULTIES,
            StateEditorService, QuestionUndoRedoService, UndoRedoService,
            QuestionsListService) {
          var ctrl = this;
          ctrl.skillIds = [];
          ctrl.selectedSkillIds = [];
          ctrl.selectedSkillId = ctrl.getSelectedSkillId();
          ctrl.getQuestionSummaries =
            QuestionsListService.getCachedQuestionSummaries;
          ctrl.getCurrentPageNumber = QuestionsListService.getCurrentPageNumber;
          ctrl.editorIsOpen = false;

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

          ctrl.saveAndPublishQuestion = function() {
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
                ctrl.questionIsBeingSaved = true;
                // TODO(tjiang11): Allow user to specify a commit message.
                EditableQuestionBackendApiService.updateQuestion(
                  ctrl.questionId, ctrl.question.getVersion(), 'blank',
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
              }
            }
          };

          ctrl.initializeNewQuestionCreation = function(skillIds) {
            ctrl.question =
              QuestionObjectFactory.createDefaultQuestion(skillIds);
            ctrl.questionId = ctrl.question.getId();
            ctrl.questionStateData = ctrl.question.getStateData();
            ctrl.questionIsBeingUpdated = false;
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
            var allSkillSummaries = ctrl.getAllSkillSummaries().map(
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
                    $scope.instructionMessage = (
                      'Select the skill(s) to link the question to:');
                    $scope.currentMode = currentMode;
                    $scope.linkedSkillsWithDifficulty =
                      linkedSkillsWithDifficulty;
                    $scope.skillSummaries = allSkillSummaries;
                    $scope.skillIdToRubricsObject = skillIdToRubricsObject;
                  };

                  $scope.selectOrDeselectSkill = function(skillId, index) {
                    if (!$scope.skillSummaries[index].isSelected) {
                      $scope.linkedSkillsWithDifficulty.push(
                        SkillDifficultyObjectFactory.create(
                          skillId,
                          $scope.skillSummaries[index].getDescription(),
                          DEFAULT_SKILL_DIFFICULTY));
                      $scope.skillSummaries[index].isSelected = true;
                    } else {
                      var idIndex = $scope.linkedSkillsWithDifficulty.map(
                        function(linkedSkillWithDifficulty) {
                          return linkedSkillWithDifficulty.getId();
                        }).indexOf(skillId);
                      $scope.linkedSkillsWithDifficulty.splice(idIndex, 1);
                      $scope.skillSummaries[index].isSelected = false;
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
            });
          };

          ctrl.populateMisconceptions = function(skillIds) {
            ctrl.misconceptionsBySkill = {};
            EditableSkillBackendApiService.fetchMultiSkills(
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

          ctrl.editQuestion = function(questionSummary) {
            if (ctrl.editorIsOpen) {
              return;
            }
            ctrl.misconceptionsBySkill = {};
            EditableQuestionBackendApiService.fetchQuestion(
              questionSummary.id).then(function(response) {
              if (response.associated_skill_dicts) {
                response.associated_skill_dicts.forEach(function(skillDict) {
                  ctrl.misconceptionsBySkill[skillDict.id] =
                    skillDict.misconceptions.map(function(misconception) {
                      return MisconceptionObjectFactory.createFromBackendDict(
                        misconception);
                    });
                });
              }
              ctrl.question =
                QuestionObjectFactory.createFromBackendDict(
                  response.question_dict);
              ctrl.questionId = ctrl.question.getId();
              ctrl.questionStateData = ctrl.question.getStateData();
              ctrl.questionIsBeingUpdated = true;

              ctrl.openQuestionEditor();
            }, function(errorResponse) {
              AlertsService.addWarning(
                errorResponse.error || 'Failed to fetch question.');
            });
          };

          ctrl.deleteQuestionFromSkill = function(
              questionId, skillDescriptions) {
            if (!ctrl.canEditQuestion()) {
              AlertsService.addWarning(
                'User does not have enough rights to delete the question');
              return;
            }
            _reInitializeSelectedSkillIds();
            if (skillDescriptions.length === 1) {
              var skillId = null;
              ctrl.getAllSkillSummaries().forEach(function(summary) {
                if (summary.getDescription() === skillDescriptions[0]) {
                  EditableQuestionBackendApiService.deleteQuestionFromSkill(
                    questionId, summary.getId()).then(function() {
                    QuestionsListService.resetPageNumber();
                    ctrl.getQuestionSummariesAsync(
                      ctrl.selectedSkillIds, true, true
                    );
                    AlertsService.addSuccessMessage('Deleted Question');
                  });
                }
              });
              // For the case when, it is in the skill editor.
              if (ctrl.getAllSkillSummaries().length === 0) {
                EditableQuestionBackendApiService.deleteQuestionFromSkill(
                  questionId, ctrl.selectedSkillId).then(function() {
                  QuestionsListService.resetPageNumber();
                  ctrl.getQuestionSummariesAsync(
                    ctrl.selectedSkillIds, true, true
                  );
                  AlertsService.addSuccessMessage('Deleted Question');
                });
              }
            } else {
              var allSkillSummaries = ctrl.getAllSkillSummaries().filter(
                function(summary) {
                  summary.isSelected = false;
                  return (
                    skillDescriptions.indexOf(
                      summary.getDescription()) !== -1);
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
                      $scope.instructionMessage = (
                        'Select the skill(s) from which to unlink ' +
                        'question. (If all skills are selected, the ' +
                        ' question would be deleted)');
                      $scope.currentMode = MODE_SELECT_SKILL;
                      $scope.skillSummaries = allSkillSummaries;
                    };

                    $scope.selectOrDeselectSkill = function(skillId, index) {
                      if (!$scope.skillSummaries[index].isSelected) {
                        $scope.skillSummaries[index].isSelected = true;
                      } else {
                        $scope.skillSummaries[index].isSelected = false;
                      }
                    };

                    $scope.cancelModal = function() {
                      $uibModalInstance.dismiss('cancel');
                    };

                    $scope.goToNextStep = function() {
                      var selectedSkillIds = [];
                      $scope.skillSummaries.forEach(function(summary) {
                        if (summary.isSelected) {
                          selectedSkillIds.push(summary.getId());
                        }
                      });
                      $uibModalInstance.close(selectedSkillIds);
                    };

                    init();
                  }
                ]
              });

              modalInstance.result.then(function(selectedSkillIds) {
                _reInitializeSelectedSkillIds();
                var deletedQuestionSkillLinksCount = 0;
                selectedSkillIds.forEach(function(skillId) {
                  EditableQuestionBackendApiService.deleteQuestionFromSkill(
                    questionId, skillId).then(function() {
                    deletedQuestionSkillLinksCount++;
                    if (
                      deletedQuestionSkillLinksCount ===
                      selectedSkillIds.length) {
                      /*
                        Had to resort to a timeout here, since it seems when
                        deleting multiple question skill links, even though the
                        API call is done, the storage layer takes a while to
                        update. So, for eg: when deleting 2 question skill
                        links, it was seen that without timeout, one question
                        skill link remained at the moment this next block
                        called.
                      */
                      $timeout(function() {
                        QuestionsListService.resetPageNumber();
                        ctrl.getQuestionSummariesAsync(
                          ctrl.selectedSkillIds, true, true
                        );
                        AlertsService.addSuccessMessage('Deleted Links');
                      }, 100 * selectedSkillIds.length);
                    }
                  });
                });
              });
            }
          };

          ctrl.changeDifficulty = function(
              questionId, skillDescriptions, skillDifficulties) {
            if (!ctrl.canEditQuestion()) {
              AlertsService.addWarning(
                'User does not have enough rights to edit the question');
              return;
            }
            var linkedSkillsWithDifficulty = [];
            if (ctrl.getAllSkillSummaries().length === 0) {
              linkedSkillsWithDifficulty.push(
                SkillDifficultyObjectFactory.create(
                  ctrl.selectedSkillId, skillDescriptions[0],
                  skillDifficulties[0])
              );
            } else {
              var allSkillSummaries = ctrl.getAllSkillSummaries().filter(
                function(summary) {
                  summary.isSelected = false;
                  return (
                    skillDescriptions.indexOf(
                      summary.getDescription()) !== -1);
                });
              for (var idx in allSkillSummaries) {
                var index = skillDescriptions.indexOf(
                  allSkillSummaries[idx].getDescription());
                linkedSkillsWithDifficulty.push(
                  SkillDifficultyObjectFactory.create(
                    allSkillSummaries[idx].getId(),
                    allSkillSummaries[idx].getDescription(),
                    skillDifficulties[index]));
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
            });
          };

          ctrl.openQuestionEditor = function() {
            var question = ctrl.question;
            var questionStateData = ctrl.questionStateData;
            var questionId = ctrl.questionId;
            var canEditQuestion = ctrl.canEditQuestion();
            var misconceptionsBySkill = ctrl.misconceptionsBySkill;
            QuestionUndoRedoService.clearChanges();
            ctrl.editorIsOpen = true;

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
                  $scope.question = question;
                  $scope.questionStateData = questionStateData;
                  $scope.questionId = questionId;
                  $scope.misconceptionsBySkill = misconceptionsBySkill;
                  $scope.canEditQuestion = canEditQuestion;
                  $scope.removeErrors = function() {
                    $scope.validationError = null;
                  };
                  $scope.questionChanged = function() {
                    $scope.removeErrors();
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
                    $uibModalInstance.close();
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
                      });
                    } else {
                      $uibModalInstance.dismiss('cancel');
                    }
                  };
                }
              ]
            });

            modalInstance.result.then(function() {
              ctrl.editorIsOpen = false;
              ctrl.saveAndPublishQuestion();
            }, function() {
              ctrl.editorIsOpen = false;
            });
          };

          $scope.$on(EVENT_QUESTION_SUMMARIES_INITIALIZED, function(ev) {
            _initTab(false);
          });

          _initTab(true);
        }
      ]
    };
  }]);
