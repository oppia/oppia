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

export enum UserRoles {
  QUESTION_COORDINATOR = 'QUESTION_COORDINATOR',
  QUESTION_ADMIN = 'QUESTION_ADMIN',
  BLOG_ADMIN = 'BLOG_ADMIN',
  BLOG_POST_EDITOR = 'BLOG_POST_EDITOR',
  TRANSLATION_ADMIN = 'TRANSLATION_ADMIN',
  TRANSLATION_COORDINATOR = 'TRANSLATION_COORDINATOR',
  VOICEOVER_ADMIN = 'VOICEOVER_ADMIN',
}

export interface UserInfoBackendDict {
  roles: string[];
  is_moderator: boolean;
  is_curriculum_admin: boolean;
  is_super_admin: boolean;
  is_topic_manager: boolean;
  can_create_collections: boolean;
  preferred_site_language_code: string | null;
  username: string | null;
  email: string | null;
  user_is_logged_in: boolean;
}

export class UserInfo {
  _roles: string[];
  _isModerator: boolean;
  _isCurriculumAdmin: boolean;
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
    roles: string[],
    isModerator: boolean,
    isCurriculumAdmin: boolean,
    isSuperAdmin: boolean,
    isTopicManager: boolean,
    canCreateCollections: boolean,
    preferredSiteLanguageCode: string | null,
    username: string | null,
    email: string | null,
    isLoggedIn: boolean
  ) {
    this._roles = roles;
    this._isModerator = isModerator;
    this._isCurriculumAdmin = isCurriculumAdmin;
    this._isTopicManager = isTopicManager;
    this._isSuperAdmin = isSuperAdmin;
    this._canCreateCollections = canCreateCollections;
    this._preferredSiteLanguageCode = preferredSiteLanguageCode;
    this._username = username;
    this._email = email;
    this._isLoggedIn = isLoggedIn;
  }

  static createFromBackendDict(data: UserInfoBackendDict): UserInfo {
    return new UserInfo(
      data.roles,
      data.is_moderator,
      data.is_curriculum_admin,
      data.is_super_admin,
      data.is_topic_manager,
      data.can_create_collections,
      data.preferred_site_language_code,
      data.username,
      data.email,
      data.user_is_logged_in
    );
  }

  static createDefault(): UserInfo {
    return new UserInfo(
      ['GUEST'],
      false,
      false,
      false,
      false,
      false,
      null,
      null,
      null,
      false
    );
  }

  isModerator(): boolean {
    return this._isModerator;
  }

  isBlogAdmin(): boolean {
    return this._roles.includes(UserRoles.BLOG_ADMIN);
  }

  isVoiceoverAdmin(): boolean {
    return this._roles.includes(UserRoles.VOICEOVER_ADMIN);
  }

  isBlogPostEditor(): boolean {
    return this._roles.includes(UserRoles.BLOG_POST_EDITOR);
  }

  isCurriculumAdmin(): boolean {
    return this._isCurriculumAdmin;
  }

  isTranslationAdmin(): boolean {
    return this._roles.includes(UserRoles.TRANSLATION_ADMIN);
  }

  isQuestionAdmin(): boolean {
    return this._roles.includes(UserRoles.QUESTION_ADMIN);
  }

  isTranslationCoordinator(): boolean {
    return this._roles.includes(UserRoles.TRANSLATION_COORDINATOR);
  }

  isQuestionCoordinator(): boolean {
    return this._roles.includes(UserRoles.QUESTION_COORDINATOR);
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
