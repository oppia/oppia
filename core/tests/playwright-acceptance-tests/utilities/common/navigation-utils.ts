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
 * @fileoverview Utility class for navigation actions shared across multiple
 * user roles (e.g. LoggedInUser, LoggedOutUser). Extracted here to avoid
 * duplicate implementations of the same action across user utility files.
 */

import {expect} from '@playwright/test';
import {BaseUser} from './playwright-utils';
import testConstants from './test-constants';

const splashPageUrl = testConstants.URLs.splash;

export class NavigationUtils {
  userInstance: BaseUser;

  constructor(userInstance: BaseUser) {
    this.userInstance = userInstance;
  }

  /**
   * Verifies that the current page URL includes the expected page pathname.
   * @param {string} expectedPage - The expected page pathname (e.g., 'learner-dashboard').
   */
  async expectToBeOnPage(expectedPage: string): Promise<void> {
    await this.userInstance.waitForStaticAssetsToLoad();
    const url = this.userInstance.page.url();

    // Replace spaces in the expectedPage with hyphens.
    const expectedPageInUrl = expectedPage.replace(/\s+/g, '-');

    if (!url.toLowerCase().includes(expectedPageInUrl.toLowerCase())) {
      throw new Error(
        `Expected to be on page ${expectedPage}, but found ${url}`
      );
    }
  }

  /**
   * Navigates to the splash page and verifies the resulting URL. Since
   * /splash redirects the user to a different page depending on their auth
   * state, the expected destination must be supplied by the caller rather
   * than assumed here.
   * @param {string} expectedURL - The expected URL after navigation.
   */
  async navigateToSplashPage(expectedURL: string): Promise<void> {
    // We explicitly check for expected URL instead of verifying it through
    // BaseUser.goto as /splash redirects user to a different page.
    await this.userInstance.goto(splashPageUrl, false);

    expect(this.userInstance.page.url()).toBe(expectedURL);
  }

  /**
   * Navigates to and plays an exploration by its ID.
   * @param {string} baseUrl - The base URL of the Oppia instance.
   * @param {string | null} explorationId - The ID of the exploration to play.
   */
  async playExploration(
    baseUrl: string,
    explorationId: string | null
  ): Promise<void> {
    await this.userInstance.goto(
      `${baseUrl}/explore/${explorationId as string}`
    );
  }
}
