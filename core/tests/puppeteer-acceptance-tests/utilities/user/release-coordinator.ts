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

import * as puppeteer from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const releaseCoordinatorUrl = testConstants.URLs.ReleaseCoordinator;
const learnerDashboardUrl = testConstants.URLs.LearnerDashboard;
const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';
const featureFlagDiv = '.e2e-test-feature-flag';
const featureFlagOptionSelector = '.e2e-test-value-selector';
const featureFlagNameSelector = '.e2e-test-feature-name';
const saveFeatureFlagButtonSelector = '.e2e-test-save-button';

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
      `.e2e-test-feature-flag-${featureFlagIndex} .e2e-test-editor-int`
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
   * Check if the redesigned learner dashboard feature is enabled.
   */
  async expectNewDesignInLearnerDashboard(enabled: boolean): Promise<void> {
    await this.goto(learnerDashboardUrl);
    const newSideBar = await this.page.$('.oppia-learner-dash-sidebar_pic');
    if (newSideBar && enabled) {
      showMessage('New design in learner dashboard is enabled.');
    } else {
      throw new Error('New design in learner dashboard is not enabled.');
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
   * Selects and runs a job.
   * @param {string} jobName - The name of the job to run.
   */
  async selectAndRunJob(jobName: string): Promise<void> {
    await this.type('.mat-input-element', jobName);
    await this.clickOn('.mat-option-text');
    await this.clickOn('.job-start-button');
    await this.clickOn(' Start New Job ');
  }

  /**
   * Waits for a job to complete.
   */
  async waitForJobToComplete(): Promise<void> {
    // Waiting for 30 seconds for the job to complete. However, if some job takes longer,
    // than the default timeout of the function below can be increased.
    try {
      await this.page.waitForFunction(() => {
        const regex = new RegExp('\\bView Output\\b');
        return regex.test(document.documentElement.outerHTML);
      }, {});
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        const newError = new Error('Job did not complete within 30 seconds');
        newError.stack = error.stack;
        throw newError;
      }
      throw error;
    }
  }

  /**
   * Views and copies the output of a job.
   */
  async viewAndCopyJobOutput(): Promise<string> {
    await this.clickOn(' View Output ');
    await this.page.waitForSelector('.mat-row');
    const output = await this.page.$eval('.mat-row', el => el.textContent);
    await this.clickOn(' Copy Output ');

    // Read the clipboard data.
    const clipboardData = await this.page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    if (clipboardData !== output) {
      throw new Error('Data was not copied correctly');
    }
    showMessage('Data was copied correctly');

    return output;
  }

  /**
   * Expects the output of a job to be a certain value.
   * @param {string} expectedOutput - The expected output of the job.
   */
  async expectJobOutputToBe(expectedOutput: string): Promise<void> {
    await this.page.waitForSelector('.mat-row');
    const actualOutput = await this.page.$eval(
      '.mat-row',
      el => el.textContent
    );
    expect(actualOutput).toEqual(expectedOutput);
    showMessage('Output is as expected');
  }

  /**
   * Closes the output modal.
   * @returns {Promise<void>}
   */
  async closeOutputModal(): Promise<void> {
    await this.clickOn(' Close ');
  }
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
