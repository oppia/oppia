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
 * @fileoverview Controller for translation suggestion review modal.
 */

require('domain/feedback_message/ThreadMessageObjectFactory.ts');

require('services/site-analytics.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').controller(
  'TranslationSuggestionReviewModalController', [
    '$http', '$scope', '$uibModalInstance', 'ContributionAndReviewService',
    'SiteAnalyticsService', 'ThreadMessageObjectFactory',
    'UrlInterpolationService', 'initialSuggestionId', 'reviewable',
    'suggestionIdToSuggestion', 'ACTION_ACCEPT_SUGGESTION',
    'ACTION_REJECT_SUGGESTION',
    function(
        $http, $scope, $uibModalInstance, ContributionAndReviewService,
        SiteAnalyticsService, ThreadMessageObjectFactory,
        UrlInterpolationService, initialSuggestionId, reviewable,
        suggestionIdToSuggestion, ACTION_ACCEPT_SUGGESTION,
        ACTION_REJECT_SUGGESTION) {
      var resolvedSuggestionIds = [];
      $scope.reviewable = reviewable;
      $scope.activeSuggestionId = initialSuggestionId;
      $scope.activeSuggestion = suggestionIdToSuggestion[
        $scope.activeSuggestionId];
      delete suggestionIdToSuggestion[initialSuggestionId];
      var remainingSuggestions = Object.entries(suggestionIdToSuggestion);

      if (reviewable) {
        SiteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview('Translation');
      }

      // The length of the commit message should not exceed 375 characters,
      // since this is the maximum allowed commit message size.
      var generateCommitMessage = function() {
        var contentId = $scope.activeSuggestion.change.content_id;
        var stateName = $scope.activeSuggestion.change.state_name;
        var contentType = contentId.split('_')[0];

        return `${contentType} section of "${stateName}" card`;
      };

      var _getThreadHandlerUrl = function(suggestionId) {
        return UrlInterpolationService.interpolateUrl(
          '/threadhandler/<suggestionId>', { suggestionId });
      };

      var _getThreadMessagesAsync = function(threadId) {
        return $http.get(_getThreadHandlerUrl(threadId)).then((response) => {
          let threadMessageBackendDicts = response.data.messages;
          return threadMessageBackendDicts.map(
            m => ThreadMessageObjectFactory.createFromBackendDict(m));
        });
      };

      var init = function() {
        $scope.resolvingSuggestion = false;
        $scope.lastSuggestionToReview = remainingSuggestions.length <= 0;
        $scope.translationHtml = (
          $scope.activeSuggestion.change.translation_html);
        $scope.contentHtml = (
          $scope.activeSuggestion.change.content_html);
        $scope.reviewMessage = '';
        if (!reviewable) {
          $scope.suggestionIsRejected = (
            $scope.activeSuggestion.status === 'rejected');
          if ($scope.suggestionIsRejected) {
            _getThreadMessagesAsync($scope.activeSuggestionId).then(
              function(messageSummaries) {
                $scope.reviewMessage = messageSummaries[1].text;
              }
            );
          }
        }
      };

      init();

      $scope.showNextItemToReview = function(suggestionId) {
        resolvedSuggestionIds.push($scope.activeSuggestionId);
        var suggestionId = null;
        if ($scope.lastSuggestionToReview) {
          $uibModalInstance.close(resolvedSuggestionIds);
          return;
        }

        [$scope.activeSuggestionId, $scope.activeSuggestion] = (
          remainingSuggestions.pop());
        init();
      };

      $scope.acceptAndReviewNext = function() {
        $scope.resolvingSuggestion = true;
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion(
          'Translation');

        ContributionAndReviewService.resolveSuggestionToExploration(
          $scope.activeSuggestion.target_id, $scope.activeSuggestionId,
          ACTION_ACCEPT_SUGGESTION,
          $scope.reviewMessage, generateCommitMessage(),
          $scope.showNextItemToReview);
      };

      $scope.rejectAndReviewNext = function() {
        $scope.resolvingSuggestion = true;
        SiteAnalyticsService.registerContributorDashboardRejectSuggestion(
          'Translation');

        ContributionAndReviewService.resolveSuggestionToExploration(
          $scope.activeSuggestion.target_id, $scope.activeSuggestionId,
          ACTION_REJECT_SUGGESTION, $scope.reviewMessage,
          generateCommitMessage(), $scope.showNextItemToReview);
      };

      $scope.cancel = function() {
        $uibModalInstance.close(resolvedSuggestionIds);
      };
    }
  ]);
