// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching and resolving suggestions.
 */

require('domain/feedback_thread/FeedbackThreadObjectFactory.ts');
require('domain/suggestion/SuggestionObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/alerts.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('ContributionAndReviewService', [
  '$http', 'UrlInterpolationService', 'ACTION_ACCEPT_SUGGESTION',
  function($http, UrlInterpolationService, ACTION_ACCEPT_SUGGESTION) {
    let getSubmittedSuggestionListHandlerUrl = (
      (targetType, suggestionType) => UrlInterpolationService.interpolateUrl(
        '/getsubmittedsuggestions/<target_type>/<suggestion_type>', {
          target_type: targetType,
          suggestion_type: suggestionType
        }));
    let getReviewableSuggestionsHandlerUrl = (
      (targetType, suggestionType) => UrlInterpolationService.interpolateUrl(
        '/getreviewablesuggestions/<target_type>/<suggestion_type>', {
          target_type: targetType,
          suggestion_type: suggestionType
        }));
    let getSuggestionToExplorationActionHandlerUrl = (
      (expId, suggestionId) => UrlInterpolationService.interpolateUrl(
        '/suggestionactionhandler/exploration/<exploration_id>/<suggestion_id>',
        { exploration_id: expId, suggestion_id: suggestionId }));
    let getSuggestionToSkillActionHandlerUrl = (
      (skillId, suggestionId) => UrlInterpolationService.interpolateUrl(
        '/suggestionactionhandler/skill/<skill_id>/<suggestion_id>', {
          skill_id: skillId,
          suggestion_id: suggestionId
        }));

    let getSuggestionsByIdFromHttpResponse = httpResponse => {
      let targetIdToDetails = httpResponse.data.target_id_to_opportunity_dict;
      let suggestionsById = {};
      httpResponse.data.suggestions.forEach(suggestion => {
        let suggestionId = suggestion.suggestion_id;
        let targetId = suggestion.target_id;
        suggestionsById[suggestionId] = {
          suggestion: suggestion,
          details: targetIdToDetails[targetId]
        };
      });
      return suggestionsById;
    };

    return {
      getUserCreatedQuestionSuggestions: function(onSuccess) {
        // TODO(#8016): Move this function to a backend-api.service with unit
        // tests.
        return $http.get(
          getSubmittedSuggestionListHandlerUrl('skill', 'add_question')
        ).then(getSuggestionsByIdFromHttpResponse).then(suggestionsById => {
          if (onSuccess) {
            onSuccess(suggestionsById);
          }
          return suggestionsById;
        });
      },
      getReviewableQuestionSuggestions: function(onSuccess) {
        // TODO(#8016): Move this function to a backend-api.service with unit
        // tests.
        return $http.get(
          getReviewableSuggestionsHandlerUrl('skill', 'add_question')
        ).then(getSuggestionsByIdFromHttpResponse).then(suggestionsById => {
          if (onSuccess) {
            onSuccess(suggestionsById);
          }
          return suggestionsById;
        });
      },
      getUserCreatedTranslationSuggestions: function(onSuccess) {
        // TODO(#8016): Move this function to a backend-api.service with unit
        // tests.
        return $http.get(
          getSubmittedSuggestionListHandlerUrl(
            'exploration', 'translate_content')
        ).then(getSuggestionsByIdFromHttpResponse).then(suggestionsById => {
          if (onSuccess) {
            onSuccess(suggestionsById);
          }
          return suggestionsById;
        });
      },
      getReviewableTranslationSuggestions: function(onSuccess) {
        // TODO(#8016): Move this function to a backend-api.service with unit
        // tests.
        return $http.get(
          getReviewableSuggestionsHandlerUrl('exploration', 'translate_content')
        ).then(getSuggestionsByIdFromHttpResponse).then(suggestionsById => {
          if (onSuccess) {
            onSuccess(suggestionsById);
          }
          return suggestionsById;
        });
      },
      resolveSuggestiontoExploration: function(
          targetId, suggestionId, action, reviewMessage, commitMessage,
          onSuccess) {
        // TODO(#8016): Move this function to a backend-api.service with unit
        // tests.
        return $http.put(
          getSuggestionToExplorationActionHandlerUrl(targetId, suggestionId), {
            action: action,
            review_message: reviewMessage,
            commit_message: (
              action === ACTION_ACCEPT_SUGGESTION ? commitMessage : null)
          }).then(() => onSuccess(suggestionId));
      },
      resolveSuggestiontoSkill: function(
          targetId, suggestionId, action, reviewMessage, commitMessage,
          onSuccess) {
        // TODO(#8016): Move this function to a backend-api.service with unit
        // tests.
        return $http.put(
          getSuggestionToSkillActionHandlerUrl(targetId, suggestionId), {
            action: action,
            review_message: reviewMessage,
            commit_message: (
              action === ACTION_ACCEPT_SUGGESTION ? commitMessage : null)
          }).then(() => onSuccess(suggestionId));
      }
    };
  }
]);
