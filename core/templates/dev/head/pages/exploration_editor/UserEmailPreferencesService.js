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
 * @fileoverview User exploration emails service for the exploration settings.
 */

oppia.factory('UserEmailPreferencesService', [
  '$http', '$q', 'AlertsService', 'ExplorationDataService',
  'UrlInterpolationService',
  function(
      $http, $q, AlertsService,
      ExplorationDataService, UrlInterpolationService) {
    var MESSAGE_TYPE_SUGGESTION = 'suggestion';
    var MESSAGE_TYPE_FEEDBACK = 'feedback';
    return {
      init: function(
          feedbackNotificationsMuted, suggestionNotificationsMuted) {
        this.feedbackNotificationsMuted = feedbackNotificationsMuted;
        this.suggestionNotificationsMuted = suggestionNotificationsMuted;
      },
      areFeedbackNotificationsMuted: function() {
        return this.feedbackNotificationsMuted;
      },
      areSuggestionNotificationsMuted: function() {
        return this.suggestionNotificationsMuted;
      },
      setFeedbackNotificationPreferences: function(mute) {
        this.saveChangeToBackend({
          message_type: MESSAGE_TYPE_FEEDBACK,
          mute: mute
        });
      },
      setSuggestionNotificationPreferences: function(mute) {
        this.saveChangeToBackend({
          message_type: MESSAGE_TYPE_SUGGESTION,
          mute: mute
        });
      },
      saveChangeToBackend: function(requestParams) {
        var that = this;
        var emailPreferencesUrl = UrlInterpolationService.interpolateUrl(
          '/createhandler/notificationpreferences/<exploration_id>', {
            exploration_id: ExplorationDataService.explorationId
          }
        );
        return $http.put(emailPreferencesUrl, requestParams).then(
          function(response) {
            var data = response.data;
            AlertsService.clearWarnings();
            that.init(
              data.email_preferences.mute_feedback_notifications,
              data.email_preferences.mute_suggestion_notifications);
          }
        );
      }
    };
  }
]);
