// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility File for declaring and initializing users.
 * Uses prototype-based composition to mix role capabilities onto user instances.
 * Mirrors Puppeteer's pattern for consistent behavior across test frameworks.
 */

import {Browser} from '@playwright/test';
import testConstants from './test-constants';
import {showMessage} from './show-message';
import {BaseUser, BaseUserFactory} from './playwright-utils';
import {SuperAdmin, SuperAdminFactory} from '../user/super-admin';
import {LoggedOutUser, LoggedOutUserFactory} from '../user/logged-out-user';
import {LoggedInUser, LoggedInUserFactory} from '../user/logged-in-user';
import {
  ExplorationEditor,
  ExplorationEditorFactory,
} from '../user/exploration-editor';
import {
  CurriculumAdmin,
  CurriculumAdminFactory,
} from '../user/curriculum-admin';
import {ReleaseCoordinatorFactory} from '../user/release-coordinator';
import {TopicManager, TopicManagerFactory} from '../user/topic-manager';

const ROLES = testConstants.Roles;
const cookieBannerAcceptButton =
  'button.e2e-test-oppia-cookie-banner-accept-button';
const isMobile = process.env.MOBILE === 'true';
const specName = process.env.SPEC_NAME;
const VIDEO_RECORDING_DIR = `../oppia_full_stack_test_video_recordings/acceptance/${isMobile ? 'mobile' : 'desktop'}-${specName}/`;

/**
 * Mapping of user roles to their respective factory functions.
 */
const USER_ROLE_MAPPING = {
  [ROLES.CURRICULUM_ADMIN]: CurriculumAdminFactory,
  [ROLES.RELEASE_COORDINATOR]: ReleaseCoordinatorFactory,
  [ROLES.TOPIC_MANAGER]: TopicManagerFactory,
} as const;

// Roles that are not reflected on the admin page after assignment.
const USERS_ROLES_NOT_REFLECTED_IN_ADMIN_PAGE: string[] = [
  ROLES.TRANSLATION_REVIEWER,
  ROLES.VOICEOVER_SUBMITTER,
];

/**
 * These types are used to create a union of all the roles and then
 * create an intersection of all the roles. This is used to create a
 * composition of the user and the role for type inference.
 */
