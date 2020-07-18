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
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CsrfTokenService } from 'services/csrf-token.service';

import { UserService } from 'services/user.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
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

fdescribe('User Service', () => {
  let userService: UserService = null;
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
    userService = TestBed.get(UserService);
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
    // creating a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
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
    var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userService.getUserInfoAsync().then((userInfo) => {
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

    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);      

    flushMicrotasks();
  }));

  it('should return new userInfo data when url path is signup', fakeAsync(() => {
    spyOn(urlService, 'getPathname').and.returnValue('/signup');
    var sampleUserInfo = userInfoObjectFactory.createDefault();

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
  }));

  it('should not fetch userInfo if it is was fetched before', fakeAsync(() => {
    // creating a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
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
    var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
      // Fetch userInfo again
      userService.getUserInfoAsync().then((sameUserInfo) => {
        expect(sameUserInfo).toEqual(userInfo);
      });
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return new userInfo data if user is not logged', fakeAsync(() => {
      // creating a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
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
    var sampleUserInfo = userInfoObjectFactory.createDefault();

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return image data', fakeAsync(() => {
    var requestUrl = '/preferenceshandler/profile_picture';
    // creating a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
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

    userService.getProfileImageDataUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe('image data');
    });

    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({profile_picture_data_url: 'image data'});
    
    flushMicrotasks();

    userService.getProfileImageDataUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe(urlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.webp'));
    });
    
    req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);
    
    req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(404);
    
    flushMicrotasks();
  }));

  it('should return the default profile image path when user is not logged',
    fakeAsync(() => {
      // creating a test user for checking profile picture of user.
      var sampleUserInfoBackendObject = {
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

      userService.getProfileImageDataUrlAsync().then((dataUrl) => {
        expect(dataUrl).toBe(urlInterpolationService.getStaticImageUrl(
          '/avatar/user_blue_72px.webp'));
      });
      var req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks();
    }));

  it('should return the login url', fakeAsync(() => {
    var loginUrl = '/login';
    var currentUrl = 'home';
    
    userService.getLoginUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe(loginUrl);
    });
    var req = httpTestingController.expectOne(
      '/url_handler?current_url=' + currentUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({login_url: loginUrl});

    flushMicrotasks();
  }));

  it('should set a profile image data url', fakeAsync(() => {
    var newProfileImageDataurl = '/avatar/x.png';
    //return types here might cause problems
    userService.setProfileImageDataUrlAsync(newProfileImageDataurl).then(
      (response) => {
        expect(response.profile_picture_data_url).toBe(
          newProfileImageDataurl);
      }
    );
    var req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('PUT');
    req.flush({profile_picture_data_url: newProfileImageDataurl});

    flushMicrotasks();
  }));

  it('should handle when set profile image data url is reject', fakeAsync(() => {
    var newProfileImageDataurl = '/avatar/x.png';
    var errorMessage = 'It\'s not possible to set a new profile image data';
    //check this too
    userService.setProfileImageDataUrlAsync(newProfileImageDataurl)
      /* eslint-disable dot-notation */
      .catch((error) => {
      /* eslint-enable dot-notation */
        expect(error.data).toEqual(errorMessage);
      });
    var req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('PUT');
    req.flush(errorMessage);

    flushMicrotasks();
  }));

  it('should return user community rights data', fakeAsync(() => {
    //need to check return type
    var sampleUserCommunityRightsDict = {
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
      var sampleUserCommunityRightsDict = {
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