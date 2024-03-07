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
import { BlogAdminFactory, IBlogAdmin } from '../user-utilities/blog-admin-utils';
import { QuestionAdminFactory } from '../user-utilities/question-admin-utils';
import { BlogPostEditorFactory } from '../user-utilities/blog-post-editor-utils';
import testConstants from './test-constants';

const ROLES = testConstants.roles;

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: ISuperAdmin & IBlogAdmin | null = null;
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

/**
 * This function creates a composition of the user and the role
 * through object prototypes and returns the instance of that user.
 */
let composeUserWithRole = function<
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
};

/**
 * This function assigns roles to a user and returns the instance of that user.
 */
export let assignRolesToUser = async function<
  TUser extends IBaseUser,
  TRole extends keyof typeof USER_ROLE_MAPPING
>(
    user: TUser,
    roles: TRole[]
): Promise<TUser & MultipleRoleIntersection<typeof roles>> {
  for (const role of roles) {
    if (superAdminInstance === null) {
      superAdminInstance = await createNewSuperAdmin('superAdm');
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

    composeUserWithRole(user, USER_ROLE_MAPPING[role]());
  }

  return user as TUser & MultipleRoleIntersection<typeof roles>;
};

/**
 * This function creates a new user and returns the instance of that user.
 */
export let createNewUser = async function(
    username: string, email: string,
    roles: (keyof typeof USER_ROLE_MAPPING)[] = []
): Promise<ILoggedInUser & MultipleRoleIntersection<typeof roles>> {
  const user = composeUserWithRole(BaseUserFactory(), LoggedInUserFactory());
  await user.openBrowser();
  await user.signUpNewUser(username, email);
  activeUsers.push(user);

  return await assignRolesToUser(user, roles);
};

/**
 * The function creates a new super admin user and returns the instance
 * of that user.
 */
export let createNewSuperAdmin = async function(
    username: string
): Promise<ISuperAdmin & IBlogAdmin> {
  if (superAdminInstance !== null) {
    return superAdminInstance;
  }

  // Here we manually intialize the super admin instance since it needs
  // to be temporarily created to assign "super admin" roles.
  const user = await createNewUser(username, 'testadmin@example.com');
  const superAdmin = composeUserWithRole(user, SuperAdminFactory());
  await superAdmin.assignRoleToUser(username, ROLES.BLOG_ADMIN);
  await superAdmin.expectUserToHaveRole(username, ROLES.BLOG_ADMIN);
  superAdminInstance = composeUserWithRole(superAdmin, BlogAdminFactory());

  return superAdminInstance;
};

/**
 * This function closes all the browsers opened by different users.
 */
export let closeAllBrowsers = async function(): Promise<void> {
  for (let i = 0; i < activeUsers.length; i++) {
    await activeUsers[i].closeBrowser();
  }
};

/**
 * This function closes the browser for the provided user.
 */
export let closeBrowserForUser = async function(
    user: IBaseUser
): Promise<void> {
  const index = activeUsers.indexOf(user);
  activeUsers.splice(index, 1);
  await user.closeBrowser();
};
