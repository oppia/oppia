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
 * @fileoverview moderator user utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const moderatorPageUrl = testConstants.URLs.ModeratorPage;
const featuredActivitiesTab = '.e2e-test-featured-activities-tab-link';
const explorationIDField = 'input[aria-label="text input"]';
const featuredActivityRowSelector =
  '#e2e-test-schema-based-list-editor-table-row';
const deleteFeaturedActivityButton = '.e2e-test-delete-list-entry';

export class Moderator extends BaseUser {
  /**
   * Function to navigate to the moderator page.
   */
  async navigateToModeratorPage(): Promise<void> {
    await this.page.goto(moderatorPageUrl);
  }

  /**
   * Function to navigate to the Featured Activities tab.
   */
  async navigateToFeaturedActivitiesTab(): Promise<void> {
    await this.clickOn(featuredActivitiesTab);
  }

  /**
   * Function to feature an activity.
   * @param {string} explorationId - The ID of the exploration to feature.
   */
  async featureActivity(explorationId: string | null): Promise<void> {
    await this.clickOn(' Add element ');

    await this.page.waitForSelector(explorationIDField);
    await this.page.type(explorationIDField, explorationId as string);
    await this.page.keyboard.press('Enter');
    await this.clickOn(' Save Featured Activities ');

    try {
      await this.page.waitForFunction(
        'document.querySelector(".e2e-test-toast-message") !== null',
        {timeout: 5000}
      );
      showMessage('Activity featured successfully.');
    } catch (error) {
      throw new Error('Failed to save the featured activities');
    }
  }

  /**
   * Function to unfeature an activity.
   */
  async unfeatureActivity(explorationId: string | null): Promise<void> {
    await this.navigateToFeaturedActivitiesTab();
    await this.page.waitForSelector(featuredActivityRowSelector);
    const rows = await this.page.$$(featuredActivityRowSelector);

    if (rows.length === 0) {
      throw new Error('No featured activities found');
    }

    let activityUnfeatured = false;

    for (const row of rows) {
      await row.waitForSelector('schema-based-unicode-editor');
      const schemaBasedUnicodeEditor = await row.$(
        'schema-based-unicode-editor'
      );
      const modelValue = await schemaBasedUnicodeEditor?.evaluate(node =>
        node.getAttribute('ng-reflect-model')
      );

      if (modelValue === (explorationId as string)) {
        await row.waitForSelector(deleteFeaturedActivityButton);
        const deleteButton = await row.$(deleteFeaturedActivityButton);

        if (deleteButton) {
          await this.waitForElementToBeClickable(deleteButton);
          await deleteButton.click();
          activityUnfeatured = true;
          break;
        }
      }
    }

    if (!activityUnfeatured) {
      throw new Error(
        `Failed to unfeature the activity with id: ${explorationId}`
      );
    }

    await this.clickOn(' Save Featured Activities ');

    try {
      await this.page.waitForFunction(
        'document.querySelector(".e2e-test-toast-message") !== null',
        {timeout: 5000}
      );
      showMessage('Activity unfeatured successfully.');
    } catch (error) {
      throw new Error('Failed to save the unfeatured activities');
    }
  }
}

export let ModeratorFactory = (): Moderator => new Moderator();
