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
const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';

// Selectors for mobile navigation.
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

const e2eTestAngularDummyHandlerIndicator =
  '.e2e-test-angular-dummy-handler-indicator';
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
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavBar);
      await this.clickOn(mobileFeaturesTab);
    } else {
      await this.clickOn(featuresTab);
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

    // Save the changes.
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

  async verifyDummyHandlerStatusInFeaturesTab(enabled: boolean): Promise<void> {
    await this.page.reload({waitUntil: ['load', 'networkidle0']});
    try {
      const dummyHandlerExists =
        (await this.page.$(e2eTestAngularDummyHandlerIndicator)) !== null;

      if (enabled) {
        if (!dummyHandlerExists) {
          throw new Error(
            'Dummy handler is expected to be enabled but it is disabled'
          );
        }
        showMessage('Dummy handler is enabled');
      } else {
        if (dummyHandlerExists) {
          throw new Error(
            'Dummy handler is expected to be disabled but it is enabled'
          );
        }
        showMessage('Dummy handler is disabled');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
