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
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/editable-skill-backend-api.service.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
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
        '$scope', '$uibModal', 'QuestionSuggestionService', 'AlertsService',
        'ContributionOpportunitiesService', 'EditableSkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'QuestionUndoRedoService', 'SkillObjectFactory',
        function(
            $scope, $uibModal, QuestionSuggestionService, AlertsService,
            ContributionOpportunitiesService, EditableSkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            QuestionUndoRedoService, SkillObjectFactory) {
          var ctrl = this;
          ctrl.opportunities = [];
          ctrl.opportunitiesAreLoading = true;
          ctrl.moreOpportunitiesAvailable = true;
          ctrl.progressBarRequired = true;

          var getOpportunity = function(skillId) {
            for (var index in ctrl.opportunities) {
              if (ctrl.opportunities[index].id === skillId) {
                return ctrl.opportunities[index];
              }
            }
          };

          var updateWithNewOpportunities = function(opportunities, more) {
            for (var index in opportunities) {
              var opportunity = opportunities[index];
              var heading = opportunity.getOpportunityHeading();
              var subheading = opportunity.getOpportunitySubheading();
              var progressPercentage = (
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
            var opportunity = getOpportunity(skillId);
            var question =
              QuestionObjectFactory.createDefaultQuestion([skillId]);
            var questionId = question.getId();
            var questionStateData = question.getStateData();

            QuestionUndoRedoService.clearChanges();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/question-directives/modal-templates/' +
                'question-editor-modal.directive.html'),
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
                  EditableSkillBackendApiService.fetchSkill(skillId)
                    .then(function(backendSkillObject) {
                      $scope.associatedSkill =
                        SkillObjectFactory.createFromBackendDict(
                          backendSkillObject.skill);
                      $scope.misconceptionsBySkill = {};
                      $scope.misconceptionsBySkill[$scope.associatedSkill._id] =
                        $scope.associatedSkill._misconceptions.map(
                          function(misconceptionsBackendDict) {
                            return MisconceptionObjectFactory
                              .createFromBackendDict(misconceptionsBackendDict);
                          });
                    }, function(error) {
                      AlertsService.addWarning();
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
                    QuestionSuggestionService.submitSuggestion($scope.question,
                      $scope.associatedSkill, opportunity.heading);
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
          };

          ContributionOpportunitiesService.getSkillOpportunities(
            updateWithNewOpportunities);
        }
      ]
    };
  }]);
