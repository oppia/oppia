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

import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CsrfTokenService } from 'services/csrf-token.service';  
import { UserBackendApiService } from 'services/user-backend-api.service';
import { UrlService } from './contextual/url.service';


class MockWindowRef {
  _window = {
    location: {
      pathname: 'home'
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('User Backend Api Service', () => {
  let userBackendApiService: UserBackendApiService = null;
  let urlInterpolationService: UrlInterpolationService = null;
  let userInfoObjectFactory: UserInfoObjectFactory = null;
  let urlService: UrlService = null;
  let httpTestingController: HttpTestingController = null;
  let csrfService: CsrfTokenService = null;
  let windowRef: MockWindowRef = null;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: WindowRef, useValue: windowRef }]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    userBackendApiService = TestBed.get(UserBackendApiService);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    userInfoObjectFactory = TestBed.get(UserInfoObjectFactory);
    urlService = TestBed.get(UrlService);
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(
      () =>{
        return Promise.resolve('sample-csrf-token');
      });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return userInfo data', fakeAsync(() => {
    // Creating a test user for checking profile picture of user.
    const sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true
    };
    const sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userBackendApiService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo.isAdmin()).toBe(sampleUserInfo.isAdmin());
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

  it('should return new userInfo data when url path is signup',
    fakeAsync(() => {
      spyOn(urlService, 'getPathname').and.returnValue('/signup');
      const sampleUserInfo = userInfoObjectFactory.createDefault();

      userBackendApiService.getUserInfoAsync().then((userInfo) => {
        expect(userInfo).toEqual(sampleUserInfo);
      });
    }));

  it('should not fetch userInfo if it is was fetched before', fakeAsync(() => {
    // Creating a test user for checking profile picture of user.
    const sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true
    };
    const sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userBackendApiService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
      // Fetch userInfo again.
      userBackendApiService.getUserInfoAsync().then((sameUserInfo) => {
        expect(sameUserInfo).toEqual(userInfo);
      });
    });
    const req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return new userInfo data if user is not logged', fakeAsync(() => {
    // Creating a test user for checking profile picture of user.
    const sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: false
    };
    const sampleUserInfo = userInfoObjectFactory.createDefault();

    userBackendApiService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    const req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return the default profile image path when user is not logged',
    fakeAsync(() => {
      // Creating a test user for checking profile picture of user.
      const sampleUserInfoBackendObject = {
        is_moderator: false,
        is_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        email: 'test@test.com',
        user_is_logged_in: false
      };

      userBackendApiService.getProfileImageDataUrlAsync().then((dataUrl) => {
        expect(dataUrl).toBe(urlInterpolationService.getStaticImageUrl(
          '/avatar/user_blue_72px.webp'));
      });
      const req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks();
    }));

  it('should return the login url', fakeAsync(() => {
    const loginUrl = '/login';
    const currentUrl = 'home';

    userBackendApiService.getLoginUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe(loginUrl);
    });
    const req = httpTestingController.expectOne(
      '/url_handler?current_url=' + currentUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({login_url: loginUrl});

    flushMicrotasks();
  }));

  it('should set a profile image data url', fakeAsync(() => {
    const newProfileImageDataurl = '/avatar/x.png';
    userBackendApiService.setProfileImageDataUrlAsync(
      newProfileImageDataurl).then((response) => {
      expect(response.profile_picture_data_url).toBe(
        newProfileImageDataurl);
    }
    );
    const req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('PUT');
    req.flush({profile_picture_data_url: newProfileImageDataurl});

    flushMicrotasks();
  }));

  it('should handle when set profile image data url is reject',
    fakeAsync(() => {
      const newProfileImageDataurl = '/avatar/x.png';
      const errorMessage = 'It\'s not possible to set a new profile image data';
      userBackendApiService.setProfileImageDataUrlAsync(newProfileImageDataurl)
        /* eslint-disable dot-notation */
        .catch((error) => {
        /* eslint-enable dot-notation */
          expect(error.data).toEqual(errorMessage);
        });
      const req = httpTestingController.expectOne('/preferenceshandler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush(errorMessage);

      flushMicrotasks();
    }));

  it('should return user community rights data', fakeAsync(() => {
    const sampleUserCommunityRightsDict = {
      translation: ['hi'],
      voiceover: [],
      question: true
    };

    userBackendApiService.getUserCommunityRightsData().then(
      (userCommunityRights) => {
        expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
      });
    const req = httpTestingController.expectOne(
      '/usercommunityrightsdatahandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserCommunityRightsDict);

    flushMicrotasks();
  }));

  it('should not fetch userCommunityRights if it is was fetched before',
    fakeAsync(() => {
      const sampleUserCommunityRightsDict = {
        translation: ['hi'],
        voiceover: [],
        question: true
      };

      userBackendApiService.getUserCommunityRightsData().then(
        (userCommunityRights) => {
          expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
          // Fetch userCommunityRightsInfo again.
          userBackendApiService.getUserCommunityRightsData().then((
              sameUserCommunityRights) => {
            expect(sameUserCommunityRights).toEqual(
              sampleUserCommunityRightsDict);
          });
        });
      const req = httpTestingController.expectOne(
        '/usercommunityrightsdatahandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserCommunityRightsDict);

      flushMicrotasks();
    }));
});
