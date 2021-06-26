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
 * @fileoverview Frontend Model for user info.
 */

export interface UserInfoBackendDict {
  'is_moderator': boolean;
  'is_admin': boolean;
  'is_super_admin': boolean;
  'is_topic_manager': boolean;
  'can_create_collections': boolean;
  'preferred_site_language_code': string | null;
  'username': string | null;
  'email': string | null;
  'user_is_logged_in': boolean;
}

export class UserInfo {
  _isModerator: boolean;
  _isAdmin: boolean;
  _isTopicManager: boolean;
  _isSuperAdmin: boolean;
  _canCreateCollections: boolean;
  // The following three properties are set to null when the
  // user is not logged in.
  _preferredSiteLanguageCode: string | null;
  _username: string | null;
  _email: string | null;
  _isLoggedIn: boolean;

  constructor(
      isModerator: boolean, isAdmin: boolean, isSuperAdmin: boolean,
      isTopicManager: boolean, canCreateCollections: boolean,
      preferredSiteLanguageCode: string | null, username: string | null,
      email: string | null, isLoggedIn: boolean) {
    this._isModerator = isModerator;
    this._isAdmin = isAdmin;
    this._isTopicManager = isTopicManager;
    this._isSuperAdmin = isSuperAdmin;
    this._canCreateCollections = canCreateCollections;
    this._preferredSiteLanguageCode = preferredSiteLanguageCode;
    this._username = username;
    this._email = email;
    this._isLoggedIn = isLoggedIn;
  }

  static createFromBackendDict(
      data: UserInfoBackendDict): UserInfo {
    return new UserInfo(
      data.is_moderator, data.is_admin, data.is_super_admin,
      data.is_topic_manager, data.can_create_collections,
      data.preferred_site_language_code, data.username,
      data.email, data.user_is_logged_in);
  }
  static createDefault(): UserInfo {
    return new UserInfo(
      false, false, false, false, false, null, null, null, false);
  }

  isModerator(): boolean {
    return this._isModerator;
  }

  isAdmin(): boolean {
    return this._isAdmin;
  }

  isTopicManager(): boolean {
    return this._isTopicManager;
  }

  isSuperAdmin(): boolean {
    return this._isSuperAdmin;
  }

  canCreateCollections(): boolean {
    return this._canCreateCollections;
  }

  getPreferredSiteLanguageCode(): string | null {
    return this._preferredSiteLanguageCode;
  }

  getUsername(): string | null {
    return this._username;
  }

  getEmail(): string | null {
    return this._email;
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn;
  }
}
