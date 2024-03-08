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

import { SuperAdminFactory, ISuperAdmin } from '../user-utilities/super-admin-utils';
import { BaseUserFactory, IBaseUser } from './puppeteer-utils';
import { TranslationAdminFactory } from '../user-utilities/translation-admin-utils';
import { LoggedInUserFactory, ILoggedInUser } from '../user-utilities/logged-in-users-utils';
import { BlogAdminFactory } from '../user-utilities/blog-admin-utils';
import { QuestionAdminFactory } from '../user-utilities/question-admin-utils';
import { BlogPostEditorFactory } from '../user-utilities/blog-post-editor-utils';
import testConstants from './test-constants';

const ROLES = testConstants.roles;

// This user is a full super admin with all roles.
export type IFullSuperAdmin = ISuperAdmin & MultipleRoleIntersection<[keyof typeof USER_ROLE_MAPPING]>;

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: IFullSuperAdmin | null = null;
let activeUsers: IBaseUser[] = [];

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
  (U extends IBaseUser ? (k: U) => void : never) extends
    ((k: infer I) => void) ? I : never;

type MultipleRoleIntersection<T extends (keyof typeof USER_ROLE_MAPPING)[]> =
  UnionToIntersection<ReturnType<typeof USER_ROLE_MAPPING[T[number]]>>;

export class UserFactory {
  /**
   * This function creates a composition of the user and the role
   * through object prototypes and returns the instance of that user.
   */
  private static composeUserWithRole = function<
    TUser extends IBaseUser,
    TRole extends IBaseUser
  >(
      user: TUser,
      role: TRole
  ): TUser & TRole {
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

    return user as TUser & TRole;
  }

  /**
   * This function assigns roles to a user and returns the instance of that user.
   */
  static assignRolesToUser = async function<
    TUser extends IBaseUser,
    TRole extends keyof typeof USER_ROLE_MAPPING
  >(
      user: TUser,
      roles: TRole[]
  ): Promise<TUser & MultipleRoleIntersection<typeof roles>> {
    for (const role of roles) {
      if (superAdminInstance === null) {
        superAdminInstance = await UserFactory.createNewSuperAdmin('superAdm');
      }

      switch (role) {
        case ROLES.BLOG_POST_EDITOR:
          await superAdminInstance.assignUserToRoleFromBlogAdminPage(
            user.username, 'BLOG_POST_EDITOR');
          break;
        default:
          await superAdminInstance.assignRoleToUser(user.username, role);
          break;
      }

      await superAdminInstance.expectUserToHaveRole(user.username, role);

      UserFactory.composeUserWithRole(user, USER_ROLE_MAPPING[role]());
    }

    return user as TUser & MultipleRoleIntersection<typeof roles>;
  }

  /**
   * This function creates a new user and returns the instance of that user.
   */
  static createNewUser = async function(
      username: string, email: string,
      roles: (keyof typeof USER_ROLE_MAPPING)[] = []
  ): Promise<ILoggedInUser & MultipleRoleIntersection<typeof roles>> {
    const user = UserFactory.composeUserWithRole(BaseUserFactory(), LoggedInUserFactory());
    await user.openBrowser();
    await user.signUpNewUser(username, email);
    activeUsers.push(user);

    return await UserFactory.assignRolesToUser(user, roles);
  }

  /**
   * The function creates a new super admin user and returns the instance
   * of that user.
   */
  static createNewSuperAdmin = async function(
      username: string
  ): Promise<IFullSuperAdmin> {
    if (superAdminInstance !== null) {
      return superAdminInstance;
    }

    /**
     * Here we are creating a new user to be the super admin and
     * assigning all the roles to that user.
     */
    const user = await UserFactory.createNewUser(username, 'testadmin@example.com');
    superAdminInstance = UserFactory.composeUserWithRole(user, SuperAdminFactory());
    await UserFactory.assignRolesToUser(superAdminInstance, [ROLES.BLOG_ADMIN]);
    const roles = Object.keys(USER_ROLE_MAPPING).filter(
      role => role !== ROLES.BLOG_ADMIN);
    await UserFactory.assignRolesToUser(
      superAdminInstance, roles as (keyof typeof USER_ROLE_MAPPING)[]);

    return superAdminInstance;
  }

  /**
   * This function closes all the browsers opened by different users.
   */
  static closeAllBrowsers = async function(): Promise<void> {
    for (let i = 0; i < activeUsers.length; i++) {
      await activeUsers[i].closeBrowser();
    }
  }

  /**
   * This function closes the browser for the provided user.
   */
  static closeBrowserForUser = async function(
      user
  ): Promise<void> {
    const index = activeUsers.indexOf(user);
    activeUsers.splice(index, 1);
    await user.closeBrowser();
  }
}
