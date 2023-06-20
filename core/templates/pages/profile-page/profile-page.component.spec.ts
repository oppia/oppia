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
 * @fileoverview Unit tests for profile page component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProfilePageComponent } from './profile-page.component';
import { ProfilePageBackendApiService } from './profile-page-backend-api.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UserProfile } from 'domain/user/user-profile.model';
import { MatCardModule } from '@angular/material/card';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { LoaderService } from 'services/loader.service';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('Profile page', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let componentInstance: ProfilePageComponent;
  let userService: UserService;
  let csrfTokenService: CsrfTokenService;
  let dateTimeFormatService: DateTimeFormatService;
  let loaderService: LoaderService;
  let loggerService: LoggerService;
  let mockWindowRef: MockWindowRef;
  let profilePageBackendApiService: ProfilePageBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  let profileData = UserProfile.createFromBackendDict({
    username: '',
    username_of_viewed_profile: 'username1',
    user_bio: 'User bio',
    user_impact_score: 100,
    profile_is_of_current_user: false,
    is_user_visiting_own_profile: false,
    created_exp_summary_dicts: [{
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cc4b00',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    }],
    is_already_subscribed: false,
    first_contribution_msec: null,
    edited_exp_summary_dicts: [{
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cc4b00',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    }],
    subject_interests: [],
  });

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        reload: () => { }
      }
    };
  }

  class MockProfilePageBackendApiService {
    fetchProfileDataAsync(): Promise<Object> {
      return Promise.resolve(profileData);
    }

    subscribeAsync(username: string): Promise<void> {
      return Promise.resolve();
    }

    unsubscribeAsync(username: string): Promise<void> {
      return Promise.resolve();
    }
  }

  class MockUrlService {
    getUserFromProfileUrl(): string {
      return 'username1';
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatCardModule
      ],
      declarations: [
        MockTranslatePipe,
        ProfilePageComponent,
        TruncatePipe
      ],
      providers: [
        {
          provide: ProfilePageBackendApiService,
          useClass: MockProfilePageBackendApiService
        },
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilePageComponent);
    componentInstance = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    csrfTokenService = TestBed.inject(CsrfTokenService) as
      jasmine.SpyObj<CsrfTokenService>;
    dateTimeFormatService = TestBed.inject(DateTimeFormatService) as
      jasmine.SpyObj<DateTimeFormatService>;
    loaderService = TestBed.inject(LoaderService) as
      jasmine.SpyObj<LoaderService>;
    loggerService = TestBed.inject(LoggerService) as
      jasmine.SpyObj<LoggerService>;
    mockWindowRef = TestBed.inject(WindowRef) as MockWindowRef;
    profilePageBackendApiService = (
      TestBed.inject(ProfilePageBackendApiService) as
      jasmine.SpyObj<ProfilePageBackendApiService>);
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token'));
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue(
      ['default-image-url-png', 'default-image-url-webp']);
  });

  afterEach(() => {
    mockWindowRef.nativeWindow.location.href = '';
  });

  it('should initialize', fakeAsync(() => {
    spyOn(componentInstance, 'updateSubscriptionButtonPopoverText');
    spyOn(loaderService, 'hideLoadingScreen');
    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.data).toEqual(profileData);
    expect(componentInstance.userNotLoggedIn).toEqual(!profileData.username);
    expect(componentInstance.profileIsOfCurrentUser).toEqual(
      profileData.profileIsOfCurrentUser);
    expect(componentInstance.updateSubscriptionButtonPopoverText)
      .toHaveBeenCalled();
    expect(componentInstance.profilePicturePngDataUrl).toEqual(
      'default-image-url-png');
    expect(componentInstance.profilePictureWebpDataUrl).toEqual(
      'default-image-url-webp');
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should get formatted date string from the timestamp in milliseconds',
    () => {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      let NOW_MILLIS = 1416563100000;
      spyOn(dateTimeFormatService, 'getLocaleDateString').withArgs(NOW_MILLIS)
        .and.returnValue('11/21/2014');
      expect(componentInstance.getLocaleDateString(NOW_MILLIS))
        .toBe('11/21/2014');
    });

  it('should not change subscription status and change to login page',
    fakeAsync(() => {
      let loginUrl = 'login-url';
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve(loginUrl));

      componentInstance.ngOnInit();
      tick();
      componentInstance.changeSubscriptionStatus();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe(loginUrl);
    }));

  it('should not change subscription status and reload the page when login' +
    ' page is not provided', fakeAsync(() => {
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve(''));

    componentInstance.ngOnInit();
    tick();
    componentInstance.changeSubscriptionStatus();
    tick();
    expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should update subscription button text to warn user to log in',
    fakeAsync(() => {
      componentInstance.ngOnInit();
      tick();
      componentInstance.updateSubscriptionButtonPopoverText();
      expect(componentInstance.subscriptionButtonPopoverText).toBe(
        'Log in or sign up to subscribe to your favorite creators.');
    }));

  it('should subscribe and unsubscribe from a profile', fakeAsync(() => {
    let profileDataLocal = UserProfile.createFromBackendDict({
      username: 'username1',
      username_of_viewed_profile: 'username1',
      user_bio: 'User bio',
      user_impact_score: 100,
      created_exp_summary_dicts: [],
      edited_exp_summary_dicts: [],
      is_already_subscribed: false,
      profile_is_of_current_user: false,
      is_user_visiting_own_profile: false,
      first_contribution_msec: null,
      subject_interests: [],
    });
    spyOn(profilePageBackendApiService, 'fetchProfileDataAsync')
      .and.returnValue(Promise.resolve(profileDataLocal));
    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.isAlreadySubscribed).toBe(false);
    componentInstance.changeSubscriptionStatus();
    tick();

    expect(componentInstance.isAlreadySubscribed).toBe(true);
    expect(componentInstance.subscriptionButtonPopoverText).toBe(
      'Unsubscribe to stop receiving email notifications regarding new' +
      ' explorations published by ' + profileDataLocal.usernameOfViewedProfile +
      '.');

    componentInstance.changeSubscriptionStatus();
    tick();

    expect(componentInstance.isAlreadySubscribed).toBe(false);
    expect(componentInstance.subscriptionButtonPopoverText).toBe(
      'Receive email notifications, whenever ' +
      profileDataLocal.usernameOfViewedProfile +
      ' publishes a new exploration.');
  }));

  it('should get explorations to display when edited explorations are empty',
    fakeAsync(() => {
      let profileDataLocal = UserProfile.createFromBackendDict({
        username: '',
        username_of_viewed_profile: 'username1',
        user_bio: 'User bio',
        user_impact_score: 100,
        profile_is_of_current_user: false,
        is_user_visiting_own_profile: false,
        created_exp_summary_dicts: [{
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title'
        }],
        is_already_subscribed: false,
        first_contribution_msec: null,
        edited_exp_summary_dicts: [],
        subject_interests: [],
      });
      spyOn(profilePageBackendApiService, 'fetchProfileDataAsync')
        .and.returnValue(Promise.resolve(profileDataLocal));
      componentInstance.ngOnInit();
      tick();
      expect(componentInstance.getExplorationsToDisplay()).toEqual([]);
    }));

  it('should get explorations to display',
    fakeAsync(() => {
      let profileDataLocal = UserProfile.createFromBackendDict({
        username: '',
        username_of_viewed_profile: 'username1',
        user_bio: 'User bio',
        user_impact_score: 100,
        profile_is_of_current_user: false,
        is_user_visiting_own_profile: false,
        created_exp_summary_dicts: [],
        is_already_subscribed: false,
        first_contribution_msec: null,
        edited_exp_summary_dicts: [],
        subject_interests: [],
      });

      for (let i = 0; i < 5; i++) {
        profileDataLocal.editedExpSummaries.push(
          LearnerExplorationSummary.createFromBackendDict({
            last_updated_msec: 1591296737470.528,
            community_owned: false,
            objective: 'Test Objective',
            id: '44LKoKLlIbGe',
            num_views: 10,
            thumbnail_icon_url: '/subjects/Algebra.svg',
            human_readable_contributors_summary: {},
            language_code: 'en',
            thumbnail_bg_color: '#cc4b00',
            created_on_msec: 1591296635736.666,
            ratings: {
              1: 0,
              2: 0,
              3: 1,
              4: 0,
              5: 0
            },
            status: 'public',
            tags: [],
            activity_type: 'exploration',
            category: 'Algebra',
            title: 'Test Title'
          }));
      }


      spyOn(profilePageBackendApiService, 'fetchProfileDataAsync')
        .and.returnValue(Promise.resolve(profileDataLocal));
      componentInstance.ngOnInit();
      tick();
      expect(componentInstance.getExplorationsToDisplay().length).toEqual(5);
    }));

  it('should go back and forth between pages', fakeAsync(() => {
    for (let i = 0; i < 5; i++) {
      profileData.editedExpSummaries.push(
        LearnerExplorationSummary.createFromBackendDict({
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 10,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 1,
            4: 0,
            5: 0
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title'
        }));
    }

    profileData.editedExpSummaries.push(
      LearnerExplorationSummary.createFromBackendDict({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 10,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 1,
          3: 1,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }));

    profileData.editedExpSummaries.push(
      LearnerExplorationSummary.createFromBackendDict({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 10,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 1,
          3: 2,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }));

    profileData.editedExpSummaries.push(
      LearnerExplorationSummary.createFromBackendDict({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 10,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 2,
          4: 0,
          5: 1
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }));

    profileData.editedExpSummaries.push(
      LearnerExplorationSummary.createFromBackendDict({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 12,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 2,
          4: 0,
          5: 1
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }));

    profileData.editedExpSummaries.push(
      LearnerExplorationSummary.createFromBackendDict({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 8,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 2,
          4: 0,
          5: 1
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }));

    spyOn(profilePageBackendApiService, 'fetchProfileDataAsync')
      .and.returnValue(Promise.resolve(profileData));

    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.currentPageNumber).toBe(0);
    componentInstance.goToNextPage();

    expect(componentInstance.currentPageNumber).toBe(1);
    expect(componentInstance.startingExplorationNumber).toBe(7);
    expect(componentInstance.endingExplorationNumber).toBe(11);

    spyOn(loggerService, 'error');
    componentInstance.goToNextPage();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Error: Cannot increment page');

    componentInstance.goToPreviousPage();

    expect(componentInstance.currentPageNumber).toBe(0);
    expect(componentInstance.startingExplorationNumber).toBe(1);
    expect(componentInstance.endingExplorationNumber).toBe(6);

    componentInstance.goToPreviousPage();

    expect(componentInstance.currentPageNumber).toBe(0);
    expect(loggerService.error).toHaveBeenCalledWith(
      'Error: cannot decrement page');
  }));
});
