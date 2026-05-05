// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {Browser} from '@playwright/test';
import {BaseUser} from '../base-user';
import {SuperAdmin} from '../user/super-admin';
import {BlogPostEditor} from '../user/blog-post-editor';
import testConstants, {BLOG_RIGHTS} from './test-constants';
import {showMessage} from './show-message';

const ROLES = testConstants.Roles;

// Roles that are not reflected on the admin page after assignment.
const USERS_ROLES_NOT_REFLECTED_IN_ADMIN_PAGE: string[] = [
  ROLES.TRANSLATION_REVIEWER,
  ROLES.VOICEOVER_SUBMITTER,
];

// Global super admin instance reused across all tests in a suite.
// Mirrors Puppeteer's pattern — one super admin per suite.
let superAdminInstance: SuperAdmin | null = null;

export class UserFactory {
  /**
   * Creates and returns a super admin instance.
   * Reuses the existing instance if already created (singleton per suite).
   */
  static async createNewSuperAdmin(browser: Browser): Promise<SuperAdmin> {
    if (superAdminInstance !== null) {
      return superAdminInstance;
    }

    const context = await browser.newContext({
      recordVideo: {dir: './test-results/videos/'},
    });
    const page = await context.newPage();
    const superAdmin = new SuperAdmin(page);
    superAdmin.username = 'superAdm';
    superAdmin.email = 'testadmin@example.com';

    await superAdmin.signUpNewUser('superAdm', 'testadmin@example.com');

    // Grant all admin roles to superAdm — mirrors Puppeteer's pattern.
    await superAdmin.assignRoleToUser('superAdm', ROLES.BLOG_ADMIN);
    await superAdmin.expectUserToHaveRole('superAdm', ROLES.BLOG_ADMIN);
    await superAdmin.assignRoleToUser('superAdm', ROLES.TRANSLATION_ADMIN);
    await superAdmin.expectUserToHaveRole('superAdm', ROLES.TRANSLATION_ADMIN);
    await superAdmin.assignRoleToUser('superAdm', ROLES.VOICEOVER_ADMIN);
    await superAdmin.expectUserToHaveRole('superAdm', ROLES.VOICEOVER_ADMIN);

    superAdminInstance = superAdmin;
    showMessage('Super admin created successfully.');
    return superAdminInstance;
  }

  /**
   * Assigns roles to a user via the super admin.
   * Mirrors Puppeteer's assignRolesToUser logic exactly.
   *
   * @param user - The user to assign roles to.
   * @param roles - The roles to assign.
   * @param browser - The browser instance (needed to create super admin if
   *     not yet created).
   * @param args - Extra arguments for specific roles:
   *     - TOPIC_MANAGER: topic name (string)
   *     - TRANSLATION_COORDINATOR: language codes (string[])
   *     - TRANSLATION_REVIEWER: language codes (string[])
   *     - VOICEOVER_SUBMITTER: exploration ID (string)
   */
  static async assignRolesToUser(
    user: BaseUser,
    roles: string[],
    browser: Browser,
    args?: string | string[]
  ): Promise<void> {
    if (roles.length === 0) {
      return;
    }

    // Create super admin if not already created.
    const superAdmin = await UserFactory.createNewSuperAdmin(browser);

    if (!user.username) {
      throw new Error('Username is null while adding roles.');
    }

    for (const role of roles) {
      switch (role) {
        case ROLES.BLOG_POST_EDITOR:
          // Blog post editor is assigned via blog admin page,
          // not the standard admin roles page.
          await superAdmin.navigateToBlogAdminPage();
          await superAdmin.assignUserToRoleFromBlogAdminPage(
            user.username,
            BLOG_RIGHTS.BLOG_POST_EDITOR
          );
          break;

        case ROLES.TOPIC_MANAGER:
          if (typeof args !== 'string') {
            throw new Error(
              'Topic name (string) is required for TOPIC_MANAGER role.'
            );
          }
          await superAdmin.assignRoleToUser(
            user.username,
            ROLES.TOPIC_MANAGER,
            args
          );
          break;

        case ROLES.TRANSLATION_COORDINATOR:
          await superAdmin.assignRoleToUser(
            user.username,
            ROLES.TRANSLATION_COORDINATOR,
            args
          );
          break;

        case ROLES.TRANSLATION_REVIEWER:
          await superAdmin.navigateToContributorDashboardAdminPage();
          const languages =
            typeof args === 'string' ? [args] : (args as string[]);
          for (const language of languages) {
            await superAdmin.addTranslationLanguageReviewRights(
              user.username,
              language
            );
          }
          break;

        case ROLES.VOICEOVER_SUBMITTER:
          if (typeof args !== 'string') {
            throw new Error(
              'Exploration ID (string) is required for VOICEOVER_SUBMITTER role.'
            );
          }
          await superAdmin.addVoiceoverArtistToExplorationWithID(
            args,
            user.username
          );
          break;

        default:
          // Standard roles assigned via the admin roles page.
          await superAdmin.assignRoleToUser(user.username, role);
          break;
      }

      // Verify the role was assigned (except for roles not shown on admin page).
      if (!USERS_ROLES_NOT_REFLECTED_IN_ADMIN_PAGE.includes(role)) {
        await superAdmin.expectUserToHaveRole(user.username, role);
      }

      showMessage(`Role "${role}" assigned to "${user.username}".`);
    }
  }

