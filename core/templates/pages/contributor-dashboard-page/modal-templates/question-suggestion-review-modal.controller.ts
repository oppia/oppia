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
 * @fileoverview Controller for question suggestion review modal.
 */

import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';

require('domain/skill/skill-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-opportunities.service.ts');

require('services/context.service.ts');
require('services/site-analytics.service.ts');
require('services/suggestion-modal.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-data-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');

angular.module('oppia').controller('QuestionSuggestionReviewModalController', [
  '$rootScope', '$scope', '$uibModal', '$uibModalInstance', 'ContextService',
  'ContributionOpportunitiesService', 'SkillBackendApiService',
  'SiteAnalyticsService', 'SuggestionModalService', 'QuestionObjectFactory',
  'ThreadDataBackendApiService', 'UrlInterpolationService',
  'misconceptionsBySkill', 'suggestionIdToContribution',
  'reviewable', 'suggestionId', 'editSuggestionCallback',
  'ACTION_ACCEPT_SUGGESTION', 'ACTION_REJECT_SUGGESTION',
  'SKILL_DIFFICULTY_LABEL_TO_FLOAT',
  function(
      $rootScope, $scope, $uibModal, $uibModalInstance, ContextService,
      ContributionOpportunitiesService, SkillBackendApiService,
      SiteAnalyticsService, SuggestionModalService, QuestionObjectFactory,
      ThreadDataBackendApiService, UrlInterpolationService,
      misconceptionsBySkill, suggestionIdToContribution,
      reviewable, suggestionId, editSuggestionCallback,
      ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION,
      SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
    const getSkillDifficultyLabel = () => {
      const skillDifficultyFloatToLabel = invertMap(
        SKILL_DIFFICULTY_LABEL_TO_FLOAT);
      return skillDifficultyFloatToLabel[$scope.skillDifficulty];
    };

    const getRubricExplanation = skillDifficultyLabel => {
      for (const rubric of $scope.skillRubrics) {
        if (rubric.difficulty === skillDifficultyLabel) {
          return rubric.explanations;
        }
      }
      return 'This rubric has not yet been specified.';
    };

    const invertMap = originalMap => {
      return Object.keys(originalMap).reduce(
        (invertedMap, key) => {
          invertedMap[originalMap[key]] = key;
          return invertedMap;
        },
        {}
      );
    };

    const _getThreadMessagesAsync = function(threadId) {
      return ThreadDataBackendApiService.fetchMessagesAsync(
        threadId).then((response) => {
        const threadMessageBackendDicts = response.messages;
        $scope.reviewMessage = threadMessageBackendDicts.map(
          m => ThreadMessage.createFromBackendDict(m))[1].text;
        $rootScope.$applyAsync();
      });
    };

    $scope.reviewable = reviewable;
    $scope.misconceptionsBySkill = misconceptionsBySkill;

    let currentSuggestion = suggestionIdToContribution[suggestionId];
    delete suggestionIdToContribution[suggestionId];
    let allContributions = suggestionIdToContribution;
    allContributions[suggestionId] = currentSuggestion;

    let remainingContributionIds: string[] = Object.keys(
      suggestionIdToContribution
    );
    let skippedContributionIds: string[] = [];

    $scope.init = function() {
      $scope.suggestion = allContributions[suggestionId].suggestion;
      $scope.question = QuestionObjectFactory.createFromBackendDict(
        $scope.suggestion.change.question_dict);
      $scope.authorName = $scope.suggestion.author_name;
      $scope.contentHtml = $scope.question.getStateData().content.html;
      $scope.questionHeader = (
        allContributions[suggestionId].details.skill_description);
      $scope.skillRubrics = (
        allContributions[suggestionId].details.skill_rubrics);
      $scope.questionStateData = $scope.question.getStateData();
      $scope.questionId = $scope.question.getId();
      $scope.canEditQuestion = false;
      $scope.skillDifficulty = $scope.suggestion.change.skill_difficulty;
      $scope.skillDifficultyLabel = getSkillDifficultyLabel();
      $scope.skillRubricExplanations = getRubricExplanation(
        $scope.skillDifficultyLabel);
      $scope.reviewMessage = '';
      $scope.suggestionIsRejected = $scope.suggestion.status === 'rejected';
      $scope.isLastItem = remainingContributionIds.length === 0;
      $scope.isFirstItem = skippedContributionIds.length === 0;

      if (reviewable) {
        SiteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview('Question');
      } else if ($scope.suggestionIsRejected) {
        _getThreadMessagesAsync(suggestionId);
      }
    };

    $scope.init();

    $scope.questionChanged = function() {
      $scope.validationError = null;
    };

    $scope.gotoNextItem = function() {
      if ($scope.isLastItem) {
        return;
      }
      skippedContributionIds.push(suggestionId);

      let lastContributionId = remainingContributionIds.pop();
      suggestionId = lastContributionId;
      let nextContribution = allContributions[lastContributionId];
      $scope.suggestion = allContributions[lastContributionId].suggestion;

      console.log(nextContribution);

      $scope.isLastItem = remainingContributionIds.length === 0;
      $scope.isFirstItem = skippedContributionIds.length === 0;

      if (!nextContribution.details) {
        SuggestionModalService.cancelSuggestion($uibModalInstance);
        return;
      }

      SkillBackendApiService.fetchSkillAsync(
        $scope.suggestion.change.skill_id).then((skillDict) => {
        var misconceptionsBySkill = {};
        var skill = skillDict.skill;
        misconceptionsBySkill[skill.getId()] = skill.getMisconceptions();
        $scope.misconceptionsBySkill = misconceptionsBySkill;
        $scope.init();
      });
    };

    $scope.gotoPreviousItem = function() {
      if ($scope.isFirstItem) {
        return;
      }
      remainingContributionIds.push(suggestionId);

      let lastContributionId = skippedContributionIds.pop();
      suggestionId = lastContributionId;
      let nextContribution = allContributions[lastContributionId];
      $scope.suggestion = allContributions[lastContributionId].suggestion;

      console.log(nextContribution);

      $scope.isLastItem = remainingContributionIds.length === 0;
      $scope.isFirstItem = skippedContributionIds.length === 0;

      if (!nextContribution.details) {
        SuggestionModalService.cancelSuggestion($uibModalInstance);
        return;
      }

      SkillBackendApiService.fetchSkillAsync(
        $scope.suggestion.change.skill_id).then((skillDict) => {
        var misconceptionsBySkill = {};
        var skill = skillDict.skill;
        misconceptionsBySkill[skill.getId()] = skill.getMisconceptions();
        $scope.misconceptionsBySkill = misconceptionsBySkill;
        $scope.init();
      });
    };

    $scope.accept = function() {
      ContributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
        [suggestionId]);
      SiteAnalyticsService.registerContributorDashboardAcceptSuggestion(
        'Question');
      SuggestionModalService.acceptSuggestion(
        $uibModalInstance,
        {
          action: ACTION_ACCEPT_SUGGESTION,
          reviewMessage: $scope.reviewMessage,
          skillDifficulty: $scope.skillDifficulty
        });
    };

    $scope.reject = function() {
      ContributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
        [suggestionId]);
      SiteAnalyticsService.registerContributorDashboardRejectSuggestion(
        'Question');
      SuggestionModalService.rejectSuggestion(
        $uibModalInstance,
        {
          action: ACTION_REJECT_SUGGESTION,
          reviewMessage: $scope.reviewMessage
        });
    };

    $scope.edit = function() {
      $uibModalInstance.dismiss();
      SkillBackendApiService.fetchSkillAsync(
        $scope.suggestion.change.skill_id).then((skillDict) => {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/contributor-dashboard-page/modal-templates/' +
            'question-suggestion-editor-modal.directive.html'),
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            suggestionId: () => suggestionId,
            question: () => $scope.question,
            questionId: () => '',
            questionStateData: () => $scope.question.getStateData(),
            skill: () => skillDict.skill,
            skillDifficulty: () => $scope.skillDifficulty
          },
          controller: 'QuestionSuggestionEditorModalController'
        }).result.then(function() {
          editSuggestionCallback(
            suggestionId, $scope.suggestion, reviewable, $scope.question);
        }, function() {
          ContextService.resetImageSaveDestination();
          editSuggestionCallback(suggestionId, $scope.suggestion, reviewable);
        });
      });
    };

    $scope.cancel = function() {
      SuggestionModalService.cancelSuggestion($uibModalInstance);
    };
  }
]);
