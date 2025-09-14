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

import puppeteer, {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const releaseCoordinatorUrl = testConstants.URLs.ReleaseCoordinator;

// Selectors for buttons.
const copyOutputButton = '.e2e-test-copy-output-button';
const startNewJobButton = '.job-start-button';
const startNewJobConfirmationButton = '.e2e-test-start-new-job-button';

// Selectors for tabs.
const splashUrl = testConstants.URLs.splash;

const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';
const beamJobsTab = '.e2e-test-beam-jobs';
const mobileBeamJobsTab = '.e2e-test-beam-jobs-mobile';
const beamJobsTabContainerSelector = 'oppia-beam-jobs-tab';

// Selectors for mobile navigation.
const mobileMiscTab = '.e2e-test-misc-tab-mobile';
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';

// Selectors for feature flags.
const saveButtonSelector = '.e2e-test-save-button';
const featureFlagNameSelector = '.e2e-test-feature-name';
const featureFlagDiv = '.e2e-test-feature-flag';
const rolloutPercentageInputSelector = '.e2e-test-editor-int';
const featureFlagSelector = '.e2e-test-feature-flag';
const enableFeatureSelector = '.e2e-test-value-selector';

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
const getMemoryCacheProfileButton = '.e2e-test-get-memory-cache-profile';

const miscTabContainerSelector =
  '.e2e-test-release-coordiator-misc-tab-container';
const promoBarSaveButtonSelector =
  '.e2e-test-release-coordinator-promo-bar-button';
const beamJobCloseOuputButtonSelector = '.e2e-test-close-beam-job-output';
const addUserGroupContainerSelector = '.e2e-test-add-user-group-container';
const userGroupItemSelector = '.e2e-test-user-group-item';
const userGroupCreateErrorSelector = '.e2e-test-user-group-save-error';
const removeUserGroupButtonSelector = '.e2e-test-remove-user-group-button';
const beamJobsTableSelector = '.e2e-test-beam-jobs-table';
const beamJobStatusSelectorPrefix = '.e2e-test-job-status-';

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
        await this.expectElementToBeVisible(mobileNavBar);
        await this.clickOn(mobileNavBar);
        await this.clickOn(mobileFeaturesTab);
      } else {
        await this.expectElementToBeVisible(featuresTab);
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
   * Navigates to the beam jobs tab.
   */
  async navigateToBeamJobsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileNavBar);
      await this.clickOn(mobileNavBar);
      await this.clickOn(mobileBeamJobsTab);
    } else {
      await this.expectElementToBeVisible(beamJobsTab);
      await this.clickOn(beamJobsTab);
    }

    await this.expectElementToBeVisible(beamJobsTabContainerSelector);
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

    await this.expectElementToBeVisible(miscTabContainerSelector);
  }

  /**
   * This function edits the rollout percentage for a specific feature flag.
   * @param {string} featureName - The name of the feature flag to edit.
   * @param {number} percentage - The rollout percentage to set for the feature flag.
   */
  async editFeatureRolloutPercentage(
    featureName: string,
    percentage: number
  ): Promise<void> {
    try {
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

      await this.page.waitForSelector(featureFlagDiv);
      const featureFlags = await this.page.$$(featureFlagDiv);

      for (let i = 0; i < featureFlags.length; i++) {
        await featureFlags[i].waitForSelector(featureFlagNameSelector);
        const featureFlagNameElement = await featureFlags[i].$(
          featureFlagNameSelector
        );
        const featureFlagName = await this.page.evaluate(
          element => element.textContent.trim(),
          featureFlagNameElement
        );

        if (featureFlagName === featureName) {
          await featureFlags[i].waitForSelector(rolloutPercentageInputSelector);
          const inputElement = await featureFlags[i].$(
            rolloutPercentageInputSelector
          );
          if (inputElement) {
            // Select all the text in the input field and delete it.
            await inputElement.click({clickCount: 3});
            await this.page.keyboard.press('Backspace');
            await inputElement.type(percentage.toString());
          } else {
            throw new Error(
              `Input field not found for feature flag: "${featureName}"`
            );
          }

          await featureFlags[i].waitForSelector(saveButtonSelector);
          const saveButton = await featureFlags[i].$(saveButtonSelector);
          if (saveButton) {
            await this.waitForElementToBeClickable(saveButton);
            await saveButton.click();
          } else {
            throw new Error(
              `Save button not found for feature flag: "${featureName}"`
            );
          }

          await featureFlags[i].waitForSelector(
            `${saveButtonSelector}[disabled]`,
            {visible: true}
          );
          showMessage(
            `Feature flag: "${featureName}" rollout percentage has been set to ${percentage}%.`
          );
          return;
        }
      }

      throw new Error(`Feature flag: "${featureName}" not found.`);
    } catch (error) {
      console.error(
        `Failed to edit feature flag: "${featureName}". Error: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Checks if the force enabled status of a feature flag is as expected.
   * @param {string} featureFlag - The name of the feature flag to expect.
   * @param {boolean} forceEnabled - The expected force enabled status of the feature flag.
   */
  async expectFeatureFlagForcedEnabledStatusToBe(
    featureFlag: string,
    forceEnabled: boolean
  ): Promise<void> {
    const featureFlagDiv = await this.expectFeatureFlagToBePresent(featureFlag);
    const forceEnabledElement = await featureFlagDiv.$(enableFeatureSelector);

    if (!forceEnabledElement) {
      throw new Error('Force enabled element not found.');
    }

    const forceEnabledSelectValue = await forceEnabledElement.evaluate(
      el => (el as HTMLSelectElement).value
    );

    expect(forceEnabledSelectValue).toBe(forceEnabled ? '0: true' : '1: false');
  }

  /**
   * This function enables a specific feature flag.
   * @param {string} featureName - The name of the feature flag to enable.
   * @param {boolean} enable - Whether to enable or disable the feature flag.
   */
  async enableFeatureFlag(
    featureName: string,
    enable: boolean = true
  ): Promise<void> {
    try {
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

      await this.page.waitForSelector(featureFlagDiv);
      const featureFlags = await this.page.$$(featureFlagDiv);

      for (let i = 0; i < featureFlags.length; i++) {
        await featureFlags[i].waitForSelector(featureFlagNameSelector);
        const featureFlagNameElement = await featureFlags[i].$(
          featureFlagNameSelector
        );
        const featureFlagName = await this.page.evaluate(
          element => element.textContent.trim(),
          featureFlagNameElement
        );

        if (featureFlagName === featureName) {
          await featureFlags[i].waitForSelector(enableFeatureSelector);
          const selectElement = await featureFlags[i].$(enableFeatureSelector);
          if (selectElement) {
            await selectElement.select(enable ? '0: true' : '1: false');
          } else {
            throw new Error(
              `Value selector not found for feature flag: "${featureName}"`
            );
          }

          await featureFlags[i].waitForSelector(saveButtonSelector);
          const saveButton = await featureFlags[i].$(saveButtonSelector);
          if (saveButton) {
            await this.waitForElementToBeClickable(saveButton);
            await saveButton.click();
          } else {
            throw new Error(
              `Save button not found for feature flag: "${featureName}"`
            );
          }

          await featureFlags[i].waitForSelector(
            `${saveButtonSelector}[disabled]`,
            {visible: true}
          );

          showMessage(
            `Feature flag: "${featureName}" has been enabled successfully.`
          );
          return;
        }
      }

      throw new Error(`Feature flag: "${featureName}" not found.`);
    } catch (error) {
      console.error(
        `Failed to enable feature flag: "${featureName}". Error: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Enables the promo bar.
   * @param {'enabled' | 'disabled'} expectedState - The expected state of the promo bar.
   */
  async togglePromoBar(
    expectedState: 'enabled' | 'disabled' = 'enabled'
  ): Promise<void> {
    await this.page.waitForSelector(promoBarToggleSelector);
    await this.clickOn(promoBarToggleSelector);

    await this.page.waitForFunction(
      (selector: string, checked: boolean) => {
        const element = document.querySelector(selector);
        return (element as HTMLInputElement)?.checked === checked;
      },
      {},
      `${promoBarToggleSelector} input`,
      expectedState === 'enabled'
    );
  }

  /**
   * Enters a message into the promo bar.
   * @param {string} promoMessage - The message to enter into the promo bar.
   */
  async enterPromoBarMessage(promoMessage: string): Promise<void> {
    await this.page.waitForSelector(promoMessageInputSelector);
    await this.page.type(promoMessageInputSelector, promoMessage);

    await this.expectElementToBeClickable(promoBarSaveButtonSelector);
  }

  /**
   * Saves the promo bar message.
   */
  async savePromoBarMessage(): Promise<void> {
    await this.clickOn(' Save changes ');
    await this.page.waitForSelector(actionStatusMessageSelector, {
      visible: true,
    });
    await this.expectTextContentToBe(actionStatusMessageSelector, 'Success!');
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
    await this.expectActionStatusMessageToBe('Success! Memory Cache Flushed.');
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
    await this.page.waitForSelector(getMemoryCacheProfileButton, {
      visible: true,
    });
    await this.waitForStaticAssetsToLoad();
    await this.page.evaluate(selector => {
      document.querySelector(selector).click();
    }, getMemoryCacheProfileButton);
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
   * @param {number} minValue - The value that 'totalKeysStored' is expected to be greater than.
   */
  async expectTotalKeysStoredToBeInRange(
    maxValue?: number,
    minValue?: number
  ): Promise<void> {
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
    }
    if (maxValue && totalKeysStored >= maxValue) {
      throw new Error(
        `Expected totalKeysStored to be less than ${maxValue}, but it was ${totalKeysStored}`
      );
    }
    if (minValue && totalKeysStored <= minValue) {
      throw new Error(
        `Expected totalKeysStored to be greater than ${minValue}, but it was ${totalKeysStored}`
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

    await this.expectElementToBeClickable(startNewJobConfirmationButton, false);
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

      await this.clickOn('View Output');
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
    await this.expectTextContentToContain(
      beamJobRunOutputSelector,
      expectedOutput
    );
  }

  /**
   * Closes the output modal.
   * @returns {Promise<void>}
   */
  async closeOutputModal(): Promise<void> {
    await this.expectElementToBeVisible(beamJobCloseOuputButtonSelector);
    await this.page.click(beamJobCloseOuputButtonSelector);
    await this.expectElementToBeVisible(beamJobCloseOuputButtonSelector, false);
    showMessage('Output modal closed');
  }

  /**
   * Expects the feature flag to be present in the features tab.
   * @param {string} featureFlag - The name of the feature flag to expect.
   */
  async expectFeatureFlagToBePresent(
    featureFlag: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(featureFlagNameSelector);
    const featureFlagNames = await this.page.$$eval(
      featureFlagNameSelector,
      elements => elements.map(element => element.textContent?.trim())
    );
    expect(featureFlagNames).toContain(featureFlag);

    await this.expectElementToBeVisible(featureFlagDiv);
    const featureFlagDivs = await this.page.$$(featureFlagDiv);
    let featureFlagDivElement: ElementHandle<Element> | null = null;
    for (const featureFlagDivElementElement of featureFlagDivs) {
      const featureFlagDivElementText =
        await featureFlagDivElementElement.$eval(featureFlagNameSelector, el =>
          el.textContent?.trim()
        );
      if (featureFlagDivElementText === featureFlag) {
        featureFlagDivElement = featureFlagDivElementElement;
        break;
      }
    }

    if (!featureFlagDivElement) {
      throw new Error(`Feature flag "${featureFlag}" not found.`);
    }

    return featureFlagDivElement;
  }

  /**
   * Checks if the rollout percentage input is enabled or disabled.
   * @param {string} featureFlag - The name of the feature flag to expect.
   * @param {'enabled' | 'disabled'} state - The expected state of the rollout percentage input.
   * @param {number} value - The expected value of the rollout percentage input.
   */
  async expectRolloutPercentageInputToBe(
    featureFlag: string,
    state: 'enabled' | 'disabled',
    value?: number
  ): Promise<void> {
    const featureFlagDiv = await this.expectFeatureFlagToBePresent(featureFlag);
    const rolloutPercentageInputElement = await featureFlagDiv.$(
      rolloutPercentageInputSelector
    );
    if (!rolloutPercentageInputElement) {
      throw new Error('Rollout percentage input not found.');
    }
    await this.page.waitForFunction(
      (selector: string, disabled: boolean, context: HTMLElement) => {
        const element = context.querySelector(selector);
        return (element as HTMLInputElement).disabled === disabled;
      },
      {
        timeout: 10000,
      },
      rolloutPercentageInputSelector,
      state === 'disabled',
      featureFlagDiv
    );

    if (value) {
      const rolloutPercentageInputValue =
        await rolloutPercentageInputElement.evaluate(
          el => (el as HTMLInputElement).value
        );
      expect(rolloutPercentageInputValue).toBe(value.toString());
    }
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

    try {
      await this.page.waitForSelector(agDummyFeatureIndicator, {timeout: 5000});

      if (!enabled) {
        throw new Error(
          'Dummy handler is expected to be disabled but it is enabled'
        );
      }
    } catch (error) {
      if (enabled) {
        throw new Error(
          'Dummy handler is expected to be enabled but it is disabled'
        );
      }
    }

    showMessage(
      `Dummy handler is ${enabled ? 'enabled' : 'disabled'}, as expected`
    );
  }

  /**
   * Checks if the user group is present in the user groups list.
   * @param {string} groupName - The name of the user group to check.
   * @param {boolean} present - Whether the user group is expected to be present.
   */
  async expectUserGroupToBePresent(
    groupName: string,
    present: boolean = true
  ): Promise<void> {
    await this.page.waitForFunction(
      (selector: string, groupName: string, present: boolean) => {
        const elements = document.querySelectorAll(selector);
        return (
          Array.from(elements).some(
            element => element.textContent?.trim() === groupName
          ) === present
        );
      },
      {},
      userGroupItemSelector,
      groupName,
      present
    );
  }

  /**
   * Adds a new user group with the given name.
   * @param {string} groupName - The name of the user group to add.
   */
  async addUserGroup(groupName: string): Promise<void> {
    const userGroupInputSelector = `${addUserGroupContainerSelector} input`;
    const addNewUserGroupButtonSelector = `${addUserGroupContainerSelector} button`;

    await this.expectElementToBeVisible(addUserGroupContainerSelector);
    await this.clearAllTextFrom(userGroupInputSelector);
    await this.type(userGroupInputSelector, groupName);
    await this.clickOn(addNewUserGroupButtonSelector);

    await this.expectUserGroupToBePresent(groupName);
  }

  /**
   * Deletes the user group with the given name.
   * @param {string} groupName - The name of the user group to delete.
   */
  async removeUserGroup(groupName: string): Promise<void> {
    await this.expectElementToBeVisible(userGroupItemSelector);
    const userGroupElements = await this.page.$$(userGroupItemSelector);
    const userGroupNames = await this.page.$$eval(
      userGroupItemSelector,
      elements => elements.map(element => element.textContent?.trim())
    );

    const index = userGroupNames.indexOf(groupName);

    if (index === -1) {
      throw new Error(`User group "${groupName}" not found.`);
    }

    const userGroupElement = userGroupElements[index];
    if (!userGroupElement) {
      throw new Error(`User group "${groupName}" not found.`);
    }
    await userGroupElement.click();
    const removeUserGroupButton = await userGroupElement.$(
      removeUserGroupButtonSelector
    );
    if (!removeUserGroupButton) {
      throw new Error('Remove user group button not found.');
    }
    await removeUserGroupButton.click();

    await this.expectUserGroupToBePresent(groupName, false);
  }

  /**
   * Checks if the user group creation error is present.
   * @param {string} errorMessage - The expected error message.
   */
  async expectUserGroupCreationErrorToBe(errorMessage: string): Promise<void> {
    await this.expectTextContentToContain(
      userGroupCreateErrorSelector,
      errorMessage
    );
  }

  /**
   * Checks if the job status is as expected.
   * @param {number} rowIndex - The 1-based index of the row to check.
   * @param {boolean} expectedStatus - The expected status of the job.
   */
  async expectJobStatusToBeSuccessful(
    rowIndex: number,
    expectedStatus: boolean
  ): Promise<void> {
    const beamJobRowSelector = `${beamJobsTableSelector} tbody tr:nth-child(${rowIndex})`;
    const rowElement = await this.page.waitForSelector(beamJobRowSelector);
    if (!rowElement) {
      throw new Error('Row element not found');
    }

    const statusSelector =
      expectedStatus === true
        ? beamJobStatusSelectorPrefix + 'success'
        : beamJobStatusSelectorPrefix + 'failure';

    await rowElement.waitForSelector(statusSelector, {visible: true});
  }
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
