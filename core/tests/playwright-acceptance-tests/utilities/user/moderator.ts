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
 * @fileoverview Moderator user utility file.
 */

import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const moderatorPageUrl = testConstants.URLs.ModeratorPage;

const moderatorPageContainerSelector = '.e2e-test-moderator-page';
const commitRowSelector = '.e2e-test-commit-row';
const commitTableHeaderRowSelector = '.e2e-test-commit-table-header-row';
const explorationEditorContainerSelector = 'oppia-exploration-editor-page-root';

interface CommitProperties {
  timestamp: string;
  exploration: string;
  category: string;
  username: string;
  commitMessage: string;
  isCommunityOwned: string;
}

export class Moderator extends BaseUser {
  /**
   * Navigates to the moderator page.
   */
  async navigateToModeratorPage(): Promise<void> {
    await this.goto(moderatorPageUrl);
  }

  /**
   * Function to view a specific recent commit.
   * @param {number} commitIndex - The index of the commit to view.
   */
  private async getPropertiesOfCommit(
    commitIndex: number
  ): Promise<CommitProperties> {
    const commitRows = this.page.locator(commitRowSelector);
    const commitRowsLen = await commitRows.count();
    expect(commitRowsLen).toBeGreaterThan(0);

    commitIndex -= 1; // Adjusting to 0-based index.
    if (commitIndex < 0 || commitIndex >= commitRowsLen) {
      throw new Error('Invalid commit number');
    }

    const row = commitRows.nth(commitIndex);
    const timestamp = await row
      .locator('td:nth-child(1)')
      .evaluate(el => el.textContent);
    const exploration = await row
      .locator('td:nth-child(2) a')
      .evaluate(el => el.textContent);
    const category = await row
      .locator('td:nth-child(3)')
      .evaluate(el => el.textContent);
    const username = await row
      .locator('td:nth-child(4)')
      .evaluate(el => el.textContent);
    const commitMessage = await row
      .locator('td:nth-child(5)')
      .evaluate(el => el.textContent);
    const isCommunityOwned = await row
      .locator('td:nth-child(6)')
      .evaluate(el => el.textContent);

    if (
      !timestamp ||
      !exploration ||
      !category ||
      !username ||
      !commitMessage ||
      !isCommunityOwned
    ) {
      throw new Error('Failed to fetch commit properties');
    }

    return {
      timestamp,
      exploration,
      category,
      username,
      commitMessage,
      isCommunityOwned,
    };
  }

  /**
   * Function to check the number of recent commits.
   * @param {number} expectedCount - The expected number of commits.
   */
  async expectNumberOfRecentCommits(expectedCount: number): Promise<void> {
    const commitRows = await this.page.locator(commitRowSelector);
    await expect(commitRows).toHaveCount(expectedCount);
    showMessage('Recent commits count matches expected count.');
  }

  /**
   * Function to check if the recent commits table has the expected columns.
   * @param {string[]} columnNames - The names of the columns to check.
   */
  async expectRecentCommitsTableToHaveColumns(
    columnNames: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(commitTableHeaderRowSelector);
    const commitTableColumnFields = await this.page
      .locator(`${commitTableHeaderRowSelector} th`)
      .evaluateAll(elements => elements.map(element => element.textContent));

    for (const columnName of columnNames) {
      expect(commitTableColumnFields).toContain(columnName);
    }
  }

  /**
   * Function to check if a specific commit has all the expected properties.
   * @param {number} commitIndex - The 1-based index of the commit to check.
   * @param {string[]} expectedProperties - The properties that the commit is expected to have.
   */
  async expectCommitToHaveProperties(
    commitIndex: number,
    expectedProperties: string[]
  ): Promise<void> {
    const commit = await this.getPropertiesOfCommit(commitIndex);

    for (const property of expectedProperties) {
      if (!(property in commit)) {
        throw new Error(`Commit does not have property: ${property}`);
      }
    }
    showMessage(`Commit ${commitIndex} has all expected properties.`);
  }

  /**
   * Checks if a specific commit has a specific property with a specific value.
   * @param {number} commitIndex - The 1-based index of the commit to check.
   * @param {string} property - The property to check.
   * @param {string} value - The value of the property to check.
   */
  async expectCommitPropertyToBe(
    commitIndex: number,
    property: keyof {
      timestamp: string;
      exploration: string;
      category: string;
      username: string;
      commitMessage: string;
      isCommunityOwned: string;
    },
    value: string
  ): Promise<void> {
    const commit = await this.getPropertiesOfCommit(commitIndex);

    if (!(property in commit)) {
      throw new Error(`Commit does not have property: ${property}`);
    }

    expect(commit[property]).toBe(value);
    showMessage(
      `Commit ${commitIndex} has property ${property} with value ${value}.`
    );
  }

  /**
   * Function to click on the exploration link in the recent commits table.
   * @param {number} commitIndex - The 1-based index of the commit to click on.
   */
  async clickOnExplorationLinkInRecentCommitsTable(
    commitIndex: number
  ): Promise<void> {
    const commitRows = await this.page.locator(commitRowSelector);
    const commitRowsLen = await commitRows.count();
    expect(commitRowsLen).toBeGreaterThan(0);

    commitIndex -= 1; // Adjusting to 0-based index.
    if (commitIndex < 0 || commitIndex >= commitRowsLen) {
      throw new Error('Invalid commit number');
    }

    const row = commitRows.nth(commitIndex);
    const explorationElement = await row.locator('td:nth-child(2) a');

    explorationElement.click();
    await this.page.waitForLoadState('load');
  }

  /**
   * Check if the user is in the exploration editor.
   * @param {string} explorationId - The ID of the exploration to check.
   */
  async expectToBeInExplorationEditor(explorationId?: string): Promise<void> {
    await this.expectElementToBeVisible(explorationEditorContainerSelector);

    if (explorationId) {
      await this.expectPageURLToContain(explorationId);
    }
  }

  /**
   * Check if the user is in the moderator page.
   */
  async expectToBeInModeratorPage(): Promise<void> {
    await this.expectElementToBeVisible(moderatorPageContainerSelector);
  }

  /**
   * Checks if the timestamps in the commits or feedback messages are in descending order.
   * @param {'commit' | 'feedback messages'} table - The table to check the timestamps in.
   */
  async expectTimestampToBeInDescendingOrder(
    table: 'commit' | 'feedback messages' = 'commit'
  ): Promise<void> {
    const selector = `.e2e-test-${table.replace(' ', '-')}-row`;
    await this.expectElementToBeVisible(selector);
    const rowElements = await this.page.locator(selector);
    const rawTimeValue1 = await rowElements.nth(0).evaluate(el => {
      return el.querySelector('td')?.textContent?.trim();
    });
    const rawTimeValue2 = await rowElements.nth(1).evaluate(el => {
      return el.querySelector('td')?.textContent?.trim();
    });
    const time1 = this.parseLocaleAbbreviatedDatetimeString(
      rawTimeValue1 as string
    );
    const time2 = this.parseLocaleAbbreviatedDatetimeString(
      rawTimeValue2 as string
    );

    expect(time1).toBeGreaterThanOrEqual(time2);
  }

}

export let ModeratorFactory = (page: Page): Moderator => {
  return new Moderator(page);
};
