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
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Signup controller', function() {

  describe('SignupCtrl', function() {
    var scope, ctrl, $httpBackend, rootScope, mockWarningsData, urlParams;

    beforeEach(module('oppia', GLOBALS.OVERWRITE_TRANSLATOR_PROVIDER));

    beforeEach(inject(function(_$httpBackend_, $http, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/signuphandler/data').respond({
        username: 'myUsername',
        has_agreed_to_latest_terms: false
      });
      rootScope = $rootScope;

      mockWarningsData = {
        addWarning: function(warning) {}
      };
      spyOn(mockWarningsData, 'addWarning');

      scope = {
        getUrlParams: function() {
          return {return_url: 'return_url'};
        }
      };

      ctrl = $controller('Signup', {
        $scope: scope,
        $http: $http,
        $rootScope: rootScope,
        warningsData: mockWarningsData
      });
    }));

    it('should show warning if user has not agreed to terms', function() {
      scope.submitPrerequisitesForm(false, null);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'I18N_SIGNUP_ERROR_MUST_AGREE_WITH_TERMS');
    });

    it('should get data correctly from the server', function() {
      $httpBackend.flush();
      expect(scope.username).toBe('myUsername');
      expect(scope.hasAgreedToLatestTerms).toBe(false);
    });

    it('should show a loading message until the data is retrieved', function() {
      expect(rootScope.loadingMessage).toBe('I18N_SIGNUP_LOADING');
      $httpBackend.flush();
      expect(rootScope.loadingMessage).toBeFalsy();
    });

    it('should show warning if terms are not agreed to', function() {
      scope.submitPrerequisitesForm(false, '');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'I18N_SIGNUP_ERROR_MUST_AGREE_WITH_TERMS');
    });

    it('should show warning if no username provided', function($http) {
      scope.updateWarningText('');
      expect(scope.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_NO_USERNAME');

      scope.submitPrerequisitesForm(false);
      expect(scope.warningI18nCode).toEqual('I18N_SIGNUP_ERROR_NO_USERNAME');
    });

    it('should show warning if username is too long', function($http) {
      scope.updateWarningText(
        'abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba');
      expect(scope.warningI18nCode).toEqual(
        'I18N_SIGNUP_ERROR_USERNAME_MORE_50_CHARS');
    });

    it('should show warning if username has non-alphanumeric characters', function($http) {
      scope.updateWarningText('a-a');
      expect(scope.warningI18nCode).toEqual(
        'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM');
    });

    it('should show warning if username has \'admin\' in it', function($http) {
      scope.updateWarningText('administrator');
      expect(scope.warningI18nCode).toEqual(
        'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN');
    });
  });
});