  /**
   * Creates a new user, signs them up, assigns roles via super admin,
   * and returns the user instance.
   *
   * The return type is BlogPostEditor because it extends the full
   * class chain:
   *   BaseUser → LoggedInUser → ExplorationEditor → ... → BlogPostEditor
   * so it has ALL capabilities. Cast to a more specific type in tests
   * if needed.
   *
   * @param username - The username for the new user.
   * @param email - The email for the new user.
   * @param browser - The Playwright browser instance.
   * @param roles - Optional roles to assign via super admin.
   * @param args - Extra args for specific roles (topic name, language, etc).
   */
  static async createNewUser(
    username: string,
    email: string,
    browser: Browser,
    roles: string[] = [],
    args?: string | string[]
  ): Promise<BlogPostEditor> {
    const context = await browser.newContext({
      recordVideo: {dir: './test-results/videos/'},
    });
    const page = await context.newPage();

    // BlogPostEditor sits at the top of the class hierarchy so it has
    // all methods from every user class — mirrors Puppeteer's pattern
    // of composing ALL role factories onto every user.
    const user = new BlogPostEditor(page);
    user.username = username;
    user.email = email;

    await user.signUpNewUser(username, email);
    showMessage(`User "${username}" created successfully.`);

    // Assign roles via super admin if any are specified.
    if (roles.length > 0) {
      await UserFactory.assignRolesToUser(user, roles, browser, args);
    }

    return user;
  }

  /**
   * Creates a logged-out user (no sign-up, just a fresh browser context).
   */
  static async createLoggedOutUser(browser: Browser): Promise<BaseUser> {
    const context = await browser.newContext();
    const page = await context.newPage();
    const user = new BaseUser(page);
    await user.goto(testConstants.URLs.Home);
    await page
      .locator('button.e2e-test-oppia-cookie-banner-accept-button')
      .click();
    showMessage('Logged-out user created.');
    return user;
  }

  /**
   * Closes all browser contexts for the given users.
   * Also closes the super admin context and resets the singleton.
   *
   * Call this in test.afterAll().
   */
  static async closeAllBrowsers(users: BaseUser[]): Promise<void> {
    showMessage(`Closing browsers for ${users.length} user(s).`);
    await Promise.all(users.map(u => u.page.context().close()));

    if (superAdminInstance !== null) {
      await superAdminInstance.page.context().close();
      superAdminInstance = null;
      showMessage('Super admin browser closed.');
    }

    showMessage('All browsers closed.');
  }

  /**
   * Closes the browser for a single user.
   */
  static async closeBrowserForUser(user: BaseUser): Promise<void> {
    await user.page.context().close();
    showMessage(`Browser closed for "${user.username}".`);
  }
}
