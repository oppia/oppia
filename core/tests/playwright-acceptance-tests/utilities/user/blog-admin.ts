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

const blogAdminUrl = testConstants.URLs.BlogAdmin;

const roleSelectDropdown = 'select#label-target-update-form-role-select';
const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const updateRoleButtonSelector = 'button.oppia-blog-admin-update-role-button';
const blogEditorUsernameInput = 'input#label-target-form-reviewer-username';
const maximumTagLimitInput = 'input#float-input';
const removeRoleButtonSelector =
  'button.oppia-blog-admin-remove-blog-editor-button';

export class BlogAdmin extends BaseUser {
  /**
   * This function navigates to the blog admin page.
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
    await this.page.selectOption(roleSelectDropdown, role);
    await this.typeInInputField(roleUpdateUsernameInput, username);
    await this.clickOnElementWithSelector(updateRoleButtonSelector);

    await this.expectElementToBeClickable(updateRoleButtonSelector, false);
  }

  /**
   * Removes blog editor role from a user.
   */
  async removeBlogEditorRoleFromUsername(username: string): Promise<void> {
    await this.goto(blogAdminUrl);
    await this.typeInInputField(blogEditorUsernameInput, username);
    await this.clickOnElementWithSelector(removeRoleButtonSelector);

    await this.expectElementToBeClickable(removeRoleButtonSelector, false);
  }

  /**
   * Changes the maximum blog tags limit.
   */
  async setMaximumTagLimitTo(limit: number): Promise<void> {
    await this.expectElementToBeVisible(maximumTagLimitInput);
    await this.clearAllTextFrom(maximumTagLimitInput);

    await this.typeInInputField(maximumTagLimitInput, limit.toString());
    await this.clickOnElementWithText('Save');

    await this.expectToastMessage('Data saved successfully.');
  }

  /**
   * Checks whether the maximum tag limit equals the expected value.
   */
  async expectMaximumTagLimitToBe(limit: number): Promise<void> {
    await this.expectElementToBeVisible(maximumTagLimitInput);

    const tagLimit = await this.page.locator(maximumTagLimitInput).inputValue();

    if (parseInt(tagLimit, 10) !== limit) {
      throw new Error(`Maximum tag limit is not ${limit}!`);
    }
  }
}

export const BlogAdminFactory = (page: Page): BlogAdmin => {
  return new BlogAdmin(page);
};
