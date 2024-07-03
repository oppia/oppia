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
 * @fileoverview Blog Admin users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const BLOG_RIGHTS = testConstants.BlogRights;

const roleUpdateUsernameInput = 'input#label-target-update-form-name';
const blogEditorUsernameInput = 'input#label-target-form-reviewer-username';
const maximumTagLimitInput = 'input#float-input';
const blogAdminUrl = testConstants.URLs.BlogAdmin;

const LABEL_FOR_SAVE_BUTTON = 'Save';

export class BlogAdmin extends BaseUser {
  /**
   * This function assigns a user with a role from the blog admin page.
   */
  async assignUserToRoleFromBlogAdminPage(
    username: string,
    role: keyof typeof BLOG_RIGHTS
  ): Promise<void> {
    await this.goto(blogAdminUrl);
    await this.page.select('select#label-target-update-form-role-select', role);
    await this.type(roleUpdateUsernameInput, username);
    await this.clickOn('button.oppia-blog-admin-update-role-button');
  }

  /**
   * This function removes blog editor role from the users.
   */
  async removeBlogEditorRoleFromUsername(username: string): Promise<void> {
    await this.goto(blogAdminUrl);
    await this.type(blogEditorUsernameInput, username);
    await this.clickOn('button.oppia-blog-admin-remove-blog-editor-button');
  }

  /**
   * This function changes the blog tags limit.
   */
  async setMaximumTagLimitTo(limit: number): Promise<void> {
    // These steps are for deleting the existing value in the input field.
    const tagInputField = await this.page.$(maximumTagLimitInput);
    await tagInputField?.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');

    await this.type(maximumTagLimitInput, limit.toString());
    await this.clickOn(LABEL_FOR_SAVE_BUTTON);

    showMessage(`Successfully updated the tag limit to ${limit}!`);
  }

  /**
   * This function checks if the tag limit is not equal to.
   */
  async expectMaximumTagLimitNotToBe(limit: number): Promise<void> {
    const tagLimit = await this.page.$eval(
      maximumTagLimitInput,
      element => (element as HTMLInputElement).value
    );
    if (parseInt(tagLimit) === limit) {
      throw new Error(`Maximum tag limit is already ${limit}!`);
    }
    showMessage(`Maximum tag limit is not ${limit}!`);
  }

  /**
   * This function checks if the tag limit is equal to.
   */
  async expectMaximumTagLimitToBe(limit: number): Promise<void> {
    const tagLimit = await this.page.$eval(
      maximumTagLimitInput,
      element => (element as HTMLInputElement).value
    );
    if (parseInt(tagLimit) !== limit) {
      throw new Error(`Maximum tag limit is not ${limit}!`);
    }
    showMessage(`Maximum tag is currently ${limit}!`);
  }
}

export let BlogAdminFactory = (): BlogAdmin => new BlogAdmin();
