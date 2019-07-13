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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class UserInfo {
  _isModerator: boolean;
  _isAdmin: boolean;
  _isTopicManager: boolean;
  _isSuperAdmin: boolean;
  _canCreateCollections: boolean;
  _preferredSiteLanguageCode: string;
  _username: string;
  _isLoggedIn: boolean;
  constructor(
      isModerator, isAdmin, isSuperAdmin, isTopicManager, canCreateCollections,
      preferredSiteLanguageCode, username, isLoggedIn) {
    this._isModerator = isModerator;
    this._isAdmin = isAdmin;
    this._isTopicManager = isTopicManager;
    this._isSuperAdmin = isSuperAdmin;
    this._canCreateCollections = canCreateCollections;
    this._preferredSiteLanguageCode = preferredSiteLanguageCode;
    this._username = username;
    this._isLoggedIn = isLoggedIn;
  }
  isModerator() {
    return this._isModerator;
  }
  isAdmin() {
    return this._isAdmin;
  }
  isTopicManager() {
    return this._isTopicManager;
  }
  isSuperAdmin() {
    return this._isSuperAdmin;
  }
  canCreateCollections() {
    return this._canCreateCollections;
  }
  getPreferredSiteLanguageCode() {
    return this._preferredSiteLanguageCode;
  }
  getUsername() {
    return this._username;
  }
  isLoggedIn() {
    return this._isLoggedIn;
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserInfoObjectFactory {
  createFromBackendDict(data) {
    return new UserInfo(
      data.is_moderator, data.is_admin, data.is_super_admin,
      data.is_topic_manager, data.can_create_collections,
      data.preferred_site_language_code, data.username, data.user_is_logged_in);
  }
  createDefault() {
    return new UserInfo(false, false, false, false, false, null, null, false);
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'UserInfoObjectFactory',
  downgradeInjectable(UserInfoObjectFactory));
