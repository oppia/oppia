// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility File for declaring and initializing users.
 */

import { SuperAdminFactory, SuperAdmin } from '../user-utilities/super-admin-utils';
import { BaseUserFactory, BaseUser } from './puppeteer-utils';
import { TranslationAdminFactory } from '../user-utilities/translation-admin-utils';
import { LoggedInUserFactory, LoggedInUser } from '../user-utilities/logged-in-users-utils';
import { BlogAdminFactory, BlogAdmin } from '../user-utilities/blog-admin-utils';
import { QuestionAdminFactory } from '../user-utilities/question-admin-utils';
import { BlogPostEditorFactory } from '../user-utilities/blog-post-editor-utils';
import testConstants from './test-constants';

const ROLES = testConstants.Roles;
const BLOG_RIGHTS = testConstants.BlogRights;

/**
 * Mapping of user roles to their respective function class.
 */
const USER_ROLE_MAPPING = {
  [ROLES.TRANSLATION_ADMIN]: TranslationAdminFactory,
  [ROLES.BLOG_ADMIN]: BlogAdminFactory,
  [ROLES.BLOG_POST_EDITOR]: BlogPostEditorFactory,
  [ROLES.QUESTION_ADMIN]: QuestionAdminFactory
} as const;

/**
 * These types are used to create a union of all the roles and then
 * create an intersection of all the roles. This is used to create a
 * composition of the user and the role for type inference.
 */
type UnionToIntersection<U> =
  (U extends BaseUser ? (k: U) => void : never) extends
    ((k: infer I) => void) ? I : never;

type MultipleRoleIntersection<T extends (keyof typeof USER_ROLE_MAPPING)[]> =
  UnionToIntersection<ReturnType<typeof USER_ROLE_MAPPING[T[number]]>>;

type OptionalRoles<TRoles extends (keyof typeof USER_ROLE_MAPPING)[]> =
  TRoles extends never[] ? [] : TRoles | [];

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: SuperAdmin & BlogAdmin | null = null;
let activeUsers: BaseUser[] = [];

export class UserFactory {
  /**
   * This function creates a composition of the user and the role
   * through object prototypes and returns the instance of that user.
   */
  private static composeUserWithRoles = function<
    TUser extends BaseUser,
    TRoles extends BaseUser[]
  >(
      user: TUser,
      roles: TRoles
  ): TUser & UnionToIntersection<TRoles[number]> {
    for (const role of roles) {
      const userPrototype = Object.getPrototypeOf(user);
      const rolePrototype = Object.getPrototypeOf(role);

      Object.getOwnPropertyNames(rolePrototype).forEach((name: string) => {
        Object.defineProperty(
          userPrototype,
          name,
          Object.getOwnPropertyDescriptor(rolePrototype, name) ||
            Object.create(null)
        );
      });
    }

    return user as TUser & UnionToIntersection<TRoles[number]>;
  };

  /**
   * This function assigns roles to a user and returns the instance of
   * that user.
   */
  static assignRolesToUser = async function<
    TUser extends BaseUser,
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[]
  >(
      user: TUser,
      roles: TRoles
  ): Promise<TUser & MultipleRoleIntersection<TRoles>> {
    for (const role of roles) {
      if (superAdminInstance === null) {
        superAdminInstance = await UserFactory.createNewSuperAdmin('superAdm');
      }

      switch (role) {
        case ROLES.BLOG_POST_EDITOR:
          await superAdminInstance.assignUserToRoleFromBlogAdminPage(
            user.username, BLOG_RIGHTS.BLOG_POST_EDITOR);
          break;
        default:
          await superAdminInstance.assignRoleToUser(user.username, role);
          break;
      }

      await superAdminInstance.expectUserToHaveRole(user.username, role);

      UserFactory.composeUserWithRoles(user, [USER_ROLE_MAPPING[role]()]);
    }

    return user as TUser & MultipleRoleIntersection<typeof roles>;
  };

  /**
   * This function creates a new user and returns the instance of that user.
   */
  static createNewUser = async function<
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[] = never[]
  >(
      username: string, email: string,
      roles: OptionalRoles<TRoles> = [] as OptionalRoles<TRoles>
  ): Promise<LoggedInUser & MultipleRoleIntersection<TRoles>> {
    let user = UserFactory.composeUserWithRoles(
      BaseUserFactory(), [LoggedInUserFactory()]);
    await user.openBrowser();
    await user.signUpNewUser(username, email);
    activeUsers.push(user);

    return await UserFactory.assignRolesToUser(user, roles);
  };

  /**
   * The function creates a new super admin user and returns the instance
   * of that user.
   */
  static createNewSuperAdmin = async function(
      username: string
  ): Promise<SuperAdmin & BlogAdmin> {
    if (superAdminInstance !== null) {
      return superAdminInstance;
    }

    const user = await UserFactory.createNewUser(
      username, 'testadmin@example.com');
    const superAdmin = UserFactory.composeUserWithRoles(
      user, [SuperAdminFactory()]);
    await superAdmin.assignRoleToUser(username, ROLES.BLOG_ADMIN);
    await superAdmin.expectUserToHaveRole(username, ROLES.BLOG_ADMIN);
    superAdminInstance = UserFactory.composeUserWithRoles(
      superAdmin, [BlogAdminFactory()]);

    return superAdminInstance;
  };

  /**
   * This function closes all the browsers opened by different users.
   */
  static closeAllBrowsers = async function(): Promise<void> {
    for (let i = 0; i < activeUsers.length; i++) {
      await activeUsers[i].closeBrowser();
    }
  };

  /**
   * This function closes the browser for the provided user.
   */
  static closeBrowserForUser = async function(
      user: BaseUser
  ): Promise<void> {
    const index = activeUsers.indexOf(user);
    activeUsers.splice(index, 1);
    await user.closeBrowser();
  };
}
