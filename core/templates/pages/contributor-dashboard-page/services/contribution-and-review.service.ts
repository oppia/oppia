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
require('domain/suggestion/suggestion.model.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/alerts.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('ContributionAndReviewService', [
  '$http', 'UrlInterpolationService', 'ACTION_ACCEPT_SUGGESTION',
  function(
      $http, UrlInterpolationService, ACTION_ACCEPT_SUGGESTION) {
    var _SUBMITTED_SUGGESTION_LIST_HANDLER_URL = (
      '/getsubmittedsuggestions/<target_type>/<suggestion_type>');
    var _REVIEWABLE_SUGGESTIONS_HANDLER_URL = (
      '/getreviewablesuggestions/<target_type>/<suggestion_type>');
    var _SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL = (
      '/suggestionactionhandler/exploration/<exp_id>/<suggestion_id>');
    var _SUGGESTION_TO_SKILL_ACTION_HANDLER_URL = (
      '/suggestionactionhandler/skill/<skill_id>/<suggestion_id>');
    var _UPDATE_TRANSLATION_HANDLER_URL = (
      '/updatetranslationsuggestionhandler/<suggestion_id>'
    );
    var _UPDATE_QUESTION_HANDLER_URL = (
      '/updatequestionsuggestionhandler/<suggestion_id>'
    );

    var _fetchSuggestionsAsync = async function(url) {
      return $http.get(url).then(function(res) {
        var suggestionIdToSuggestions = {};
        var targetIdToDetails = res.data.target_id_to_opportunity_dict;
        res.data.suggestions.forEach(function(suggestion) {
          suggestionIdToSuggestions[suggestion.suggestion_id] = {
            suggestion: suggestion,
            details: targetIdToDetails[suggestion.target_id]
          };
        });
        return suggestionIdToSuggestions;
      });
    };

    return {
      getUserCreatedQuestionSuggestionsAsync: async function() {
        var url = UrlInterpolationService.interpolateUrl(
          _SUBMITTED_SUGGESTION_LIST_HANDLER_URL, {
            target_type: 'skill',
            suggestion_type: 'add_question'
          });
        return _fetchSuggestionsAsync(url);
      },
      getReviewableQuestionSuggestionsAsync: async function() {
        var url = UrlInterpolationService.interpolateUrl(
          _REVIEWABLE_SUGGESTIONS_HANDLER_URL, {
            target_type: 'skill',
            suggestion_type: 'add_question'
          });
        return _fetchSuggestionsAsync(url);
      },
      getUserCreatedTranslationSuggestionsAsync: async function(onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _SUBMITTED_SUGGESTION_LIST_HANDLER_URL, {
            target_type: 'exploration',
            suggestion_type: 'translate_content'
          });
        return _fetchSuggestionsAsync(url);
      },
      getReviewableTranslationSuggestionsAsync: async function(onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _REVIEWABLE_SUGGESTIONS_HANDLER_URL, {
            target_type: 'exploration',
            suggestion_type: 'translate_content'
          });
        return _fetchSuggestionsAsync(url);
      },
      resolveSuggestionToExploration: function(
          targetId, suggestionId, action, reviewMessage, commitMessage,
          onSuccess, onFailure) {
        var url = UrlInterpolationService.interpolateUrl(
          _SUGGESTION_TO_EXPLORATION_ACTION_HANDLER_URL, {
            exp_id: targetId,
            suggestion_id: suggestionId
          });
        return $http.put(url, {
          action: action,
          review_message: reviewMessage,
          commit_message: (
            action === ACTION_ACCEPT_SUGGESTION ?
            commitMessage : null
          )
        }).then(function() {
          onSuccess(suggestionId);
        }, (error) => onFailure && onFailure(error));
      },
      resolveSuggestiontoSkill: function(
          targetId, suggestionId, action, reviewMessage, skillDifficulty,
          onSuccess, onFailure) {
        var url = UrlInterpolationService.interpolateUrl(
          _SUGGESTION_TO_SKILL_ACTION_HANDLER_URL, {
            skill_id: targetId,
            suggestion_id: suggestionId
          });
        return $http.put(url, {
          action: action,
          review_message: reviewMessage,
          skill_difficulty: skillDifficulty
        }).then(function() {
          onSuccess(suggestionId);
        }, () => onFailure && onFailure(suggestionId));
      },
      updateTranslationSuggestionAsync: async function(
          suggestionId, translationHtml,
          onSuccess, onFailure) {
        var url = UrlInterpolationService.interpolateUrl(
          _UPDATE_TRANSLATION_HANDLER_URL, {
            suggestion_id: suggestionId
          });
        return $http.put(url, {
          translation_html: translationHtml
        }).then(function() {
          onSuccess();
        }, (error) => onFailure && onFailure(error));
      },
      updateQuestionSuggestionAsync: async function(
          suggestionId, skillDifficulty, questionStateData, imagesData,
          onSuccess, onFailure) {
        var url = UrlInterpolationService.interpolateUrl(
          _UPDATE_QUESTION_HANDLER_URL, {
            suggestion_id: suggestionId
          });
        const payload = {
          skill_difficulty: skillDifficulty,
          question_state_data: questionStateData
        };
        const body = new FormData();
        body.append('payload', JSON.stringify(payload));
        imagesData.forEach(obj => {
          if (obj.imageBlob !== null) {
            body.append(obj.filename, obj.imageBlob);
          }
        });
        return $http({
          method: 'POST',
          url,
          data: body,
          headers: {
            'Content-Type': undefined
          },
        }).then(function() {
          onSuccess(suggestionId);
        }, () => onFailure && onFailure(suggestionId));
      }
    };
  }
]);
