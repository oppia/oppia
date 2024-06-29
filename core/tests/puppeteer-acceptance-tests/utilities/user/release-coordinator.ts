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

import puppeteer from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const releaseCoordinatorUrl = testConstants.URLs.ReleaseCoordinator;

// Selectors for buttons.
const copyOutputButton = '.e2e-test-copy-output-button';
const startNewJobButton = '.job-start-button';
const startNewJobConfirmationButton = '.e2e-test-start-new-job-button';
const saveFeatureFlagButtonSelector = '.e2e-test-save-button';

// Selectors for tabs.
const splashUrl = testConstants.URLs.splash;

const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';

// Selectors for mobile navigation.
const mobileMiscTab = '.e2e-test-misc-tab-mobile';
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';

// Selectors for feature flags.
const featureFlagDiv = '.e2e-test-feature-flag';
const featureFlagNameSelector = '.e2e-test-feature-name';
const featureFlagOptionSelector = '.e2e-test-value-selector';
const rolloutPercentageInput = '.e2e-test-editor-int';

// Selectors for jobs.
const jobInputField = '.mat-input-element';
const jobOutputRowSelector = '.mat-row';
const beamJobRunOutputSelector = '.beam-job-run-output';

const agDummyFeatureIndicator = '.e2e-test-angular-dummy-handler-indicator';

const navbarElementSelector = '.oppia-clickable-navbar-element';
const promoBarToggleSelector = '#mat-slide-toggle-1';
const promoMessageInputSelector = '.mat-input-element';
const actionStatusMessageSelector = '.e2e-test-status-message';
const toastMessageSelector = '.toast-message';
const memoryCacheProfileTableSelector = '.view-results-table';
const featureFlagSelector = '.e2e-test-feature-flag';
export class ReleaseCoordinator extends BaseUser {
  /**
   * Navigate to the release coordinator page.
   */
  async navigateToReleaseCoordinatorPage(): Promise<void> {
    await this.goto(releaseCoordinatorUrl);
  }

  /**
   * Navigate to the features tab.
   */
  async navigateToFeaturesTab(): Promise<void> {
    try {
      if (this.isViewportAtMobileWidth()) {
        await this.clickOn(mobileNavBar);
        await this.clickOn(mobileFeaturesTab);
      } else {
        await this.clickOn(featuresTab);
      }

      await this.page.waitForSelector(featureFlagSelector, {
        visible: true,
        timeout: 10000,
      });
      showMessage('Successfully navigated to features tab.');
    } catch (error) {
      console.error('Failed to navigate to features tab:', error);
      throw error;
    }
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
   * Edit the rollout percentage for a feature.
   */
  async editFeatureRolloutPercentage(
    featureName: string,
    percentage: number
  ): Promise<void> {
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

    // Find the input field for rollout percentage and set its value to the specified percentage.
    await this.page.waitForSelector(rolloutPercentageInput);
    await this.page.evaluate(
      (percentage, inputSelector) => {
        const inputElem = document.querySelector(
          inputSelector
        ) as HTMLInputElement | null;
        if (!inputElem) {
          console.error('Input element not found');
          return;
        }

        inputElem.value = percentage.toString();
        const event = new Event('input', {bubbles: true});
        inputElem.dispatchEvent(event);
      },
      percentage,
      `.e2e-test-feature-flag-${featureFlagIndex} ${rolloutPercentageInput}`
    );

    await this.clickOn(
      `.e2e-test-feature-flag-${featureFlagIndex} ${saveFeatureFlagButtonSelector}`
    );
    showMessage(
      `Feature flag: "${featureName}" rollout percentage has been set to ${percentage}%.`
    );
  }

  /**
   * Enable specified feature flag from the release coordinator page.
   */
  async enableFeatureFlag(featureName: string): Promise<void> {
    await this.goto(releaseCoordinatorUrl);

    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileNavBar);
      await this.clickOn(mobileNavBar);
      await this.page.waitForSelector(mobileFeaturesTab);
      await this.clickOn(mobileFeaturesTab);
    } else {
      await this.page.waitForSelector(featuresTab);
      await this.clickOn(featuresTab);
    }

