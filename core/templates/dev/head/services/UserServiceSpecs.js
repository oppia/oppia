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

describe('User Service', function() {
  var UserService, $httpBackend, UrlInterpolationService,
    UserInfoObjectFactory;
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    UserService = $injector.get('UserService');
    UrlInterpolationService = $injector.get(
      'UrlInterpolationService');
    UserInfoObjectFactory = $injector.get(
      'UserInfoObjectFactory');
    $httpBackend = $injector.get('$httpBackend');
  }));


  it('should be return userInfo data', function() {
    // creating a test user for checking profile picture of user.
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

    $httpBackend.expect('GET', '/userinfohandler').respond(200,
      sampleUserInfoBackendObject);

    sampleUserInfo = UserInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    UserService.getUserInfoAsync().then(function(userInfo) {
      expect(userInfo.is_admin).toBe(sampleUserInfo.is_admin);
      expect(userInfo.is_super_admin).toBe(sampleUserInfo.is_super_admin);
      expect(userInfo.is_moderator).toBe(sampleUserInfo.is_moderator);
      except(userInfo.is_topic_manager).toBe(sampleUserInfo.is_topic_manager);
      expect(userInfo.user_is_logged_in).toBe(
        sampleUserInfo.user_is_logged_in);
      except(userInfo.can_create_collections).toBe(
        sampleUserInfo.can_create_collections);
      except(userInfo.username).toBe(sampleUserInfo.username);
      except(userInfo.preferred_site_language_code).toBe(
        sampleUserInfo.preferred_site_language_code);
    });
    $httpBackend.flush();

    // second call to /userinfohandler.
    $httpBackend.expect('GET', '/userinfohandler').respond(200);
    UserService.getUserInfoAsync().then(function(userInfo) {
    });

    try {
      // throw exception because /userinfohandler was not called
      $httpBackend.flush();
    } catch (err) {
      expect(err.message).toBe('No pending request to flush !');
    }
  });

  it('should return image data', function() {
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
      user_is_logged_in: true
    };
    $httpBackend.expect('GET', '/userinfohandler').respond(200,
      sampleUserInfoBackendObject);

    $httpBackend.expect('GET', requestUrl).respond(200, {
      profile_picture_data_url: 'image data'
    });

    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe('image data');
    });
    $httpBackend.flush();

    $httpBackend.when('GET', '/userinfohandler').respond(200,
      sampleUserInfoBackendObject);
    $httpBackend.expect('GET', requestUrl).respond(404);

    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe(UrlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.png'));
    });
    $httpBackend.flush();
  });
});
