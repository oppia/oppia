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
 * @fileoverview Logged-in users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const profilePageUrlPrefix = testConstants.URLs.ProfilePagePrefix;
const subscribeButton = 'button.oppia-subscription-button';
const unsubscribeLabel = '.e2e-test-unsubscribe-label';
const explorationCard = '.e2e-test-exploration-dashboard-card';

export class LoggedInUser extends BaseUser {
  /**
   * Function for navigating to the profile page for a given username.
   */
  async navigateToProfilePage(username: string): Promise<void> {
    const profilePageUrl = `${profilePageUrlPrefix}/${username}`;
    if (this.page.url() === profilePageUrl) {
      return;
    }
    await this.goto(profilePageUrl);
  }

  /**
   * Function to subscribe to a creator with the given username.
   */
  async subscribeToCreator(username: string): Promise<void> {
    const profilePageUrl = `${profilePageUrlPrefix}/${username}`;

    if (this.page.url() !== profilePageUrl) {
      await this.navigateToProfilePage(username);
    }

    await this.clickOn(subscribeButton);
    await this.page.waitForSelector(unsubscribeLabel);
    showMessage(`Subscribed to the creator with username ${username}.`);
  }

  /**
   * Checks whether the exploration with the given title is authored by the creator.
   */
  async expectExplorationToBePresentInProfilePageWithTitle(
    title: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationCard);
    const explorations = await this.page.$$(explorationCard);

    if (explorations.length === 0) {
      throw new Error('There are no explorations authored by the creator.');
    }

    const explorationTitle = await explorations[0].$eval(
      '.e2e-test-exp-summary-tile-title span span',
      element => (element as HTMLElement).textContent
    );

    if (explorationTitle?.trim() === title) {
      showMessage(`Exploration with title ${title} is present.`);
    } else {
      throw new Error(`Exploration with title ${title} is not present.`);
    }
  }

  /**
   * This function navigates to the given topic URL and checks if the page displays
   * an 'Error 404' message.
   * @param {string} topicUrlFragment - The URL fragment of the topic to check.
   */
  async expectTopicLinkReturns404(topicUrlFragment: string): Promise<void> {
    // Reloading the page to ensure the latest state is reflected,
    // particularly useful if a topic was recently unpublished.
    await this.page.reload();
    await this.goto(`http://localhost:8181/learn/staging/${topicUrlFragment}`);
    const isError404Present = await this.isTextPresentOnPage('Error 404');
    if (!isError404Present) {
      throw new Error(
        'Expected "Error 404" to be present on the page, but it was not.'
      );
    } else {
      showMessage('The link returns 404 as expected.');
    }
  }
}

export let LoggedInUserFactory = (): LoggedInUser => new LoggedInUser();
