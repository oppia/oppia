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

// TODO(#7222): Remove the following block of unnnecessary imports once
// UserService.ts is upgraded to Angular 8.
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory.ts';
// ^^^ This block is to be removed.

require('domain/utilities/UrlInterpolationService.ts');
require('services/UserService.ts');

describe('User Service', function() {
  var UserService, $httpBackend, UrlInterpolationService;
  var userInfoObjectFactory;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UserInfoObjectFactory', new UserInfoObjectFactory());
  }));

  beforeEach(angular.mock.inject(function($injector) {
    UserService = $injector.get('UserService');
    UrlInterpolationService = $injector.get(
      'UrlInterpolationService');
    // The injector is required because this service is directly used in this
    // spec, therefore even though UserInfoObjectFactory is upgraded to
    // Angular, it cannot be used just by instantiating it by its class but
    // instead needs to be injected. Note that 'userInfoObjectFactory' is
    // the injected service instance whereas 'UserInfoObjectFactory' is the
    // service class itself. Therefore, use the instance instead of the class in
    // the specs.
    userInfoObjectFactory = $injector.get(
      'UserInfoObjectFactory');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return userInfo data', function() {
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

    $httpBackend.expect('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);

    var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    UserService.getUserInfoAsync().then(function(userInfo) {
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
        '/avatar/user_blue_72px.png'));
    });
    $httpBackend.flush();
  });
});
