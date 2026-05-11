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
 * @fileoverview BlogAdmin role mixin for composition.
 * Provides blog admin methods that can be composed onto SuperAdmin.
 */

import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants, {BLOG_RIGHTS, BlogRoles} from '../common/test-constants';

// Blog Admin selectors.
const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const updateRoleButtonSelector = 'button.oppia-blog-admin-update-role-button';

// URLs.
const blogAdminUrl = testConstants.URLs.BlogAdmin;

/**
 * BlogAdmin provides blog administration capabilities.
 * This class is designed to be composed with SuperAdmin via prototype mixing.
 */
export class BlogAdmin extends BaseUser {
  /**
   * Navigates to the blog admin page.
   */
  async navigateToBlogAdminPage(): Promise<void> {
    await this.goto(blogAdminUrl);
  }

  async assignUserToRoleFromBlogAdminPage(
    username: string,
    role: BlogRoles
  ): Promise<void> {
    await this.page
      .locator('select#label-target-update-form-role-select')
      .selectOption(role);
    await this.page.locator(roleUpdateUsernameInput).fill(username);
    await this.page.locator(updateRoleButtonSelector).click();

    await expect(this.page.locator(updateRoleButtonSelector)).not.toBeEnabled();
  }
}

export const BlogAdminFactory = (page: Page): BlogAdmin => {
  return new BlogAdmin(page);
};
