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

angular.module('oppia').controller('QuestionSuggestionReviewModalController', [
  '$scope', '$uibModal', '$uibModalInstance', 'ContextService',
  'ContributionOpportunitiesService', 'SkillBackendApiService',
  'SiteAnalyticsService', 'SuggestionModalService',
  'ThreadDataBackendApiService', 'UrlInterpolationService',
  'authorName', 'contentHtml', 'misconceptionsBySkill', 'question',
  'questionHeader', 'reviewable', 'skillDifficulty', 'skillRubrics',
  'suggestion', 'suggestionId', 'ACTION_ACCEPT_SUGGESTION',
  'ACTION_REJECT_SUGGESTION', 'SKILL_DIFFICULTY_LABEL_TO_FLOAT',
  function(
      $scope, $uibModal, $uibModalInstance, ContextService,
      ContributionOpportunitiesService, SkillBackendApiService,
      SiteAnalyticsService, SuggestionModalService,
      ThreadDataBackendApiService, UrlInterpolationService,
      authorName, contentHtml, misconceptionsBySkill, question, questionHeader,
      reviewable, skillDifficulty, skillRubrics, suggestion, suggestionId,
      ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION,
      SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
    const getSkillDifficultyLabel = () => {
      const skillDifficultyFloatToLabel = invertMap(
        SKILL_DIFFICULTY_LABEL_TO_FLOAT);
      return skillDifficultyFloatToLabel[skillDifficulty];
    };

    const getRubricExplanation = skillDifficultyLabel => {
      for (const rubric of skillRubrics) {
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

    $scope.authorName = authorName;
    $scope.contentHtml = contentHtml;
    $scope.reviewable = reviewable;
    $scope.reviewMessage = '';
    $scope.question = question;
    $scope.questionHeader = questionHeader;
    $scope.questionStateData = question.getStateData();
    $scope.questionId = question.getId();
    $scope.canEditQuestion = false;
    $scope.misconceptionsBySkill = misconceptionsBySkill;
    $scope.skillDifficultyLabel = getSkillDifficultyLabel();
    $scope.skillRubricExplanations = getRubricExplanation(
      $scope.skillDifficultyLabel);
    $scope.reviewMessage = '';
    $scope.suggestionIsRejected = suggestion.status === 'rejected';

    const _getThreadMessagesAsync = function(threadId) {
      return ThreadDataBackendApiService.fetchMessagesAsync(
        threadId).then((response) => {
        const threadMessageBackendDicts = response.messages;
        $scope.reviewMessage = threadMessageBackendDicts.map(
          m => ThreadMessage.createFromBackendDict(m))[1].text;
      });
    };

    $scope.init = function() {
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
          skillDifficulty: skillDifficulty
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
      SkillBackendApiService.fetchSkillAsync(
        suggestion.change.skill_id).then((skillDict) => {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/contributor-dashboard-page/modal-templates/' +
            'question-suggestion-editor-modal.directive.html'),
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            suggestionId: () => suggestionId,
            question: () => question,
            questionId: () => '',
            questionStateData: () => question.getStateData(),
            skill: () => skillDict.skill,
            skillDifficulty: () => skillDifficulty
          },
          controller: 'QuestionSuggestionEditorModalController'
        }).result.then(function() {}, function() {
          ContextService.resetImageSaveDestination();
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      });
    };

    $scope.cancel = function() {
      SuggestionModalService.cancelSuggestion($uibModalInstance);
    };
  }
]);
