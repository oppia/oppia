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
 * @fileoverview Utility file for tasks shared by all contributor admin users.
 * These users include translation coordinators, and question coordinators.
 */

import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';

const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const activeTabInContributorAdminPageSelector = '.dashboard-tabs-active';
const addContributorButtonSelector = '.e2e-test-add-contributor-button';
const commonModalTitleSelector = '.e2e-test-modal-header';
const commonModalContainerSelector = '.e2e-test-modal-container';
const addRightsButtonSelector = '.e2e-test-add-rights-button';
const contributorCountSelector = '.e2e-test-contributor-count';

export class ContributorAdmin extends BaseUser {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(ContributorDashboardAdminUrl);
  }

  /**
   * Switches to the tab in the contributor dashboard admin page.
   * @param {'Translation Submitters' | 'Translation Reviewers'} tabName - The name of the tab to switch to.
   */
  async switchToTabInContributorAdminPage(
    tabName: 'Translation Submitters' | 'Translation Reviewers'
  ) {
    if (this.isViewportAtMobileWidth()) {
    } else {
      const tabNameInLowerCase = tabName.toLocaleLowerCase().replace(' ', '-');
      const tabSelector = `.e2e-test-${tabNameInLowerCase}-tab`;
      await this.expectElementToBeVisible(tabSelector);
      await this.clickOn(tabSelector);

      const activeTabSelector = `${activeTabInContributorAdminPageSelector} ${tabSelector}`;
      await this.expectTextContentToBe(
        activeTabSelector,
        tabName.toUpperCase()
      );
    }
  }

  /**
   * Clicks on the add contributor button.
   */
  async clickOnAddReviewerOrSubmitterButton(): Promise<void> {
    await this.expectElementToBeVisible(addContributorButtonSelector);
    await this.clickOn(addContributorButtonSelector);

    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToContain(
      commonModalTitleSelector,
      'Enter the username to add'
    );
  }

  /**
   * Adds a username in the username input modal and clicks on the add rights button.
   * @param username The username to add.
   */
  async addUsernameInUsernameInputModal(username: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalContainerSelector);
    const modalContainer = await this.page.$(commonModalContainerSelector);
    if (!modalContainer) {
      throw new Error('Modal container not found.');
    }

    const usernameInputSelector = `${commonModalContainerSelector} input`;
    await this.type(usernameInputSelector, username);

    await this.clickOn(addRightsButtonSelector);
    await this.expectElementToBeVisible(addRightsButtonSelector, false);
  }

  /**
   * Checks if the number of contributors is as expected.
   * @param {number} number - The expected number of contributors.
   */
  async expectNumberOfContributorsToBe(number: number): Promise<void> {
    await this.expectTextContentToBe(
      contributorCountSelector,
      number.toString()
    );
  }
}

export let ContributorAdminFactory = (): ContributorAdmin =>
  new ContributorAdmin();
