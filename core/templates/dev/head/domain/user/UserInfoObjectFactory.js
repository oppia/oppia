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

oppia.factory('UserInfoObjectFactory', [function() {
  var UserInfo = function(
      isModerator, isAdmin, isSuperAdmin, canCreateCollections,
      preferredSiteLanguageCode, username, isLoggedIn) {
    this._isModerator = isModerator;
    this._isAdmin = isAdmin;
    this._isSuperAdmin = isSuperAdmin;
    this._canCreateCollections = canCreateCollections;
    this._preferredSiteLanguageCode = preferredSiteLanguageCode;
    this._username = username;
    this._isLoggedIn = isLoggedIn;
  };

  // Instance methods
  UserInfo.prototype.isModerator = function() {
    return this._isModerator;
  };

  UserInfo.prototype.isAdmin = function() {
    return this._isAdmin;
  };

  UserInfo.prototype.isSuperAdmin = function() {
    return this._isSuperAdmin;
  };

  UserInfo.prototype.canCreateCollections = function() {
    return this._canCreateCollections;
  };

  UserInfo.prototype.getPreferredSiteLanguageCode = function() {
    return this._preferredSiteLanguageCode;
  };

  UserInfo.prototype.getUsername = function() {
    return this._username;
  };

  UserInfo.prototype.isLoggedIn = function() {
    return this._isLoggedIn;
  };

  UserInfo.createFromBackendDict = function(data) {
    return new UserInfo(data.is_moderator, data.is_admin, data.is_super_admin,
      data.can_create_collections, data.preferred_site_language_code,
      data.username, data.user_is_logged_in);
  };

  UserInfo.createDefault = function() {
    return new UserInfo(false, false, false, false, null, null, false);
  };

  return UserInfo;
}]);
