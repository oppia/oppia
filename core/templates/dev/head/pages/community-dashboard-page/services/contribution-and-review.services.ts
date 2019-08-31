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
 * @fileoverview Service for getting thread data from the backend for the
 * feedback tab of the exploration editor.
 */

require('domain/feedback_thread/FeedbackThreadObjectFactory.ts');
require('domain/suggestion/SuggestionObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/AlertsService.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('ContributionAndReviewService', [
  '$http', '$q', 'UrlInterpolationService', 'ACTION_ACCEPT_SUGGESTION',
  function(
      $http, $q, UrlInterpolationService, ACTION_ACCEPT_SUGGESTION) {
    var _SUGGESTION_LIST_HANDLER_URL = '/suggestionlisthandler';
    var _SUGGESTION_ACTION_HANDLER_URL = (
      '/suggestionactionhandler/exploration/<exp_id>/<thread_id>');

    var _fetchSuggestions = function(params, onSuccess) {
      var suggestionsPromise = $http.get(_SUGGESTION_LIST_HANDLER_URL, {
        params: params
      });

      return $q.when(suggestionsPromise, function(res) {
        var suggestionIdToSuggestions = {};
        var expIdToSuggestions = res.data.exp_id_to_suggestions;
        Object.keys(expIdToSuggestions).forEach(function(key) {
          var suggestions = expIdToSuggestions[key].suggestions;
          var details = expIdToSuggestions[key].details;
          suggestions.forEach(function(suggestion) {
            suggestionIdToSuggestions[suggestion.suggestion_id] = {
              suggestion: suggestion,
              details: details
            };
          });
        });
        onSuccess(suggestionIdToSuggestions);
      });
    };

    return {
      getUserTranslationContributions: function(
          username, onSuccess, onFailure) {
        var params = {
          author_name: username,
          suggestion_type: 'translate_content'
        };
        return _fetchSuggestions(params, onSuccess);
      },
      getReviewableTranslationSuggestions: function(onSuccess) {
        var params = {
          suggestion_type: 'translate_content',
          status: 'review'
        };
        return _fetchSuggestions(params, onSuccess);
      },
      resolveSuggestion: function(targetId, threadId, action, onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _SUGGESTION_ACTION_HANDLER_URL, {
            exp_id: targetId,
            thread_id: threadId
          });
        return $http.put(url, {
          action: action,
          review_message: 'Done',
          commit_message: (
            action === ACTION_ACCEPT_SUGGESTION ? 'Accepted' : 'Rejected')
        });
      }
    };
  }
]);
