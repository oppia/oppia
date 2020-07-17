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

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { UserService } from './user-backend-api.service';
import { HttpTestingController, HttpClientTestingModule } from
  '@angular/common/http/testing';
import { CsrfTokenService } from './csrf-token.service';
import { UserInfoObjectFactory, UserInfo } from
  'domain/user/UserInfoObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from './contextual/url.service';
import { WindowRef } from './contextual/window-ref.service';

/**
 * @fileoverview Tests that the user service is working as expected.
 */

interface IProfilePictureDataUrl {
  'profile_picture_data_url': string
}

class MockWindwRef {
  _window = {
    location: {
      _pathname: ''
    },
    get pathname() {
      return this._pathname;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('User Service', () => {
  let userService: UserService = null;
  let httpTestingController: HttpTestingController = null;
  let csrfService: CsrfTokenService;
  let userInfoObjectFactory: UserInfoObjectFactory = null;
  let urlInterpolationService: UrlInterpolationService = null;
  let urlService: UrlService = null;
  let windowRef: MockWindwRef;

  beforeEach(() => {
    windowRef = new MockWindwRef();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WindowRef, useValue: windowRef
        }
      ],
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    userService = TestBed.get(UserService);
    userInfoObjectFactory = TestBed.get(UserInfoObjectFactory);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    urlService = TestBed.get(UrlService);
    csrfService = TestBed.get(CsrfTokenService);
    spyOn(csrfService, 'getTokenAsync').and.callFake(function() {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return userInfo data', fakeAsync(() => {
    // Creating a test user for checking profile picture of user.
    let sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true,
      email: 'email'
    };

    let sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userService.getUserInfoAsync().then((userInfo: UserInfo) => {
      expect(userInfo.isAdmin()).toBe(sampleUserInfo.isAdmin());
      expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
      expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
      expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
      expect(userInfo.isLoggedIn()).toBe(
        sampleUserInfo.isLoggedIn());
      expect(userInfo.canCreateCollections()).toBe(
        sampleUserInfo.canCreateCollections());
      expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
      expect(userInfo.getPreferredSiteLanguageCode()).toBe(
        sampleUserInfo.getPreferredSiteLanguageCode());
    });

    let req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return new userInfo data when url path is signup', () => {
    spyOn(urlService, 'getPathname').and.returnValue('/signup');
    let sampleUserInfo = userInfoObjectFactory.createDefault();

    userService.getUserInfoAsync().then((userInfo: UserInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
  });

  it('should not fetch userInfo if it is was fetched before', fakeAsync(() => {
    let sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true,
      email: 'email'
    };

    let sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userService.getUserInfoAsync().then((userInfo: UserInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
      // Fetch userInfo again.
      userService.getUserInfoAsync().then((sameUserInfo: UserInfo) => {
        expect(sameUserInfo).toEqual(userInfo);
      });
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return new userInfo data if user is not logged', fakeAsync(() => {
    let sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: false,
      email: 'email'
    };
    let sampleUserInfo = userInfoObjectFactory.createDefault();

    userService.getUserInfoAsync().then((userInfo: UserInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return image data', fakeAsync(() => {
    let requestUrl = '/preferenceshandler/profile_picture';
    // Create a test user for checking profile picture of user.
    let sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true,
      email: 'email'
    };

    userService.getProfileImageDataUrlAsync().then((dataUrl: string) => {
      expect(dataUrl).toBe('image data');
    });

    var req1 = httpTestingController.expectOne('/userinfohandler');
    expect(req1.request.method).toEqual('GET');
    req1.flush(sampleUserInfoBackendObject);

    flushMicrotasks();

    var req2 = httpTestingController.expectOne(requestUrl);
    expect(req2.request.method).toEqual('GET');
    req2.flush({profile_picture_data_url: 'image data'});

    flushMicrotasks();
  }));

  it('should return the default profile image path when user is not logged',
    fakeAsync(() => {
      let sampleUserInfoBackendObject = {
        is_moderator: false,
        is_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        user_is_logged_in: false,
        email: 'email'
      };
      userService.getProfileImageDataUrlAsync().then((dataUrl: string) => {
        expect(dataUrl).toBe(urlInterpolationService.getStaticImageUrl(
          '/avatar/user_blue_72px.webp'));
      });

      var req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks();
    }));

  it('should return the login url', fakeAsync(() => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: 'home'
      }
    });
    let loginUrl = '/login';
    let currentUrl = 'home';
    userService.getLoginUrlAsync().then((dataUrl: string) => {
      expect(dataUrl).toBe(loginUrl);
    });
    var req = httpTestingController.expectOne(
      '/url_handler?current_url=' + currentUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({login_url: loginUrl});
    flushMicrotasks();
  }));

  it('should set a profile image data url', fakeAsync(() => {
    let newProfileImageDataurl = '/avatar/x.png';

    userService.setProfileImageDataUrlAsync(newProfileImageDataurl).then(
      (response: IProfilePictureDataUrl) => {
        expect(response.profile_picture_data_url).toBe(
          newProfileImageDataurl);
      }
    );
    var req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('PUT');
    req.flush({profile_picture_data_url: newProfileImageDataurl});
    flushMicrotasks();
  }));

  it('should handle when set profile image data url is reject',
    fakeAsync(() => {
      let newProfileImageDataurl = '/avatar/x.png';
      let errorMessage = 'It\'s not possible to set a new profile image data';
      userService.setProfileImageDataUrlAsync(newProfileImageDataurl)
      /* eslint-disable dot-notation */
        .catch((error) => {
          /* eslint-enable dot-notation */
          expect(error.data).toEqual(errorMessage);
        });
      var req = httpTestingController.expectOne('/preferenceshandler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush({
        status: 500,
        statusText: errorMessage
      });
      flushMicrotasks();
    }));

  it('should return user community rights data', fakeAsync(() => {
    let sampleUserCommunityRightsDict = {
      translation: ['hi'],
      voiceover: [],
      question: true
    };

    userService.getUserCommunityRightsData().then(
      (userCommunityRights) => {
        expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
      });
    var req = httpTestingController.expectOne(
      '/usercommunityrightsdatahandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserCommunityRightsDict);

    flushMicrotasks();
  }));

  it('should not fetch userCommunityRights if it is was fetched before',
    fakeAsync(() => {
      let sampleUserCommunityRightsDict = {
        translation: ['hi'],
        voiceover: [],
        question: true
      };

      userService.getUserCommunityRightsData().then(
        (userCommunityRights) => {
          expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
          // Fetch userCommunityRightsInfo again.
          userService.getUserCommunityRightsData().then((
              sameUserCommunityRights) => {
            expect(sameUserCommunityRights).toEqual(
              sampleUserCommunityRightsDict);
          });
        });
      var req = httpTestingController.expectOne(
        '/usercommunityrightsdatahandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserCommunityRightsDict);
      flushMicrotasks();
    }));
});
