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
 * @fileoverview Unit tests for CreatorDashboardBackendApiService.
 */

import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';

describe('User info factory', () => {
  let userInfoObjectFactory: UserInfoObjectFactory;

  var sampleUserInfoBackendObject = {
    is_moderator: true,
    is_admin: false,
    is_super_admin: false,
    is_topic_manager: false,
    can_create_collections: true,
    preferred_site_language_code: 'en',
    username: 'tester',
    email: 'tester@example.org',
    user_is_logged_in: true
  };

  beforeEach(() => {
    userInfoObjectFactory = new UserInfoObjectFactory();
  });

  it('should create correct UserInfo obeject from backend dict', () => {
    var userInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    expect(userInfo.isModerator()).toBe(true);
    expect(userInfo.isAdmin()).toBe(false);
    expect(userInfo.isSuperAdmin()).toBe(false);
    expect(userInfo.isTopicManager()).toBe(false);
    expect(userInfo.canCreateCollections()).toBe(true);
    expect(userInfo.getPreferredSiteLanguageCode()).toBe('en');
    expect(userInfo.getUsername()).toBe('tester');
    expect(userInfo.getEmail()).toBe('tester@example.org');
    expect(userInfo.isLoggedIn()).toBe(true);
  });

  it('should create correct default UserInfo object', () => {
    var userInfo = userInfoObjectFactory.createDefault();
    expect(userInfo.isModerator()).toBe(false);
    expect(userInfo.isAdmin()).toBe(false);
    expect(userInfo.isSuperAdmin()).toBe(false);
    expect(userInfo.isTopicManager()).toBe(false);
    expect(userInfo.canCreateCollections()).toBe(false);
    expect(userInfo.getPreferredSiteLanguageCode()).toBeNull();
    expect(userInfo.getUsername()).toBeNull();
    expect(userInfo.getEmail()).toBeNull();
    expect(userInfo.isLoggedIn()).toBe(false);
  });
});
