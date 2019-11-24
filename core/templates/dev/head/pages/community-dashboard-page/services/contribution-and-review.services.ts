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
  '$http', '$q', 'UrlInterpolationService', 'ACTION_ACCEPT_SUGGESTION',
  function(
      $http, $q, UrlInterpolationService, ACTION_ACCEPT_SUGGESTION) {
    var _SUBMITTED_SUGGESTION_LIST_HANDLER_URL_TEMPLATE = (
      '/getsubmittedsuggestions/<target_type>/<suggestion_type>');
    var _REVIEWABLE_SUGGESTIONS_HANDLER_URL_TEMPLATE = (
      '/getreviewablesuggestions/<target_type>/<suggestion_type>');
    var _SUGGESTION_ACTION_HANDLER_URL = (
      '/suggestionactionhandler/exploration/<exp_id>/<thread_id>');

    var _REVIEWABLE_VOIEOVER_APPLICATIONS_HANDLER_URL = (
      '/reviewablevoiceoverapplications');
    var _USER_VOICEOVER_APPLICATIONS_HANDLER_URL = '/uservoiceoverapplications';
    var _VOICEOVER_APPLICATION_ACTION_HANDLER_URL = (
      '/voiceoverappplicationactionhandler/<voiceover_application_id>');

    var _fetchSuggestions = function(url, onSuccess) {
      var suggestionsPromise = $http.get(url);

      return $q.when(suggestionsPromise, function(res) {
        var suggestionIdToSuggestions = {};
        var targetIdToDetails = res.data.target_ids_to_opportunity_dicts;
        res.data.suggestions.forEach(function(suggestion) {
          suggestionIdToSuggestions[suggestion.suggestion_id] = {
            suggestion: suggestion,
            details: targetIdToDetails[suggestion.target_id]
          };
        });
        onSuccess(suggestionIdToSuggestions);
      });
    };

    var _fetchApplications = function(url, onSuccess) {
      var promise = $http.get(url);

      return $q.when(promise, function(res) {
        var applicationIdToApplication = {};
        res.data.voiceover_applications.forEach(function(application) {
          applicationIdToApplication[application.voiceover_application_id] = (
            application);
        });
        onSuccess(applicationIdToApplication);
      });
    };
    return {
      getUserCreatedTranslationSuggestions: function(onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _SUBMITTED_SUGGESTION_LIST_HANDLER_URL_TEMPLATE, {
            target_type: 'exploration',
            suggestion_type: 'translate_content'
          });
        return _fetchSuggestions(url, onSuccess);
      },
      getReviewableTranslationSuggestions: function(onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _REVIEWABLE_SUGGESTIONS_HANDLER_URL_TEMPLATE, {
            target_type: 'exploration',
            suggestion_type: 'translate_content'
          });
        return _fetchSuggestions(url, onSuccess);
      },
      getUserSubmittedVoiceoverApplications: function(onSuccess) {
        var url = _USER_VOICEOVER_APPLICATIONS_HANDLER_URL;
        return _fetchApplications(url, onSuccess);
      },
      getReviewableVoiceoverApplications: function(onSuccess) {
        var url = _REVIEWABLE_VOIEOVER_APPLICATIONS_HANDLER_URL;
        return _fetchApplications(url, onSuccess);
      },
      resolveSuggestion: function(
          targetId, threadId, action, reviewMessage, commitMessage, onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _SUGGESTION_ACTION_HANDLER_URL, {
            exp_id: targetId,
            thread_id: threadId
          });
        return $http.put(url, {
          action: action,
          review_message: reviewMessage,
          commit_message: (
            action === ACTION_ACCEPT_SUGGESTION ? commitMessage : null)
        }).then(function() {
          onSuccess(threadId);
        });
      },
      resolveVoiceoverApplication: function(
          voiceoverApplicationId, action, reviewMessage, onSuccess) {
        var url = UrlInterpolationService.interpolateUrl(
          _VOICEOVER_APPLICATION_ACTION_HANDLER_URL, {
            voiceover_application_id: voiceoverApplicationId
          });
        return $http.put(url, {
          action: action,
          review_message: (
            action === ACTION_ACCEPT_SUGGESTION ? null : reviewMessage)
        }).then(function() {
          onSuccess();
        });
      }
    };
  }
]);
