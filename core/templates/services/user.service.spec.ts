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

import { TestBed, fakeAsync } from '@angular/core/testing';
import { UserService } from './user.service';
import { HttpTestingController, HttpClientTestingModule } from
  '@angular/common/http/testing';
import { CsrfTokenService } from './csrf-token.service';
import { UserInfoObjectFactory, UserInfo } from
  'domain/user/UserInfoObjectFactory';

/**
 * @fileoverview Tests that the user service is working as expected.
 */

describe('User Service', () => {
  let userService: UserService = null;
  let httpTestingController: HttpTestingController = null;
  let csrfService: CsrfTokenService;
  let userInfoObjectFactory: UserInfoObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    userService = TestBed.get(UserService);
    userInfoObjectFactory = TestBed.get(UserInfoObjectFactory);
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
      user_is_logged_in: true
    };

    let sampleUserInfo = this.userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);


    // $httpBackend.expect('GET', '/userinfohandler').respond(
    //   200, sampleUserInfoBackendObject);

    // UserService.getUserInfoAsync().then(function(userInfo) {
    // expect(userInfo.isAdmin()).toBe(sampleUserInfo.isAdmin());
    // expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
    // expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
    // expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
    // expect(userInfo.isLoggedIn()).toBe(
    //   sampleUserInfo.isLoggedIn());
    // expect(userInfo.canCreateCollections()).toBe(
    //   sampleUserInfo.canCreateCollections());
    // expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
    // expect(userInfo.getPreferredSiteLanguageCode()).toBe(
    //   sampleUserInfo.getPreferredSiteLanguageCode());
    // });

    // $httpBackend.flush();
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
  }));

  it('should return new userInfo data when url path is signup', function() {
    spyOn(UrlService, 'getPathname').and.returnValue('/signup');
    var sampleUserInfo = userInfoObjectFactory.createDefault();

    UserService.getUserInfoAsync().then(function(userInfo) {
      expect(userInfo).toEqual(sampleUserInfo);
    });
  });

  it('should not fetch userInfo if it is was fetched before', function() {
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };
    $httpBackend.expect('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);
    var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    UserService.getUserInfoAsync().then(function(userInfo) {
      expect(userInfo).toEqual(sampleUserInfo);
      // Fetch userInfo again.
      UserService.getUserInfoAsync().then(function(sameUserInfo) {
        expect(sameUserInfo).toEqual(userInfo);
      });
    });
    $httpBackend.flush(1);
  });

  it('should return new userInfo data if user is not logged', function() {
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: false
    };
    $httpBackend.expect('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);
    var sampleUserInfo = userInfoObjectFactory.createDefault();

    UserService.getUserInfoAsync().then(function(userInfo) {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    $httpBackend.flush();
  });

  it('should return image data', function() {
    var requestUrl = '/preferenceshandler/profile_picture';
    // Create a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };
    $httpBackend.expect('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);
    $httpBackend.expect('GET', requestUrl).respond(
      200, {profile_picture_data_url: 'image data'});

    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe('image data');
    });
    $httpBackend.flush();

    $httpBackend.when('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);
    $httpBackend.when('GET', requestUrl).respond(404);

    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe(UrlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.webp'));
    });
    $httpBackend.flush();
  });

  it('should return the default profile image path when user is not logged',
    function() {
      var sampleUserInfoBackendObject = {
        is_moderator: false,
        is_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        user_is_logged_in: false
      };
      $httpBackend.expect('GET', '/userinfohandler').respond(
        200, sampleUserInfoBackendObject);

      UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
        expect(dataUrl).toBe(UrlInterpolationService.getStaticImageUrl(
          '/avatar/user_blue_72px.webp'));
      });
      $httpBackend.flush();
    });

  it('should return the login url', function() {
    var loginUrl = '/login';
    var currentUrl = 'home';
    $httpBackend.expect('GET', '/url_handler?current_url=' + currentUrl)
      .respond({login_url: loginUrl});

    UserService.getLoginUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe(loginUrl);
    });
    $httpBackend.flush();
  });

  it('should set a profile image data url', function() {
    var newProfileImageDataurl = '/avatar/x.png';
    $httpBackend.expect('PUT', '/preferenceshandler/data')
      .respond({profile_picture_data_url: newProfileImageDataurl});

    UserService.setProfileImageDataUrlAsync(newProfileImageDataurl).then(
      function(response) {
        expect(response.data.profile_picture_data_url).toBe(
          newProfileImageDataurl);
      }
    );
    $httpBackend.flush();
  });

  it('should handle when set profile image data url is reject', function() {
    var newProfileImageDataurl = '/avatar/x.png';
    var errorMessage = 'It\'s not possible to set a new profile image data';
    $httpBackend.expect('PUT', '/preferenceshandler/data')
      .respond(500, errorMessage);

    UserService.setProfileImageDataUrlAsync(newProfileImageDataurl)
      /* eslint-disable dot-notation */
      .catch(function(error) {
      /* eslint-enable dot-notation */
        expect(error.data).toEqual(errorMessage);
      });
    $httpBackend.flush();
  });

  it('should return user community rights data', function() {
    var sampleUserCommunityRightsDict = {
      translation: ['hi'],
      voiceover: [],
      question: true
    };
    $httpBackend.expect('GET', '/usercommunityrightsdatahandler').respond(
      200, sampleUserCommunityRightsDict);

    UserService.getUserCommunityRightsData().then(function(
        userCommunityRights) {
      expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
    });
    $httpBackend.flush();
  });

  it('should not fetch userCommunityRights if it is was fetched before',
    function() {
      var sampleUserCommunityRightsDict = {
        translation: ['hi'],
        voiceover: [],
        question: true
      };
      $httpBackend.expect('GET', '/usercommunityrightsdatahandler').respond(
        200, sampleUserCommunityRightsDict);

      UserService.getUserCommunityRightsData().then(
        function(userCommunityRights) {
          expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
          // Fetch userCommunityRightsInfo again.
          UserService.getUserCommunityRightsData().then(function(
              sameUserCommunityRights) {
            expect(sameUserCommunityRights).toEqual(
              sampleUserCommunityRightsDict);
          });
        });
      $httpBackend.flush(1);
    });
});