    await this.page.waitForTimeout(10000);
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
        throw new Error(`Feature flag: "${featureName}" not found.`);
      },
      featureFlagDiv,
      featureName,
      featureFlagNameSelector
    );

    await this.page.waitForSelector(
      `.e2e-test-feature-flag-${featureFlagIndex} ${featureFlagOptionSelector}`
    );
    await this.page.evaluate(
      (optionValue, selectElemSelector) => {
        const selectElem = document.querySelector(
          selectElemSelector
        ) as HTMLSelectElement | null;
        if (!selectElem) {
          throw new Error('Select element not found');
        }

        const option = Array.from(selectElem.options).find(
          opt => opt.textContent?.trim() === optionValue
        ) as HTMLOptionElement | undefined;
        if (!option) {
          throw new Error('Option not found');
        }

        option.selected = true;
        const event = new Event('change', {bubbles: true});
        selectElem.dispatchEvent(event);
      },
      'Yes',
      `.e2e-test-feature-flag-${featureFlagIndex} ${featureFlagOptionSelector}`
    );

    await this.page.waitForSelector(
      `.e2e-test-feature-flag-${featureFlagIndex} ${saveFeatureFlagButtonSelector}`
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

  /**
   * Selects and runs a job.
   * @param {string} jobName - The name of the job to run.
   */
  async selectAndRunJob(jobName: string): Promise<void> {
    await this.page.waitForSelector(jobInputField, {visible: true});
    await this.type(jobInputField, jobName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForSelector(startNewJobButton, {visible: true});
    await this.page.evaluate(selector => {
      const element = document.querySelector(selector) as HTMLElement;
      element?.click();
    }, startNewJobButton);
    await this.page.waitForSelector(startNewJobConfirmationButton, {
      visible: true,
    });
    await this.page.evaluate(selector => {
      const element = document.querySelector(selector) as HTMLElement;
      element?.click();
    }, startNewJobConfirmationButton);
    showMessage('Job started');
  }

  /**
   * Waits for a job to complete.
   */
  async waitForJobToComplete(): Promise<void> {
    try {
      // Adjust the timeout as needed. Some jobs may take longer to complete.
      await this.page.waitForSelector(jobOutputRowSelector, {
        visible: true,
      });
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        const newError = new Error('Job did not complete within 30 seconds');
        newError.stack = error.stack;
        throw newError;
      }
      throw error;
    }
    showMessage('Job completed');
  }

  /**
   * Views and copies the output of a job.
   */
  async viewAndCopyJobOutput(): Promise<string> {
    try {
      // OverridePermissions is used to allow clipboard access.
      const context = await this.browserObject.defaultBrowserContext();
      await context.overridePermissions('http://localhost:8181', [
        'clipboard-read',
        'clipboard-write',
      ]);
      const pages = await this.browserObject.pages();
      this.page = pages[pages.length - 1];

      await this.clickOn(' View Output ');
      await this.page.waitForSelector(beamJobRunOutputSelector, {
        visible: true,
      });

      // Getting the output text directly from the element.
      const output = await this.page.$eval(
        beamJobRunOutputSelector,
        el => el.textContent
      );

      await this.clickOn(copyOutputButton);

      // Reading the clipboard data.
      const clipboardData = await this.page.evaluate(async () => {
        return await navigator.clipboard.readText();
      });

      if (clipboardData !== output) {
        throw new Error('Data was not copied correctly');
      }
      showMessage('Data was copied correctly');

      return output;
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }

  /**
   * Expects the output of a job to be a certain value.
   * @param {string} expectedOutput - The expected output of the job.
   */
  async expectJobOutputToBe(expectedOutput: string): Promise<void> {
    try {
      await this.page.waitForSelector(beamJobRunOutputSelector, {
        visible: true,
      });
      const actualOutput = await this.page.$eval(
        beamJobRunOutputSelector,
        el => el.textContent
      );
      if (!actualOutput) {
        throw new Error('Output element is empty or not found.');
      }

      if (actualOutput === expectedOutput) {
        showMessage('Output is as expected');
      } else {
        throw new Error(`Output is not as expected. Expected: ${expectedOutput} 
        Actual: ${actualOutput}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }

  /**
   * Closes the output modal.
   * @returns {Promise<void>}
   */
  async closeOutputModal(): Promise<void> {
    await this.clickOn('Close');
    showMessage('Output modal closed');
  }

  /**
   * Verifies the status of the Dummy Handler in the Features Tab.
   * If true, the function will verify that the Dummy Handler is enabled.
   * If false, it will verify that the Dummy Handler is disabled.
   * @param {boolean} enabled - Expected status of the Dummy Handler.
   */

  async verifyDummyHandlerStatusInFeaturesTab(enabled: boolean): Promise<void> {
    await this.navigateToReleaseCoordinatorPage();
    await this.navigateToFeaturesTab();
    await this.page.screenshot({path: 'screenshot.png'});
    const dummyHandlerElement = await this.page.evaluate(selector => {
      return document.querySelector(selector) !== null;
    }, agDummyFeatureIndicator);

    if (enabled && !dummyHandlerElement) {
      throw new Error(
        'Dummy handler is expected to be enabled but it is disabled'
      );
    }

    if (!enabled && dummyHandlerElement) {
      throw new Error(
        'Dummy handler is expected to be disabled but it is enabled'
      );
    }

    showMessage(
      `Dummy handler is ${enabled ? 'enabled' : 'disabled'}, as expected`
    );
  }
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
