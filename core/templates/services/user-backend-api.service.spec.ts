// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the user service is working as expected.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { UserInfo } from 'domain/user/user-info.model';
import { CsrfTokenService } from 'services/csrf-token.service';
import { PreferencesBackendDict, UserBackendApiService } from 'services/user-backend-api.service';

describe('User Backend Api Service', () => {
  let userBackendApiService: UserBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    userBackendApiService = TestBed.inject(UserBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);


    spyOn(csrfService, 'getTokenAsync').and.callFake(
      async() => {
        return new Promise((resolve, reject) => {
          resolve('sample-csrf-token');
        });
      });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return userInfo data', fakeAsync(() => {
    // Creating a test user.
    const sampleUserInfoBackendObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true
    };
    const sampleUserInfo = UserInfo.createFromBackendDict(
      sampleUserInfoBackendObject);

    userBackendApiService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo.isCurriculumAdmin()).toBe(
        sampleUserInfo.isCurriculumAdmin());
      expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
      expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
      expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
      expect(userInfo.isLoggedIn()).toBe(
        sampleUserInfo.isLoggedIn());
      expect(userInfo.canCreateCollections()).toBe(
        sampleUserInfo.canCreateCollections());
      expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
      expect(userInfo.getEmail()).toBe(sampleUserInfo.getEmail());
      expect(userInfo.getPreferredSiteLanguageCode()).toBe(
        sampleUserInfo.getPreferredSiteLanguageCode());
    });

    const req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return new userInfo data if user is not logged', fakeAsync(() => {
    // Creating a test user.
    const sampleUserInfoBackendObject = {
      role: 'GUEST',
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: false
    };
    const sampleUserInfo = UserInfo.createDefault();

    userBackendApiService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    const req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return the login url', fakeAsync(() => {
    const loginUrl = '/login';
    const currentUrl = 'dummy';

    userBackendApiService.getLoginUrlAsync(currentUrl).then((dataUrl) => {
      expect(dataUrl).toBe(loginUrl);
    });
    const req = httpTestingController.expectOne(
      '/url_handler?current_url=' + currentUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({login_url: loginUrl});

    flushMicrotasks();
  }));

  it('should handle when set profile image data url is reject',
    fakeAsync(() => {
      const newProfileImageDataurl = '/avatar/x.png';
      const errorMessage = 'It\'s not possible to set a new profile image data';
      userBackendApiService.setProfileImageDataUrlAsync(newProfileImageDataurl);
      const req = httpTestingController.expectOne('/preferenceshandler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush(errorMessage);

      flushMicrotasks();
    }));

  it('should return user contribution rights data', fakeAsync(() => {
    const sampleUserContributionRightsDict = {
      translation: ['hi'],
      voiceover: [],
      question: true
    };

    userBackendApiService.getUserContributionRightsDataAsync().then(
      (userContributionRights) => {
        expect(userContributionRights).
          toEqual(sampleUserContributionRightsDict);
      });
    const req = httpTestingController.expectOne(
      '/usercontributionrightsdatahandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserContributionRightsDict);

    flushMicrotasks();
  }));

  it('should return user preferences data', fakeAsync(() => {
    let samplePreferencesData: PreferencesBackendDict = {
      preferred_language_codes: ['en', 'hi'],
      preferred_site_language_code: 'en',
      preferred_audio_language_code: 'en',
      default_dashboard: 'learner',
      user_bio: '',
      subject_interests: '',
      can_receive_email_updates: true,
      can_receive_editor_role_email: true,
      can_receive_feedback_message_email: true,
      can_receive_subscription_email: true,
      subscription_list: []
    };
    userBackendApiService.getPreferencesAsync().then((preferencesData) => {
      expect(preferencesData).toEqual(samplePreferencesData);
    });

    const req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('GET');
    req.flush(samplePreferencesData);

    flushMicrotasks();
  }));

  it('should update preferred site langauge', fakeAsync(() => {
    let siteLanguageUrl = '/save_site_language';
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    userBackendApiService.updatePreferredSiteLanguageAsync('en')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(siteLanguageUrl);
    expect(req.request.method).toEqual('PUT');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
