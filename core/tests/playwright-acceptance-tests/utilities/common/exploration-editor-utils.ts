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
 * @fileoverview Utility class to interact with Exploration Editor.
 */

import {BaseUser} from './playwright-utils';
import {showMessage} from './show-message';

const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';
const previousCardButton = '.e2e-test-back-button';

const settingsTabButton = 'a.e2e-test-exploration-settings-tab';
const settingsTabContainer = '.oppia-editor-card.oppia-settings-card-container';
const mobileSettingsTabButton = 'li.e2e-test-mobile-settings-button';
const mobileOptionsButton = 'i.e2e-test-mobile-options';
const mobileNavbarTabsDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarTabsDropdownOpen =
  '.oppia-exploration-editor-tabs-dropdown.show';

export type SettingsTabSection =
  | 'Basic Settings'
  | 'Advanced Features'
  | 'Roles'
  | 'Voice Artists'
  | 'Permissions'
  | 'Feedback'
  | 'Controls';

// All the settings tab sections are collapsed by default on mobile viewports.
const settingsTabSectionsToExpandOnMobile: SettingsTabSection[] = [
  'Basic Settings',
  'Advanced Features',
  'Roles',
  'Voice Artists',
  'Permissions',
  'Feedback',
];

export class ExplorationEditorUtils {
  userInstance: BaseUser;

  constructor(userInstance: BaseUser) {
    this.userInstance = userInstance;
  }

