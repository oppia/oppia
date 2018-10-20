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
 * @fileoverview Factory for creating and instances of frontend user UserInfo
 * domain objects.
 */

oppia.factory('UserInfoObjectFactory', function() {
  var UserInfo = function(data) {
    this._userInfo = data;
  };

  // Instance methods
  UserInfo.prototype.isModerator = function() {
    return this._userInfo.is_moderator;
  };

  UserInfo.prototype.isAdmin = function() {
    return this._userInfo.is_admin;
  };

  UserInfo.prototype.isSuperAdmin = function() {
    return this._userInfo.is_super_admin;
  };

  UserInfo.prototype.canCreateCollections = function() {
    return this._userInfo.can_create_collections;
  };

  UserInfo.prototype.getPreferredSiteLanguageCode = function() {
    return this._userInfo.preferred_site_language_code;
  };

  UserInfo.prototype.getUsername = function() {
    return this._userInfo.username;
  };

  UserInfo.prototype.isLoggedIn = function() {
    return this._userInfo.user_is_logged_in;
  };

  UserInfo.createFromBackendDict = function(data) {
    return new UserInfo(data);
  };

  UserInfo.createDefault = function() {
    return new UserInfo({'is_moderator': false,
                         'is_admin': false,
                         'is_super_admin': false,
                         'can_create_collections': false,
                         'preferred_site_language_code': undefined,
                         'username': undefined,
                         'user_is_logged_in': false});
  };

  return UserInfo;
});
