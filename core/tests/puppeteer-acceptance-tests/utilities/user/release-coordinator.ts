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
const featuresTab = '.e2e-test-features-tab';
const mobileFeaturesTab = '.e2e-test-features-tab-mobile';
const mobileNavBar = '.e2e-test-navbar-dropdown-toggle';
const featureFlagDiv = '.e2e-test-feature-flag';
const featureFlagOptionSelector = '.e2e-test-value-selector';
const featureFlagNameSelector = '.e2e-test-feature-name';
const saveFeatureFlagButtonSelector = '.e2e-test-save-button';

export class ReleaseCoordinator extends BaseUser {
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
}

export let ReleaseCoordinatorFactory = (): ReleaseCoordinator =>
  new ReleaseCoordinator();
