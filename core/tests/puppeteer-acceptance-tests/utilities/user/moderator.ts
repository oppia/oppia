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
        const timestamp = await row.$eval('td:nth-child(1)', el => el.textContent);
        const exploration = await row.$eval('td:nth-child(2) a', el => el.textContent);
        const category = await row.$eval('td:nth-child(3)', el => el.textContent);
        const username = await row.$eval('td:nth-child(4)', el => el.textContent);
        const commitMessage = await row.$eval('td:nth-child(5)', el => el.textContent);
        const isCommunityOwned = await row.$eval('td:nth-child(6)', el => el.textContent);

        allCommits.push({
            timestamp,
            exploration,
            category,
            username,
            commitMessage,
            isCommunityOwned
        });
    }

  return allCommits;
}
    
}

export let ModeratorFactory = (): Moderator =>
    new Moderator();