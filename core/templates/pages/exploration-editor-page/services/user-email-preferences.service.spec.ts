// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the UserEmailPreferencesService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UserEmailPreferencesService } from './user-email-preferences.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
// ^^^ This block is to be removed.

describe('User Email Preferences Service', () => {
  let expId = '12345';
  let sampleResponse = {
    email_preferences: {
      mute_feedback_notifications: false,
      mute_suggestion_notifications: false
    }
  };

  let userEmailPreferencesService :
  UserEmailPreferencesService;
  let httpTestingController: HttpTestingController;
  let csrfTokenService: CsrfTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    userEmailPreferencesService = TestBed.get(UserEmailPreferencesService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfTokenService = TestBed.get(CsrfTokenService);

    spyOn(csrfTokenService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully intialise the service', () => {
    expect(userEmailPreferencesService.feedbackNotificationsMuted)
      .toBeUndefined();
    expect(userEmailPreferencesService.suggestionNotificationsMuted)
      .toBeUndefined();

    userEmailPreferencesService.init(true, true);

    expect(userEmailPreferencesService.feedbackNotificationsMuted).toBe(true);
    expect(userEmailPreferencesService.suggestionNotificationsMuted).toBe(true);
  });

  it('should successfully return the feedbackNotificationsMuted value',
    () => {
      userEmailPreferencesService.init(true, true);
      expect(userEmailPreferencesService.areFeedbackNotificationsMuted())
        .toBe(true);
    });

  it('should successfully return the suggestionNotificationsMuted value',
    () => {
      userEmailPreferencesService.init(true, true);
      expect(userEmailPreferencesService.areSuggestionNotificationsMuted())
        .toBe(true);
    });

  it('should successfully set the feedback notification preferences',
    fakeAsync(() => {
      userEmailPreferencesService.setFeedbackNotificationPreferences(false);
      var req = httpTestingController.expectOne(
        '/createhandler/notificationpreferences/' + expId);
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleResponse);
      flushMicrotasks();
      expect(userEmailPreferencesService.areFeedbackNotificationsMuted())
        .toBe(false);
    }));

  it('should successfully set the suggestion notification preferences',
    fakeAsync(() => {
      userEmailPreferencesService.setSuggestionNotificationPreferences(false);

      var req = httpTestingController.expectOne(
        '/createhandler/notificationpreferences/' + expId
      );
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleResponse);
      flushMicrotasks();
      expect(userEmailPreferencesService.areSuggestionNotificationsMuted())
        .toBe(false);
    }));
});
