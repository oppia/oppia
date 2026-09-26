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
 * @fileoverview Utility file for tasks shared by all contributor admin users.
 */

import {expect, Page} from '@playwright/test';
import {BaseUser} from '../common/playwright-utils';
import testConstants from '../common/test-constants';

const ContributorDashboardAdminUrl =
  testConstants.URLs.ContributorDashboardAdmin;

const newContributorAdminDashboardPageSelector =
  '.e2e-test-new-contributor-admin-dashboard-page';
const oldContributorAdminDashboardPageSelector =
  '.oppia-contributor-dashboard-admin-page-tabs-container';

export class ContributorAdmin extends BaseUser {
  /**
   * Function for navigating to the contributor dashboard admin page.
   */
  async navigateToContributorDashboardAdminPage(): Promise<void> {
    await this.goto(ContributorDashboardAdminUrl);
    const newDashVisible = await this.isElementVisible(
      newContributorAdminDashboardPageSelector
    );
    const oldDashVisible = await this.isElementVisible(
      oldContributorAdminDashboardPageSelector
    );
    expect(newDashVisible || oldDashVisible).toBe(true);
  }
}

export const ContributorAdminFactory = (page: Page): ContributorAdmin => {
  return new ContributorAdmin(page);
};
