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

import {Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

// URLs.
const releaseCoordinatorUrl = testConstants.URLs.ReleaseCoordinator;

const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';

// Selectors for mobile navigation.
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';

// Selectors for feature flags.
const saveButtonSelector = '.e2e-test-save-button';
const featureFlagNameSelector = '.e2e-test-feature-name';
const featureFlagDiv = '.e2e-test-feature-flag';
const enableFeatureSelector = '.e2e-test-value-selector';

export class ReleaseCoordinator extends BaseUser {
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
        await this.clickOnElementWithSelector(mobileNavBar);
        await this.page.waitForSelector(mobileFeaturesTab);
        await this.clickOnElementWithSelector(mobileFeaturesTab);
      } else {
        await this.page.waitForSelector(featuresTab);
        await this.clickOnElementWithSelector(featuresTab);
      }

      await this.page.waitForSelector(featureFlagDiv);
      const featureFlags = await this.page.$$(featureFlagDiv);

      for (let i = 0; i < featureFlags.length; i++) {
        await featureFlags[i].waitForSelector(featureFlagNameSelector);
        const featureFlagNameElement = await featureFlags[i].$(
          featureFlagNameSelector
        );
        const featureFlagName = await this.page.evaluate(
          element => element?.textContent?.trim() || '',
          featureFlagNameElement
        );

        if (featureFlagName === featureName) {
          await featureFlags[i].waitForSelector(enableFeatureSelector);
          const selectElement = await featureFlags[i].$(enableFeatureSelector);
          if (selectElement) {
            await selectElement.selectOption(enable ? '0: true' : '1: false');
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
            {state: 'visible'}
          );

          showMessage(
            `Feature flag: "${featureName}" has been enabled successfully.`
          );
          return;
        }
      }

      throw new Error(`Feature flag: "${featureName}" not found.`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Failed to enable feature flag: "${featureName}". Error: ${err.message}`
      );
      throw err;
    }
  }
}

export let ReleaseCoordinatorFactory = (page: Page): ReleaseCoordinator => {
  return new ReleaseCoordinator(page);
};
