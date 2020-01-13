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
 * @fileoverview Unit tests for the editor prerequisites page.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('pages/signup-page/signup-page.controller.ts');
require('services/csrf-token.service.ts');

describe('Signup controller', function() {
  describe('SignupCtrl', function() {
    var ctrl, $httpBackend, rootScope, mockAlertsService, urlParams;
    var $componentController, CsrfService;

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(angular.mock.inject(function(
        _$componentController_, $http, _$httpBackend_, $injector, $rootScope,
        $q) {
      $componentController = _$componentController_;
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/signuphandler/data').respond({
        username: 'myUsername',
        has_agreed_to_latest_terms: false
      });
      rootScope = $rootScope;
      CsrfService = $injector.get('CsrfTokenService');

      spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
        var deferred = $q.defer();
        deferred.resolve('sample-csrf-token');
        return deferred.promise;
      });

      mockAlertsService = {
        addWarning: function() {}
      };
      spyOn(mockAlertsService, 'addWarning');

      ctrl = $componentController('signupPage', {
        AlertsService: mockAlertsService}, {
        $http: $http,
        $rootScope: rootScope,
        getUrlParams: function() {
          return {
            return_url: 'return_url'
          };
        }
      });
      // Refer: https://www.codelord.net/2017/01/09/
      // unit-testing-angular-components-with-%24componentcontroller/
      // Angular and $componentController does not take care of
      // $onInit lifecycle hook, so we need to call it explicitly.
      ctrl.$onInit();
    }));

    it('should show warning if user has not agreed to terms', function() {
      ctrl.submitPrerequisitesForm(false, null);
      expect(mockAlertsService.addWarning).toHaveBeenCalledWith(
        'I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
    });

    it('should get data correctly from the server', function() {
      $httpBackend.flush();
      expect(ctrl.username).toBe('myUsername');
      expect(ctrl.hasAgreedToLatestTerms).toBe(false);
    });

    it('should show a loading message until the data is retrieved', function() {
      expect(rootScope.loadingMessage).toBe('I18N_SIGNUP_LOADING');
      $httpBackend.flush();
      expect(rootScope.loadingMessage).toBeFalsy();
    });

    it('should show warning if terms are not agreed to', function() {
      ctrl.submitPrerequisitesForm(false, '');
      expect(mockAlertsService.addWarning).toHaveBeenCalledWith(
        'I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
    });

    it('should show warning if no username provided', function() {
      ctrl.updateWarningText('');
      expect(ctrl.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_NO_USERNAME');

      ctrl.submitPrerequisitesForm(false);
      expect(ctrl.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_NO_USERNAME');
    });

    it('should show warning if username is too long', function() {
      ctrl.updateWarningText(
        'abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba');
      expect(ctrl.warningI18nCode).toEqual(
        'I18N_SIGNUP_ERROR_USERNAME_MORE_50_CHARS');
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

    it(
      'should show continue registration modal if user is logged ' +
      'out in new tab',
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
  });
});
