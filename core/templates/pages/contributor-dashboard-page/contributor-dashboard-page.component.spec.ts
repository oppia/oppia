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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
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
  var LocalStorageService = null;
  var $timeout = null;
  var UserService = null;
  var TranslationLanguageService = null;
  var TranslationTopicService = null;
  var ContributionOpportunitiesService = null;
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
    ContributionOpportunitiesService =
      $injector.get('ContributionOpportunitiesService');
    LocalStorageService = $injector.get('LocalStorageService');
    TranslationLanguageService = $injector.get('TranslationLanguageService');
    TranslationTopicService = $injector.get('TranslationTopicService');
    UserService = $injector.get('UserService');
    $q = $injector.get('$q');
    $timeout = $injector.get('$timeout');
    $rootScope = $injector.get('$rootScope');
    focusManagerService = $injector.get('FocusManagerService');
    ctrl = $componentController('contributorDashboardPage');

    spyOn(ContributionOpportunitiesService, 'getTranslatableTopicNamesAsync')
      .and.returnValue($q.resolve(['Topic 1', 'Topic 2']));
    spyOn(LocalStorageService, 'getLastSelectedTranslationLanguageCode').and
      .returnValue('');
    spyOn(LocalStorageService, 'getLastSelectedTranslationTopicName').and
      .returnValue('Topic 1');
    spyOn(TranslationLanguageService, 'setActiveLanguageCode').and
      .callThrough();
    spyOn(TranslationTopicService, 'setActiveTopicName').and.callThrough();
  }));

  it('should set focus on select lang field', function() {
    var focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');
    ctrl.onTabClick('translateTextTab');
    $timeout.flush();
    expect(focusSpy).toHaveBeenCalled();
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
      expect(ctrl.topicName).toBe('Topic 1');
      expect(TranslationTopicService.setActiveTopicName)
        .toHaveBeenCalledWith('Topic 1');
      expect(ctrl.activeTabName).toBe('myContributionTab');
      expect(ctrl.OPPIA_AVATAR_IMAGE_URL).toBe(
        '/assets/images/avatar/oppia_avatar_100px.svg');
    });

    it('should return language description in kebab case format', function() {
      let languageDescription = 'Deutsch (German)';

      expect(ctrl.provideLanguageForProtractorClass(
        languageDescription)).toEqual('deutsch-german');
    });

    it('should initialize $scope properties after controller is initialized' +
      ' and get data from backend', function() {
      expect(ctrl.userIsLoggedIn).toBe(true);
      expect(ctrl.username).toBe('username1');
      expect(ctrl.userCanReviewTranslationSuggestionsInLanguages).toEqual([
        'English', 'português (Portuguese)', 'हिन्दी (Hindi)']);
      expect(ctrl.userCanReviewVoiceoverSuggestionsInLanguages).toEqual([
        'English', 'português (Portuguese)', 'हिन्दी (Hindi)']);
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

    it('should change active topic when clicking on topic selector',
      function() {
        spyOn(LocalStorageService, 'updateLastSelectedTranslationTopicName')
          .and.callThrough();

        ctrl.onChangeTopic('Topic 2');

        expect(TranslationTopicService.setActiveTopicName)
          .toHaveBeenCalledWith('Topic 2');
        expect(LocalStorageService.updateLastSelectedTranslationTopicName)
          .toHaveBeenCalledWith('Topic 2');
      });

    it('should show topic selector based on active tab', function() {
      var changedTab = 'translateTextTab';

      expect(ctrl.activeTabName).toBe('myContributionTab');
      expect(ctrl.showLanguageSelector()).toBe(false);

      ctrl.onTabClick(changedTab);
      expect(ctrl.activeTabName).toBe(changedTab);
      expect(ctrl.showTopicSelector()).toBe(true);
    });

    it('should call scrollFunction on scroll', function() {
      var dummyScrollEvent = new Event('scroll');
      var scrollSpy = spyOn(ctrl, 'scrollFunction');

      windowRef.nativeWindow.dispatchEvent(dummyScrollEvent);

      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should show default header if window pageYOffset is ' +
      'less than 80', function() {
      const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
      nativeWindowSpy.and.returnValue({
        pageYOffset: 79
      });

      ctrl.scrollFunction();

      expect(ctrl.defaultHeaderVisible).toBe(true);
    });

    it('should show collapsed header if window pageYOffset is' +
      ' scrolled greater than 80', function() {
      const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
      nativeWindowSpy.and.returnValue({
        pageYOffset: 81
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
