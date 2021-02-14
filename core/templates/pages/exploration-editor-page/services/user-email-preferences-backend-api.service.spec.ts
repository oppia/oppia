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
import { UserEmailPreferencesBackendApiService } from './user-email-preferences-backend-api.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
// ^^^ This block is to be removed.

describe('User Email Preferences Service', () => {
  var expId = '12345';
  var sampleResponse = {
    email_preferences: {
      mute_feedback_notifications: false,
      mute_suggestion_notifications: false
    }
  };

  var serviceInstance: UserEmailPreferencesBackendApiService = null;
  var httpTestingController: HttpTestingController = null;
  var csrfService: CsrfTokenService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    serviceInstance = TestBed.get(UserEmailPreferencesBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
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


  it('should successfully intialise the service', () => {
    expect(serviceInstance.feedbackNotificationsMuted)
      .toBeUndefined();
    expect(serviceInstance.suggestionNotificationsMuted)
      .toBeUndefined();

    serviceInstance.init(true, true);

    expect(serviceInstance.feedbackNotificationsMuted).toBe(true);
    expect(serviceInstance.suggestionNotificationsMuted).toBe(true);
  });

  it('should successfully return the feedbackNotificationsMuted value',
    () => {
      serviceInstance.init(true, true);
      expect(serviceInstance.areFeedbackNotificationsMuted())
        .toBe(true);
    });

  it('should successfully return the suggestionNotificationsMuted value',
    () => {
      serviceInstance.init(true, true);
      expect(serviceInstance.areSuggestionNotificationsMuted())
        .toBe(true);
    });

  it('should successfully set the feedback notification preferences',
    fakeAsync(() => {
      serviceInstance.setFeedbackNotificationPreferences(false);
      var req = httpTestingController.expectOne(
        '/createhandler/notificationpreferences/' + expId);
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleResponse);
      flushMicrotasks();
      expect(serviceInstance.areFeedbackNotificationsMuted())
        .toBe(false);
    }));

  it('should successfully set the suggestion notification preferences',
    fakeAsync(() => {
      serviceInstance.setSuggestionNotificationPreferences(false);

      var req = httpTestingController.expectOne(
        '/createhandler/notificationpreferences/' + expId
      );
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleResponse);
      flushMicrotasks();
      expect(serviceInstance.areSuggestionNotificationsMuted())
        .toBe(false);
    }));
});