  /**
   * Function to navigate to the next card in the preview tab.
   * @param {boolean} skipVerification - Whether to skip verification of the card content.
   */
  async continueToNextCard(skipVerification: boolean = false): Promise<void> {
    try {
      await this.userInstance.clickOnElementWithSelector(nextCardButton);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        await this.userInstance.clickOnElementWithSelector(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    if (skipVerification) {
      return;
    }
    await this.userInstance.expectElementToBeVisible(previousCardButton);
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   * @param {boolean} failIfMissing - Whether to fail if the welcome modal is not found.
   */
  async dismissWelcomeModal(failIfMissing: boolean = true): Promise<void> {
    try {
      await this.userInstance.expectElementToBeVisible(
        dismissWelcomeModalSelector,
        true,
        this.userInstance.page,
        failIfMissing ? 20000 : 5000
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
          `Welcome Modal not found, but test can be continued.\n Error: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }
      throw new Error(
        `Welcome Modal not found, but test can be continued.\n Actual Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensures that the mobile navigation bar is expanded, since the option to open
   * a tab is rendered only after the mobile options button is clicked. On
   * desktop the navigation bar is always expanded, so nothing is done.
   */
  private async ensureMobileNavbarIsExpanded(): Promise<void> {
    if (!this.userInstance.isViewportAtMobileWidth()) {
      return;
    }

    // The tabs dropdown is rendered only when the mobile navbar is expanded.
    const navbarTabsDropdown = await this.userInstance.page.$(
      mobileNavbarTabsDropdown
    );
    if (navbarTabsDropdown) {
      return;
    }

    await this.userInstance.expectElementToBeVisible(mobileOptionsButton);
    await this.userInstance.clickOnElementWithSelector(mobileOptionsButton);
  }

  /**
   * Closes the mobile navbar tabs dropdown if it stayed open after navigating to
   * a tab, since it can overlap the content of the newly opened tab.
   */
  private async closeMobileNavbarTabsDropdownIfOpen(): Promise<void> {
    const isDropdownOpen = await this.userInstance.isElementVisible(
      mobileNavbarTabsDropdownOpen
    );
    if (!isDropdownOpen) {
      return;
    }

    // We are using page.click as the toggle icon might be overlapped by the
    // open dropdown. Thus, it will fail with onClick.
    // TODO(#25021): Fix flaky mobile navbar dropdown closing in acceptance tests.
    await this.userInstance.page.click(mobileNavbarTabsDropdown);
    try {
      await this.userInstance.expectElementToBeVisible(
        mobileNavbarTabsDropdownOpen,
        false,
        this.userInstance.page,
        10000
      );
    } catch (error) {
      // Retry once, as the dropdown occasionally does not close on the first
      // click.
      await this.userInstance.page.click(mobileNavbarTabsDropdown);
      await this.userInstance.expectElementToBeVisible(
        mobileNavbarTabsDropdownOpen,
        false
      );
    }
  }

  /**
   * Expands the specified settings tab section.
   * Supports Basic Settings, Advanced Features, Roles, Voice Artists,
   * Permissions, Feedback, and Controls sections.
   * Note: Roles and Voice Artists sections are only available for exploration creators.
   * @param {SettingsTabSection} section - The name of the section to expand.
   */
  async expandSettingsTabSection(section: SettingsTabSection): Promise<void> {
    if (!this.userInstance.isViewportAtMobileWidth()) {
      showMessage(
        `Skipped: Expanding ${section} section on desktop.\n` +
          'Reason: Sections are already expanded on desktop.'
      );
      return;
    }

    // Generate the selectors for the section header and content.
    const identifier = section.replace(' ', '-').toLowerCase();
    const sectionContentSelector = `.e2e-test-${identifier}-content`;
    const sectionHeaderSelector = `.e2e-test-${identifier}-header`;

    // Check if the section header exists (some sections like Roles and Voice Artists
    // are only available for exploration creators).
    const sectionHeaderExists = await this.userInstance.page.$(
      sectionHeaderSelector
    );
    if (!sectionHeaderExists) {
      showMessage(
        `Skipped: Expanding ${section} section.\n` +
          'Reason: Section is not available (only available for exploration creators).'
      );
      return;
    }

    // Skip if the section is already expanded. The visibility is checked
    // immediately instead of with isElementVisible(), which waits up to its
    // timeout for the content to appear: a collapsed section never satisfies
    // that wait, so every expansion would stall for the full timeout.
    const isSectionExpanded = await this.userInstance.page.isVisible(
      sectionContentSelector
    );
    if (isSectionExpanded) {
      showMessage(
        `Skipped: Expanding ${section} section on desktop.\n` +
          'Reason: Section is already expanded on desktop.'
      );
      return;
    }

    // Expand the section.
    await this.userInstance.expectElementToBeVisible(sectionHeaderSelector);
    await this.userInstance.clickOnElementWithSelector(sectionHeaderSelector);
    await this.userInstance.expectElementToBeVisible(sectionContentSelector);
  }

  /**
   * Opens the exploration settings tab. On mobile viewports this also expands
   * the mobile navigation bar, closes its dropdown and expands all the settings
   * sections, which are collapsed by default.
   */
  async navigateToSettingsTab(): Promise<void> {
    // Ensure the editor is fully loaded before attempting to navigate.
    await this.userInstance.waitForPageToFullyLoad();

    if (this.userInstance.isViewportAtMobileWidth()) {
      await this.ensureMobileNavbarIsExpanded();
      // Open the navbar tabs dropdown, then navigate to Settings.
      await this.userInstance.expectElementToBeVisible(
        mobileNavbarTabsDropdown
      );
      await this.userInstance.clickOnElementWithSelector(
        mobileNavbarTabsDropdown
      );
      await this.userInstance.clickOnElementWithSelector(
        mobileSettingsTabButton
      );
      await this.closeMobileNavbarTabsDropdownIfOpen();

      for (const section of settingsTabSectionsToExpandOnMobile) {
        // The expandSettingsTabSection method skips sections that are not
        // available to the current user and ones that are already expanded.
        await this.expandSettingsTabSection(section);
      }
    } else {
      await this.userInstance.expectElementToBeVisible(settingsTabButton);
      await this.userInstance.clickOnElementWithSelector(settingsTabButton);
    }

    await this.userInstance.expectElementToBeVisible(settingsTabContainer);
    showMessage('Settings tab is opened successfully.');
  }
}
