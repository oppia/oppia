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
 * @fileoverview Unit tests for the Preferences page.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// preferences-page.component.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('pages/preferences-page/preferences-page.component.ts');

describe('Preferences Controller', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $rootScope = null;
  var $q = null;
  var $timeout = null;
  var $uibModal = null;
  var CsrfService = null;
  var UserService = null;
  var userInfo = {
    getUsername: () => 'myUsername',
    email: () => 'myusername@email.com'
  };
  var mockWindow = {
    location: {
      reload: () => {}
    }
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module('oppia', TranslatorProviderForTests));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $uibModal = $injector.get('$uibModal');

    CsrfService = $injector.get('CsrfTokenService');
    UserService = $injector.get('UserService');

    spyOn(CsrfService, 'getTokenAsync').and.returnValue(
      $q.resolve('sample-csrf-token'));

    ctrl = $componentController('preferencesPage', {
      $rootScope: $rootScope
    });

    spyOn(UserService, 'getUserInfoAsync').and.returnValue(
      $q.resolve(userInfo));
    $httpBackend.expectGET('/preferenceshandler/data').respond({
      can_receive_email_updates: false,
      can_receive_editor_role_email: true,
      can_receive_feedback_message_email: true
    });

    ctrl.$onInit();
    $rootScope.$apply();
    $httpBackend.flush();
  }));

  it('should get static image url', function() {
    expect(ctrl.getStaticImageUrl('/path/to/image.png')).toBe(
      '/assets/images/path/to/image.png');
  });

  it('should save user bio', function() {
    var userBio = 'User bio example';
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match('"update_type":"user_bio"');
    };

    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.saveUserBio(userBio);
    $httpBackend.flush();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save subject interests after changing it', function() {
    var subjectInterests = 'Math';
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match(
        '"update_type":"subject_interests"');
    };

    expect(ctrl.subjectInterestsChangedAtLeastOnce).toBe(false);

    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.onSubjectInterestsSelectionChange(subjectInterests);
    $httpBackend.flush();

    expect(ctrl.subjectInterestsChangedAtLeastOnce).toBe(true);

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save preferred site language code after changing it', function() {
    var newLanguage = 'es';
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match(
        '"update_type":"preferred_site_language_code"');
    };

    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.savePreferredSiteLanguageCodes(newLanguage);
    $httpBackend.flush();

    expect(ctrl.select2DropdownIsShown).toBe(false);
    $timeout.flush();
    expect(ctrl.select2DropdownIsShown).toBe(true);

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save preferred audio language code after changing it', function() {
    var newLanguage = 'es';
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match(
        '"update_type":"preferred_audio_language_code"');
    };

    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.savePreferredAudioLanguageCode(newLanguage);
    $httpBackend.flush();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should show username popover based on its length', function() {
    expect(ctrl.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
    expect(ctrl.showUsernamePopover('abc')).toBe('none');
  });

  it('should save email preferences', function() {
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match(
        '"update_type":"email_preferences"');
    };
    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.saveEmailPreferences(true, true, true, true);
    $httpBackend.flush();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save preferred language codes', function() {
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match(
        '"update_type":"preferred_language_codes"');
    };
    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.savePreferredLanguageCodes([]);
    $httpBackend.flush();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save default dashboard', function() {
    var isRequestTheExpectOne = function(queryParams) {
      return decodeURIComponent(queryParams).match(
        '"update_type":"default_dashboard"');
    };
    $httpBackend.expect(
      'PUT', '/preferenceshandler/data', isRequestTheExpectOne).respond(200);
    ctrl.saveDefaultDashboard({});
    $httpBackend.flush();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should handle export data click', function() {
    expect(ctrl.exportingData).toBe(false);
    ctrl.handleExportDataClick();
    expect(ctrl.exportingData).toBe(true);
  });

  it('should show that notifications checkbox is true by default',
    function() {
      expect(ctrl.canReceiveEditorRoleEmail).toBe(true);
      expect(ctrl.canReceiveFeedbackMessageEmail).toBe(true);
    });

  it('should map SUPPORTED_AUDIO_LANGUAGES correctly to ' +
      'AUDIO_LANGUAGE_CHOICES to support select2 plugin',
  function() {
    var numberOfAudioLanguageChoices = ctrl.AUDIO_LANGUAGE_CHOICES.length;
    expect(numberOfAudioLanguageChoices > 0).toBe(true);
    for (var index = 0; index < numberOfAudioLanguageChoices; index++) {
      expect(Object.keys(ctrl.AUDIO_LANGUAGE_CHOICES[index])).toEqual(
        ['id', 'text']);
    }
  });

  it('should edit profile picture modal', function() {
    var newPicture = 'new-picture.png';
    spyOn(mockWindow.location, 'reload').and.callThrough();
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve(newPicture)
    });
    spyOn(UserService, 'setProfileImageDataUrlAsync').and.returnValue(
      $q.resolve());

    ctrl.showEditProfilePictureModal();
    $rootScope.$apply();
    $rootScope.$apply();

    expect(mockWindow.location.reload).toHaveBeenCalled();
  });

  it('should edit profile picture modal', function() {
    spyOn(mockWindow.location, 'reload').and.callThrough();
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    ctrl.showEditProfilePictureModal();
    $rootScope.$apply();

    expect(mockWindow.location.reload).not.toHaveBeenCalled();
  });
});
