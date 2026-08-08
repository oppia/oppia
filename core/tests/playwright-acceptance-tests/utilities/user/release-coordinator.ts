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
 * @fileoverview Release coordinator users utility file.
 */

import {ElementHandle, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const releaseCoordinatorUrl = testConstants.URLs.ReleaseCoordinator;

// Selectors for tabs.
const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';
const beamJobsTab = '.e2e-test-beam-jobs';
const mobileBeamJobsTab = '.e2e-test-beam-jobs-mobile';
const beamJobsTabContainerSelector = 'oppia-beam-jobs-tab';

// Selectors for mobile navigation.
const mobileMiscTab = '.e2e-test-misc-tab-mobile';
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';
const navbarElementSelector = '.oppia-clickable-navbar-element';

// Selectors for feature flags.
const saveButtonSelector = '.e2e-test-save-button';
const featureFlagNameSelector = '.e2e-test-feature-name';
const featureFlagDiv = '.e2e-test-feature-flag';
const featureFlagSelector = '.e2e-test-feature-flag';
const enableFeatureSelector = '.e2e-test-value-selector';
const rolloutPercentageInputSelector = '.e2e-test-editor-int';
const agDummyFeatureIndicator = '.e2e-test-angular-dummy-handler-indicator';

// Selectors for jobs.
const jobInputField = '.mat-input-element';
const jobOutputRowSelector = '.mat-row';
const startNewJobButton = '.job-start-button';
const startNewJobConfirmationButton = '.e2e-test-start-new-job-button';
const beamJobOutputDialogSelector = '.e2e-test-view-beam-job-output-dialog';
const beamJobCloseOuputButtonSelector = '.e2e-test-close-beam-job-output';
const copyOutputButton = '.e2e-test-copy-output-button';
const beamJobRunOutputSelector = '.beam-job-run-output';
const beamJobsTableSelector = '.e2e-test-beam-jobs-table';
const beamJobStatusSelectorPrefix = '.e2e-test-job-status-';

// Selectors for the promo bar.
const promoBarToggleSelector = '#mat-slide-toggle-1';
const promoMessageInputSelector = '.mat-input-element';
const actionStatusMessageSelector = '.e2e-test-status-message';
const promoBarSaveButtonSelector =
  '.e2e-test-release-coordinator-promo-bar-button';

// Selectors for the memory cache profile.
const memoryCacheProfileTableSelector = '.view-results-table';
const getMemoryCacheProfileButton = '.e2e-test-get-memory-cache-profile';

// Selectors for user groups.
const miscTabContainerSelector =
  '.e2e-test-release-coordiator-misc-tab-container';
const addUserGroupContainerSelector = '.e2e-test-add-user-group-container';
const userGroupItemSelector = '.e2e-test-user-group-item';
const userGroupCreateErrorSelector = '.e2e-test-user-group-save-error';
const removeUserGroupButtonSelector = '.e2e-test-remove-user-group-button';

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
      await this.expectElementToBeVisible(mobileNavBar);
      await this.clickOnElementWithSelector(mobileNavBar);
      await this.clickOnElementWithSelector(mobileFeaturesTab);
    } else {
      await this.expectElementToBeVisible(featuresTab);
      await this.clickOnElementWithSelector(featuresTab);
    }

    await this.expectElementToBeVisible(featureFlagSelector);
    showMessage('Successfully navigated to features tab.');
  }

  /**
   * Navigates to the beam jobs tab.
   */
  async navigateToBeamJobsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileNavBar);
      await this.clickOnElementWithSelector(mobileNavBar);
      await this.clickOnElementWithSelector(mobileBeamJobsTab);
    } else {
      await this.expectElementToBeVisible(beamJobsTab);
      await this.clickOnElementWithSelector(beamJobsTab);
    }

    await this.expectElementToBeVisible(beamJobsTabContainerSelector);
  }

  /**
   * Navigates to the Misc tab.
   */
  async navigateToMiscTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.expectElementToBeVisible(mobileNavBar);
      await this.clickOnElementWithSelector(mobileNavBar);
      await this.clickOnElementWithSelector(mobileMiscTab);
    } else {
      await this.clickOnElementWithSelectorAndText(
        navbarElementSelector,
        'Misc'
      );
    }

    await this.expectElementToBeVisible(miscTabContainerSelector);
  }

  /**
   * Finds the feature flag div for the given feature flag name.
   * @param {string} featureName - The name of the feature flag to find.
   * @returns {Promise<ElementHandle<Element>>} The feature flag div element.
   */
  private async findFeatureFlagDiv(
    featureName: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(featureFlagDiv);
    const featureFlags = await this.page.$$(featureFlagDiv);

    for (const featureFlagDivElement of featureFlags) {
      const featureFlagNameElement = await this.getElementInParent(
        featureFlagNameSelector,
        featureFlagDivElement
      );
      const featureFlagName = await this.getTextContent(featureFlagNameElement);

      if (featureFlagName === featureName) {
        return featureFlagDivElement;
      }
    }

    throw new Error(`Feature flag: "${featureName}" not found.`);
  }

  /**
   * Expects the feature flag to be present in the features tab.
   * @param {string} featureFlag - The name of the feature flag to expect.
   * @returns {Promise<ElementHandle<Element>>} The feature flag div element.
   */
  async expectFeatureFlagToBePresent(
    featureFlag: string
  ): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(featureFlagNameSelector);
    const featureFlagNames = await this.page.$$eval(
      featureFlagNameSelector,
      elements => elements.map(element => element.textContent?.trim())
    );
    if (!featureFlagNames.includes(featureFlag)) {
      throw new Error(`Feature flag "${featureFlag}" not found.`);
    }

    return this.findFeatureFlagDiv(featureFlag);
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
    const featureFlagDivElement =
      await this.expectFeatureFlagToBePresent(featureFlag);
    const forceEnabledElement = await this.getElementInParent(
      enableFeatureSelector,
      featureFlagDivElement
    );
    await this.expectElementValueToBe(
      forceEnabledElement,
      forceEnabled ? '0: true' : '1: false'
    );
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
    const featureFlagDivElement =
      await this.expectFeatureFlagToBePresent(featureFlag);
    const rolloutPercentageInputElement = await this.getElementInParent(
      rolloutPercentageInputSelector,
      featureFlagDivElement
    );
    await this.page.waitForFunction(
      ({element, disabled}: {element: Element; disabled: boolean}) => {
        return (element as HTMLInputElement).disabled === disabled;
      },
      {element: rolloutPercentageInputElement, disabled: state === 'disabled'},
      {timeout: 10000}
    );

    if (value) {
      await this.expectElementValueToBe(
        rolloutPercentageInputElement,
        value.toString()
      );
    }
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
      await this.navigateToReleaseCoordinatorPage();
      await this.navigateToFeaturesTab();

      const featureFlagDivElement = await this.findFeatureFlagDiv(featureName);
      const selectElement = await this.getElementInParent(
        enableFeatureSelector,
        featureFlagDivElement
      );
      await selectElement.selectOption(enable ? '0: true' : '1: false');

      const saveButton = await this.getElementInParent(
        saveButtonSelector,
        featureFlagDivElement
      );
      await this.clickOnElement(saveButton);

      await this.expectElementToBeVisible(`${saveButtonSelector}[disabled]`);

      showMessage(
        `Feature flag: "${featureName}" has been enabled successfully.`
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Failed to enable feature flag: "${featureName}". Error: ${err.message}`
      );
      throw err;
    }
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
    await this.navigateToReleaseCoordinatorPage();
    await this.navigateToFeaturesTab();

    const featureFlagDivElement = await this.findFeatureFlagDiv(featureName);
    const inputElement = await this.getElementInParent(
      rolloutPercentageInputSelector,
      featureFlagDivElement
    );

    // Select all the text in the input field and delete it.
    await inputElement.click({clickCount: 3});
    await this.page.keyboard.press('Backspace');
    await inputElement.type(percentage.toString());

    const saveButton = await this.getElementInParent(
      saveButtonSelector,
      featureFlagDivElement
    );
    await this.clickOnElement(saveButton);

    await this.expectElementToBeVisible(`${saveButtonSelector}[disabled]`);
    showMessage(
      `Feature flag: "${featureName}" rollout percentage has been set to ${percentage}%.`
    );
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

    await this.expectElementToBeVisible(agDummyFeatureIndicator, enabled);
    showMessage(
      `Dummy handler is ${enabled ? 'enabled' : 'disabled'}, as expected`
    );
  }

  /**
   * Enables the promo bar.
   * @param {'enabled' | 'disabled'} expectedState - The expected state of the promo bar.
   */
  async togglePromoBar(
    expectedState: 'enabled' | 'disabled' = 'enabled'
  ): Promise<void> {
    await this.expectElementToBeVisible(promoBarToggleSelector);
    await this.clickOnElementWithSelector(promoBarToggleSelector);

    await this.page.waitForFunction(
      ({selector, checked}: {selector: string; checked: boolean}) => {
        const element = document.querySelector(selector);
        return (element as HTMLInputElement)?.checked === checked;
      },
      {
        selector: `${promoBarToggleSelector} input`,
        checked: expectedState === 'enabled',
      }
    );
  }

  /**
   * Enters a message into the promo bar.
   * @param {string} promoMessage - The message to enter into the promo bar.
   */
  async enterPromoBarMessage(promoMessage: string): Promise<void> {
    await this.expectElementToBeVisible(promoMessageInputSelector);
    await this.typeInInputField(promoMessageInputSelector, promoMessage);

    await this.expectElementToBeClickable(promoBarSaveButtonSelector);
  }

  /**
   * Saves the promo bar message.
   */
  async savePromoBarMessage(): Promise<void> {
    await this.clickOnElementWithText('Save changes');
    await this.expectElementToBeVisible(actionStatusMessageSelector);
    await this.expectActionStatusMessageToBe('Success!');
  }

  /**
   * Waits for a progress message to disappear from the action status message.
   * @param {string} progressMessage - The processing message to wait for.
   */
  async waitForProgressMessageDisappear(
    progressMessage: string
  ): Promise<void> {
    const maxWaitTime = 10000; // 10 seconds.
    const pollInterval = 500; // 500ms.
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const currentMessage = await this.getTextContent(
        actionStatusMessageSelector
      );

      // If the current message doesn't contain the processing message, we're done.
      if (!currentMessage?.includes(progressMessage)) {
        return;
      }

      // Wait before checking again.
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // If we get here, processing didn't complete within the timeout.
    throw new Error(
      `Progress message "${progressMessage}" did not disappear within ${maxWaitTime}ms`
    );
  }

  /**
   * Verifies that the action status message matches the expected message.
   * @param {string} statusMessage - The expected status message to check for.
   * @param {string} progressMessage - Optional processing message to wait for before checking the expected message.
   */
  async expectActionStatusMessageToBe(
    statusMessage: string,
    progressMessage?: string
  ): Promise<void> {
    // If progressMessage is provided, wait for it to disappear.
    if (progressMessage) {
      await this.waitForProgressMessageDisappear(progressMessage);
    }

    await this.expectElementToBeVisible(actionStatusMessageSelector);
    await this.expectTextContentToContain(
      actionStatusMessageSelector,
      statusMessage
    );
  }

  /**
   * Waits for a success message to appear and checks if it matches the expected message.
   * @param {string} expectedMessage - The expected success message.
   */
  async expectSuccessMessage(expectedMessage: string): Promise<void> {
    await this.expectActionStatusMessageToBe(expectedMessage);
    showMessage('Action was successful.');
  }

  /**
   * Clicks on the 'Flush Cache' button.
   */
  async flushCache(): Promise<void> {
    await this.clickOnElementWithText('Flush Cache');
    await this.expectActionStatusMessageToBe('Success! Memory Cache Flushed.');
  }

  /**
   * Clicks on the 'Get Memory Cache Profile' button and waits for the results table to appear.
   */
  async getMemoryCacheProfile(): Promise<void> {
    await this.expectElementToBeVisible(getMemoryCacheProfileButton);
    await this.waitForStaticAssetsToLoad();
    await this.clickOnElementWithSelector(getMemoryCacheProfileButton);
    await this.expectElementToBeVisible(memoryCacheProfileTableSelector);
  }

  /**
   * Checks if the 'totalKeysStored' property of the memory cache profile is in the given range.
   * @param {number} maxValue - The value that 'totalKeysStored' is expected to be less than.
   * @param {number} minValue - The value that 'totalKeysStored' is expected to be greater than.
   */
  async expectTotalKeysStoredToBeInRange(
    maxValue?: number,
    minValue?: number
  ): Promise<void> {
    await this.expectElementToBeVisible(memoryCacheProfileTableSelector);

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
    await this.expectElementToBeVisible(jobInputField);
    await this.clearAllTextFrom(jobInputField);
    await this.typeInInputField(jobInputField, jobName);
    await this.page.keyboard.press('Enter');

    await this.expectElementToBeVisible(startNewJobButton);
    await this.clickOnElementWithSelector(startNewJobButton);

    await this.expectElementToBeVisible(startNewJobConfirmationButton);
    await this.clickOnElementWithSelector(startNewJobConfirmationButton);

    await this.expectElementToBeClickable(startNewJobConfirmationButton, false);
    showMessage('Job started');
  }

  /**
   * Waits for a job to complete.
   */
  async waitForJobToComplete(): Promise<void> {
    await this.expectElementToBeVisible(jobOutputRowSelector);
    showMessage('Job completed');
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
    const rowElement = await this.expectElementToBeVisible(beamJobRowSelector);
    if (!rowElement) {
      throw new Error('Row element not found');
    }

    const statusSelector =
      expectedStatus === true
        ? beamJobStatusSelectorPrefix + 'success'
        : beamJobStatusSelectorPrefix + 'failure';

    await this.getElementInParent(statusSelector, rowElement);
  }

  /**
   * Clicks on "View Output" of the latest beam job run.
   */
  async viewJobOutput(): Promise<void> {
    await this.clickOnElementWithText('View Output');
    await this.expectElementToBeVisible(beamJobOutputDialogSelector);
  }

  /**
   * View and copy the output of a job.
   * @returns {Promise<string>} The output of the job.
   */
  async viewAndCopyJobOutput(): Promise<string> {
    await this.viewJobOutput();
    await this.expectElementToBeVisible(beamJobRunOutputSelector);

    // Grant clipboard permissions so that the copy operation can be verified.
    await this.page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);

    const output = await this.getTextContent(beamJobRunOutputSelector);

    await this.clickOnElementWithSelector(copyOutputButton);

    // Read the clipboard data.
    const clipboardData = await this.page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    if (clipboardData !== output) {
      throw new Error(
        'Data was not copied correctly\n' +
          `Expected: "${output}"\n` +
          `Actual: "${clipboardData}"`
      );
    }
    showMessage('Data was copied correctly');

    return output;
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
   * Closes the output modal by clicking on "Close" button.
   */
  async closeOutputModal(): Promise<void> {
    await this.expectElementToBeVisible(beamJobCloseOuputButtonSelector);
    await this.clickOnElementWithSelector(beamJobCloseOuputButtonSelector);
    await this.expectElementToBeVisible(beamJobCloseOuputButtonSelector, false);
    showMessage('Output modal closed');
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
      ({
        selector,
        groupName,
        present,
      }: {
        selector: string;
        groupName: string;
        present: boolean;
      }) => {
        const elements = document.querySelectorAll(selector);
        return (
          Array.from(elements).some(
            element => element.textContent?.trim() === groupName
          ) === present
        );
      },
      {selector: userGroupItemSelector, groupName, present}
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
    await this.typeInInputField(userGroupInputSelector, groupName);
    await this.clickOnElementWithSelector(addNewUserGroupButtonSelector);

    await this.expectUserGroupToBePresent(groupName);
  }

  /**
   * Deletes the user group with the given name.
   * @param {string} groupName - The name of the user group to delete.
   */
  async removeUserGroup(groupName: string): Promise<void> {
    await this.expectElementToBeVisible(userGroupItemSelector);
    const userGroupElements = await this.page.$$(userGroupItemSelector);
    const userGroupNames: string[] = [];
    for (const element of userGroupElements) {
      userGroupNames.push(await this.getTextContent(element));
    }

    const index = userGroupNames.indexOf(groupName);

    if (index === -1) {
      throw new Error(`User group "${groupName}" not found.`);
    }

    const userGroupElement = userGroupElements[index];
    if (!userGroupElement) {
      throw new Error(`User group "${groupName}" not found.`);
    }
    await this.clickOnElement(userGroupElement);
    const removeUserGroupButton = await this.getElementInParent(
      removeUserGroupButtonSelector,
      userGroupElement
    );
    await this.clickOnElement(removeUserGroupButton);

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
}

export const ReleaseCoordinatorFactory = (page: Page): ReleaseCoordinator => {
  return new ReleaseCoordinator(page);
};