type UnionToIntersection<U> = (
  U extends BaseUser ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type MultipleRoleIntersection<T extends (keyof typeof USER_ROLE_MAPPING)[]> =
  UnionToIntersection<ReturnType<(typeof USER_ROLE_MAPPING)[T[number]]>>;

type OptionalRoles<TRoles extends (keyof typeof USER_ROLE_MAPPING)[]> =
  TRoles extends never[] ? [] : TRoles | [];

type BasicRolesUser = LoggedOutUser &
  LoggedInUser &
  ExplorationEditor &
  CurriculumAdmin &
  TopicManager;

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: SuperAdmin | null = null;
let activeUsers: BaseUser[] = [];

export class UserFactory {
  /**
   * This function creates a composition of the user and the role
   * through object prototypes and returns the instance of that user.
   */
  private static composeUserWithRoles = function <
    TUser extends BaseUser,
    TRoles extends BaseUser[],
  >(user: TUser, roles: TRoles): TUser & UnionToIntersection<TRoles[number]> {
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
   * @param {TUser} user - The user to assign roles to.
   * @param {TRoles} roles - The roles to assign to the user.
   * @param {Browser} browser - The Playwright browser instance.
   * @param {string | string[]} args - The arguments to pass to the role
   *     assignment function. For Blog Post Editor, it uses the blog admin page.
   * @returns {TUser & MultipleRoleIntersection<TRoles>} - The user with
   *     the roles assigned.
   */
  static assignRolesToUser = async function <
    TUser extends BaseUser,
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[],
  >(
    user: TUser,
    roles: TRoles,
    browser: Browser,
    args?: string | string[]
  ): Promise<TUser & MultipleRoleIntersection<TRoles>> {
    for (const role of roles) {
      if (superAdminInstance === null) {
        superAdminInstance = await UserFactory.createNewSuperAdmin(browser);
      }

      if (!user.username) {
        throw new Error('Username is null while adding roles.');
      }

      switch (role) {
        case ROLES.TOPIC_MANAGER:
          if (typeof args !== 'string') {
            throw new Error('Expected additional argument to be string.');
          }
          await superAdminInstance.assignRoleToUser(
            user.username,
            ROLES.TOPIC_MANAGER,
            args as string
          );
          break;
        default:
          await superAdminInstance.assignRoleToUser(user.username, role);
          break;
      }

      if (!USERS_ROLES_NOT_REFLECTED_IN_ADMIN_PAGE.includes(role)) {
        await superAdminInstance.expectUserToHaveRole(user.username, role);
      }

      UserFactory.composeUserWithRoles(user, [
        USER_ROLE_MAPPING[role](user.page),
      ]);
    }

    return user as TUser & MultipleRoleIntersection<typeof roles>;
  };

  /**
   * This function creates a new user with the specified roles and returns
   * the instance of that user.
   * @param {string} username - The username of the user.
   * @param {string} email - The email of the user.
   * @param {Browser} browser - The Playwright browser instance.
   * @param {OptionalRoles<TRoles>} roles - The roles to assign to the user.
   * @param {string | string[]} args - The arguments to pass to the role
   *     assignment function.
   */
  static createNewUser = async function <
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[] = never[],
  >(
    username: string,
    email: string,
    browser: Browser,
    roles: OptionalRoles<TRoles> = [] as OptionalRoles<TRoles>,
    args?: string | string[]
  ): Promise<BasicRolesUser & MultipleRoleIntersection<TRoles>> {
    const context = await browser.newContext({
      recordVideo: {
        dir: VIDEO_RECORDING_DIR,
      },
    });
    const page = await context.newPage();

    let user = UserFactory.composeUserWithRoles(BaseUserFactory(page), [
      LoggedOutUserFactory(page),
      LoggedInUserFactory(page),
      ExplorationEditorFactory(page),
      CurriculumAdminFactory(page),
      TopicManagerFactory(page),
    ]);

    user.username = username;
    user.email = email;

    await user.signUpNewUser(username, email);
    activeUsers.push(user);

    return (await UserFactory.assignRolesToUser(
      user,
      roles,
      browser,
      args
    )) as BasicRolesUser & MultipleRoleIntersection<TRoles>;
  };

  /**
   * The function creates a new super admin user and returns the instance
   * of that user.
   */
  static createNewSuperAdmin = async function (
    browser: Browser
  ): Promise<SuperAdmin> {
    if (superAdminInstance !== null) {
      return superAdminInstance;
    }

    const user = await UserFactory.createNewUser(
      'superAdm',
      'testadmin@example.com',
      browser
    );

    superAdminInstance = UserFactory.composeUserWithRoles(user, [
      SuperAdminFactory(user.page),
    ]);

    showMessage('Super admin created successfully.');
    return superAdminInstance;
  };

  /**
   * This function creates a new instance of a LoggedOutUser, opens a browser
   * for that user, navigates to the home page, adds the user to the
   * activeUsers array, and returns the user.
   */
  static createLoggedOutUser = async function (
    browser: Browser
  ): Promise<LoggedOutUser> {
    const context = await browser.newContext({
      recordVideo: {
        dir: VIDEO_RECORDING_DIR,
      },
    });
    const page = await context.newPage();

    let user = UserFactory.composeUserWithRoles(BaseUserFactory(page), [
      LoggedOutUserFactory(page),
    ]);

    await page.goto(testConstants.URLs.Home);
    await page.locator(cookieBannerAcceptButton).click();

    activeUsers.push(user);
    return user;
  };

  /**
   * This function closes all the browsers opened by different users.
   */
  static closeAllBrowsers = async function (): Promise<void> {
    showMessage(`Closing browsers for ${activeUsers.length} users.`);
    await Promise.all(
      activeUsers.map(async user => {
        await user.closeBrowser();
      })
    );

    activeUsers = [];
    showMessage('All browsers closed.');
  };

  /**
   * This function closes the browser for the provided user.
   */
  static closeBrowserForUser = async function (user: BaseUser): Promise<void> {
    const index = activeUsers.indexOf(user);
    if (index !== -1) {
      activeUsers.splice(index, 1);
    }
    await user.closeBrowser();
  };

  /**
   * This function closes the browser for SuperAdmin and resets the singleton.
   */
  static closeSuperAdminBrowser = async function (): Promise<void> {
    if (superAdminInstance !== null) {
      await superAdminInstance.closeBrowser();
      superAdminInstance = null;
      showMessage('Super admin browser closed.');
    }
  };
}
