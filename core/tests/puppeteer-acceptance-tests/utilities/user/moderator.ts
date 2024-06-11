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
export class Moderator extends BaseUser {
  /**
   * Function to navigate to the moderator page.
   */
  async navigateToModeratorPage(): Promise<void> {
    await this.page.goto(moderatorPageUrl, {waitUntil: 'load'});
  }

  /**
   * Function to navigate to the Featured Activities tab.
   */
  async navigateToFeaturedActivitiesTab(): Promise<void> {
    await this.clickOn(featuredActivitiesTab);
  }

  /**
   * Function to view all recent commits.
   */
  async viewAllRecentCommits(): Promise<object[]> {
    const commitRows = await this.page.$$('.commit-row');
    const allCommits: {
      timestamp: string | null;
      exploration: string | null;
      category: string | null;
      username: string | null;
      commitMessage: string | null;
      isCommunityOwned: string | null;
    }[] = [];

    for (const row of commitRows) {
      const timestamp = await row.$eval(
        'td:nth-child(1)',
        el => el.textContent
      );
      const exploration = await row.$eval(
        'td:nth-child(2) a',
        el => el.textContent
      );
      const category = await row.$eval('td:nth-child(3)', el => el.textContent);
      const username = await row.$eval('td:nth-child(4)', el => el.textContent);
      const commitMessage = await row.$eval(
        'td:nth-child(5)',
        el => el.textContent
      );
      const isCommunityOwned = await row.$eval(
        'td:nth-child(6)',
        el => el.textContent
      );

      allCommits.push({
        timestamp,
        exploration,
        category,
        username,
        commitMessage,
        isCommunityOwned,
      });
    }

    return allCommits;
  }

  /**
   * Function to view a specific recent commit.
   * @param {number} commitIndex - The index of the commit to view.
   */
  async viewRecentCommit(commitIndex: number): Promise<object> {
    const commitRows = await this.page.$$('.commit-row');
    if (commitRows.length === 0) {
      throw new Error('No recent commits found');
    }

    commitIndex -= 1;

    if (commitIndex < 0 || commitIndex >= commitRows.length) {
      throw new Error('Invalid commit number');
    }

    const row = commitRows[commitIndex];
    const timestamp = await row.$eval('td:nth-child(1)', el => el.textContent);
    const exploration = await row.$eval(
      'td:nth-child(2) a',
      el => el.textContent
    );
    const category = await row.$eval('td:nth-child(3)', el => el.textContent);
    const username = await row.$eval('td:nth-child(4)', el => el.textContent);
    const commitMessage = await row.$eval(
      'td:nth-child(5)',
      el => el.textContent
    );
    const isCommunityOwned = await row.$eval(
      'td:nth-child(6)',
      el => el.textContent
    );

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
   * Function to open the exploration editor from a title link.
   * @param {string} title - The title of the exploration.
   */
  async openExplorationEditorFromTitleLink(title: string): Promise<void> {
    await this.clickAndWaitForNavigation(title);
  }

  /**
   * Function to check if the user is on the feedback tab of the exploration editor.
   */
  async isOnFeedbackTabOfExplorationEditor(): Promise<boolean> {
    return await this.isTextPresentOnPage('Start new thread');
  }

  /**
   * Function to open the exploration editor from an ID link.
   * @param {string | null} explorationID - The ID of the exploration.
   */
  async openExplorationEditorFromIdLink(
    explorationID: string | null
  ): Promise<void> {
    await this.clickAndWaitForNavigation(explorationID as string);
  }

  /**
   * Function to navigate to recent feedback messages.
   */
  async goToRecentFeedbackMessages(): Promise<void> {
    await this.clickAndWaitForNavigation('Recent Feedback Messages');
  }

  /**
   * Function to view all recent feedback messages.
   */
  async viewAllRecentFeedbackMessages(): Promise<object[]> {
    const feedbackMessages = await this.page.$$eval(
      '.protractor-test-message-table-row',
      rows => {
        return rows.map(row => {
          const columns = row.querySelectorAll('td');
          return {
            timestamp: columns[0]?.textContent?.trim(),
            explorationId: columns[1]?.textContent?.trim(),
            username: columns[2]?.textContent?.trim(),
          };
        });
      }
    );

    feedbackMessages.shift();

    return feedbackMessages;
  }

  /**
   * Function to feature an activity.
   * @param {string} explorationId - The ID of the exploration to feature.
   */
  async featureActivity(explorationId: string): Promise<void> {
    await this.clickOn(' Add element ');
    await this.page.waitForSelector('input[aria-label="text input"]');
    console.log('explorationId:', explorationId);
    await this.page.type('input[aria-label="text input"]', explorationId);
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
  async unfeatureActivity(explorationId: string): Promise<void> {
    const rows = await this.page.$$(
      '#e2e-test-schema-based-list-editor-table-row'
    );
    for (const row of rows) {
      const schemaBasedUnicodeEditor = await row.$(
        'schema-based-unicode-editor'
      );
      const modelValue = await schemaBasedUnicodeEditor?.evaluate(node =>
        node.getAttribute('ng-reflect-model')
      );
      if (modelValue === explorationId) {
        console.log('reached one');
        const deleteButton = await row.$('.e2e-test-delete-list-entry');
        if (deleteButton) {
          console.log('reached two');
          await this.waitForElementToBeClickable(deleteButton);
          await deleteButton.click();
        }
        break;
      }
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
