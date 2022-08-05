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

import { WindowRef } from 'services/contextual/window-ref.service';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ContributorDashboardPageComponent } from 'pages/contributor-dashboard-page/contributor-dashboard-page.component';
import { ContributionOpportunitiesService } from './services/contribution-opportunities.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { UserService } from 'services/user.service';
import { LocalStorageService } from 'services/local-storage.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserInfo } from 'domain/user/user-info.model';

describe('Contributor dashboard page', () => {
  let component: ContributorDashboardPageComponent;
  let fixture: ComponentFixture<ContributorDashboardPageComponent>;
  let localStorageService: LocalStorageService;
  let userService: UserService;
  let translationLanguageService: TranslationLanguageService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  let userProfileImage = 'profile-data-url';
  let userContributionRights = {
    can_review_translation_for_language_codes: ['en', 'pt', 'hi'],
    can_review_voiceover_for_language_codes: ['en', 'pt', 'hi'],
    can_review_questions: true,
    can_suggest_questions: true,
  };
  let focusManagerService: FocusManagerService;
  let windowRef: WindowRef;
  let getTranslatableTopicNamesAsyncSpy;
  let getUserInfoAsyncSpy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ContributorDashboardPageComponent
      ],
      providers: [
        LocalStorageService,
        UserService,
        TranslationLanguageService,
        TranslationTopicService,
        ContributionOpportunitiesService,
        WindowRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContributorDashboardPageComponent);
    component = fixture.componentInstance;

    contributionOpportunitiesService =
      TestBed.inject(ContributionOpportunitiesService);
    localStorageService = TestBed.inject(LocalStorageService);
    windowRef = TestBed.inject(WindowRef);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    userService = TestBed.inject(UserService);
    focusManagerService = TestBed.inject(FocusManagerService);

    getTranslatableTopicNamesAsyncSpy = spyOn(
      contributionOpportunitiesService, 'getTranslatableTopicNamesAsync');
    getTranslatableTopicNamesAsyncSpy.and.returnValue(
      Promise.resolve(['Topic 1', 'Topic 2']));
    spyOn(localStorageService, 'getLastSelectedTranslationLanguageCode').and
      .returnValue('');
    spyOn(localStorageService, 'getLastSelectedTranslationTopicName').and
      .returnValue('Topic 1');
    spyOn(translationLanguageService, 'setActiveLanguageCode').and
      .callThrough();
    spyOn(translationTopicService, 'setActiveTopicName').and.callThrough();

    let userInfo = {
      isLoggedIn: () => true,
      getUsername: () => 'username1'
    };

    spyOn(userService, 'getProfileImageDataUrlAsync')
      .and.returnValue(Promise.resolve(userProfileImage));
    spyOn(userService, 'getUserContributionRightsDataAsync')
      .and.returnValue(Promise.resolve(userContributionRights));
    getUserInfoAsyncSpy = spyOn(userService, 'getUserInfoAsync')
    getUserInfoAsyncSpy.and.returnValue(
      Promise.resolve(userInfo as UserInfo));

    component.ngOnInit();
  });

  it('should set focus on select lang field', fakeAsync(() => {
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');

    component.onTabClick('translateTextTab');
    tick();
    flush();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should scroll properly', () => {
    const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
    nativeWindowSpy.and.returnValue({
      pageYOffset: 11
    });

    component.scrollFunction();

    expect(component.defaultHeaderVisible).toBeTrue();
  });

  it('should username equal to "" when user is not loggedIn', fakeAsync(() => {
    let userInfo = {
      isLoggedIn: () => false,
      getUsername: () => 'username1'
    };

    getUserInfoAsyncSpy.and.returnValue(
      Promise.resolve(userInfo as UserInfo));

    component.ngOnInit();
    tick();

    expect(component.username).toEqual('');
    expect(component.userIsLoggedIn).toBeFalse();
  }));

  describe('when user is logged in', () => {
    it('should set specific properties after $onInit is called',
      fakeAsync(() => {
        component.ngOnInit();
        tick();

        expect(component.topicName).toBe('Topic 1');
        expect(translationTopicService.setActiveTopicName)
          .toHaveBeenCalled();
        expect(component.activeTabName).toBe('myContributionTab');
        expect(component.OPPIA_AVATAR_IMAGE_URL).toBe(
          '/assets/images/avatar/oppia_avatar_100px.svg');
      }));

    it('should not set active topic name when no topics are returned',
      fakeAsync(() => {
        getTranslatableTopicNamesAsyncSpy.and.returnValue(
          Promise.resolve([]));

        component.ngOnInit();
        tick();

        expect(component.topicName).toBe(undefined);
        expect(translationTopicService.setActiveTopicName)
          .not.toHaveBeenCalled();
      }));

    it('should return language description in kebab case format', () => {
      let languageDescription = 'Deutsch (German)';

      expect(component.provideLanguageForProtractorClass(
        languageDescription)).toEqual('deutsch-german');
    });

    it('should initialize $scope properties after controller is initialized' +
      ' and get data from backend', () => {
      expect(component.userIsLoggedIn).toBe(false);
      expect(component.username).toBe(null);
      expect(component.userCanReviewQuestions).toBe(false);
      expect(component.userIsReviewer).toBe(false);
      expect(component.profilePictureDataUrl).toBe(null);
    });

    it('should change active tab name when clicking on translate text tab',
      () => {
        let changedTab = 'translateTextTab';
        expect(component.activeTabName).toBe('myContributionTab');
        component.onTabClick(changedTab);
        expect(component.activeTabName).toBe(changedTab);
      });

    it('should change active language when clicking on language selector',
      () => {
        spyOn(localStorageService, 'updateLastSelectedTranslationLanguageCode')
          .and.callThrough();

        component.onChangeLanguage('hi');

        expect(translationLanguageService.setActiveLanguageCode)
          .toHaveBeenCalledWith('hi');
        expect(localStorageService.updateLastSelectedTranslationLanguageCode)
          .toHaveBeenCalledWith('hi');
      });

    it('should show language selector based on active tab', () => {
      let changedTab = 'translateTextTab';

      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.showLanguageSelector()).toBe(false);

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showLanguageSelector()).toBe(true);
    });

    it('should change active topic when clicking on topic selector',
      () => {
        spyOn(localStorageService, 'updateLastSelectedTranslationTopicName')
          .and.callThrough();

        component.onChangeTopic('Topic 2');

        expect(translationTopicService.setActiveTopicName)
          .toHaveBeenCalledWith('Topic 2');
        expect(localStorageService.updateLastSelectedTranslationTopicName)
          .toHaveBeenCalledWith('Topic 2');
      });

    it('should show topic selector based on active tab', () => {
      let changedTab = 'translateTextTab';

      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.showLanguageSelector()).toBe(false);

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showTopicSelector()).toBe(true);
    });

    it('should call scrollFunction on scroll', () => {
      let dummyScrollEvent = new Event('scroll');
      let scrollSpy = spyOn(component, 'scrollFunction');

      windowRef.nativeWindow.dispatchEvent(dummyScrollEvent);

      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should show default header if window pageYOffset is ' +
      'less than 80', function() {
      const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
      nativeWindowSpy.and.returnValue({
        pageYOffset: 79
      });

      component.scrollFunction();

      expect(component.defaultHeaderVisible).toBe(true);
    });

    it('should show collapsed header if window pageYOffset is' +
      ' scrolled greater than 80', fakeAsync(() => {
      const nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
      nativeWindowSpy.and.returnValue({
        pageYOffset: 81
      });

      component.scrollFunction();
      tick();

      expect(component.defaultHeaderVisible).toBe(false);
    }));
  });
});
