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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/' +
  'services/user-email-preferences.service.ts');

describe('User Email Preferences Service', function() {
  var UserEmailPreferencesService = null;
  var httpBackend = null;
  var CsrfService = null;
  var expId = '12345';
  var sampleResponse = {
    email_preferences: {
      mute_feedback_notifications: false,
      mute_suggestion_notifications: false
    }
  };

  beforeEach(function() {
    angular.mock.module('oppia');

    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', {
        explorationId: expId
      });
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    });

    angular.mock.inject(function($injector, $q) {
      UserEmailPreferencesService = $injector
        .get('UserEmailPreferencesService');
      CsrfService = $injector.get('CsrfTokenService');
      httpBackend = $injector.get('$httpBackend');

      spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
        var deferred = $q.defer();
        deferred.resolve('sample-csrf-token');
        return deferred.promise;
      });
    });
  });

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully intialise the service', function() {
    expect(UserEmailPreferencesService.feedbackNotificationsMuted)
      .toBeUndefined();
    expect(UserEmailPreferencesService.suggestionNotificationsMuted)
      .toBeUndefined();

    UserEmailPreferencesService.init(true, true);

    expect(UserEmailPreferencesService.feedbackNotificationsMuted).toBe(true);
    expect(UserEmailPreferencesService.suggestionNotificationsMuted).toBe(true);
  });

  it('should successfully return the feedbackNotificationsMuted value',
    function() {
      UserEmailPreferencesService.init(true, true);
      expect(UserEmailPreferencesService.areFeedbackNotificationsMuted())
        .toBe(true);
    });

  it('should successfully return the suggestionNotificationsMuted value',
    function() {
      UserEmailPreferencesService.init(true, true);
      expect(UserEmailPreferencesService.areSuggestionNotificationsMuted())
        .toBe(true);
    });

  it('should successfully set the feedback notification preferences',
    function() {
      httpBackend.expectPUT('/createhandler/notificationpreferences/' + expId)
        .respond(200, sampleResponse);
      UserEmailPreferencesService.setFeedbackNotificationPreferences(false);
      httpBackend.flush();
      expect(UserEmailPreferencesService.areFeedbackNotificationsMuted())
        .toBe(false);
    });

  it('should successfully set the suggestion notification preferences',
    function() {
      httpBackend.expectPUT('/createhandler/notificationpreferences/' + expId)
        .respond(200, sampleResponse);
      UserEmailPreferencesService.setSuggestionNotificationPreferences(false);
      httpBackend.flush();
      expect(UserEmailPreferencesService.areSuggestionNotificationsMuted())
        .toBe(false);
    });
});
