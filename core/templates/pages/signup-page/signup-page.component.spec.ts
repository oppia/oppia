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
 * @fileoverview Unit tests for the signup page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('pages/signup-page/signup-page.component.ts');
require('services/csrf-token.service.ts');

describe('Signup page', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var AlertsService = null;
  var CsrfService = null;
  var LoaderService = null;
  var SiteAnalyticsService = null;
  var UrlService = null;

  var alertsServiceSpy = null;
  var loadingMessage;
  var subscriptions = [];
  var mockWindow = {
    location: {
      href: '',
      reload: () => {}
    }
  };

  beforeEach(angular.mock.module('oppia', TranslatorProviderForTests));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($componentController, $injector) {
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    AlertsService = $injector.get('AlertsService');
    CsrfService = $injector.get('CsrfTokenService');
    loadingMessage = '';
    LoaderService = $injector.get('LoaderService');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    UrlService = $injector.get('UrlService');

    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));

    spyOn(CsrfService, 'getTokenAsync').and.returnValue(
      $q.resolve('sample-csrf-token'));

    alertsServiceSpy = spyOnAllFunctions(AlertsService);

    ctrl = $componentController('signupPage', {
      $rootScope: $rootScope,
    });
  }));

  afterEach(function() {
    for (let subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  describe('when has no user logged', function() {
    beforeEach(function() {
      $httpBackend.expectGET('/signuphandler/data').respond({
        username: '',
        has_agreed_to_latest_terms: false,
        can_send_emails: true
      });

      ctrl.$onInit();
      $httpBackend.flush();
    });

    it('should show warning and not submit form', function() {
      ctrl.updateWarningText(ctrl.username);
      ctrl.submitPrerequisitesForm(true, '', true);

      expect(ctrl.warningI18nCode).toBe('I18N_SIGNUP_ERROR_NO_USERNAME');
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should show warning if email preferences is null but user can send' +
      ' emails and reset its value', function() {
      expect(ctrl.emailPreferencesWarningText).toBe(undefined);

      ctrl.submitPrerequisitesForm(true, '', null);

      expect(ctrl.emailPreferencesWarningText).toBe(
        'I18N_SIGNUP_FIELD_REQUIRED');

      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();

      ctrl.onSelectEmailPreference();
      expect(ctrl.emailPreferencesWarningText).toBe('');
    });

    it('should send correct information if can receive email updates',
      function() {
        spyOn(UrlService, 'getUrlParams').and.returnValue({
          return_url: '/expected_url'
        });
        spyOn(SiteAnalyticsService, 'registerNewSignupEvent').and.callThrough();

        var isRequestTheExpectOne = function(queryParams) {
          return decodeURIComponent(queryParams).match(
            '"can_receive_email_updates":true');
        };

        $httpBackend.expectPOST('/signuphandler/data', isRequestTheExpectOne)
          .respond(200);
        ctrl.submitPrerequisitesForm(true, '', 'yes');
        $httpBackend.flush();

        expect(SiteAnalyticsService.registerNewSignupEvent).toHaveBeenCalled();
        expect(mockWindow.location.href).toBe('/expected_url');
      });

    it('should send correct information if cannot receive email updates',
      function() {
        spyOn(UrlService, 'getUrlParams').and.returnValue({
          return_url: '/expected_url'
        });
        spyOn(SiteAnalyticsService, 'registerNewSignupEvent').and.callThrough();

        var isRequestTheExpectOne = function(queryParams) {
          return decodeURIComponent(queryParams).match(
            '"can_receive_email_updates":false');
        };

        $httpBackend.expectPOST('/signuphandler/data', isRequestTheExpectOne)
          .respond(200);
        ctrl.submitPrerequisitesForm(true, '', 'no');
        $httpBackend.flush();

        expect(SiteAnalyticsService.registerNewSignupEvent).toHaveBeenCalled();
        expect(mockWindow.location.href).toBe('/expected_url');
      });

    it('should throw an error if email preferences is invalid', function() {
      expect(() => {
        ctrl.submitPrerequisitesForm(true, '', 'invalid value');
      }).toThrowError('Invalid value for email preferences: invalid value');
    });
  });

  describe('when user has not agreed to terms', function() {
    beforeEach(function() {
      $httpBackend.expectGET('/signuphandler/data').respond({
        username: 'myUsername',
        has_agreed_to_latest_terms: false
      });

      ctrl.$onInit();
    });

    it('should show a loading message until the data is retrieved', function() {
      expect(loadingMessage).toBe('I18N_SIGNUP_LOADING');
      $httpBackend.flush();
      expect(loadingMessage).toBeFalsy();
    });

    it('should show warning if user has not agreed to terms', function() {
      ctrl.submitPrerequisitesForm(false, null);
      expect(alertsServiceSpy.addWarning).toHaveBeenCalledWith(
        'I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
    });

    it('should get data correctly from the server', function() {
      $httpBackend.flush();
      expect(ctrl.username).toBe('myUsername');
      expect(ctrl.hasAgreedToLatestTerms).toBe(false);
    });

    it('should check that form is not valid', function() {
      $httpBackend.flush();
      expect(ctrl.isFormValid()).toBe(false);
    });

    it('should not check username disponibility if user is already logged',
      function() {
        $httpBackend.flush();
        ctrl.onUsernameInputFormBlur();

        expect(alertsServiceSpy.clearWarnings).not.toHaveBeenCalled();
        expect(ctrl.blurredAtLeastOnce).toBe(false);
        expect(ctrl.warningI18nCode).toEqual('');
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });
  });

  describe('when user has agreed to terms', function() {
    beforeEach(function() {
      $httpBackend.expectGET('/signuphandler/data').respond({
        username: 'myUsername',
        has_agreed_to_latest_terms: true,
      });

      ctrl.$onInit();
    });

    it('should submit prerequisites form when return url is creator dashboard',
      function() {
        spyOn(UrlService, 'getUrlParams').and.returnValue({
          return_url: '/creator-dashboard'
        });

        $httpBackend.expect('POST', '/signuphandler/data').respond(200);
        ctrl.submitPrerequisitesForm(true, 'myUsername', true);
        $httpBackend.flush();

        expect(mockWindow.location.href).toBe('/creator-dashboard');
      });

    it('should submit prerequisites form when return url is not creator ' +
      'dashboard', function() {
      spyOn(UrlService, 'getUrlParams').and.returnValue({
        return_url: '/another_url'
      });

      $httpBackend.expect('POST', '/signuphandler/data').respond(200);
      ctrl.submitPrerequisitesForm(true, 'myUsername', true);
      $httpBackend.flush();

      expect(mockWindow.location.href).toBe('/another_url');
    });

    it('should get data correctly from the server', function() {
      $httpBackend.flush();
      expect(ctrl.username).toBe('myUsername');
      expect(ctrl.hasAgreedToLatestTerms).toBe(true);
    });

    it('should check that form is valid', function() {
      $httpBackend.flush();
      expect(ctrl.isFormValid()).toBe(true);
    });
  });

  it('should show warning when creating a username and it\'s already' +
     ' being used', function() {
    $httpBackend.expectPOST('usernamehandler/data').respond({
      username_is_taken: true
    });
    ctrl.onUsernameInputFormBlur('myUsername');
    $httpBackend.flush();

    expect(alertsServiceSpy.clearWarnings).toHaveBeenCalled();
    expect(ctrl.blurredAtLeastOnce).toBe(true);
    expect(ctrl.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_USERNAME_TAKEN');
  });

  it('should show warning when creating a username and it\'s not being used',
    function() {
      $httpBackend.expectPOST('usernamehandler/data').respond({
        username_is_taken: false
      });
      ctrl.onUsernameInputFormBlur('myUsername');
      $httpBackend.flush();

      expect(alertsServiceSpy.clearWarnings).toHaveBeenCalled();
      expect(ctrl.blurredAtLeastOnce).toBe(true);
      expect(ctrl.warningI18nCode).toEqual('');
    });

  it('should show warning if no username provided', function() {
    ctrl.updateWarningText('');
    expect(ctrl.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_NO_USERNAME');

    ctrl.submitPrerequisitesForm(false);
    expect(ctrl.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_NO_USERNAME');
  });

  it('should show warning if username has spaces', function() {
    ctrl.updateWarningText('new user');
    expect(ctrl.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES');
  });

  it('should show warning if username is too long', function() {
    ctrl.updateWarningText(
      'abcdefghijklmnopqrstuvwxyzyxwvu');
    expect(ctrl.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_TOO_LONG');
  });

  it('should show warning if username has non-alphanumeric characters',
    function() {
      ctrl.updateWarningText('a-a');
      expect(ctrl.warningI18nCode).toEqual(
        'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM');
    }
  );

  it('should show warning if username has \'admin\' in it', function() {
    ctrl.updateWarningText('administrator');
    expect(ctrl.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN');
  });

  it('should show warning if username contains oppia word', function() {
    ctrl.updateWarningText('oppiauser');
    expect(ctrl.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE');
  });

  it('should show continue registration modal if user is logged out in new tab',
    function() {
      spyOn(ctrl, 'showRegistrationSessionExpiredModal');
      var errorResponseObject = {
        status_code: 401,
        error: (
          'Sorry, you have been logged out [probably in another ' +
          'window]. Please log in again. You will be redirected ' +
          'to main page in a while!')
      };
      $httpBackend.expectPOST('/signuphandler/data').respond(
        401, errorResponseObject);
      ctrl.submitPrerequisitesForm(true, 'myUsername', 'no');
      $httpBackend.flush();
      expect(ctrl.showRegistrationSessionExpiredModal).toHaveBeenCalled();
    });

  it('should call close callback license explanation modal', function() {
    var modalSpy = spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    ctrl.showLicenseExplanationModal();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call dismiss callback license explanation modal', function() {
    var modalSpy = spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    ctrl.showLicenseExplanationModal();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call close callback registration session expired modal',
    function() {
      var modalSpy = spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      ctrl.showRegistrationSessionExpiredModal();
      $rootScope.$apply();

      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call dismiss callback registration session expired modal',
    function() {
      var modalSpy = spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      ctrl.showRegistrationSessionExpiredModal();
      $rootScope.$apply();

      expect(modalSpy).toHaveBeenCalled();
    });
});
