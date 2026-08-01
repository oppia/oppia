// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Blog Admin users utility file.
 */

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants, {BlogRoles} from '../common/test-constants';

const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const blogAdminUrl = testConstants.URLs.BlogAdmin;
const updateRoleButtonSelector = 'button.oppia-blog-admin-update-role-button';

export class BlogAdmin extends BaseUser {
  /**
   * Navigates to the blog admin page.
   */
  async navigateToBlogAdminPage(): Promise<void> {
    await this.goto(blogAdminUrl);
  }

  /**
   * This function assigns a user with a role from the blog admin page.
   */
  async assignUserToRoleFromBlogAdminPage(
    username: string,
    role: BlogRoles
  ): Promise<void> {
    await this.page.selectOption(
      'select#label-target-update-form-role-select',
      role
    );
    await this.typeInInputField(roleUpdateUsernameInput, username);
    await this.clickOnElementWithSelector(updateRoleButtonSelector);
    await this.expectElementToBeClickable(updateRoleButtonSelector, false);
  }
}

export const BlogAdminFactory = (page: Page): BlogAdmin => {
  return new BlogAdmin(page);
};
