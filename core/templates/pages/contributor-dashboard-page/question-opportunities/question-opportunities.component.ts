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
 * @fileoverview Component for question opportunities.
 */

require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/question-difficulty-selector/' +
  'question-difficulty-selector.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require(
  'pages/contributor-dashboard-page/login-required-message/' +
  'login-required-message.component.ts');
require(
  'pages/contributor-dashboard-page/opportunities-list/' +
  'opportunities-list.component.ts');
require(
  'pages/contributor-dashboard-page/modal-templates/' +
  'question-suggestion-editor-modal.controller.ts');
require(
  'pages/topic-editor-page/modal-templates/' +
  'question-opportunities-select-skill-and-difficulty-modal.controller.ts');

require(
  'components/question-directives/questions-list/' +
  'questions-list.constants.ajs.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('third-party-imports/ui-codemirror.import.ts');
require(
  'pages/contributor-dashboard-page/opportunities-list/' +
  'opportunities-list.component.ts');
require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').component('questionOpportunities', {
  template: require('./question-opportunities.component.html'),
  controller: [
    '$rootScope', '$uibModal', 'AlertsService', 'ContextService',
    'ContributionOpportunitiesService', 'QuestionObjectFactory',
    'QuestionUndoRedoService', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UserService', 'MAX_QUESTIONS_PER_SKILL',
    function(
        $rootScope, $uibModal, AlertsService, ContextService,
        ContributionOpportunitiesService, QuestionObjectFactory,
        QuestionUndoRedoService, SiteAnalyticsService,
        UrlInterpolationService, UserService, MAX_QUESTIONS_PER_SKILL) {
      const ctrl = this;
      let userIsLoggedIn = false;
      let allOpportunities = [];

      var getPresentableOpportunitiesData = function({opportunities, more}) {
        let opportunitiesDicts = [];
        for (let index in opportunities) {
          const opportunity = opportunities[index];
          const heading = opportunity.getOpportunityHeading();
          const subheading = opportunity.getOpportunitySubheading();
          const progressPercentage = (
            (opportunity.getQuestionCount() / MAX_QUESTIONS_PER_SKILL) *
            100).toFixed(2);
          var opportunityDict = {
            id: opportunity.id,
            heading: heading,
            subheading: subheading,
            progressPercentage: progressPercentage,
            actionButtonTitle: 'Suggest Question',
          };
          allOpportunities[opportunityDict.id] = opportunityDict;
          opportunitiesDicts.push(opportunityDict);
        }
        return {opportunitiesDicts, more};
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
            '/pages/contributor-dashboard-page/modal-templates/' +
            'question-suggestion-editor-modal.directive.html'),
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            question: () => question,
            questionId: () => questionId,
            questionStateData: () => questionStateData,
            skill: () => skill,
            skillDifficulty: () => skillDifficulty
          },
          controller: 'QuestionSuggestionEditorModalController'
        }).result.then(function() {}, function() {
          ContextService.resetImageSaveDestination();
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      ctrl.$onInit = function() {
        UserService.getUserInfoAsync().then(function(userInfo) {
          userIsLoggedIn = userInfo.isLoggedIn();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });
      };

      ctrl.loadMoreOpportunities = function() {
        return ContributionOpportunitiesService.getMoreSkillOpportunitiesAsync()
          .then(getPresentableOpportunitiesData);
      };

      ctrl.loadOpportunities = function() {
        return ContributionOpportunitiesService.getSkillOpportunitiesAsync()
          .then(getPresentableOpportunitiesData);
      };

      ctrl.onClickSuggestQuestionButton = function(skillId) {
        if (!userIsLoggedIn) {
          ContributionOpportunitiesService.showRequiresLoginModal();
          return;
        }

        SiteAnalyticsService.registerContributorDashboardSuggestEvent(
          'Question');

        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/topic-editor-page/modal-templates/' +
            'select-skill-and-difficulty-modal.template.html'),
          backdrop: true,
          resolve: {
            skillId: () => skillId
          },
          controller: (
            'QuestionsOpportunitiesSelectSkillAndDifficultyModalController')
        }).result.then(function(result) {
          if (AlertsService.warnings.length === 0) {
            ctrl.createQuestion(result.skill, result.skillDifficulty);
          }
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };
    }
  ]
});
