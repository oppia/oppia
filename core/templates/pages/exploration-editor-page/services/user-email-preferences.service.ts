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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';

import { UserEmailPreferencesBackendApiService } from
  'domain/user/user-email-preferences-backend-api.service';

// require('domain/utilities/url-interpolation.service.ts')
// require('pages/exploration-editor-page/services/exploration-data.service.ts')
// require('services/alerts.service.ts')




@Injectable({
  providedIn: 'root'
})
export class UserEmailPreferencesService {
  MESSAGE_TYPE_SUGGESTION = 'suggestion';
  MESSAGE_TYPE_FEEDBACK = 'feedback';

  constructor(
  private urlInterpolationService: UrlInterpolationService,
  private explorationDataService: ExplorationDataService,
  private alertsService: AlertsService,
  private userEmailPreferencesBackendApiService:
   UserEmailPreferencesBackendApiService,
  private feedbackNotificationsMuted,
  private suggestionNotificationsMuted
  ) {

  }

  init(feedbackNotificationsMuted, suggestionNotificationsMuted) {
    this.feedbackNotificationsMuted = feedbackNotificationsMuted;
    this.suggestionNotificationsMuted = suggestionNotificationsMuted;
  }

  /**
       * @return {boolean} Whether the feedback notification is muted.
       */
  areFeedbackNotificationsMuted() :boolean {
    return this.feedbackNotificationsMuted;
  }
  /**
       * @return {boolean} Whether the suggestion notification is muted.
       */
  areSuggestionNotificationsMuted() :boolean {
    return this.suggestionNotificationsMuted;
  }
  /**
       * Set the message type to feedback and mute to true or false.
       * @param {boolean} mute - Whether the feedback notification is muted.
       */
  setFeedbackNotificationPreferences(mute) :void {
    this.saveChangeToBackend({
      message_type: this.MESSAGE_TYPE_FEEDBACK,
      mute: mute
    });
  }
  /**
       * Set the message type to suggestion and mute to true or false.
       * @param {boolean} mute - Whether the suggestion notification is muted.
       */
  setSuggestionNotificationPreferences(mute) :void {
    this.saveChangeToBackend({
      message_type: this.MESSAGE_TYPE_SUGGESTION,
      mute: mute
    });
  }
  /**
       * Save the change of message_type and mute to backend.
       * @param {object} requestParams - Info about message_type and mute.
       */
  saveChangeToBackend(requestParams) :Promise< void |Object> {
    let that = this;
    var emailPreferencesUrl = this.urlInterpolationService.interpolateUrl(
      '/createhandler/notificationpreferences/<exploration_id>', {
        exploration_id: ExplorationDataService.explorationId
      }
    );


    return this.userEmailPreferencesBackendApiService
      .saveChangeToBackend(requestParams).then(
        (response:any) => {
          let data = response.data;
          this.alertsService.clearWarnings();
          that.init(
            data.email_preferences.mute_feedback_notifications,
            data.email_preferences.mute_suggestion_notifications);
        }
      );
  }
}

angular.module('oppia').factory('UserEmailPreferencesService',
  downgradeInjectable(UserEmailPreferencesService));


