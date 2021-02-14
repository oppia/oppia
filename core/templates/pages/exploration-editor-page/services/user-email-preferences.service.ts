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

import { HttpClient } from '@angular/common/http';
import { AlertsService } from 'services/alerts.service';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
/**
 * @fileoverview User exploration emails service for the exploration settings.
 */
@Injectable({
  providedIn: 'root'
})
export class UserEmailPreferencesService {
  MESSAGE_TYPE_SUGGESTION = 'suggestion';
  MESSAGE_TYPE_FEEDBACK = 'feedback';
  feedbackNotificationsMuted: boolean;
  suggestionNotificationsMuted: boolean;
  constructor(
    private http: HttpClient,
    private alertsService: AlertsService
  ) { }

  init(
      feedbackNotificationsMuted: boolean,
      suggestionNotificationsMuted: boolean): void {
    this.feedbackNotificationsMuted = feedbackNotificationsMuted;
    this.suggestionNotificationsMuted = suggestionNotificationsMuted;
  }
  /**
   * @return {boolean} Whether the feedback notification is muted.
   */
  areFeedbackNotificationsMuted(): boolean {
    return this.feedbackNotificationsMuted;
  }
  /**
   * @return {boolean} Whether the suggestion notification is muted.
   */
  areSuggestionNotificationsMuted(): boolean {
    return this.suggestionNotificationsMuted;
  }
  /**
   * Set the message type to feedback and mute to true or false.
   * @param {boolean} mute - Whether the feedback notification is muted.
   */
  setFeedbackNotificationPreferences(mute: boolean): void {
    this.saveChangeToBackend({
      message_type: this.MESSAGE_TYPE_FEEDBACK,
      mute: mute
    });
  }
  /**
   * Set the message type to suggestion and mute to true or false.
   * @param {boolean} mute - Whether the suggestion notification is muted.
   */
  setSuggestionNotificationPreferences(mute: boolean): void {
    this.saveChangeToBackend({
      message_type: this.MESSAGE_TYPE_SUGGESTION,
      mute: mute
    });
  }
  /**
   * Save the change of message_type and mute to backend.
   * @param {object} requestParams - Info about message_type and mute.
   */
  saveChangeToBackend(
      requestParams: object
  ): Promise<void | object> {
    var that = this;
    var emailPreferencesUrl = '/createhandler/notificationpreferences/12345';
    return this.http.put(emailPreferencesUrl, requestParams).toPromise().then(
      function(response) {
        var data = response;
        that.alertsService.clearWarnings(),
        that.init(
          data.email_preferences.mute_feedback_notifications,
          data.email_preferences.mute_suggestion_notifications);
      });
  }
}

angular.module('oppia').factory(
  'UserEmailPreferencesService',
  downgradeInjectable(UserEmailPreferencesService));
