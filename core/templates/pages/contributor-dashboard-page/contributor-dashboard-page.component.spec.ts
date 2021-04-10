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
 * @fileoverview Unit tests for contributor dashboard page component.
 */
import { importAllAngularServices } from 'tests/unit-test-utils';
import { WindowRef } from 'services/contextual/window-ref.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

require(
  'pages/contributor-dashboard-page/contributor-dashboard-page.component.ts');

describe('Contributor dashboard page', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $window = null;
  var LocalStorageService = null;
  var $timeout = null;
  var UserService = null;
  var TranslationLanguageService = null;
  var userProfileImage = 'profile-data-url';
  var userContributionRights = {
    can_review_translation_for_language_codes: ['en', 'pt', 'hi'],
    can_review_voiceover_for_language_codes: ['en', 'pt', 'hi'],
    can_review_questions: true
  };
  var windowRef = new WindowRef();
  var focusManagerService = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    focusManagerService = TestBed.get(FocusManagerService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    LocalStorageService = $injector.get('LocalStorageService');
    TranslationLanguageService = $injector.get('TranslationLanguageService');
    UserService = $injector.get('UserService');
    $q = $injector.get('$q');
    $window = $injector.get('$window');
    $timeout = $injector.get('$timeout');
    $rootScope = $injector.get('$rootScope');
    focusManagerService = $injector.get('FocusManagerService');
    ctrl = $componentController('contributorDashboardPage');

    spyOn(LocalStorageService, 'getLastSelectedTranslationLanguageCode').and
      .returnValue('');
    spyOn(TranslationLanguageService, 'setActiveLanguageCode').and
      .callThrough();
  }));

  it('should set focus on select lang field', function() {
    var focusSpy = spyOn(focusManagerService, 'setFocus');
    var windowSpy = spyOn ($window, 'scrollTo');
    ctrl.onTabClick('translateTextTab');
    $timeout.flush();
    expect(focusSpy).toHaveBeenCalled();
    $timeout.flush();
    expect(windowSpy).toHaveBeenCalled();
  });

  describe('when user is logged in', function() {
    var userInfo = {
      isLoggedIn: () => true,
      getUsername: () => 'username1'
    };

    beforeEach(function() {
      spyOn(UserService, 'getProfileImageDataUrlAsync')
        .and.returnValue($q.resolve(userProfileImage));
      spyOn(UserService, 'getUserContributionRightsDataAsync')
        .and.returnValue($q.resolve(userContributionRights));
      spyOn(UserService, 'getUserInfoAsync').and.returnValue(
        $q.resolve(userInfo));
      ctrl.$onInit();
      $rootScope.$apply();
    });

    it('should set specific properties after $onInit is called', function() {
      expect(ctrl.languageCode).toBe('hi');
      expect(TranslationLanguageService.setActiveLanguageCode)
        .toHaveBeenCalledWith('hi');
      expect(ctrl.activeTabName).toBe('myContributionTab');
      expect(ctrl.OPPIA_AVATAR_IMAGE_URL).toBe(
        '/assets/images/avatar/oppia_avatar_100px.svg');
    });

    it('should initialize $scope properties after controller is initialized' +
      ' and get data from backend', function() {
      expect(ctrl.userIsLoggedIn).toBe(true);
      expect(ctrl.username).toBe('username1');
      expect(ctrl.userCanReviewTranslationSuggestionsInLanguages).toEqual([
        'English', 'Portuguese', 'Hindi']);
      expect(ctrl.userCanReviewVoiceoverSuggestionsInLanguages).toEqual([
        'English', 'Portuguese', 'Hindi']);
      expect(ctrl.userCanReviewQuestions).toBe(true);
      expect(ctrl.userIsReviewer).toBe(true);
      expect(ctrl.profilePictureDataUrl).toBe(userProfileImage);
    });

    it('should change active tab name when clicking on translate text tab',
      function() {
        var changedTab = 'translateTextTab';
        expect(ctrl.activeTabName).toBe('myContributionTab');
        ctrl.onTabClick(changedTab);
        expect(ctrl.activeTabName).toBe(changedTab);
      });

    it('should change active language when clicking on language selector',
      function() {
        spyOn(LocalStorageService, 'updateLastSelectedTranslationLanguageCode')
          .and.callThrough();

        ctrl.onChangeLanguage('hi');

        expect(TranslationLanguageService.setActiveLanguageCode)
          .toHaveBeenCalledWith('hi');
        expect(LocalStorageService.updateLastSelectedTranslationLanguageCode)
          .toHaveBeenCalledWith('hi');
      });

    it('should show language selector based on active tab', function() {
      var changedTab = 'translateTextTab';

      expect(ctrl.activeTabName).toBe('myContributionTab');
      expect(ctrl.showLanguageSelector()).toBe(false);

      ctrl.onTabClick(changedTab);
      expect(ctrl.activeTabName).toBe(changedTab);
      expect(ctrl.showLanguageSelector()).toBe(true);
    });

    it('should call scrollFunction on scroll', function() {
      var e = document.createEvent('Event');
      var scrollSpy = spyOn(ctrl, 'scrollFunction');
      e.initEvent('scroll', true, true);

      window.dispatchEvent(e);

      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should show default header if window pageYOffset is ' +
      'less than 5', function() {
      const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
      nativeWindowSpy.and.returnValue({
        pageYOffset: 4
      });

      ctrl.scrollFunction();

      expect(ctrl.defaultHeaderVisible).toBe(true);
    });

    it('should show collapsed header if window pageYOffset is' +
      ' scrolled greater than 5', function() {
      const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
      nativeWindowSpy.and.returnValue({
        pageYOffset: 6
      });

      ctrl.scrollFunction();

      expect(ctrl.defaultHeaderVisible).toBe(false);
    });
  });

  describe('when user is not logged in', function() {
    var userInfo = {
      isLoggedIn: () => false
    };

    beforeEach(function() {
      spyOn(UserService, 'getProfileImageDataUrlAsync')
        .and.returnValue($q.resolve(userProfileImage));
      spyOn(UserService, 'getUserContributionRightsDataAsync')
        .and.returnValue($q.resolve(userContributionRights));
      spyOn(UserService, 'getUserInfoAsync').and.returnValue(
        $q.resolve(userInfo));
      ctrl.$onInit();
      $rootScope.$apply();
    });

    it('should have no user data in dashboard page', function() {
      expect(ctrl.userIsLoggedIn).toBe(false);
      expect(ctrl.username).toBe('');
    });
  });
});
