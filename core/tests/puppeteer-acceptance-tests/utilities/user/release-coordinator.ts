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
 * @fileoverview Release coordinator users utility file.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const releaseCoordinatorUrl = testConstants.URLs.ReleaseCoordinator;
const splashUrl = testConstants.URLs.splash;

const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';
const mobileMiscTab = '.e2e-test-misc-tab-mobile';
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';
const featureFlagDiv = '.e2e-test-feature-flag';
const featureFlagOptionSelector = '.e2e-test-value-selector';
const featureFlagNameSelector = '.e2e-test-feature-name';
const saveFeatureFlagButtonSelector = '.e2e-test-save-button';

const navbarElementSelector = '.oppia-clickable-navbar-element';
const promoBarToggleSelector = '#mat-slide-toggle-1';
const promoMessageInputSelector = '.mat-input-element';
const actionStatusMessageSelector = '.e2e-test-status-message';
const toastMessageSelector = '.toast-message';
const memoryCacheProfileTableSelector = '.view-results-table';

export class ReleaseCoordinator extends BaseUser {
  /**
   * Navigates to the release coordinator page.
   */
  async navigateToReleaseCoordinatorPage(): Promise<void> {
    await this.page.goto(releaseCoordinatorUrl);
  }

  /**
   * Navigates to the Misc tab.
   */
  async navigateToMiscTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavBar);
      await this.page.waitForSelector(mobileMiscTab, {visible: true});
      await this.clickOn(mobileMiscTab);
    } else {
      await this.page.waitForSelector(navbarElementSelector);
      const navbarElements = await this.page.$$(navbarElementSelector);
      await this.waitForElementToBeClickable(navbarElements[2]);
      await navbarElements[2].click();
    }
  }

  /**
   * Enable specified feature flag from the release coordinator page.
   */
  async enableFeatureFlag(featureName: string): Promise<void> {
    await this.goto(releaseCoordinatorUrl);
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavBar);
      await this.clickOn(mobileFeaturesTab);
    } else {
      await this.clickOn(featuresTab);
    }

    await this.page.waitForSelector(featureFlagDiv);
    const featureFlagIndex = await this.page.evaluate(
      (featureFlagDiv, featureName, featureFlagNameSelector) => {
        const featureFlagDivs = Array.from(
          document.querySelectorAll(featureFlagDiv)
        );

        for (let i = 0; i < featureFlagDivs.length; i++) {
          if (
            featureFlagDivs[i]
              .querySelector(featureFlagNameSelector)
              ?.textContent?.trim() === featureName
          ) {
            return i;
          }
        }
      },
      featureFlagDiv,
      featureName,
      featureFlagNameSelector
    );

    /**
     * We enable the flag through the yes/no dropdown with this method because the event doesn't propagate
     * otherwise and no further changes are made to the DOM, even though the option is selected.
     */
    await this.page.evaluate(
      (optionValue, selectElemSelector) => {
        const selectElem = document.querySelector(
          selectElemSelector
        ) as HTMLSelectElement | null;
        if (!selectElem) {
          console.error('Select element not found');
          return;
        }

        const option = Array.from(selectElem.options).find(
          opt => opt.textContent?.trim() === optionValue
        ) as HTMLOptionElement | undefined;
        if (!option) {
          console.error('Option not found');
          return;
        }

        option.selected = true;
        const event = new Event('change', {bubbles: true});
        selectElem.dispatchEvent(event);
      },
      'Yes',
      `.e2e-test-feature-flag-${featureFlagIndex} ${featureFlagOptionSelector}`
    );

    await this.clickOn(
      `.e2e-test-feature-flag-${featureFlagIndex} ${saveFeatureFlagButtonSelector}`
    );
    showMessage(
      `Feature flag: "${featureName}" has been enabled successfully.`
    );
  }

  /**
   * Enables the promo bar.
   */
  async enablePromoBar(): Promise<void> {
    await this.page.waitForSelector(promoBarToggleSelector);
    await this.clickOn(promoBarToggleSelector);
  }

  /**
   * Enters a message into the promo bar.
   * @param {string} promoMessage - The message to enter into the promo bar.
   */
  async enterPromoBarMessage(promoMessage: string): Promise<void> {
    await this.page.waitForSelector(promoMessageInputSelector);
    await this.page.type(promoMessageInputSelector, promoMessage);
  }

  /**
   * Saves the promo bar message.
   */
  async savePromoBarMessage(): Promise<void> {
    await this.clickOn(' Save changes ');
    await this.page.waitForSelector(actionStatusMessageSelector, {
      visible: true,
    });
    const statusMessage = await this.page.$eval(
      actionStatusMessageSelector,
      el => el.textContent
    );
    if (statusMessage === ' Success! ') {
      showMessage('Promo bar message saved successfully.');
    }
  }

  /**
   * Navigates to the splash page.
   */
  async navigateToSplash(): Promise<void> {
    await this.page.goto(splashUrl);
  }

  /**
   * Expects the promo message to be a certain value.
   * @param {string} expectedMessage - The expected promo message.
   */
  async expectPromoMessageToBe(expectedMessage: string): Promise<void> {
    await this.page.waitForSelector(toastMessageSelector, {visible: true});
    const actualMessage = await this.page.$eval(
      toastMessageSelector,
      el => el.textContent
    );
    expect(actualMessage).toEqual(expectedMessage);
    showMessage('Promo message is as expected.');
    return;
  }

  /**
   * Clicks on the 'Flush Cache' button.
   */
  async flushCache(): Promise<void> {
    await this.clickOn('Flush Cache');
  }

  /**
   * Waits for a success message to appear and checks if it matches the expected message.
   * @param {string} expectedMessage - The expected success message.
   */
  async expectSuccessMessage(expectedMessage: string): Promise<void> {
    await this.page.waitForSelector(actionStatusMessageSelector, {
      visible: true,
    });
    const actualMessage = await this.page.$eval(
      actionStatusMessageSelector,
      el => el.textContent?.trim()
    );
    if (actualMessage === expectedMessage.trim()) {
      showMessage('Action was successful.');
      return;
    }
    throw new Error(
      `Action failed. Actual message: "${actualMessage}", expected message: "${expectedMessage}"`
    );
  }

  /**
   * Clicks on the 'Get Memory Cache Profile' button and waits for the results table to appear.
   */
  async getMemoryCacheProfile(): Promise<void> {
    await this.clickOn('Get Memory Cache Profile');
    await this.page.waitForSelector(memoryCacheProfileTableSelector);
  }

  /**
   * Checks if the memory cache profile has the expected properties.
   * @param {string[]} expectedProperties - The properties that the memory cache profile is expected to have.
   */
  async expectCacheProfileToHaveProperties(
    expectedProperties: string[]
  ): Promise<void> {
    await this.page.waitForSelector(memoryCacheProfileTableSelector, {
      visible: true,
    });

    const memoryCacheProfile = await this.page.evaluate(() => {
      const cells = Array.from(
        document.querySelectorAll('.view-results-table tbody tr td')
      );
      const totalAllocatedInBytes = cells[0]?.textContent;
      const peakAllocatedInBytes = cells[1]?.textContent;
      const totalKeysStored = cells[2]?.textContent;

      return {totalAllocatedInBytes, peakAllocatedInBytes, totalKeysStored};
    });

    for (const prop of expectedProperties) {
      if (!memoryCacheProfile.hasOwnProperty(prop)) {
        throw new Error(
          `Expected memory cache profile to have property ${prop}`
        );
      }
    }

    if (
      Object.values(memoryCacheProfile).some(
        value => value === null || value === undefined
      )
    ) {
      throw new Error(
        'One or more properties of the memory cache profile are null or undefined'
      );
    }

    showMessage('Memory cache profile has all expected properties.');
  }

  /**
   * Checks if the 'totalKeysStored' property of the memory cache profile is less than a specified value.
   * @param {number} maxValue - The value that 'totalKeysStored' is expected to be less than.
   */
  async expectTotalKeysStoredToBeLessThan(maxValue: number): Promise<void> {
    await this.page.waitForSelector(memoryCacheProfileTableSelector, {
      visible: true,
    });

    const totalKeysStored = await this.page.evaluate(() => {
      const cells = Array.from(
        document.querySelectorAll('.view-results-table tbody tr td')
      );
      const totalKeysStoredText = cells[2]?.textContent;
      return totalKeysStoredText ? parseInt(totalKeysStoredText, 10) : null;
    });

    if (totalKeysStored === null) {
      throw new Error('totalKeysStored is null');
    } else if (totalKeysStored >= maxValue) {
      throw new Error(
        `Expected totalKeysStored to be less than ${maxValue}, but it was ${totalKeysStored}`
      );
    }
  }
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
