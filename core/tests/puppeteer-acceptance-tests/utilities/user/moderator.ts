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

export class Moderator extends BaseUser {
  async navigateToModeratorPage(): Promise<void> {
    await this.page.goto(testConstants.URLs.ModeratorPage, {waitUntil: 'load'});
  }

  async viewAllRecentCommits(): Promise<Array<object>> {
    const commitRows = await this.page.$$('.commit-row');
    const allCommits: Array<{
      timestamp: string | null;
      exploration: string | null;
      category: string | null;
      username: string | null;
      commitMessage: string | null;
      isCommunityOwned: string | null;
    }> = [];

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

  async viewRecentCommit(commitNumber: number): Promise<object> {
    const commitRows = await this.page.$$('.commit-row');
    if (commitRows.length === 0) {
      throw new Error('No recent commits found');
    }

    commitNumber -= 1;

    if (commitNumber < 0 || commitNumber >= commitRows.length) {
      throw new Error('Invalid commit number');
    }

    const row = commitRows[commitNumber];
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

  async openExplorationEditorFromTitleLink(title: string): Promise<void> {
    await this.clickAndWaitForNavigation(title);
  }

  async isOnFeedbackTabOfExplorationEditor(): Promise<boolean> {
    return await this.isTextPresentOnPage('Start new thread');
  }

  async openExplorationEditorFromIdLink(
    explorationID: string | null
  ): Promise<void> {
    await this.clickAndWaitForNavigation(explorationID as string);
  }

  async goToRecentFeedbackMessages(): Promise<void> {
    await this.clickAndWaitForNavigation('Recent Feedback Messages');
  }

  async viewAllRecentFeedbackMessages(): Promise<object[]> {
    await this.page.waitForSelector('.oppia-padded-table');

    const feedbackMessages = await this.page.$$eval(
      '.oppia-padded-table tr',
      rows => {
        return Array.from(rows, row => {
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
}

export let ModeratorFactory = (): Moderator => new Moderator();
