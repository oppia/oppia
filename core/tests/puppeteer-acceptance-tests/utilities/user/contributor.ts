// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilty class for contributor. Not to be used standlone.
 * However, it provides common methods that can be used by different contributors.
 */

import {BaseUser} from '../common/puppeteer-utils';

const activeTabNameSelector = '.e2e-test-active-tab-name';
const activeTabDescriptionSelector = '.e2e-test-active-tab-description';

export class Contributor extends BaseUser {
  /**
   * Checks if the active tab name is visible and matches the expected values.
   * @param tabName - The expected name of the active tab.
   */
  async expectActiveTabNameToBe(tabName: string): Promise<void> {
    await this.expectElementToBeVisible(activeTabNameSelector);
    await this.expectTextContentToBe(activeTabNameSelector, tabName);
  }

  /**
   * Checks if the active tab description is visible and matches the expected value.
   * @param tabDescription - The expected description of the active tab.
   */
  async expectActiveTabDescriptionToBe(tabDescription: string): Promise<void> {
    await this.expectElementToBeVisible(activeTabDescriptionSelector);
    await this.expectTextContentToContain(
      activeTabDescriptionSelector,
      tabDescription
    );
  }
}

export const ContributorFactory = (): Contributor => new Contributor();
