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
import { BlogPostAdminFactory } from '../user-utilities/blog-post-admin-utils';
import { QuestionAdminFactory } from '../user-utilities/question-admin-utils';
import { BlogPostEditorFactory } from '../user-utilities/blog-post-editor-utils';

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: ISuperAdmin | null = null;
let activeUsers: IBaseUser[] = [];

/**
 * Mapping of user roles to their respective function class.
 */
const USER_ROLE_MAPPING = {
  'super admin': SuperAdminFactory,
  'logged in user': LoggedInUserFactory,
  'translation admin': TranslationAdminFactory,
  'blog admin': BlogPostAdminFactory,
  'blog post editor': BlogPostEditorFactory,
  'question admin': QuestionAdminFactory
};

/**
 * This function assigns a role to a user and returns the instance of that user.
 */
export let assignRoleToUser = async function<
  TUser extends IBaseUser,
  TRole extends keyof typeof USER_ROLE_MAPPING
>(
    user: TUser,
    role: TRole
): Promise<TUser & ReturnType<typeof USER_ROLE_MAPPING[TRole]>> {
  if (role !== 'super admin' && role !== 'logged in user') {
    if (superAdminInstance === null) {
      superAdminInstance = await createNewSuperAdmin('superAdm');
    }

    await superAdminInstance.assignRoleToUser(user.username, role);
    await superAdminInstance.expectUserToHaveRole(user.username, role);
  }

  const userPrototype = Object.getPrototypeOf(user);
  const rolePrototype = Object.getPrototypeOf(USER_ROLE_MAPPING[role]());

  /**
   * Here we merge the two classes by altering their prototypes. It is fine to
   * cast the return so we can use the typescript functionalities of
   * both classes.
   */
  Object.getOwnPropertyNames(rolePrototype).forEach((name: string) => {
    Object.defineProperty(
      userPrototype,
      name,
      Object.getOwnPropertyDescriptor(rolePrototype, name) ||
        Object.create(null)
    );
  });

  return user as TUser & ReturnType<typeof USER_ROLE_MAPPING[TRole]>;
};

/**
 * This function creates a new user and returns the instance of that user.
 */
export let createNewUser = async function(
    username: string, email: string
): Promise<ILoggedInUser> {
  const user = BaseUserFactory();
  await user.openBrowser();
  await user.signUpNewUser(username, email);
  activeUsers.push(user);

  const loggedInUser = await assignRoleToUser(user, 'logged in user');
  return loggedInUser;
};

/**
 * The function creates a new super admin user and returns the instance
 * of that user.
 */
export let createNewSuperAdmin = async function(
    username: string
): Promise<ISuperAdmin> {
  if (superAdminInstance !== null) {
    return superAdminInstance;
  }

  const user = await createNewUser(username, 'testadmin@example.com');
  const superAdmin = await assignRoleToUser(user, 'super admin');
  superAdminInstance = superAdmin;

  return superAdmin;
};

/**
 * The function closes all the browsers opened by different users.
 */
export let closeAllBrowsers = async function(): Promise<void> {
  for (let i = 0; i < activeUsers.length; i++) {
    await activeUsers[i].closeBrowser();
  }
};

/**
 * Function to close the browser opened by the specified user
 * should be closed.
 */
export let closeBrowserForUser = async function(
    user: IBaseUser
): Promise<void> {
  const index = activeUsers.indexOf(user);
  activeUsers.splice(index, 1);
  await user.closeBrowser();
};
