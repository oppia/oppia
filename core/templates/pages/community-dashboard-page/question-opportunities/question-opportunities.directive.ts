// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for question opportunities.
 */

require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ajs.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('domain/skill/SkillDifficultyObjectFactory.ts');
require('domain/skill/SkillObjectFactory.ts');
require('interactions/codemirrorRequires.ts');
require(
  'pages/community-dashboard-page/opportunities-list/' +
  'opportunities-list.directive.ts');
require(
  'pages/community-dashboard-page/services/' +
  'question-suggestion.service.ts');
require(
  'pages/community-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').directive('questionOpportunities', [
  'UrlInterpolationService', 'MAX_QUESTIONS_PER_SKILL',
  function(UrlInterpolationService, MAX_QUESTIONS_PER_SKILL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/question-opportunities/' +
      'question-opportunities.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$scope', '$uibModal', 'AlertsService',
        'ContributionOpportunitiesService', 'MisconceptionObjectFactory',
        'QuestionObjectFactory', 'QuestionSuggestionService',
        'QuestionUndoRedoService', 'SkillBackendApiService',
        'SkillObjectFactory',
        function(
            $rootScope, $scope, $uibModal, AlertsService,
            ContributionOpportunitiesService, MisconceptionObjectFactory,
            QuestionObjectFactory, QuestionSuggestionService,
            QuestionUndoRedoService, SkillBackendApiService,
            SkillObjectFactory) {
          const ctrl = this;

          const updateWithNewOpportunities = function(opportunities, more) {
            for (const index in opportunities) {
              const opportunity = opportunities[index];
              const heading = opportunity.getOpportunityHeading();
              const subheading = opportunity.getOpportunitySubheading();
              const progressPercentage = (
                (opportunity.getQuestionCount() / MAX_QUESTIONS_PER_SKILL) *
                100).toFixed(2);
              ctrl.opportunities.push({
                id: opportunity.id,
                heading: heading,
                subheading: subheading,
                progressPercentage: progressPercentage,
                actionButtonTitle: 'Suggest Question'
              });
            }
            ctrl.moreOpportunitiesAvailable = more;
            ctrl.opportunitiesAreLoading = false;
            // TODO(#8521): Remove the use of $rootScope.$apply().
            $rootScope.$apply();
          };

          const onSubmitSuggestionSuccess = function() {
            AlertsService.addSuccessMessage('Submitted question for review.');
          };

          ctrl.onLoadMoreOpportunities = function() {
            if (!ctrl.opportunitiesAreLoading &&
                ctrl.moreOpportunitiesAvailable) {
              ctrl.opportunitiesAreLoading = true;
              ContributionOpportunitiesService.getMoreSkillOpportunities(
                updateWithNewOpportunities);
            }
          };

          ctrl.onClickSuggestQuestionButton = function(skillId) {
            const modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'select-skill-and-difficulty-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', 'DEFAULT_SKILL_DIFFICULTY',
                'MODE_SELECT_DIFFICULTY', 'SkillDifficultyObjectFactory',
                function($scope, $uibModalInstance, DEFAULT_SKILL_DIFFICULTY,
                    MODE_SELECT_DIFFICULTY, SkillDifficultyObjectFactory) {
                  const init = function() {
                    $scope.instructionMessage = (
                      'Select the skill(s) to link the question to:');
                    $scope.currentMode = MODE_SELECT_DIFFICULTY;
                    SkillBackendApiService.fetchSkill(skillId)
                      .then(function(backendSkillObject) {
                        $scope.skill =
                          SkillObjectFactory.createFromBackendDict(
                            backendSkillObject.skill);
                        $scope.linkedSkillsWithDifficulty = [
                          SkillDifficultyObjectFactory.create(
                            skillId, $scope.skill.getDescription(),
                            DEFAULT_SKILL_DIFFICULTY)
                        ];
                        $scope.skillIdToRubricsObject = {};
                        $scope.skillIdToRubricsObject[skillId] =
                          $scope.skill.getRubrics();
                      }, function(error) {
                        AlertsService.addWarning(
                          `Error populating skill: ${error}.`);
                      });
                  };

                  $scope.startQuestionCreation = function() {
                    const result = {
                      skill: $scope.skill,
                      skillDifficulty:
                        parseFloat(
                          $scope.linkedSkillsWithDifficulty[0].getDifficulty())
                    };
                    $uibModalInstance.close(result);
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

            modalInstance.result.then(function(result) {
              if (AlertsService.warnings.length === 0) {
                ctrl.createQuestion(result.skill, result.skillDifficulty);
              }
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.createQuestion = function(skill, skillDifficulty) {
            const skillId = skill.getId();
            const question =
              QuestionObjectFactory.createDefaultQuestion([skillId]);
            const questionId = question.getId();
            const questionStateData = question.getStateData();

            QuestionUndoRedoService.clearChanges();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/community-dashboard-page/modal-templates/' +
                'question-suggestion-editor-modal.directive.html'),
              size: 'lg',
              backdrop: 'static',
              keyboard: false,
              controller: [
                '$scope', '$uibModalInstance', 'StateEditorService',
                function(
                    $scope, $uibModalInstance, StateEditorService) {
                  $scope.canEditQuestion = true;
                  $scope.newQuestionIsBeingCreated = true;
                  $scope.question = question;
                  $scope.questionStateData = questionStateData;
                  $scope.questionId = questionId;
                  $scope.skill = skill;
                  $scope.skillDifficulty = skillDifficulty;
                  $scope.misconceptionsBySkill = {};
                  $scope.misconceptionsBySkill[$scope.skill.getId()] =
                    $scope.skill.getMisconceptions().map(
                      function(misconceptionsBackendDict) {
                        return MisconceptionObjectFactory
                          .createFromBackendDict(misconceptionsBackendDict);
                      });
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
                    QuestionSuggestionService.submitSuggestion(
                      $scope.question, $scope.skill, $scope.skillDifficulty,
                      onSubmitSuggestionSuccess);
                    $uibModalInstance.close();
                  };
                  // Checking if Question contains all requirements to enable
                  // Save and Publish Question
                  $scope.isSaveButtonDisabled = function() {
                    return $scope.question.validate(
                      $scope.misconceptionsBySkill);
                  };

                  $scope.cancel = function() {
                    if (QuestionUndoRedoService.hasChanges()) {
                      const modalInstance = $uibModal.open({
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
          };

          ctrl.$onInit = function() {
            ctrl.opportunities = [];
            ctrl.opportunitiesAreLoading = true;
            ctrl.moreOpportunitiesAvailable = true;
            ctrl.progressBarRequired = true;
            ctrl.opportunityHeadingTruncationLength = 45;
            ContributionOpportunitiesService.getSkillOpportunities(
              updateWithNewOpportunities);
          };
        }
      ]
    };
  }]);
