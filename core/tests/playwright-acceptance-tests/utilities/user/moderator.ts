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
 * @fileoverview Moderator user utility file.
 */

import {Page, expect} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';

const moderatorPageUrl = testConstants.URLs.ModeratorPage;

const featuredActivitiesTab = '.e2e-test-featured-activities-tab-link';
const featuredActivitiesHeaderSelector = '.e2e-test-featured-activities-header';
const explorationIdField = 'input[aria-label="text input"]';
const featuredActivityRowSelector =
  '.e2e-test-schema-based-list-editor-table-row';
const deleteFeaturedActivityButton = '.e2e-test-delete-list-entry';
const toastMessageSelector = '.e2e-test-toast-message';
const errorModalSelector = '.oppia-error-modal-window';
const errorModalToggleDetailsSelector = '.e2e-test-error-details-toggle-link';
const errorModalDetailsContentSelector = '.e2e-test-error-details-content';
const errorModalCloseButtonSelector = '.e2e-test-close-button';

export class Moderator extends BaseUser {
  /**
   * Navigates to the moderator page.
   */
  async navigateToModeratorPage(): Promise<void> {
    await this.goto(moderatorPageUrl);
  }

  /**
   * Navigates to the Featured Activities tab of the moderator page.
   */
  async navigateToFeaturedActivitiesTab(): Promise<void> {
    await this.expectElementToBeVisible(featuredActivitiesTab);
    await this.clickOnElementWithSelector(featuredActivitiesTab);
    await this.expectElementToBeVisible(featuredActivitiesHeaderSelector);
  }

  /**
   * Adds an activity to the featured activities list and saves it.
   * @param {string} explorationId - The ID of the exploration to feature.
   * @param {number} activityIndex - The 0-based index of the new row.
   */
  async featureActivity(
    explorationId: string,
    activityIndex: number = 0
  ): Promise<void> {
    await this.clickOnElementWithText('Add element');

    const idFields = this.page.locator(explorationIdField);
    await expect(idFields).toHaveCount(activityIndex + 1);
    const idField = idFields.nth(activityIndex);
    await idField.fill(explorationId);
    await idField.press('Enter');
    await expect(idField).toHaveValue(explorationId);

    await this.clickOnElementWithText('Save Featured Activities');
    await this.expectSaveResultToBeShown();
  }

  /**
   * Removes the featured activity at the given position and saves the list.
   * @param {number} index - The 1-based index of the activity to remove.
   */
  async unfeatureActivityAtIndex(index: number): Promise<void> {
    const rows = this.page.locator(featuredActivityRowSelector);
    await rows.first().waitFor({state: 'visible'});
    const rowCount = await rows.count();
    if (index < 1 || index > rowCount) {
      throw new Error(
        `Invalid index ${index}. Found ${rowCount} featured activities.`
      );
    }

    await rows
      .nth(index - 1)
      .locator(deleteFeaturedActivityButton)
      .click();
    await expect(rows).toHaveCount(rowCount - 1);

    await this.clickOnElementWithText('Save Featured Activities');
    await this.expectSaveResultToBeShown();
  }

  /**
   * Checks that saving featured activities showed either the success toast
   * or the error modal.
   */
  private async expectSaveResultToBeShown(): Promise<void> {
    await expect(
      this.page
        .locator(`${toastMessageSelector}, ${errorModalSelector}`)
        .first()
    ).toBeVisible();
    showMessage('Featured activities save result is shown.');
  }

  /**
   * Checks that the error modal is visible.
   */
  async expectErrorModalToBeVisible(): Promise<void> {
    await this.expectElementToBeVisible(errorModalSelector);
  }

  /**
   * Opens the details of the error modal and checks its message.
   * @param {string} expectedMessage - The expected error message.
   */
  async expectErrorModalMessageToBe(expectedMessage: string): Promise<void> {
    await this.clickOnElementWithSelector(errorModalToggleDetailsSelector);
    await this.expectTextContentToContain(
      errorModalDetailsContentSelector,
      expectedMessage
    );
  }

  /**
   * Closes the error modal.
   */
  async closeErrorModal(): Promise<void> {
    await this.clickOnElementWithSelector(errorModalCloseButtonSelector);
    await this.expectElementToBeVisible(errorModalSelector, false);
  }
}

export let ModeratorFactory = (page: Page): Moderator => {
  return new Moderator(page);
};
