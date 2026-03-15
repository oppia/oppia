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
 * @fileoverview Utility class to interact with Exploration Editor.
 */

import {BaseUser} from './puppeteer-utils';
import {showMessage} from './show-message';

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';

export class ExplorationEditorModal {
  userInstance: BaseUser;

  constructor(userInstance: BaseUser) {
    this.userInstance = userInstance;
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   * @param failIfMissing - Whether to fail if the welcome modal is not found.
   */
  async dismissWelcomeModal(failIfMissing: boolean = true): Promise<void> {
    try {
      await this.userInstance.page.waitForSelector(
        dismissWelcomeModalSelector,
        {
          visible: true,
          // If we know the modal should appear, we can wait longer.
          timeout: failIfMissing ? 20000 : 5000,
        }
      );
      await this.userInstance.clickOnElementWithSelector(
        dismissWelcomeModalSelector
      );
      await this.userInstance.expectElementToBeVisible(
        dismissWelcomeModalSelector,
        false
      );
      showMessage('Tutorial pop-up closed successfully.');
    } catch (error) {
      if (!failIfMissing) {
        showMessage(
          'Welcome Modal not found, but test can be continued.\n' +
            `Error: ${error.message}`
        );
        return;
      }
      throw new Error(
        'Welcome Modal not found.\n' + 'Actual Error:\n' + error.message
      );
    }
  }
}
