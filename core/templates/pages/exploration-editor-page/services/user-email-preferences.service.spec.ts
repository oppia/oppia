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
 * @fileoverview Unit tests for the UserEmailPreferencesService.
 */



import { HttpClientTestingModule, HttpTestingController } from
   '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { CsrfTokenService } from 'services/csrf-token.service';
import {UserEmailPreferencesService } from './user-email-preferences.service';

describe('User Email Preferences Service',() => {
  let userEmailPreferencesService: UserEmailPreferencesService = null;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  var expId = '12345';
  var sampleResponse = {
    email_preferences: {
      mute_feedback_notifications: false,
      mute_suggestion_notifications: false
    }
  };

  beforeEach( () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    userEmailPreferencesService = TestBed.get(UserEmailPreferencesService);  
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
    });

    afterEach(() => {
      httpTestingController.verify();
      });

  it('should successfully intialise the service', fakeAsync(() => {
    expect(this.userEmailPreferencesService.feedbackNotificationsMuted)
      .toBeUndefined();
    expect(this.userEmailPreferencesService.suggestionNotificationsMuted)
      .toBeUndefined();

    userEmailPreferencesService.init(true, true);

    expect(this.userEmailPreferencesService.feedbackNotificationsMuted)
      .toBe(true);
    expect(this.userEmailPreferencesService.suggestionNotificationsMuted)
      .toBe(true);
  }));

  it('should successfully return the feedbackNotificationsMuted value',
  fakeAsync(() => {
      userEmailPreferencesService.init(true, true);
      expect(userEmailPreferencesService.areFeedbackNotificationsMuted())
        .toBe(true);
    }));

  it('should successfully return the suggestionNotificationsMuted value',
  fakeAsync(() => {
      userEmailPreferencesService.init(true, true);
      expect(userEmailPreferencesService.areSuggestionNotificationsMuted())
        .toBe(true);
    }));

  it('should successfully set the feedback notification preferences',
  fakeAsync(() => {
      let req = httpTestingController
      .expectOne('/createhandler/notificationpreferences/' + expId);
      expect(req.request.method).toEqual('PUT');
      userEmailPreferencesService.setFeedbackNotificationPreferences(false);
      flushMicrotasks();

      expect(userEmailPreferencesService.areFeedbackNotificationsMuted())
        .toBe(false);
    }));

  it('should successfully set the suggestion notification preferences',
  fakeAsync(() => {
      let req = httpTestingController
      .expectOne('/createhandler/notificationpreferences/' + expId);
      expect(req.request.method).toEqual('PUT');
      userEmailPreferencesService.setSuggestionNotificationPreferences(false);
      flushMicrotasks();
      expect(userEmailPreferencesService.areSuggestionNotificationsMuted())
        .toBe(false);
    }));
});
