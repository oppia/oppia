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

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {ContributorDashboardPageComponent} from 'pages/contributor-dashboard-page/contributor-dashboard-page.component';
import {ContributionAndReviewService} from './services/contribution-and-review.service';
import {ContributionOpportunitiesService} from './services/contribution-opportunities.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {UserService} from 'services/user.service';
import {LocalStorageService} from 'services/local-storage.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {UserInfo} from 'domain/user/user-info.model';
import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

describe('Contributor dashboard page', () => {
  let component: ContributorDashboardPageComponent;
  let fixture: ComponentFixture<ContributorDashboardPageComponent>;
  let localStorageService: LocalStorageService;
  let userService: UserService;
  let translationLanguageService: TranslationLanguageService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  let userContributionRights = {
    can_review_translation_for_language_codes: ['en', 'pt', 'hi'],
    can_review_voiceover_for_language_codes: ['en', 'pt', 'hi'],
    can_review_questions: true,
    can_suggest_questions: true,
  };
  let focusManagerService: FocusManagerService;
  let getTranslatableTopicNamesAsyncSpy: jasmine.Spy;
  let getUserInfoAsyncSpy: jasmine.Spy;
  let urlInterpolationService: UrlInterpolationService;
  let contributionAndReviewService: ContributionAndReviewService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ContributorDashboardPageComponent],
      providers: [
        LocalStorageService,
        UserService,
        TranslationLanguageService,
        TranslationTopicService,
        ContributionOpportunitiesService,
        ContributionAndReviewService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContributorDashboardPageComponent);
    component = fixture.componentInstance;

    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService
    );
    localStorageService = TestBed.inject(LocalStorageService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    userService = TestBed.inject(UserService);
    focusManagerService = TestBed.inject(FocusManagerService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);

    getTranslatableTopicNamesAsyncSpy = spyOn(
      contributionOpportunitiesService,
      'getTranslatableTopicNamesAsync'
    );
    getTranslatableTopicNamesAsyncSpy.and.returnValue(
      Promise.resolve(['Topic 1', 'Topic 2'])
    );
    spyOn(
      localStorageService,
      'getLastSelectedTranslationLanguageCode'
    ).and.returnValue('');
    spyOn(
      localStorageService,
      'getLastSelectedTranslationTopicName'
    ).and.returnValue('Topic 1');
    spyOn(
      translationLanguageService,
      'setActiveLanguageCode'
    ).and.callThrough();
    spyOn(translationTopicService, 'setActiveTopicName').and.callThrough();

    let userInfo = {
      isLoggedIn: () => true,
      getUsername: () => 'username1',
    };

    getUserInfoAsyncSpy = spyOn(userService, 'getUserInfoAsync');
    getUserInfoAsyncSpy.and.returnValue(Promise.resolve(userInfo as UserInfo));
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);

    component.ngOnInit();
  });

  it('should set focus on select lang field', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(userContributionRights)
    );
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');

    component.onTabClick('translateTextTab');
    flush();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should throw error if contribution rights is null', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(null)
    );
    expect(() => {
      component.ngOnInit();
      flush();
    }).toThrowError();
  }));

  it('should set default profile pictures when username is null', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(userContributionRights)
    );
    let userInfo = {
      isLoggedIn: () => true,
      getUsername: () => null,
    };

    getUserInfoAsyncSpy.and.returnValue(Promise.resolve(userInfo as UserInfo));

    component.ngOnInit();
    flush();

    expect(component.profilePicturePngDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
      )
    );
    expect(component.profilePictureWebpDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
      )
    );
  }));

  it('should username equal to "" when user is not loggedIn', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(userContributionRights)
    );
    let userInfo = {
      isLoggedIn: () => false,
      getUsername: () => 'username1',
    };

    getUserInfoAsyncSpy.and.returnValue(Promise.resolve(userInfo as UserInfo));

    component.ngOnInit();
    flush();

    expect(component.username).toEqual('');
    expect(component.userIsLoggedIn).toBeFalse();
    expect(component.profilePicturePngDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
      )
    );
    expect(component.profilePictureWebpDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
      )
    );
  }));

  describe('when user is logged in', () => {
    it('should set specific properties after $onInit is called', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      component.ngOnInit();
      flush();

      expect(component.topicName).toBe('Topic 1');
      expect(translationTopicService.setActiveTopicName).toHaveBeenCalled();
      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.OPPIA_AVATAR_IMAGE_URL).toBe(
        '/assets/copyrighted-images/avatar/oppia_avatar_100px.svg'
      );
      expect(component.profilePicturePngDataUrl).toEqual(
        'default-image-url-png'
      );
      expect(component.profilePictureWebpDataUrl).toEqual(
        'default-image-url-webp'
      );
    }));

    it('should set active topic name as default when no topics are returned', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      getTranslatableTopicNamesAsyncSpy.and.returnValue(Promise.resolve([]));

      component.ngOnInit();
      flush();

      expect(component.topicName).toBeUndefined();
      expect(translationTopicService.setActiveTopicName).toHaveBeenCalled();
    }));

    it('should return language description in kebab case format', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let languageDescription = 'Deutsch (German)';

      expect(
        component.provideLanguageForProtractorClass(languageDescription)
      ).toEqual('deutsch-german');
    });

    it(
      'should initialize component properties after component is initialized' +
        ' and get data from backend',
      () => {
        spyOn(
          userService,
          'getUserContributionRightsDataAsync'
        ).and.returnValue(Promise.resolve(userContributionRights));
        expect(component.userIsLoggedIn).toBe(false);
        expect(component.username).toBe('');
        expect(component.userCanReviewQuestions).toBe(false);
        expect(component.userIsReviewer).toBe(false);
      }
    );

    it('should change active tab name when clicking on translate text tab', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let changedTab = 'translateTextTab';
      expect(component.activeTabName).toBe('myContributionTab');
      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
    });

    it('should change active language when clicking on language selector', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      spyOn(
        localStorageService,
        'updateLastSelectedTranslationLanguageCode'
      ).and.callThrough();

      component.onChangeLanguage('hi');

      expect(
        translationLanguageService.setActiveLanguageCode
      ).toHaveBeenCalledWith('hi');
      expect(
        localStorageService.updateLastSelectedTranslationLanguageCode
      ).toHaveBeenCalledWith('hi');
    });

    it('should show language selector based on active tab', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let changedTab = 'translateTextTab';

      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.showLanguageSelector()).toBe(false);

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showLanguageSelector()).toBe(true);
    });

    it('should change active topic when clicking on topic selector', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      spyOn(
        localStorageService,
        'updateLastSelectedTranslationTopicName'
      ).and.callThrough();

      component.onChangeTopic('Topic 2');

      expect(translationTopicService.setActiveTopicName).toHaveBeenCalledWith(
        'Topic 2'
      );
      expect(
        localStorageService.updateLastSelectedTranslationTopicName
      ).toHaveBeenCalledWith('Topic 2');
    });

    it('should show topic selector based on active tab', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let changedTab = 'translateTextTab';

      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.showLanguageSelector()).toBe(false);

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showTopicSelector()).toBe(true);
    });

    it('should show topic selector for questions reviews', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      spyOn(
        contributionAndReviewService,
        'getActiveSuggestionType'
      ).and.returnValue('add_question');
      spyOn(contributionAndReviewService, 'getActiveTabType').and.returnValue(
        'reviews'
      );
      let changedTab = 'myContributionTab';

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showTopicSelector()).toBe(true);
    });
  });
});
