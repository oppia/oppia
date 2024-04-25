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
 * @fileoverview utility function for curriculum admin page
 */

import {BaseUser} from '../puppeteer-testing-utilities/puppeteer-utils';
import {showMessage} from '../puppeteer-testing-utilities/show-message-utils';
import testConstants from '../puppeteer-testing-utilities/test-constants';

const baseURL = testConstants.URLs.BaseURL;

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const explorationSettingsTab = '.e2e-test-settings-tab';
const deleteExplorationButton = 'button.e2e-test-delete-exploration-button';
const confirmDeletionButton =
  'button.e2e-test-really-delete-exploration-button';

/**
 * For mobile.
 */
const mobileNavToggelbutton = '.e2e-test-mobile-options';
const mobileOptionsDropdown = '.e2e-test-mobile-options-dropdown';
const mobileSettingsButton = 'li.e2e-test-mobile-settings-button';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';

export class CurriculumAdmin extends BaseUser {
  /**
   * Function to navigate to exploration editor
   * @param explorationUrl - url of the exploration
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseURL}/create/${explorationId}`;
    await this.page.goto(editorUrl);
    showMessage('Navigation to exploration editor is successfull.');
  }

  /**
   * Function to navigate to exploration settings tab
   */
  async navigateToExplorationSettingsTab(): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavToggelbutton);
      await this.clickOn(mobileOptionsDropdown);
      await this.clickOn(mobileSettingsButton);
    } else {
      await this.clickOn(explorationSettingsTab);
    }
    showMessage('Navigation to settings tab is successfull.');
  }

  /**
   * Deletes the exploration permanently.
   * Note: This action requires Curriculum Admin role.
   */
  async deleteExplorationPermanently(): Promise<void> {
    await this.page.waitForFunction('document.readyState === "complete"');
    await this.clickOn(deleteExplorationButton);
    await this.clickOn(confirmDeletionButton);
  }

  /**
   * Function to dismiss welcome modal
   */
  async dismissWelcomeModal(): Promise<void> {
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissWelcomeModalSelector);
    await this.page.waitForSelector(dismissWelcomeModalSelector, {
      hidden: true,
    });

    showMessage('Tutorial pop is closed.');
  }

  /**
   * Function to open control dropdown so that delete exploration button is visible
   * in mobile view.
   */
  async openExplorationControlDropdown(): Promise<void> {
    await this.clickOn(explorationControlsSettingsDropdown);
  }
}

export let CurriculumAdminFactory = (): CurriculumAdmin =>
  new CurriculumAdmin();
