// Copyright 2024 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the Licensep
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

const commitRowSelector = '.e2e-test-commit-row';
const feedbackMessagesTab = '.e2e-test-feedback-messages-tab-link';
const feedbackMessageRowSelector = '.e2e-test-feedback-messages-row';
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
   * Function to check the number of recent commits.
   * @param {number} expectedCount - The expected number of commits.
   */
  async expectNumberOfRecentCommits(expectedCount: number): Promise<void> {
    await this.page.waitForSelector(commitRowSelector);
    const commitRows = await this.page.$$(commitRowSelector);
    const actualCount = commitRows.length;

    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} commits, but found ${actualCount}`
      );
    }
    showMessage('Recent commits count matches expected count.');
  }

  /**
   * Function to view a specific recent commit.
   * @param {number} commitIndex - The index of the commit to view.
   */
  private async getPropertiesOfCommit(commitIndex: number): Promise<object> {
    const commitRows = await this.page.$$(commitRowSelector);
    if (commitRows.length === 0) {
      throw new Error('No recent commits found');
    }

    commitIndex -= 1; // Adjusting to 0-based index.

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
   * Function to check if a specific commit has all the expected properties.
   * @param {number} commitIndex - The index of the commit to check.
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
   * Function to open the exploration editor from a title link.
   * @param {string} title - The title of the exploration.
   */
  async openFeedbackTabFromLinkInExplorationTitle(
    title: string
  ): Promise<void> {
    await this.clickAndWaitForNavigation(title);
  }

  /**
   * Function to check if the user is on the feedback tab of the exploration editor.
   */
  async expectToBeOnFeedbackTab(): Promise<void> {
    const isOnFeedbackTab = await this.isTextPresentOnPage('Start new thread');

    if (!isOnFeedbackTab) {
      throw new Error(
        'User is not on the feedback tab of the exploration editor'
      );
    }
    showMessage('User is on the feedback tab of the exploration editor.');
  }

  /**
   * Function to check the number of feedback messages.
   * @param {number} expectedCount - The expected number of feedback messages.
   */
  async expectNumberOfFeedbackMessages(expectedCount: number): Promise<void> {
    await this.page.waitForSelector('table');
    const feedbackRows = await this.page.$$('table tr');
    const actualCount = feedbackRows.length - 1;

    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} feedback messages, but found ${actualCount}`
      );
    }
    showMessage('Feedback messages count matches expected count.');
  }

  /**
   * Function to fetch a specific feedback message and return its properties.
   * @param {number} messageIndex - The index of the feedback message to fetch, starting from 1.
   */
  private async fetchFeedbackMessage(messageIndex: number): Promise<object> {
    await this.page.waitForSelector(feedbackMessageRowSelector);
    const messageRows = await this.page.$$(feedbackMessageRowSelector);
    if (messageRows.length === 0) {
      throw new Error('No feedback messages found');
    }

    messageIndex -= 1; // Adjusting to 0-based index.

    if (messageIndex < 0 || messageIndex >= messageRows.length) {
      throw new Error('Invalid message number');
    }

    const row = messageRows[messageIndex];

    const timestamp = await row.$eval('td:nth-child(1)', el => el.textContent);
    const explorationId = await row.$eval(
      'td:nth-child(2) a',
      el => el.textContent
    );
    const username = await row.$eval('td:nth-child(3)', el => el.textContent);

    return {
      timestamp,
      explorationId,
      username,
    };
  }

  /**
   * Function to check if a specific feedback message has all the expected properties.
   * @param {number} messageIndex - The index of the feedback message to check.
   * @param {string[]} expectedProperties - The properties that the feedback message
   * is expected to have.
   */
  async expectFeedbackMessageToHaveProperties(
    messageIndex: number,
    expectedProperties: string[]
  ): Promise<void> {
    const message = await this.fetchFeedbackMessage(messageIndex);

    for (const property of expectedProperties) {
      if (!(property in message)) {
        throw new Error(`Feedback message does not have property: ${property}`);
      }
    }
    showMessage(
      `Feedback message ${messageIndex} has all expected properties.`
    );
  }

  /**
   * Function to open the exploration editor from an ID link.
   * @param {string | null} explorationID - The ID of the exploration.
   */
  async openFeedbackTabFromLinkInExplorationId(
    explorationID: string | null
  ): Promise<void> {
    await this.clickAndWaitForNavigation(` ${explorationID} ` as string);
  }

  /**
   * Function to navigate to recent feedback messages.
   */
  async navigateToRecentFeedbackMessagesTab(): Promise<void> {
    await this.clickOn(feedbackMessagesTab);
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
   * @param {number} index - The index of the activity to unfeature.
   */
  async unfeatureActivityAtIndex(index: number): Promise<void> {
    // Subtracting 1 from index to make it 1-based.
    index -= 1;

    await this.navigateToFeaturedActivitiesTab();
    await this.page.waitForSelector(featuredActivityRowSelector, {
      visible: true,
    });

    const rows = await this.page.$$(featuredActivityRowSelector);

    if (rows.length === 0) {
      throw new Error('No featured activities found');
    }

    if (index < 0 || index >= rows.length) {
      throw new Error('Invalid index');
    }

    const row = rows[index];
    await row.waitForSelector(deleteFeaturedActivityButton, {
      visible: true,
    });
    const deleteButton = await row.$(deleteFeaturedActivityButton);

    if (!deleteButton) {
      throw new Error('Delete featured activity button not found');
    }
    const isDeleteButtonVisible = await deleteButton.isIntersectingViewport();
    if (!isDeleteButtonVisible) {
      throw new Error('Delete button is not visible');
    }
    await this.waitForElementToBeClickable(deleteButton);
    await deleteButton.click();

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
